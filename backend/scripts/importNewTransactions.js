const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Transaction = require('../src/models/Transaction');

// Simple CSV parser that handles quoted fields
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  let i = 1;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }
    
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length === headers.length) {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = values[index];
      });
      records.push(record);
    }
    i++;
  }
  return records;
}

async function importTransactions() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear existing transactions
    console.log('🗑️  Clearing existing transactions...');
    const deleteResult = await Transaction.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} old transactions`);

    // Read CSV file
    const csvPath = path.join(__dirname, '../../Data/transactions.csv');
    console.log(`📂 Reading CSV from: ${csvPath}`);
    
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found at ${csvPath}`);
    }
    
    const fileContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parseCSV(fileContent);

    console.log(`📋 Found ${records.length} records in CSV`);
    
    // Count by type before insertion
    const csvIncomeCount = records.filter(r => r.type === 'Income').length;
    const csvExpenseCount = records.filter(r => r.type === 'Expense').length;
    console.log(`   Before insert - Income: ${csvIncomeCount}, Expense: ${csvExpenseCount}`);
    
    // Show first few income records
    const firstIncome = records.filter(r => r.type === 'Income').slice(0, 3);
    console.log(`   First income records:`, firstIncome);

    // Convert CSV records to transaction documents
    console.log('🔄 Converting records...');
    const transactions = records.map(record => {
      try {
        const txn = {
          transactionId: record.transactionId,
          userId: record.userId,
          date: new Date(record.date),
          amount: parseFloat(record.amount),
          type: record.type.charAt(0).toUpperCase() + record.type.slice(1),
          category: record.category,
          merchantName: record.merchantName,
          description: record.description,
          paymentMode: record.paymentMode,
          isRecurring: record.isRecurring === 'true',
          source: record.source,
        };
        return txn;
      } catch (e) {
        console.log(`⚠️  Error converting record: ${JSON.stringify(record)}, Error: ${e.message}`);
        return null;
      }
    }).filter(t => t !== null);
    
    console.log(`   After conversion: ${transactions.length} valid records`);

    // Insert into MongoDB
    console.log('📤 Inserting transactions into MongoDB...');
    let inserted = 0;
    try {
      const result = await Transaction.insertMany(transactions, { ordered: false }).catch(err => {
        // With ordered: false, some may succeed despite errors
        console.log(`⚠️  Insert error occurred: ${err.message}`);
        return err.result;
      });
      
      if (result) {
        inserted = result.insertedIds ? result.insertedIds.length : result.length;
      }
      console.log(`✅ Successfully inserted ${inserted} transactions`);
    } catch (insertError) {
      console.log(`❌ Critical insert error: ${insertError.message}`);
      console.log(`   Result:`, insertError.result);
      if (insertError.result && insertError.result.insertedCount) {
        inserted = insertError.result.insertedCount;
        console.log(`   Inserted before error: ${inserted}`);
      }
    }

    // Get statistics
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    console.log('\n📊 Statistics:');
    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} transactions, ₹${stat.total.toLocaleString()}`);
      if (stat._id === 'Income') {
        totalIncome = stat.total;
        incomeCount = stat.count;
      } else {
        totalExpense = stat.total;
        expenseCount = stat.count;
      }
    });

    console.log(`\n💰 Financial Summary:`);
    console.log(`   Total Income:  ₹${totalIncome.toLocaleString()}`);
    console.log(`   Total Expense: ₹${totalExpense.toLocaleString()}`);
    console.log(`   Net Flow:      ₹${(totalIncome - totalExpense).toLocaleString()}`);
    console.log(`   Distribution:  ${incomeCount} income (${(incomeCount/(incomeCount+expenseCount)*100).toFixed(1)}%) | ${expenseCount} expense (${(expenseCount/(incomeCount+expenseCount)*100).toFixed(1)}%)`);

    // Per user stats
    console.log('\n👥 Per User Stats:');
    const userStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
          totalIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'Income'] }, '$amount', 0] },
          },
          totalExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    userStats.forEach(user => {
      const netFlow = user.totalIncome - user.totalExpense;
      const status = netFlow >= 0 ? '✅' : '⚠️';
      console.log(
        `   ${status} ${user._id}: ${user.count} txns | Income: ₹${user.totalIncome.toLocaleString()} | Expense: ₹${user.totalExpense.toLocaleString()} | Net: ₹${netFlow.toLocaleString()}`
      );
    });

    console.log('\n✨ Import complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

importTransactions();
