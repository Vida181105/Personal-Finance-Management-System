const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Transaction = require('../src/models/Transaction');

async function fixTransactionDates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all transactions with invalid dates
    const transactions = await Transaction.find({}).lean();
    console.log(`\n📊 Found ${transactions.length} total transactions`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const transaction of transactions) {
      try {
        // Check if date is a string
        if (typeof transaction.date === 'string') {
          const dateObj = new Date(transaction.date);
          if (isNaN(dateObj.getTime())) {
            console.log(`❌ Invalid date for transaction ${transaction.transactionId}: ${transaction.date}`);
            errorCount++;
            continue;
          }
          
          // Update the transaction with proper Date object
          await Transaction.updateOne(
            { _id: transaction._id },
            { $set: { date: dateObj } }
          );
          fixedCount++;
        } else if (!(transaction.date instanceof Date) || isNaN(transaction.date.getTime())) {
          console.log(`❌ Invalid date type for transaction ${transaction.transactionId}`);
          errorCount++;
        }
      } catch (err) {
        console.error(`Error fixing transaction ${transaction.transactionId}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} transactions with invalid dates`);
    if (errorCount > 0) {
      console.log(`⚠️  ${errorCount} transactions had errors`);
    }

    console.log('\n✅ Date fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during date fix:', error);
    process.exit(1);
  }
}

fixTransactionDates();
