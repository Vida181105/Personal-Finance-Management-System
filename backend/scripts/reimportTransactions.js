const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',');
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const obj = {};
    const values = lines[i].split(',');
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    data.push(obj);
  }
  
  return data;
}

async function reimportTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Read CSV file
    const csvPath = path.join(__dirname, '../../Data/transactions.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const transactions = parseCSV(fileContent);

    console.log(`\n📄 Read ${transactions.length} transactions from CSV`);

    // Get all users
    const users = await User.find().lean();
    console.log(`📊 Found ${users.length} users in database`);

    // Create a map of userId (U001, U002, etc.) to MongoDB user _id
    const userIdMap = {};
    for (const user of users) {
      userIdMap[user.userId] = user._id.toString();
    }

    console.log(`\n📍 User mapping: ${Object.keys(userIdMap).join(', ')}`);

    // Delete all existing transactions
    await Transaction.deleteMany({});
    console.log('\n🗑️  Deleted all existing transactions');

    // Import transactions
    let importedCount = 0;
    const erroredTransactions = [];

    for (const txn of transactions) {
      try {
        const mongoUserId = userIdMap[txn.userId];
        
        if (!mongoUserId) {
          erroredTransactions.push({
            transactionId: txn.transactionId,
            reason: `User ${txn.userId} not found in database`,
          });
          continue;
        }

        // Parse the date properly
        const dateObj = new Date(txn.date);
        if (isNaN(dateObj.getTime())) {
          erroredTransactions.push({
            transactionId: txn.transactionId,
            reason: `Invalid date: ${txn.date}`,
          });
          continue;
        }

        // Create transaction object
        const transaction = new Transaction({
          transactionId: txn.transactionId,
          userId: mongoUserId,
          date: dateObj,
          amount: parseInt(txn.amount),
          type: txn.type.charAt(0).toUpperCase() + txn.type.slice(1), // Capitalize first letter
          category: txn.category,
          merchantName: txn.merchantName,
          description: txn.description,
          paymentMode: txn.paymentMode,
          isRecurring: txn.isRecurring === 'true',
          source: txn.source,
        });

        await transaction.save();
        importedCount++;
      } catch (error) {
        erroredTransactions.push({
          transactionId: txn.transactionId,
          reason: error.message,
        });
      }
    }

    console.log(`\n✅ Successfully imported ${importedCount} transactions`);

    if (erroredTransactions.length > 0) {
      console.log(`\n⚠️  Failed to import ${erroredTransactions.length} transactions:`);
      erroredTransactions.forEach((err) => {
        console.log(`   - ${err.transactionId}: ${err.reason}`);
      });
    }

    // Verify the import
    console.log('\n\n🔍 Verification - Transactions per user:');
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    let totalTransactions = 0;
    for (const stat of stats) {
      const user = await User.findById(stat._id).lean();
      console.log(`   ${user?.name || 'Unknown'} (${user?.userId}): ${stat.count} transactions`);
      totalTransactions += stat.count;
    }

    console.log(`\n📊 Total: ${totalTransactions} transactions across ${stats.length} users`);
    console.log(`\n✅ Reimport complete!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during reimport:', error);
    process.exit(1);
  }
}

reimportTransactions();
