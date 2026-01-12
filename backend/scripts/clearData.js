const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('finance_ai_db');
    
    console.log('\n🧹 Clearing all collections...\n');
    
    const collections = ['users', 'categories', 'merchants', 'transactions', 'recurring_transactions'];
    
    for (const collName of collections) {
      const result = await db.collection(collName).deleteMany({});
      console.log(`✅ Cleared ${collName}: ${result.deletedCount} documents removed`);
    }
    
    console.log('\n✅ All collections cleared!\n');
  } finally {
    await client.close();
  }
})();
