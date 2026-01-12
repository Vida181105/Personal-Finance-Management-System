const mongoose = require('mongoose');
const Transaction = require('../src/models/Transaction');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

async function checkTransactions() {
  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log('✅ MongoDB connected\n');

    // Get first 5 transactions to see their structure
    const transactions = await Transaction.find().limit(5);
    
    console.log(`📊 Found ${transactions.length} sample transactions:\n`);
    
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      console.log(`Transaction ${i + 1}:`);
      console.log(`  userId: ${t.userId} (type: ${typeof t.userId})`);
      console.log(`  description: ${t.description}`);
      console.log(`  amount: ${t.amount}`);
      console.log(`  type: ${t.type}\n`);
    }

    // Count by userId
    const byUserId = await Transaction.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`\n📈 Transactions grouped by userId:`);
    for (const group of byUserId) {
      console.log(`  ${group._id}: ${group.count} transactions`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

checkTransactions();
