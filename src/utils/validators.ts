// src/utils/validators.ts
import { body } from 'express-validator';

// Функция для проверки, является ли строка email или телефоном
const isEmailOrPhone = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Международный формат E.164
  return emailRegex.test(value) || phoneRegex.test(value);
};

export const registerValidator = [
  body('identifier')
    .custom(isEmailOrPhone)
    .withMessage('Please provide a valid email or phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidator = [
  body('identifier')
    .custom(isEmailOrPhone)
    .withMessage('Please provide a valid email or phone number'),
  body('password').notEmpty().withMessage('Password is required'),
];
