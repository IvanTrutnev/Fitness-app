// src/models/VisitHistory.ts
import mongoose from 'mongoose';

const VisitHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Balance',
    required: true,
  },
  visitDate: { type: Date, default: Date.now },
  notes: { type: String, maxlength: 200 },
});

export const VisitHistory = mongoose.model('VisitHistory', VisitHistorySchema);
