const fs = require('fs');
const path = require('path');

// User profiles
const users = [
  { id: 'U001', name: 'Arjun Sharma', income: 5000 },
  { id: 'U002', name: 'Vikram Iyer', income: 55000 },
  { id: 'U003', name: 'Ananya Desai', income: 65000 },
  { id: 'U004', name: 'Divya Reddy', income: 60000 },
  { id: 'U005', name: 'Sanjay Patel', income: 85000 },
  { id: 'U006', name: 'Meera Kapoor', income: 70000 },
  { id: 'U007', name: 'Rajesh Iyer', income: 180000 },
  { id: 'U008', name: 'Kavya Sharma', income: 160000 },
  { id: 'U009', name: 'Lakshmi Sundaram', income: 200000 },
  { id: 'U010', name: 'Ashok Kumar', income: 250000 },
];

const categories = {
  'Income': 'Income',
  'Rent': 'Rent',
  'Groceries': 'Groceries',
  'Food & Dining': 'Food & Dining',
  'Transport': 'Transport',
  'Utilities': 'Utilities',
  'Subscriptions': 'Subscriptions',
  'Shopping': 'Shopping',
  'Entertainment': 'Entertainment',
  'Healthcare': 'Healthcare',
  'Insurance': 'Insurance',
  'Education': 'Education',
  'Travel': 'Travel',
  'Miscellaneous': 'Miscellaneous',
};

// Merchants by category
const merchants = {
  'Groceries': ['BigBasket', 'DMart', 'Nature\'s Basket', 'Blinkit', 'Reliance Fresh'],
  'Food & Dining': ['Zomato', 'Swiggy', 'Dominos', 'KFC', 'McDonald\'s', 'Cafe Coffee Day', 'Subway'],
  'Transport': ['Uber', 'Ola', 'Shell Petrol', 'BP', 'Metro', 'Railways'],
  'Utilities': ['Jio', 'Airtel', 'VI', 'BSNL', 'TATA Power', 'BSES'],
  'Subscriptions': ['Netflix', 'Spotify', 'Disney+', 'BYJU\'S', 'YouTube Premium', 'Canva'],
  'Shopping': ['Amazon', 'Flipkart', 'Myntra', 'Nykaa', 'Uniqlo', 'Decathlon'],
  'Entertainment': ['BookMyShow', 'INOX', 'PVR Cinemas', 'Gold\'s Gym'],
  'Healthcare': ['Apollo Pharmacy', 'Apollo Hospitals', 'Max Healthcare'],
  'Insurance': ['HDFC Life', 'AXA Life', 'Max Bupa'],
  'Education': ['DPS School', 'Coursera', 'Udemy', 'VIT'],
  'Travel': ['MakeMyTrip', 'AirAsia', 'Booking.com'],
};

const paymentModes = ['UPI', 'Debit Card', 'Credit Card', 'Cash'];

function getRandomDate(month, year = 2024) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMerchant(category) {
  const categoryMerchants = merchants[category] || ['Unknown Vendor'];
  return categoryMerchants[Math.floor(Math.random() * categoryMerchants.length)];
}

