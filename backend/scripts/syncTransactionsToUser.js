const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');

async function syncTransactionsToUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all users and create a map of userId -> MongoDB _id
    const users = await User.find().lean();
    console.log(`\n📊 Found ${users.length} users in database`);

    // Create a map from CSV userId (U001, U002, etc.) to MongoDB user
    const userIdMap = {};
    for (const user of users) {
      userIdMap[user.userId] = user._id.toString();
    }
    console.log('User mapping created:', Object.keys(userIdMap));

    // For each transaction, update its userId from CSV format (U001, U002, etc.) 
    // to the MongoDB user's _id
    let totalUpdated = 0;
    for (const csvUserId in userIdMap) {
      const mongoUserId = userIdMap[csvUserId];
      
      // First check if transactions still have the CSV userId
      const count = await Transaction.countDocuments({ userId: csvUserId });
      
      if (count > 0) {
        console.log(`\n👤 Syncing ${count} transactions from userId="${csvUserId}" to MongoDB _id`);
        const result = await Transaction.updateMany(
          { userId: csvUserId },
          { $set: { userId: mongoUserId } }
        );
        console.log(`   ✅ Updated ${result.modifiedCount} transactions`);
        totalUpdated += result.modifiedCount;
      }
    }

    // Verify the sync
    console.log('\n\n🔍 Verification:');
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

    for (const stat of stats) {
      const userId = stat._id;
      const user = await User.findById(userId).lean();
      console.log(`   ${user?.name || 'Unknown'} (${user?.userId}): ${stat.count} transactions`);
    }

    console.log(`\n✅ Sync complete! Total ${totalUpdated} transactions updated.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during sync:', error);
    process.exit(1);
  }
}

syncTransactionsToUser();
