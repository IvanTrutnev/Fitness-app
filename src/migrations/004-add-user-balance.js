import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Usage: node ./src/migrations/004-add-user-balance.js up <user_id> [visits] [dueDate] [price] [notes]
// Example: node ./src/migrations/004-add-user-balance.js up 69824009e3820208ab1575ab 12 "2026-03-06" 5000 "Monthly subscription"
// Example: node ./src/migrations/004-add-user-balance.js up 69824009e3820208ab1575ab 8

dotenv.config();

async function up(
  userId,
  visits = 10,
  dueDate = null,
  price = null,
  notes = null,
) {
  if (!userId) {
    console.error('❌ Please provide user ID as argument');
    console.log(
      'Usage: node ./src/migrations/004-add-user-balance.js up <user_id> [visits] [dueDate] [price] [notes]',
    );
    process.exit(1);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error('❌ Invalid user ID format');
    process.exit(1);
  }

  // Parse visits as number
  const visitsCount = parseInt(visits);
  if (isNaN(visitsCount) || visitsCount <= 0) {
    console.error('❌ Visits must be a positive number');
    process.exit(1);
  }

  // Parse dueDate - default to 1 month from now
  let balanceDueDate;
  if (dueDate) {
    balanceDueDate = new Date(dueDate);
    if (isNaN(balanceDueDate.getTime())) {
      console.error('❌ Invalid date format. Use YYYY-MM-DD');
      process.exit(1);
    }
  } else {
    balanceDueDate = new Date();
    balanceDueDate.setMonth(balanceDueDate.getMonth() + 1);
  }

  // Parse price if provided
  let balancePrice = null;
  if (price) {
    balancePrice = parseFloat(price);
    if (isNaN(balancePrice) || balancePrice < 0) {
      console.error('❌ Price must be a positive number');
      process.exit(1);
    }
  }

  await mongoose.connect(process.env.MONGO_URL);

  const user = await mongoose.connection
    .collection('users')
    .findOne({ _id: new mongoose.Types.ObjectId(userId) });

  if (!user) {
    console.error(`❌ User with ID ${userId} not found`);
    process.exit(1);
  }

  console.log(`👤 Found user: ${user.email}`);

  // Create new balance
  const balanceData = {
    userId: new mongoose.Types.ObjectId(userId),
    visits: visitsCount,
    dueDate: balanceDueDate,
    isActive: true,
    purchaseDate: new Date(),
    ...(balancePrice !== null && { price: balancePrice }),
    ...(notes && { notes: notes }),
  };

  const result = await mongoose.connection
    .collection('balances')
    .insertOne(balanceData);

  console.log(
    `✅ Successfully added balance to user: ${user.email} (${userId})`,
  );
  console.log(`   Visits: ${visitsCount}`);
  console.log(`   Due Date: ${balanceDueDate.toISOString().split('T')[0]}`);
  if (balancePrice !== null) {
    console.log(`   Price: ${balancePrice}`);
  }
  if (notes) {
    console.log(`   Notes: ${notes}`);
  }
  console.log(`   Balance ID: ${result.insertedId}`);

  await mongoose.connection.close();
}

async function down(userId) {
  if (!userId) {
    console.error('❌ Please provide user ID as argument');
    console.log(
      'Usage: node ./src/migrations/004-add-user-balance.js down <user_id>',
    );
    process.exit(1);
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    console.error('❌ Invalid user ID format');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL);

  const user = await mongoose.connection
    .collection('users')
    .findOne({ _id: new mongoose.Types.ObjectId(userId) });

  if (!user) {
    console.error(`❌ User with ID ${userId} not found`);
    process.exit(1);
  }

  console.log(`👤 Found user: ${user.email}`);

  // Delete all balances for this user
  const result = await mongoose.connection
    .collection('balances')
    .deleteMany({ userId: new mongoose.Types.ObjectId(userId) });

  console.log(
    `✅ Successfully removed ${result.deletedCount} balance(s) from user: ${user.email} (${userId})`,
  );

  await mongoose.connection.close();
}

// Command line execution
if (process.argv.length >= 3) {
  const action = process.argv[2];
  const userId = process.argv[3];
  const visits = process.argv[4];
  const dueDate = process.argv[5];
  const price = process.argv[6];
  const notes = process.argv[7];

  if (action === 'up') {
    up(userId, visits, dueDate, price, notes).catch(console.error);
  } else if (action === 'down') {
    down(userId).catch(console.error);
  } else {
    console.error('❌ Invalid action. Use "up" or "down"');
    process.exit(1);
  }
}

export { up, down };
