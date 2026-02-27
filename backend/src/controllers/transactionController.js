const Transaction = require('../models/Transaction');
const ResponseHandler = require('../utils/responseHandler');

class TransactionController {
  /**
   * Get All Transactions for a User
   * GET /api/transactions/:userId
   */
  static async getTransactions(req, res, next) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, category, startDate, endDate, type, search, sortBy = '-date' } = req.query;

      // Verify user owns these transactions (compare userId strings, not MongoDB _id)
      if (req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      const query = { userId };
      if (category) query.category = category;
      if (type) query.type = type;
      if (search) query.description = { $regex: search, $options: 'i' };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(1000, Math.max(1, parseInt(limit)));
      const skip = (pageNum - 1) * limitNum;

      const transactions = await Transaction.find(query).sort(sortBy).skip(skip).limit(limitNum).lean();
      const total = await Transaction.countDocuments(query);

      console.log(`📊 Query result for userId=${userId}: found ${total} total, returning ${transactions.length}`);

      const summary = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] } },
            totalExpense: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] } },
            count: { $sum: 1 },
          },
        },
      ]);

      const stats = summary[0] || { totalIncome: 0, totalExpense: 0, count: 0 };

      return ResponseHandler.success(res, 200, 'Transactions retrieved', transactions, {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        summary: {
          totalIncome: stats.totalIncome,
          totalExpense: stats.totalExpense,
          netFlow: stats.totalIncome - stats.totalExpense,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Single Transaction
   * GET /api/transactions/:userId/:transactionId
   */
  static async getTransaction(req, res, next) {
    try {
      const { userId, transactionId } = req.params;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      const transaction = await Transaction.findOne({ _id: transactionId, userId });

      if (!transaction) {
        return ResponseHandler.notFound(res, 'Transaction not found');
      }

      return ResponseHandler.success(res, 200, 'Transaction retrieved', transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create New Transaction
   * POST /api/transactions/:userId
   */
  static async createTransaction(req, res, next) {
    try {
      const { userId } = req.params;
      const { amount, description, category, merchantName, type, date, paymentMode } = req.body;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      if (!amount || !description || !category || !type) {
        return ResponseHandler.validationError(res, 'Missing required fields');
      }

      if (typeof amount !== 'number' || amount <= 0) {
        return ResponseHandler.validationError(res, 'Amount must be positive');
      }

      if (!['Income', 'Expense'].includes(type)) {
        return ResponseHandler.validationError(res, 'Type must be Income or Expense');
      }

      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const transaction = new Transaction({
        transactionId,
        userId,
        amount,
        description,
        category,
        merchantName: merchantName || 'Other',
        type,
        date: date ? new Date(date) : new Date(),
        paymentMode: paymentMode || 'Cash',
      });

      // Call ML service to categorize and score transaction (non-blocking)
      try {
        // Try to auto-categorize if description is provided
        if (description) {
          const categorizerResponse = await fetch(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/categorize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              description,
              amount,
              merchantName: merchantName || 'Other',
              type,
            }),
          });

          if (categorizerResponse.ok) {
            const categorizeData = await categorizerResponse.json();
            // Store suggested category (don't override if user explicitly set it)
            transaction.suggested_category = categorizeData.predicted_category;
            transaction.category_confidence = categorizeData.confidence;
            console.log(`✅ ML categorized as: ${categorizeData.predicted_category} (${(categorizeData.confidence * 100).toFixed(0)}%)`);
          }
        }
        
        // Score transaction for anomalies
        const historicalTxs = await Transaction.find({ userId }).select('date amount type category merchantName').lean().limit(100);
        
        if (historicalTxs.length >= 5) {
          const mlResponse = await fetch(`${process.env.ML_SERVICE_URL || 'http://localhost:8000'}/score-transaction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              new_transaction: {
                date: transaction.date.toISOString(),
                amount: transaction.amount,
                type: transaction.type,
                category: transaction.category,
                merchantName: transaction.merchantName,
              },
              historical_transactions: historicalTxs,
            }),
          });

          if (mlResponse.ok) {
            const scoreData = await mlResponse.json();
            transaction.anomaly_score = scoreData.anomaly_score || 0;
            transaction.is_anomaly = scoreData.is_anomaly || false;
            transaction.anomaly_reason = scoreData.reason || '';
            console.log(`✅ ML scoring: ${scoreData.risk_level} (${(scoreData.anomaly_score * 100).toFixed(0)}%)`);
          }
        }
      } catch (mlError) {
        console.warn('⚠️ ML service failed (non-blocking):', mlError.message);
        // Continue without ML enhancements
      }

      await transaction.save();

      return ResponseHandler.success(res, 201, 'Transaction created', transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update Transaction
   * PUT /api/transactions/:userId/:transactionId
   */
  static async updateTransaction(req, res, next) {
    try {
      const { userId, transactionId } = req.params;
      const updateData = req.body;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      if (updateData.amount && (typeof updateData.amount !== 'number' || updateData.amount <= 0)) {
        return ResponseHandler.validationError(res, 'Amount must be positive');
      }

      if (updateData.type && !['Income', 'Expense'].includes(updateData.type)) {
        return ResponseHandler.validationError(res, 'Type must be Income or Expense');
      }

      const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId },
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!transaction) {
        return ResponseHandler.notFound(res, 'Transaction not found');
      }

      return ResponseHandler.success(res, 200, 'Transaction updated', transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Transaction
   * DELETE /api/transactions/:userId/:transactionId
   */
  static async deleteTransaction(req, res, next) {
    try {
      const { userId, transactionId } = req.params;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      const transaction = await Transaction.findOneAndDelete({ _id: transactionId, userId });

      if (!transaction) {
        return ResponseHandler.notFound(res, 'Transaction not found');
      }

      return ResponseHandler.success(res, 200, 'Transaction deleted', { deletedId: transactionId });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bulk Create Transactions
   * POST /api/transactions/:userId/bulk
   */
  static async bulkCreateTransactions(req, res, next) {
    try {
      const { userId } = req.params;
      const { transactions } = req.body;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return ResponseHandler.validationError(res, 'Transactions must be non-empty array');
      }

      if (transactions.length > 1000) {
        return ResponseHandler.validationError(res, 'Max 1000 transactions per bulk');
      }

      const validTransactions = transactions.map((t) => {
        if (!t.amount || !t.description || !t.category || !t.type) {
          throw new Error('Missing required fields');
        }

        const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
          transactionId,
          userId,
          amount: t.amount,
          description: t.description,
          category: t.category,
          merchantName: t.merchantName || 'Other',
          type: t.type,
          date: t.date || new Date(),
          paymentMode: t.paymentMode || 'Cash',
        };
      });

      const created = await Transaction.insertMany(validTransactions);

      return ResponseHandler.success(res, 201, `${created.length} transactions created`, {
        count: created.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Transaction Statistics
   * GET /api/transactions/:userId/stats
   */
  static async getTransactionStats(req, res, next) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      const query = { userId };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const byCategory = await Transaction.aggregate([
        { $match: query },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]);

      const byType = await Transaction.aggregate([
        { $match: query },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]);

      const monthly = await Transaction.aggregate([
        { $match: query },
        {
          $group: {
            _id: { year: { $year: '$date' }, month: { $month: '$date' } },
            income: { $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] } },
            expense: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      return ResponseHandler.success(res, 200, 'Statistics retrieved', {
        byCategory,
        byType,
        monthly,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Enrich transactions with ML data (categorization + anomaly scoring)
   * POST /api/transactions/:userId/enrich
   */
  static async enrichTransactions(req, res, next) {
    try {
      const { userId } = req.params;
      const { transactionIds = [] } = req.body;

      if (req.user._id.toString() !== userId && req.user.userId !== userId && req.user.role !== 'admin') {
        return ResponseHandler.forbidden(res, 'Unauthorized');
      }

      const query = { userId };
      if (transactionIds.length > 0) {
        query._id = { $in: transactionIds };
      }

      const transactions = await Transaction.find(query);
      const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
      let enrichedCount = 0;
      let skippedCount = 0;

      console.log(`🔄 Starting enrichment for ${transactions.length} transactions...`);

      for (const transaction of transactions) {
        try {
          let needsSave = false;

          // Categorize if not already done
          if (!transaction.suggested_category && transaction.description) {
            try {
              console.log(`📝 Categorizing: ${transaction.description}`);
              const categorizerResponse = await fetch(`${mlServiceUrl}/categorize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  description: transaction.description,
                  amount: transaction.amount,
                  merchantName: transaction.merchantName || 'Other',
                  type: transaction.type,
                }),
              });

              if (categorizerResponse.ok) {
                const categorizeData = await categorizerResponse.json();
                transaction.suggested_category = categorizeData.predicted_category;
                transaction.category_confidence = categorizeData.confidence || 0.5;
                needsSave = true;
                console.log(`✅ Categorized as: ${categorizeData.predicted_category} (${(categorizeData.confidence * 100).toFixed(0)}%)`);
              } else {
                console.warn(`⚠️ Categorizer returned ${categorizerResponse.status}`);
              }
            } catch (err) {
              console.warn(`⚠️ Categorization failed for ${transaction._id}:`, err.message);
            }
          }

          // Score for anomalies if not already done (check for default 0 with no reason = not yet scored)
          if (!transaction.anomaly_reason) {
            try {
              const historicalTxs = await Transaction.find({ userId })
                .select('date amount type category merchantName')
                .lean()
                .limit(100);

              if (historicalTxs.length >= 5) {
                console.log(`⚠️ Scoring anomaly with ${historicalTxs.length} historical transactions`);
                const scoreResponse = await fetch(`${mlServiceUrl}/score-transaction`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    new_transaction: {
                      date: transaction.date.toISOString(),
                      amount: transaction.amount,
                      type: transaction.type,
                      category: transaction.category,
                      merchantName: transaction.merchantName,
                    },
                    historical_transactions: historicalTxs,
                  }),
                });

                if (scoreResponse.ok) {
                  const scoreData = await scoreResponse.json();
                  transaction.anomaly_score = scoreData.anomaly_score || 0;
                  transaction.is_anomaly = scoreData.is_anomaly || false;
                  transaction.anomaly_reason = scoreData.reason || '';
                  needsSave = true;
                  console.log(`✅ Anomaly scored: ${(transaction.anomaly_score * 100).toFixed(0)}% (is_anomaly: ${transaction.is_anomaly})`);
                } else {
                  console.warn(`⚠️ Scorer returned ${scoreResponse.status}`);
                }
              } else {
                console.log(`⏭️ Skipping anomaly scoring: only ${historicalTxs.length} historical transactions (need >= 5)`);
              }
            } catch (err) {
              console.warn(`⚠️ Anomaly scoring failed for ${transaction._id}:`, err.message);
            }
          } else {
            skippedCount++;
          }

          // Save only if we made changes
          if (needsSave) {
            await transaction.save();
            enrichedCount++;
            console.log(`💾 Saved transaction ${transaction._id}`);
          }
        } catch (txError) {
          console.warn(`⚠️ Failed to process transaction ${transaction._id}:`, txError.message);
        }
      }

      console.log(`✅ Enrichment complete: ${enrichedCount} enriched, ${skippedCount} already enriched`);
      return ResponseHandler.success(res, 200, `Enriched ${enrichedCount} transactions`, {
        enrichedCount,
        skippedCount,
        totalCount: transactions.length,
      });
    } catch (error) {
      console.error('❌ Enrichment error:', error.message);
      next(error);
    }
  }
}

module.exports = TransactionController;
