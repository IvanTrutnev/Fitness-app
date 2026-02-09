import mongoose from 'mongoose';
import dotenv from 'dotenv';

// node ./src/migrations/001-add-user-type.js up in root of project

dotenv.config();

async function up() {
  await mongoose.connect(process.env.MONGO_URL);
  const result = await mongoose.connection
    .collection('users')
    .updateMany({ role: { $exists: false } }, { $set: { role: 'user' } });
  console.log(`✅ Added role="user" to ${result.modifiedCount} users`);
  await mongoose.disconnect();
}

async function down() {
  await mongoose.connect(process.env.MONGO_URL);
  const result = await mongoose.connection
    .collection('users')
    .updateMany({ role: 'user' }, { $unset: { role: '' } });
  console.log(`🔁 Removed role field from ${result.modifiedCount} users`);
  await mongoose.disconnect();
}

const direction = process.argv[2]; // 'up' or 'down'

if (direction === 'up') {
  up();
} else if (direction === 'down') {
  down();
} else {
  console.error('❌ Specify migration direction: up or down');
  process.exit(1);
}
