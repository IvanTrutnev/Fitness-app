#!/usr/bin/env node

// src/scripts/test-kafka.ts
// Usage: npx tsx src/scripts/test-kafka.ts

import { EventPublisher } from '../kafka/eventPublisher';
import { EventConsumer } from '../kafka/eventConsumer';

async function testKafkaProducer() {
  console.log('🧪 Testing Kafka Producer...');

  try {
    await EventPublisher.connect();

    // Test balance created event
    await EventPublisher.publishBalanceCreated({
      userId: 'test-user-123',
      balanceId: 'test-balance-456',
      visits: 10,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      price: 5000,
      notes: 'Test balance from CLI',
    });

    // Test user registration event
    await EventPublisher.publishUserRegistered({
      userId: 'test-user-123',
      userEmail: 'test@example.com',
      role: 'user',
    });

    // Test analytics event
    await EventPublisher.publishAnalytics({
      userId: 'test-user-123',
      eventType: 'test_event',
      data: {
        source: 'cli-test',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('✅ All test events published successfully!');
  } catch (error) {
    console.error('❌ Producer test failed:', error);
  } finally {
    await EventPublisher.disconnect();
  }
}

async function testKafkaConsumer() {
  console.log('👂 Testing Kafka Consumer for 30 seconds...');

  try {
    await EventConsumer.connect();
    await EventConsumer.subscribeToTopics();

    // Run consumer for 30 seconds
    const consumerPromise = EventConsumer.startConsumer();

    setTimeout(async () => {
      console.log('⏰ 30 seconds elapsed, stopping consumer...');
      await EventConsumer.disconnect();
      process.exit(0);
    }, 30000);

    await consumerPromise;
  } catch (error) {
    console.error('❌ Consumer test failed:', error);
    process.exit(1);
  }
}

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'producer':
    case 'p':
      await testKafkaProducer();
      break;

    case 'consumer':
    case 'c':
      await testKafkaConsumer();
      break;

    case 'both':
    case 'b':
      // Start consumer in background
      testKafkaConsumer();

      // Wait 2 seconds then send events
      setTimeout(async () => {
        await testKafkaProducer();
      }, 2000);
      break;

    default:
      console.log(`
🚀 Kafka Test CLI

Usage:
  npx tsx src/scripts/test-kafka.ts <command>

Commands:
  producer, p     Test event publishing
  consumer, c     Test event consumption (30 sec)  
  both, b         Test both producer and consumer

Examples:
  npx tsx src/scripts/test-kafka.ts producer
  npx tsx src/scripts/test-kafka.ts consumer
  npx tsx src/scripts/test-kafka.ts both
      `);
      process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  try {
    await EventPublisher.disconnect();
    await EventConsumer.disconnect();
  } catch (error) {
    console.error('Error during shutdown:', error);
  }
  process.exit(0);
});

main().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
