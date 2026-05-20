import mongoose from 'mongoose';

export const NOTIFICATION_TYPES = [
  'balance_created',
  'balance_low',
  'balance_empty',
  'balance_expiry_warning',
  'balance_expired',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 500 },
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model('Notification', NotificationSchema);
