// src/routes/auth.ts
import { Router } from 'express';
import { registerValidator, loginValidator } from '../utils/validators';
import { validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { AuthService } from '../services/authService';
import { Request, Response } from 'express';

const router = Router();

// --- Register ---
router.post(
  '/register',
  registerValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { identifier, password } = req.body;

    try {
      const user = await AuthService.register(identifier, password);
      res.status(201).json({
        message: 'User created successfully',
        user,
      });
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message.includes('already exists') ||
          err.message.includes('valid email or phone')
        ) {
          return res.status(400).json({ message: err.message });
        }
      }
      res.status(500).json({ message: 'Server error', error: err });
    }
  },
);

// --- Login ---
router.post('/login', loginValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { identifier, password } = req.body;

  try {
    const result = await AuthService.login(identifier, password);
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === 'Invalid credentials') {
      return res.status(401).json({ message: err.message });
    }
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// --- Refresh Token ---
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const result = await AuthService.refreshToken(refreshToken);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Missing token') {
        return res.status(401).json({ message: err.message });
      }
      if (err.message === 'Invalid token') {
        return res.status(403).json({ message: err.message });
      }
    }
    res.status(403).json({ message: 'Invalid refresh token', error: err });
  }
});

// --- Logout ---
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  try {
    const result = await AuthService.logout(refreshToken);
    res.json(result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'Missing token') {
        return res.status(400).json({ message: err.message });
      }
      if (err.message === 'User not found') {
        return res.status(404).json({ message: err.message });
      }
    }
    res.status(403).json({ message: 'Invalid token', error: err });
  }
});

// --- Protected route example ---
router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ message: 'Welcome to your profile!', user: (req as any).user });
});

export default router;
