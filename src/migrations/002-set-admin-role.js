import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Usage: node ./src/migrations/002-set-admin-role.js up <user_id>
// Example: node ./src/migrations/002-set-admin-role.js up 69824009e3820208ab1575ab

dotenv.config();

async function up(userId) {
  if (!userId) {
    console.error('❌ Please provide user ID as argument');
    console.log(
      'Usage: node ./src/migrations/002-set-admin-role.js up <user_id>',
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
    await mongoose.disconnect();
    process.exit(1);
  }

  const result = await mongoose.connection
    .collection('users')
    .updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { role: 'admin' } },
    );

  if (result.modifiedCount > 0) {
    console.log(
      `✅ Successfully granted admin role to user: ${user.email} (${userId})`,
    );
  } else {
    console.log(`ℹ️ User ${user.email} already has admin role`);
  }

  await mongoose.disconnect();
}

async function down(userId) {
  if (!userId) {
    console.error('❌ Please provide user ID as argument');
    console.log(
      'Usage: node ./src/migrations/002-set-admin-role.js down <user_id>',
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
    await mongoose.disconnect();
    process.exit(1);
  }

  const result = await mongoose.connection
    .collection('users')
    .updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { role: 'user' } },
    );

  if (result.modifiedCount > 0) {
    console.log(
      `✅ Successfully revoked admin role from user: ${user.email} (${userId})`,
    );
  } else {
    console.log(`ℹ️ User ${user.email} already has user role`);
  }

  await mongoose.disconnect();
}

const direction = process.argv[2]; // 'up' or 'down'
const userId = process.argv[3]; // user ID

if (direction === 'up') {
  up(userId);
} else if (direction === 'down') {
  down(userId);
} else {
  console.error('❌ Specify migration direction: up or down');
  console.log(
    'Usage: node ./src/migrations/002-set-admin-role.js <up|down> <user_id>',
  );
  process.exit(1);
}