function generateTransactions() {
  const transactions = [];
  let transactionId = 1;
  const TOTAL_TRANSACTIONS = 3005;
  let count = 0;

  for (const user of users) {
    const salary = user.income;
    const transactionsPerUser = Math.ceil(TOTAL_TRANSACTIONS / users.length);

    for (let i = 0; i < transactionsPerUser && count < TOTAL_TRANSACTIONS; i++) {
      count++;

      let transaction = {
        transactionId: `T${String(transactionId).padStart(4, '0')}`,
        userId: user.id,
        date: getRandomDate(Math.min(10, Math.floor(i / 30) + 1)),
        amount: 0,
        type: 'expense',
        category: 'Miscellaneous',
        merchantName: '',
        description: '',
        paymentMode: paymentModes[Math.floor(Math.random() * paymentModes.length)],
        isRecurring: 'false',
        source: 'CSV_UPLOAD'
      };

      // Salary on 1st of month
      if (i % 30 === 0) {
        const month = Math.min(10, Math.floor(i / 30) + 1);
        transaction.date = `2024-${String(month).padStart(2, '0')}-01`;
        transaction.type = 'income';
        transaction.category = 'Income';
        transaction.amount = salary;
        transaction.merchantName = 'Employer';
        transaction.description = `SALARY CREDIT - ${['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'][month - 1]}`;
        transaction.paymentMode = 'Debit Card';
        transaction.isRecurring = 'true';
      }
      // Rent on 2nd
      else if (i % 30 === 1) {
        const month = Math.min(10, Math.floor(i / 30) + 1);
        transaction.date = `2024-${String(month).padStart(2, '0')}-02`;
        transaction.amount = Math.floor(salary * (0.35 + Math.random() * 0.2));
        transaction.category = 'Rent';
        transaction.merchantName = 'Landlord';
        transaction.description = 'Rent Payment - ' + ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT'][month - 1];
        transaction.isRecurring = 'true';
      }
      // Utilities scattered in month
      else if (i % 30 === 5 || i % 30 === 10 || i % 30 === 15) {
        const utilityCategories = ['Jio', 'Airtel', 'VI', 'TATA Power', 'BSES'];
        transaction.merchantName = utilityCategories[Math.floor(Math.random() * utilityCategories.length)];
        transaction.amount = 400 + Math.floor(Math.random() * 800);
        transaction.category = 'Utilities';
        transaction.description = `${transaction.merchantName} BILL`;
        transaction.isRecurring = 'true';
        transaction.paymentMode = 'Debit Card';
      }
      // Edge cases
      else if (i === 40) {
        // Large anomaly
        transaction.amount = Math.floor(salary * 10);
        transaction.category = 'Travel';
        transaction.merchantName = 'Travel Agency';
        transaction.description = 'VACATION BOOKING (ANOMALY)';
        transaction.source = 'MANUAL_ENTRY';
      } else if (i === 100) {
        // Duplicate
        transaction.merchantName = merchants['Food & Dining'][0];
        transaction.amount = 1500;
        transaction.category = 'Food & Dining';
        transaction.description = 'Zomato Order';
      } else if (i === 101) {
        // Duplicate (same)
        transaction.merchantName = merchants['Food & Dining'][0];
        transaction.amount = 1500;
        transaction.category = 'Food & Dining';
        transaction.description = 'Zomato Order';
      } else if (i === 150) {
        // Missing description
        transaction.merchantName = 'BigBasket';
        transaction.amount = 2000;
        transaction.category = 'Groceries';
        transaction.description = '';
      } else if (i === 200) {
        // Zero amount
        transaction.amount = 0;
        transaction.merchantName = 'Unknown Vendor';
        transaction.description = 'Zero transaction';
        transaction.category = 'Miscellaneous';
      } else if (i === 250) {
        // Unknown merchant
        transaction.merchantName = 'Unknown Store';
        transaction.amount = 500;
        transaction.category = 'Miscellaneous';
        transaction.description = 'Miscellaneous purchase';
      }
      // Regular expenses
      else {
        const expenseCategories = ['Groceries', 'Food & Dining', 'Transport', 'Subscriptions', 'Shopping', 'Entertainment', 'Healthcare'];
        transaction.category = expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
        transaction.merchantName = getMerchant(transaction.category);
        
        // Amount based on category
        const amounts = {
          'Groceries': [500, 2000],
          'Food & Dining': [200, 1500],
          'Transport': [50, 500],
          'Subscriptions': [99, 2000],
          'Shopping': [500, 5000],
          'Entertainment': [200, 2000],
          'Healthcare': [300, 3000],
        };
        
        const [min, max] = amounts[transaction.category] || [100, 1000];
        transaction.amount = Math.floor(min + Math.random() * (max - min));
        transaction.description = `${transaction.merchantName} - Purchase`;
      }

      // Format for CSV
      transactions.push(transaction);
      transactionId++;
    }
  }

  return transactions;
}

// Generate and write CSV
console.log('Generating 3005 transactions...');
const transactions = generateTransactions();

console.log(`Generated ${transactions.length} transactions`);

// Write to CSV
const csvPath = path.join(__dirname, '../../Data/transactions.csv');
const csvContent = [
  'transactionId,userId,date,amount,type,category,merchantName,description,paymentMode,isRecurring,source',
  ...transactions.map(t => 
    `${t.transactionId},"${t.userId}","${t.date}",${t.amount},"${t.type}","${t.category}","${t.merchantName}","${t.description}","${t.paymentMode}",${t.isRecurring},"${t.source}"`
  )
].join('\n');

fs.writeFileSync(csvPath, csvContent);
console.log(`✅ Wrote ${transactions.length} transactions to ${csvPath}`);
console.log(`📊 File size: ${(csvContent.length / 1024 / 1024).toFixed(2)} MB`);
