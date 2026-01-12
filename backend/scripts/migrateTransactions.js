const mongoose = require('mongoose');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

async function migrateTransactions() {
  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log('✅ MongoDB connected\n');

    // Get all users with their _id and userId mapping
    const users = await User.find();
    const userMap = {};
    
    users.forEach(user => {
      userMap[user._id.toString()] = user.userId;
    });

    console.log(`📋 User mapping created for ${users.length} users`);

    // Find all transactions with ObjectId userId values
    const transactionsToUpdate = await Transaction.find({
      userId: { $in: Object.keys(userMap) }
    });

    console.log(`\n🔄 Found ${transactionsToUpdate.length} transactions to migrate\n`);

    let updated = 0;
    for (const txn of transactionsToUpdate) {
      const oldUserId = txn.userId;
      const newUserId = userMap[oldUserId];
      
      if (newUserId) {
        txn.userId = newUserId;
        await txn.save();
        updated++;
        
        if (updated <= 5) {
          console.log(`✅ Updated: ${oldUserId.substring(0, 8)}... → ${newUserId}`);
        }
      }
    }

    if (updated > 5) {
      console.log(`... and ${updated - 5} more transactions`);
    }

    console.log(`\n✨ Migration complete! Updated ${updated} transactions`);

    // Show summary
    const byUserId = await Transaction.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`\n📊 Transactions by userId after migration:`);
    for (const group of byUserId) {
      const user = users.find(u => u.userId === group._id);
      console.log(`  ${group._id} (${user?.name || 'Unknown'}): ${group.count} transactions`);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

migrateTransactions();
