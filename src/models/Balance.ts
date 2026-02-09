// src/models/Balance.ts
import mongoose from 'mongoose';

const BalanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  visits: { type: Number, required: true, min: 0, default: 0 },
  dueDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  purchaseDate: { type: Date, default: Date.now },
  price: { type: Number, min: 0 },
  notes: { type: String, maxlength: 500 },
});

export const Balance = mongoose.model('Balance', BalanceSchema);
