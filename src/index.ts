import express from 'express';
import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import balanceRoutes from './routes/balance';
import visitRoutes from './routes/visits';
import cors from 'cors';
import { KafkaManager } from './kafka/kafkaManager';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sequelize = new Sequelize(process.env.POSTGRES_URL!, {
  dialect: 'postgres',
});

async function connectMongo() {
  try {
    await mongoose.connect(process.env.MONGO_URL!);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
  }
}

// Routers
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/balance', balanceRoutes);
app.use('/visits', visitRoutes);

app.get('/', (_, res) => {
  res.send('Hello from Express + TS + Hot Reload!');
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    await connectMongo();

    // Initialize Kafka
    try {
      await KafkaManager.initialize();
    } catch (kafkaError) {
      console.error(
        '⚠️ Kafka initialization failed, continuing without it:',
        kafkaError,
      );
    }

    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('❌ Server failed to start:', err);
  }
}

start();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');

  try {
    await KafkaManager.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');

  try {
    await KafkaManager.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});
