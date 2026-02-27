const Groq = require('groq-sdk');
const Transaction = require('../models/Transaction');
const AIInsights = require('../models/AIInsights');
const ResponseHandler = require('../utils/responseHandler');

// Lazily initialize Groq so missing API key doesn't crash the server on startup
let groq = null;
function getGroqClient() {
  if (!groq) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY environment variable is not set');
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
}

const MODEL = 'llama-3.3-70b-versatile';

/**
 * Call Groq with automatic retry on 429 (RPM rate limit)
 */
async function callGroqWithRetry(messages, maxRetries = 2) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const completion = await getGroqClient().chat.completions.create({
        model: MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      });
      return completion;
    } catch (err) {
      if (err.status === 429 && attempt < maxRetries) {
        const delay = 8000;
        console.log(`Groq rate limited. Retrying in ${delay / 1000}s (attempt ${attempt}/${maxRetries})`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}

// System prompt for LLaMA as financial analyst
const FINANCIAL_ANALYST_PROMPT = `You are a personal finance analyst with access to the user's transaction data. 
Your role is to provide clear, actionable financial insights based on their transaction history.
When analyzing transactions, look for:
- Spending patterns by category
- Unusual or high-value transactions
- Opportunities to save money
- Budget efficiency tips
- Financial health indicators

Provide responses in a conversational, friendly tone. Keep explanations concise and practical.`;

class AIController {
  /**
   * POST /api/ai/query
   * Handle natural language financial queries
   * Fetches user transactions and sends to Gemini for analysis
   */
  static async handleQuery(req, res, next) {
    try {
      const { query } = req.body;
      const userId = req.user?.userId;

      // Validate userId
      if (!userId) {
        return ResponseHandler.error(res, 401, 'User authentication required');
      }

      // Validate input
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return ResponseHandler.validationError(res, 'Query cannot be empty');
      }

      if (query.length > 500) {
        return ResponseHandler.validationError(res, 'Query is too long (max 500 characters)');
      }

      console.log(`AI Query from user ${userId}: "${query}"`);

      // Fetch most recent transactions (no date filter to handle historic import data)
      const transactions = await Transaction.find({ userId })
        .select('date amount type category merchantName description')
        .sort({ date: -1 })
        .limit(200)
        .lean();

      if (transactions.length === 0) {
        return ResponseHandler.success(res, 200, 'Query processed', {
          answer: 'You have no transactions yet. Start by uploading your bank statement to get personalized insights.',
          data: null,
        });
      }

      // Format transactions for AI
      const transactionSummary = AIController.formatTransactionsForAI(transactions);

      // Build context message
      const contextMessage = `
User's recent transaction data (last 60 days):
${transactionSummary}

User question: "${query}"

Please analyze the transaction data and answer the user's question clearly and concisely.`;

      // Call Groq API with retry
      const result = await callGroqWithRetry([
        { role: 'system', content: FINANCIAL_ANALYST_PROMPT },
        { role: 'user', content: contextMessage },
      ]);

      const answer = result.choices[0].message.content;

      // Extract data from response if available (simple heuristic)
      const responseData = AIController.extractDataFromQuery(query, transactions);

      return ResponseHandler.success(res, 200, 'Query processed successfully', {
        answer,
        data: responseData,
      });
    } catch (error) {
      console.error('AI Query Error:', error);

      if (error.status === 429) {
        return ResponseHandler.error(res, 429, 'AI rate limit reached. Please try again in a moment.', null, 'API_RATE_LIMIT');
      }

      if (error.status === 401) {
        return ResponseHandler.error(res, 500, 'AI service authentication failed. Check your GROQ_API_KEY in .env.', null, 'API_AUTH_ERROR');
      }

      next(error);
    }
  }

  /**
   * POST /api/ai/categorize
   * AI-powered categorization fallback (when rule-based fails or low confidence)
   */
  static async categorizeWithAI(req, res, next) {
    try {
      const { description, amount } = req.body;

      // Validate input
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return ResponseHandler.validationError(res, 'Description cannot be empty');
      }

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return ResponseHandler.validationError(res, 'Amount must be a positive number');
      }

      console.log(`AI Categorize: "${description}" (₹${amount})`);

      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';

      try {
        // Call ML service for fast, consistent categorization
        const mlResponse = await fetch(`${mlServiceUrl}/categorize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            description,
            amount,
            merchantName: 'Other',
            type: 'Expense',
          }),
        });

        if (!mlResponse.ok) {
          console.error(`ML service error: ${mlResponse.status}`);
          return ResponseHandler.error(res, 503, 'Categorization service temporarily unavailable');
        }

        const mlResult = await mlResponse.json();
        return ResponseHandler.success(res, 200, 'Transaction categorized successfully', {
          category: mlResult.predicted_category,
          confidence: mlResult.confidence || 0.5,
          reason: `Suggested category: ${mlResult.predicted_category}`,
        });
      } catch (mlError) {
        console.error('ML service error:', mlError.message);
        return ResponseHandler.error(res, 503, 'Failed to categorize transaction');
      }
    } catch (error) {
      console.error('Categorize Error:', error);
      next(error);
    }
  }

  /**
   * GET /api/ai/insights
   * Generate personalized financial insights from transaction history
   * Cached for 24 hours per user
   * NOTE: NOT rate limited - has its own DB caching mechanism
   */
  static async getInsights(req, res, next) {
    try {
      const userId = req.user?.userId;
      
      if (!userId) {
        return ResponseHandler.error(res, 401, 'User authentication required');
      }

      const forceRefresh = req.query.refresh === 'true';

      console.log(`💡 Generating AI Insights for user ${userId}${forceRefresh ? ' (forced refresh)' : ''}`);

      // Check for cached insights (only use if it has actual data)
      if (!forceRefresh) {
        const cachedInsights = await AIInsights.findOne({
          userId,
          expireAt: { $gt: new Date() },
          'insights.0': { $exists: true }, // Ensure at least one insight exists
        });

        if (cachedInsights && cachedInsights.insights.length > 0) {
          console.log(`Using cached insights for user ${userId}. Count: ${cachedInsights.insights.length}`);
          return ResponseHandler.success(res, 200, 'Insights retrieved from cache', {
            insights: cachedInsights.insights,
            cached: true,
            generatedAt: cachedInsights.generatedAt,
          });
        }
      }

      // Fetch most recent transactions (no date filter to handle historic import data)
      const transactions = await Transaction.find({ userId })
        .select('date amount type category merchantName description')
        .sort({ date: -1 })
        .limit(300)
        .lean();

      console.log(`📊 Found ${transactions.length} transactions for user ${userId}`);

      if (transactions.length === 0) {
        console.log(`⚠️ No transactions found for user ${userId}. Returning empty insight.`);
        return ResponseHandler.success(res, 200, 'No transactions available for insights', {
          insights: [
            {
              type: 'tip',
              title: 'Get started',
              message: 'Upload your first bank statement to get personalized financial insights.',
              severity: 'low',
              actionable: false,
            },
          ],
          cached: false,
        });
      }

      // Format transactions for AI
      const transactionSummary = AIController.formatTransactionsForAI(transactions);

      // Build insights prompt
      const insightsPrompt = `
Analyze the following transaction data and provide 4-5 key financial insights in JSON format.
Focus on spending patterns, savings opportunities, warnings, and actionable tips.

Transaction Data:
${transactionSummary}

Provide response as a JSON array of insights. Each insight should have:
- type: "warning" | "tip" | "pattern" | "opportunity"
- title: brief title
- message: detailed explanation
- severity: "low" | "medium" | "high"
- actionable: boolean

Example format:
[
  {
    "type": "warning",
    "title": "High dining spend",
    "message": "You spent 15% more on dining this month compared to last month. Consider meal planning to reduce costs.",
    "severity": "medium",
    "actionable": true
  },
  ...
]

Only respond with the JSON array, no extra text.`;

      const result = await callGroqWithRetry([
        { role: 'user', content: insightsPrompt },
      ]);

      let response = result.choices[0].message.content;

      // Extract JSON array
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      let insights = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // Validate insights structure
      insights = insights.filter((insight) => {
        return (
          insight.type &&
          ['warning', 'tip', 'pattern', 'opportunity'].includes(insight.type) &&
          insight.title &&
          insight.message &&
          insight.severity &&
          ['low', 'medium', 'high'].includes(insight.severity)
        );
      });

      // Ensure at least one insight
      if (insights.length === 0) {
        insights = [
          {
            type: 'pattern',
            title: 'Regular spending detected',
            message: 'Your transaction history shows consistent spending patterns across categories.',
            severity: 'low',
            actionable: false,
          },
        ];
      }

      // Cache insights in MongoDB (only if we have valid insights)
      if (insights.length > 0) {
        await AIInsights.findOneAndUpdate(
          { userId },
          {
            userId,
            insights,
            generatedAt: new Date(),
            expireAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          { upsert: true, new: true }
        );
      }

      return ResponseHandler.success(res, 200, 'Insights generated successfully', {
        insights,
        cached: false,
      });
    } catch (error) {
      console.error('AI Insights Error:', error);

      if (error instanceof SyntaxError) {
        // Invalid JSON from Gemini - return fallback insights
        return ResponseHandler.success(res, 200, 'Insights generated with fallback data', {
          insights: [
            {
              type: 'tip',
              title: 'Review your transactions',
              message: 'Your transaction data shows regular spending patterns. Review your categories to identify savings opportunities.',
              severity: 'low',
              actionable: true,
            },
          ],
          cached: false,
        });
      }

      // On any error, return fallback insights instead of failing
      console.warn('Returning fallback insights due to error:', error.message);
      return ResponseHandler.success(res, 200, 'Using fallback insights', {
        insights: [
          {
            type: 'tip',
            title: 'Keep tracking your spending',
            message: 'Regular financial tracking helps identify spending patterns and savings opportunities.',
            severity: 'low',
            actionable: false,
          },
          {
            type: 'pattern',
            title: 'Review your categories',
            message: 'Organizing expenses by category helps you understand where your money goes.',
            severity: 'low',
            actionable: true,
          },
        ],
        cached: false,
      });
    }
  }

  /**
   * Helper: Format transactions for Gemini context
   * Summarizes transaction data in a readable format
   */
  static formatTransactionsForAI(transactions) {
    if (!transactions || transactions.length === 0) {
      return 'No transactions found.';
    }

    // Group by category and type
    const summary = {};
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((tx) => {
      const key = `${tx.type} - ${tx.category}`;
      if (!summary[key]) {
        summary[key] = { count: 0, total: 0 };
      }
      summary[key].count += 1;
      summary[key].total += tx.amount;

      if (tx.type === 'Income') {
        totalIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
      }
    });

    // Format as readable text
    let formatted = `Period: Last 60 days\nTotal Transactions: ${transactions.length}\n\n`;
    formatted += `Summary:\n- Total Income: ₹${totalIncome.toFixed(2)}\n- Total Expense: ₹${totalExpense.toFixed(2)}\n- Net: ₹${(totalIncome - totalExpense).toFixed(2)}\n\n`;
    formatted += `Breakdown by Category:\n`;

    Object.entries(summary)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 15)
      .forEach(([key, value]) => {
        formatted += `- ${key}: ₹${value.total.toFixed(2)} (${value.count} transactions)\n`;
      });

    return formatted;
  }

  /**
   * Helper: Extract structured data from query response
   * Attempts to pull out quantitative data from Gemini's text response
   */
  static extractDataFromQuery(query, transactions) {
    const queryLower = query.toLowerCase();

    // Simple heuristics to return relevant data
    if (queryLower.includes('food') || queryLower.includes('dining')) {
      const foodTx = transactions.filter((tx) => tx.category && tx.category.toLowerCase().includes('food'));
      const total = foodTx.reduce((sum, tx) => sum + tx.amount, 0);
      return {
        category: 'Food & Dining',
        amount: total,
        transactions: foodTx.length,
        period: 'last 60 days',
      };
    }

    if (queryLower.includes('spend') && queryLower.includes('category')) {
      const categories = {};
      transactions.forEach((tx) => {
        if (tx.type === 'Expense') {
          categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
        }
      });
      return { breakdown: categories };
    }

    if (queryLower.includes('income') || queryLower.includes('earn')) {
      const income = transactions
        .filter((tx) => tx.type === 'Income')
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { totalIncome: income, period: 'last 60 days' };
    }

    if (queryLower.includes('expense') || queryLower.includes('spent')) {
      const expense = transactions
        .filter((tx) => tx.type === 'Expense')
        .reduce((sum, tx) => sum + tx.amount, 0);
      return { totalExpense: expense, period: 'last 60 days' };
    }
  }
}

module.exports = AIController;
