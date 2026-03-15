// src/kafka/kafkaManager.ts
import { EventPublisher } from './eventPublisher';
import { EventConsumer } from './eventConsumer';

export class KafkaManager {
  private static isInitialized = false;

  /**
   * Initialize Kafka (connect producer and start consumer)
   */
  static async initialize() {
    if (this.isInitialized) {
      console.log('⚠️ Kafka already initialized');
      return;
    }

    console.log('🚀 Initializing Kafka...');

    try {
      // Connect producer
      await EventPublisher.connect();

      // Start consumer in background
      if (process.env.KAFKA_CONSUME_EVENTS !== 'false') {
        this.startConsumerInBackground();
      }

      this.isInitialized = true;
      console.log('✅ Kafka initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Kafka:', error);

      // В development режиме можно продолжить без Kafka
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Running in development mode without Kafka');
        return;
      }

      throw error;
    }
  }

  /**
   * Start consumer in background
   */
  private static startConsumerInBackground() {
    // Запуск consumer'а в отдельном процессе
    EventConsumer.startConsumer().catch((error) => {
      console.error('❌ Kafka Consumer error:', error);

      // Restart consumer after delay
      setTimeout(() => {
        console.log('🔄 Restarting Kafka Consumer...');
        this.startConsumerInBackground();
      }, 5000);
    });
  }

  /**
   * Graceful shutdown
   */
  static async shutdown() {
    if (!this.isInitialized) {
      return;
    }

    console.log('🛑 Shutting down Kafka...');

    try {
      await EventPublisher.disconnect();
      await EventConsumer.disconnect();

      this.isInitialized = false;
      console.log('✅ Kafka shutdown complete');
    } catch (error) {
      console.error('❌ Error during Kafka shutdown:', error);
    }
  }

  /**
   * Health check
   */
  static isHealthy(): boolean {
    return this.isInitialized;
  }
}
