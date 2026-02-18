// src/models/User.ts
import mongoose from 'mongoose';
import { USER_ROLES, UserRole } from '../constants/user';

const UserSchema = new mongoose.Schema({
  email: { type: String, sparse: true, unique: true },
  phone: { type: String, sparse: true, unique: true },
  password: { type: String, required: true },
  refreshToken: { type: String },
  avatarUrl: { type: String },
  username: { type: String, required: true, unique: true },
  role: { type: String, enum: USER_ROLES, default: UserRole.USER },
});

export const User = mongoose.model('User', UserSchema);
