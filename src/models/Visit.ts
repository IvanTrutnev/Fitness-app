// src/models/Visit.ts
import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trainerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional trainer
  date: { type: Date, default: Date.now },
  price: { type: Number, min: 0 }, // optional price for one-time visits
  notes: { type: String, maxlength: 500 },
  wasBalanceUsed: { type: Boolean, default: false }, // indicates if balance was deducted
  balanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Balance' }, // link to balance if used
  createdAt: { type: Date, default: Date.now },
});

// Index for better performance
VisitSchema.index({ userId: 1, date: -1 });
VisitSchema.index({ trainerId: 1, date: -1 });

export const Visit = mongoose.model('Visit', VisitSchema);
