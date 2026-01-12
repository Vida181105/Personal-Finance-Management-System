const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Transaction = require('../src/models/Transaction');

// Income categories
const incomeCategories = [
  { name: 'Salary', keywords: ['salary', 'paycheck'], type: 'Income' },
  { name: 'Freelance', keywords: ['freelance', 'project', 'consulting'], type: 'Income' },
  { name: 'Investment Returns', keywords: ['dividend', 'interest', 'returns'], type: 'Income' },
  { name: 'Bonus', keywords: ['bonus', 'incentive', 'reward'], type: 'Income' },
];

// Expense categories with typical monthly amounts
const expenseCategories = [
  { name: 'Food & Dining', min: 2000, max: 5000, keywords: ['zomato', 'restaurant', 'grocery', 'food'] },
  { name: 'Transportation', min: 1000, max: 3000, keywords: ['uber', 'fuel', 'metro', 'car'] },
  { name: 'Shopping', min: 500, max: 10000, keywords: ['amazon', 'mall', 'store', 'shop'] },
  { name: 'Entertainment', min: 500, max: 3000, keywords: ['movie', 'netflix', 'game', 'music'] },
  { name: 'Utilities', min: 1500, max: 3000, keywords: ['electricity', 'water', 'internet', 'phone'] },
  { name: 'Education', min: 0, max: 15000, keywords: ['course', 'book', 'tuition', 'training'] },
  { name: 'Healthcare', min: 500, max: 5000, keywords: ['doctor', 'medicine', 'hospital', 'gym'] },
  { name: 'Insurance', min: 2000, max: 5000, keywords: ['insurance', 'premium'] },
  { name: 'Travel', min: 0, max: 20000, keywords: ['flight', 'hotel', 'trip', 'vacation'] },
  { name: 'Personal Care', min: 500, max: 2000, keywords: ['salon', 'spa', 'cosmetics', 'haircut'] },
  { name: 'Miscellaneous', min: 500, max: 5000, keywords: ['other', 'misc'] },
];

const merchants = {
  'Food & Dining': ['Zomato', 'Swiggy', 'McDonald\'s', 'Starbucks', 'Whole Foods', 'Local Restaurant'],
  'Transportation': ['Uber', 'Ola', 'Indigo Fuel', 'Metro Card', 'Shell Petrol', 'Local Taxi'],
  'Shopping': ['Amazon', 'Flipkart', 'H&M', 'Nike Store', 'Uniqlo', 'Local Mall'],
  'Entertainment': ['Netflix', 'Amazon Prime', 'YouTube Premium', 'BookMyShow', 'Spotify'],
  'Utilities': ['BSNL', 'Airtel', 'Power Company', 'Water Board', 'ISP Provider'],
  'Education': ['Udemy', 'Coursera', 'LinkedIn Learning', 'Book Store', 'Institute Fee'],
  'Healthcare': ['Apollo Hospital', 'Pharmacy', 'Gym Membership', 'Fitness Center'],
  'Insurance': ['Insurance Co.', 'Premium Payment'],
  'Travel': ['MakeMyTrip', 'Booking.com', 'GoIbibo', 'Airline Direct'],
  'Personal Care': ['Salon', 'Spa', 'Cosmetics Store'],
  'Miscellaneous': ['Others', 'General'],
};

const paymentModes = ['Credit Card', 'Debit Card', 'UPI', 'Net Banking', 'Cash'];

function getRandomDate(startDate, endDate) {
  return new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
}

function generateIncome(userId, monthDate, isBonus = false) {
  const amount = isBonus ? 50000 + Math.random() * 50000 : 55000 + Math.random() * 10000;
  return {
    transactionId: `TXN-INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    date: monthDate,
    amount: Math.round(amount),
    type: 'Income',
    category: isBonus ? 'Bonus' : 'Salary',
    merchantName: isBonus ? 'Bonus Payment' : 'Salary Credit',
    description: isBonus ? 'Performance Bonus' : 'Monthly Salary',
    paymentMode: 'Net Banking',
    isRecurring: !isBonus,
    source: 'MANUAL',
  };
}

function generateExpenses(userId, monthDate, anomalyFactor = 1) {
  const expenses = [];
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();

  // Generate multiple transactions per day
  const transactionsPerDay = Math.floor(1 + Math.random() * 2);

  for (let day = 1; day <= daysInMonth; day++) {
    for (let i = 0; i < transactionsPerDay; i++) {
      const category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      let amount = category.min + Math.random() * (category.max - category.min);

      // Apply anomaly factor (spike in certain months or categories)
      if (anomalyFactor > 1) {
        if (category.name === 'Shopping' || category.name === 'Travel' || category.name === 'Entertainment') {
          amount *= anomalyFactor;
        }
      }

      const transDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
      transDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

      expenses.push({
        transactionId: `TXN-EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        date: transDate,
        amount: Math.round(amount),
        type: 'Expense',
        category: category.name,
        merchantName: merchants[category.name][Math.floor(Math.random() * merchants[category.name].length)],
        description: `${category.name} - ${Math.random() > 0.5 ? 'Regular' : 'Purchase'}`,
        paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
        isRecurring: Math.random() > 0.8,
        source: 'MANUAL',
      });
    }
  }

  return expenses;
}

