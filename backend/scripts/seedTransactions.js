const mongoose = require('mongoose');
const Transaction = require('../src/models/Transaction');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

const sampleTransactions = [
  { userId: 'U001', date: new Date('2026-01-10'), amount: 500, type: 'Expense', category: 'Food', description: 'Grocery shopping', merchantName: 'Big Basket', paymentMode: 'Debit Card' },
  { userId: 'U001', date: new Date('2026-01-09'), amount: 1200, type: 'Expense', category: 'Transport', description: 'Uber ride', merchantName: 'Uber', paymentMode: 'UPI' },
  { userId: 'U001', date: new Date('2026-01-08'), amount: 2000, type: 'Income', category: 'Salary', description: 'Monthly salary', merchantName: 'Employer', paymentMode: 'Bank Transfer' },
  { userId: 'U001', date: new Date('2026-01-07'), amount: 300, type: 'Expense', category: 'Entertainment', description: 'Movie tickets', merchantName: 'BookMyShow', paymentMode: 'Credit Card' },
  { userId: 'U001', date: new Date('2026-01-06'), amount: 150, type: 'Expense', category: 'Utilities', description: 'Electricity bill', merchantName: 'Power Company', paymentMode: 'Bank Transfer' },
  { userId: 'U001', date: new Date('2026-01-05'), amount: 800, type: 'Expense', category: 'Food', description: 'Restaurant dinner', merchantName: 'Zomato', paymentMode: 'UPI' },
  { userId: 'U001', date: new Date('2026-01-04'), amount: 100, type: 'Expense', category: 'Shopping', description: 'Clothes', merchantName: 'H&M', paymentMode: 'Credit Card' },
  { userId: 'U001', date: new Date('2026-01-03'), amount: 50, type: 'Expense', category: 'Healthcare', description: 'Medicine', merchantName: 'Apollo Pharmacy', paymentMode: 'Cash' },
  { userId: 'U001', date: new Date('2026-01-02'), amount: 1500, type: 'Expense', category: 'Rent', description: 'Monthly rent', merchantName: 'Landlord', paymentMode: 'Bank Transfer' },
  { userId: 'U001', date: new Date('2026-01-01'), amount: 200, type: 'Expense', category: 'Food', description: 'Breakfast', merchantName: 'Cafe', paymentMode: 'Cash' },
];

async function seedTransactions() {
  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log('✅ MongoDB connected');

    // Clear existing transactions for U001
    await Transaction.deleteMany({ userId: 'U001' });
    console.log('🗑️  Cleared existing transactions for U001');

    let createdCount = 0;

    for (const txData of sampleTransactions) {
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const transaction = new Transaction({
        transactionId,
        userId: txData.userId,
        date: txData.date,
        amount: txData.amount,
        type: txData.type,
        category: txData.category,
        description: txData.description,
        merchantName: txData.merchantName,
        paymentMode: txData.paymentMode,
      });

      await transaction.save();
      console.log(`✅ Created transaction: ${txData.description} (${txData.type} ₹${txData.amount})`);
      createdCount++;
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`📊 Created: ${createdCount} transactions for user U001 (Arjun Sharma)`);
    console.log(`\n💰 Sample Data Summary:`);
    console.log(`   Total Income: ₹2,000`);
    console.log(`   Total Expenses: ₹5,100`);
    console.log(`   Balance: ₹-3,100`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

seedTransactions();
