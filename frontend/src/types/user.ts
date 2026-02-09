import type { UserRole } from '@/constants/user';
import type { Balance } from './balance';

export interface User {
  _id: string;
  email: string;
  avatarUrl?: string;
  username?: string;
  phone?: string;
  role?: UserRole;
}

export interface UserWithBalance extends User {
  activeBalance?: Balance | null;
}
