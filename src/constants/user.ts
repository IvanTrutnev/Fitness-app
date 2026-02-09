export const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
  TRAINER: 'trainer',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLES = Object.values(UserRole);
