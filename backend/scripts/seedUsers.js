const mongoose = require('mongoose');
const User = require('../src/models/User');
require('dotenv').config();

const mongoURI = process.env.MONGODB_URI;

const usersData = [
  { userId: 'U001', name: 'Arjun Sharma', age: 21, profession: 'B.Tech Student', monthlyIncome: 5000, city: 'Bangalore' },
  { userId: 'U002', name: 'Vikram Iyer', age: 26, profession: 'Software Engineer', monthlyIncome: 55000, city: 'Bangalore' },
  { userId: 'U003', name: 'Ananya Desai', age: 27, profession: 'Product Manager', monthlyIncome: 65000, city: 'Mumbai' },
  { userId: 'U004', name: 'Divya Reddy', age: 28, profession: 'Management Consultant', monthlyIncome: 60000, city: 'Hyderabad' },
  { userId: 'U005', name: 'Sanjay Patel', age: 32, profession: 'Senior Software Engineer', monthlyIncome: 85000, city: 'Bangalore' },
  { userId: 'U006', name: 'Meera Kapoor', age: 30, profession: 'Marketing Manager', monthlyIncome: 70000, city: 'Mumbai' },
  { userId: 'U007', name: 'Rajesh Iyer', age: 45, profession: 'VP Engineering', monthlyIncome: 180000, city: 'Bangalore' },
  { userId: 'U008', name: 'Kavya Sharma', age: 42, profession: 'Director Sales', monthlyIncome: 160000, city: 'Mumbai' },
  { userId: 'U009', name: 'Lakshmi Sundaram', age: 50, profession: 'CFO', monthlyIncome: 200000, city: 'Chennai' },
  { userId: 'U010', name: 'Ashok Kumar', age: 48, profession: 'Managing Director', monthlyIncome: 250000, city: 'Delhi' },
];

async function seedUsers() {
  try {
    await mongoose.connect(mongoURI, {
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log('✅ MongoDB connected');

    let createdCount = 0;
    let skippedCount = 0;

    for (const userData of usersData) {
      const email = `${userData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`;

      // Check if user exists
      const existingUser = await User.findOne({ userId: userData.userId });
      if (existingUser) {
        // UPDATE existing user with correct password and make active
        existingUser.password = 'Password@123';
        existingUser.isActive = true;
        existingUser.email = email; // Ensure correct email
        await existingUser.save();
        console.log(`🔄 Updated user ${userData.userId}: ${userData.name} (${email})`);
        createdCount++;
        continue;
      }

      // Create user
      const newUser = new User({
        userId: userData.userId,
        name: userData.name,
        email: email,
        password: 'Password@123',
        age: userData.age,
        profession: userData.profession,
        monthlyIncome: userData.monthlyIncome,
        city: userData.city,
        isActive: true,
      });

      await newUser.save();
      console.log(`✅ Created user ${userData.userId}: ${userData.name} (${email})`);
      createdCount++;
    }

    console.log(`\n✨ Seeding complete!`);
    console.log(`📊 Created: ${createdCount}, Skipped: ${skippedCount}`);
    console.log(`\n🔐 Login credentials for all users:`);
    console.log(`   Password: Password@123`);
    console.log(`\n📧 Example email: arjun.sharma@example.com`);
    
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
}

seedUsers();
