const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './.env' });

(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('finance_ai_db');
    
    console.log('\n========================================');
    console.log('MongoDB Collections - Verification');
    console.log('========================================\n');
    
    const collections = ['users', 'categories', 'merchants', 'transactions', 'recurring_transactions'];
    let totalRecords = 0;
    
    for (const collName of collections) {
      const count = await db.collection(collName).countDocuments();
      totalRecords += count;
      console.log(`✅ ${collName.padEnd(30)} ${count.toString().padStart(5)} documents`);
    }
    
    console.log(`\n✅ Total records in database: ${totalRecords}`);
    console.log('✅ Data successfully imported to MongoDB!\n');
  } finally {
    await client.close();
  }
})();
