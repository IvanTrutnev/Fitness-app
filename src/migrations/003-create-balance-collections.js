// migrations/003-create-balance-collections.js

async function up(db) {
  console.log('Creating balance and visit history collections...');

  // Collections will be created automatically when first documents are inserted

  console.log('Balance collections ready');
}

async function down(db) {
  console.log('Dropping balance collections...');

  await db
    .collection('balances')
    .drop()
    .catch(() => {});
  await db
    .collection('visithistories')
    .drop()
    .catch(() => {});

  console.log('Balance collections dropped');
}

module.exports = { up, down };
