// src/migrations/005-create-visit-indexes.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

async function createVisitIndexes(action = 'up') {
  const client = new MongoClient(process.env.MONGO_URL);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('visits');

    if (action === 'up') {
      console.log('Creating indexes for visits collection...');

      // Index for user visits with date sorting
      await collection.createIndex({ userId: 1, date: -1 });
      console.log('✅ Index created: userId + date (desc)');

      // Index for trainer visits with date sorting
      await collection.createIndex({ trainerId: 1, date: -1 });
      console.log('✅ Index created: trainerId + date (desc)');

      // Index for date range queries
      await collection.createIndex({ date: -1 });
      console.log('✅ Index created: date (desc)');

      // Compound index for balance related queries
      await collection.createIndex({ wasBalanceUsed: 1, balanceId: 1 });
      console.log('✅ Index created: wasBalanceUsed + balanceId');

      console.log('🎉 All visit indexes created successfully!');
    } else if (action === 'down') {
      console.log('Dropping indexes for visits collection...');

      await collection.dropIndex({ userId: 1, date: -1 });
      await collection.dropIndex({ trainerId: 1, date: -1 });
      await collection.dropIndex({ date: -1 });
      await collection.dropIndex({ wasBalanceUsed: 1, balanceId: 1 });

      console.log('🗑️ Visit indexes dropped successfully!');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run from command line
if (require.main === module) {
  const action = process.argv[2] || 'up';
  createVisitIndexes(action)
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createVisitIndexes };
