// src/kafka/config.ts
import { Kafka, logLevel } from 'kafkajs';
import dotenv from 'dotenv';

dotenv.config();

export const kafka = new Kafka({
  clientId: 'fitness-app',
  brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  logLevel: process.env.NODE_ENV === 'production' ? logLevel.ERROR : logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
  connectionTimeout: 3000,
  requestTimeout: 30000,
});

export const producer = kafka.producer({
  maxInFlightRequests: 1,
  idempotent: true,
  transactionTimeout: 30000,
});

export const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || 'fitness-app-group',
  allowAutoTopicCreation: true,
});

// Kafka Topics Configuration
export const TOPICS = {
  // Business Events
  BALANCE: {
    CREATED: 'balance.created',
    TOPPED_UP: 'balance.topped_up', 
    VISIT_USED: 'balance.visit_used',
    EXPIRED: 'balance.expired',
    DEACTIVATED: 'balance.deactivated',
  },
  VISIT: {
    CREATED: 'visit.created',
    COMPLETED: 'visit.completed',
    CANCELLED: 'visit.cancelled',
  },
  USER: {
    REGISTERED: 'user.registered',
    LOGIN: 'user.login',
    PROFILE_UPDATED: 'user.profile_updated',
  },
  DOCUMENT: {
    UPLOADED: 'document.uploaded',
    DELETED: 'document.deleted',
  },
  // Notifications
  NOTIFICATIONS: {
    EMAIL: 'notifications.email',
    SMS: 'notifications.sms',
    PUSH: 'notifications.push',
  },
  // Analytics
  ANALYTICS: {
    USER_ACTIVITY: 'analytics.user_activity',
    REVENUE: 'analytics.revenue',
    SYSTEM_METRICS: 'analytics.system_metrics',
  },
  // Audit Log
  AUDIT: {
    USER_ACTION: 'audit.user_action',
    ADMIN_ACTION: 'audit.admin_action',
    SYSTEM_EVENT: 'audit.system_event',
  },
} as const;

// Event Schema Types
export interface BaseEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  version: string;
  source: string;
}

export interface BalanceEvent extends BaseEvent {
  balanceId: string;
  visits?: number;
  previousVisits?: number;
  dueDate?: Date;
  price?: number;
  notes?: string;
}

export interface VisitEvent extends BaseEvent {
  visitId: string;
  balanceId?: string;
  trainerId?: string;
  wasBalanceUsed: boolean;
  price?: number;
  notes?: string;
}

export interface UserEvent extends BaseEvent {
  userEmail: string;
  role?: string;
  action?: string;
}

export interface NotificationEvent extends BaseEvent {
  recipient: string;
  subject?: string;
  message: string;
  type: 'balance_low' | 'balance_expired' | 'visit_reminder' | 'welcome' | 'custom';
  metadata?: Record<string, any>;
}

export interface AnalyticsEvent extends BaseEvent {
  eventType: string;
  data: Record<string, any>;
}

export interface AuditEvent extends BaseEvent {
  action: string;
  resource: string;
  resourceId?: string;
  previousState?: Record<string, any>;
  newState?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}