// src/services/authService.ts
import { User } from '../models/User';
import { UserRole } from '../constants/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export class AuthService {
  /**
   * Generate access token
   */
  static generateAccessToken(user: any) {
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
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(user: any) {
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
  }

  /**
   * Register new user
   */
  static async register(email: string, password: string) {
    const existing = await User.findOne({ email });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const hash = await bcrypt.hash(password, 10);
    const user = new User({
      email,
      password: hash,
      username: email,
      role: UserRole.USER,
    });

    await user.save();

    return {
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = AuthService.generateAccessToken(user);
    const refreshToken = AuthService.generateRefreshToken(user);

    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    const userResponse = {
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
    };

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Missing token');
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as {
      id: string;
      email: string;
    };

    const user = await User.findById(payload.id);
    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Invalid token');
    }

    const newAccessToken = AuthService.generateAccessToken(user);
    return { accessToken: newAccessToken };
  }

  /**
   * Logout user
   */
  static async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Missing token');
    }

    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as {
      id: string;
    };

    const user = await User.findById(payload.id);
    if (!user) {
      throw new Error('User not found');
    }

    user.refreshToken = undefined;
    await user.save();

    return { message: 'Logged out successfully' };
  }
}