async function generateAllTransactions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing transactions (optional)
    console.log('🗑️  Clearing existing transactions...');
    await Transaction.deleteMany({});

    const userIds = ['U001', 'U002', 'U003', 'U004', 'U005'];
    const allTransactions = [];
    const csvRows = [
      'transactionId,userId,date,amount,type,category,merchantName,description,paymentMode,isRecurring,source',
    ];

    console.log('📊 Generating realistic transaction data...\n');

    for (const userId of userIds) {
      console.log(`👤 Generating transactions for ${userId}...`);
      
      // Start from Jan 2024, generate 12 months of data
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2026, 0, 15);

      for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
        const monthDate = new Date(d);

        // Generate income (salary every month)
        const salaryIncome = generateIncome(userId, monthDate, false);
        allTransactions.push(salaryIncome);
        csvRows.push(transactionToCSV(salaryIncome));

        // Bonus in Dec, June (anomaly)
        if (monthDate.getMonth() === 5 || monthDate.getMonth() === 11) {
          const bonusIncome = generateIncome(userId, monthDate, true);
          allTransactions.push(bonusIncome);
          csvRows.push(transactionToCSV(bonusIncome));
        }

        // Generate expenses with anomalies
        let anomalyFactor = 1;

        // Holiday shopping spree (Dec) - 50% increase
        if (monthDate.getMonth() === 11) {
          anomalyFactor = 1.5;
        }

        // Summer vacation (Jul-Aug) - 100% increase in travel
        if (monthDate.getMonth() === 6 || monthDate.getMonth() === 7) {
          anomalyFactor = 2;
        }

        // Occasional high spending months
        if (Math.random() > 0.85) {
          anomalyFactor = 2.5; // Unusual spike
        }

        const expenses = generateExpenses(userId, monthDate, anomalyFactor);
        allTransactions.push(...expenses);
        expenses.forEach(exp => csvRows.push(transactionToCSV(exp)));
      }

      console.log(`✅ Generated ${allTransactions.length} transactions for ${userId}`);
    }

    // Save to MongoDB
    console.log('\n📤 Uploading to MongoDB...');
    await Transaction.insertMany(allTransactions, { ordered: false });
    console.log(`✅ Uploaded ${allTransactions.length} transactions to MongoDB`);

    // Save to CSV
    const csvPath = path.join(__dirname, '../..', 'Data', 'transactions_realistic.csv');
    fs.writeFileSync(csvPath, csvRows.join('\n'));
    console.log(`✅ Saved ${csvRows.length - 1} transactions to ${csvPath}`);

    // Summary statistics
    console.log('\n📊 Transaction Summary:');
    console.log(`   Total Transactions: ${allTransactions.length}`);
    console.log(`   Users: ${userIds.length}`);
    console.log(`   Date Range: Jan 2024 - Jan 2026`);
    console.log(`   Income Transactions: ${allTransactions.filter(t => t.type === 'Income').length}`);
    console.log(`   Expense Transactions: ${allTransactions.filter(t => t.type === 'Expense').length}`);

    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;

    allTransactions.forEach(t => {
      if (t.type === 'Income') {
        totalIncome += t.amount;
      } else {
        totalExpense += t.amount;
      }
    });

    console.log(`   Total Income: ₹${totalIncome.toLocaleString()}`);
    console.log(`   Total Expense: ₹${totalExpense.toLocaleString()}`);
    console.log(`   Net Flow: ₹${(totalIncome - totalExpense).toLocaleString()}`);

    // Calculate average per user
    console.log(`\n👥 Per User Average:`);
    console.log(`   Avg Monthly Income: ₹${(totalIncome / userIds.length / 24).toLocaleString()}`);
    console.log(`   Avg Monthly Expense: ₹${(totalExpense / userIds.length / 24).toLocaleString()}`);

    console.log('\n✨ Transaction generation complete!');
  } catch (error) {
    console.error('❌ Error generating transactions:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

function transactionToCSV(txn) {
  return [
    txn.transactionId,
    txn.userId,
    txn.date.toISOString().split('T')[0],
    txn.amount,
    txn.type.toLowerCase(),
    txn.category,
    txn.merchantName,
    txn.description,
    txn.paymentMode,
    txn.isRecurring ? 'true' : 'false',
    txn.source,
  ].join(',');
}

// Run the script
generateAllTransactions();
