// src/routes/auth.ts
import { Router } from 'express';
import { User } from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerValidator, loginValidator } from '../utils/validators';
import { validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/authMiddleware';
import { Request, Response } from 'express';

const router = Router();

// --- Token Generators ---
const generateAccessToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '20m' },
  );
};

const generateRefreshToken = (user: any) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' },
  );
};

// --- Register ---
router.post(
  '/register',
  registerValidator,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res
          .status(400)
          .json({ message: 'User with this email already exists' });
      }

      const hash = await bcrypt.hash(password, 10);
      const user = new User({
        email,
        password: hash,
        username: email,
        role: 'user',
      });
      await user.save();

      const userResponse = {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
      };

      res.status(201).json({
        message: 'User created successfully',
        user: userResponse,
      });
    } catch (err) {
      res.status(500).json({ message: 'Server error', error: err });
    }
  },
);

// --- Login ---
router.post('/login', loginValidator, async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: 'Invalid credentials' });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Возвращаем токены и данные пользователя
    const userResponse = {
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
    };

    res.json({
      accessToken,
      refreshToken,
      user: userResponse,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// --- Refresh Token ---
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as {
      id: string;
      email: string;
    };

    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ message: 'Invalid token' });

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: 'Invalid refresh token', error: err });
  }
});

// --- Logout ---
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Missing token' });

  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as {
      id: string;
    };

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.refreshToken = undefined;
    await user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(403).json({ message: 'Invalid token', error: err });
  }
});

// --- Protected route example ---
router.get('/profile', authMiddleware, async (req, res) => {
  res.json({ message: 'Welcome to your profile!', user: (req as any).user });
});

export default router;
