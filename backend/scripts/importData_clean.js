const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { MongoClient } = require('mongodb');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'finance_ai_db';
const DATA_DIR = path.join(__dirname, '../../Data');

const COLLECTIONS = {
  'users.csv': 'users',
  'categories.csv': 'categories',
  'merchants.csv': 'merchants',
  'transactions.csv': 'transactions',
  'recurring_transactions.csv': 'recurring_transactions',
};

async function importCSV(filePath, collection) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let headers = [];
    let insertedCount = 0;
    let lineCount = 0;

    rl.on('line', async (line) => {
      lineCount++;
      
      if (lineCount === 1) {
        headers = line.split(',').map(h => h.trim());
        return;
      }

      const values = parseCSVLine(line);
      
      if (values.length === headers.length) {
        const document = {};
        for (let i = 0; i < headers.length; i++) {
          const value = values[i].trim();
          const key = headers[i];
          
          if (value === '') {
            document[key] = '';
          } else if (value === 'true') {
            document[key] = true;
          } else if (value === 'false') {
            document[key] = false;
          } else if (!isNaN(value) && value !== '') {
            document[key] = parseInt(value);
          } else {
            document[key] = value;
          }
        }

        // Use ordered: false to skip duplicates and continue
        try {
          await collection.insertOne(document);
          insertedCount++;
          
          if (insertedCount % 500 === 0) {
            console.log(`  ↳ ${insertedCount} records inserted...`);
          }
        } catch (err) {
          if (err.code !== 11000) { // Ignore duplicate key errors
            throw err;
          }
        }
      }
    });

    rl.on('close', () => {
      resolve(insertedCount);
    });

    rl.on('error', reject);
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

async function importData() {
  let client;

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI not found');
    }

    console.log('\n========================================');
    console.log('IMPORT TO MONGODB ATLAS');
    console.log('========================================\n');

    client = new MongoClient(MONGODB_URI);
    console.log('📡 Connecting...');
    await client.connect();
    console.log('✅ Connected\n');

    const db = client.db(DB_NAME);
    let totalRecords = 0;

    for (const [csvFile, collectionName] of Object.entries(COLLECTIONS)) {
      const filePath = path.join(DATA_DIR, csvFile);

      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  ${csvFile} not found`);
        continue;
      }

      try {
        console.log(`📖 ${csvFile}`);
        
        // Drop collection
        try {
          await db.collection(collectionName).drop();
        } catch {}

        const collection = db.collection(collectionName);
        const count = await importCSV(filePath, collection);
        
        console.log(`✅ ${count} records\n`);
        totalRecords += count;
      } catch (err) {
        console.error(`❌ ${csvFile}:`, err.message, '\n');
      }
    }

    // Verify
    console.log('========================================');
    for (const collectionName of Object.values(COLLECTIONS)) {
      const count = await db.collection(collectionName).countDocuments();
      console.log(`${collectionName.padEnd(25)} ${count}`);
    }
    console.log('========================================\n');
    console.log(`✅ Total: ${totalRecords} records\n`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (client) await client.close();
  }
}

importData();
