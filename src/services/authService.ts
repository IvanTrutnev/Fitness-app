// src/services/authService.ts
import { User } from '../models/User';
import { UserRole } from '../constants/user';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { EventPublisher } from '../kafka/eventPublisher';

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
  static async register(identifier: string, password: string) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const isPhone = /^\+?[1-9]\d{1,14}$/.test(identifier);

    if (!isEmail && !isPhone) {
      throw new Error('Please provide a valid email or phone number');
    }

    const query = isEmail ? { email: identifier } : { phone: identifier };
    const existing = await User.findOne(query);

    if (existing) {
      throw new Error(
        `User with this ${isEmail ? 'email' : 'phone number'} already exists`,
      );
    }

    const hash = await bcrypt.hash(password, 10);
    const userData: any = {
      password: hash,
      username: identifier,
      role: UserRole.USER,
    };

    if (isEmail) {
      userData.email = identifier;
    } else {
      userData.phone = identifier;
    }

    const user = new User(userData);
    await user.save();

    // 📤 Publish Kafka event for user registration
    try {
      await EventPublisher.publishUserRegistered({
        userId: user._id.toString(),
        userEmail: userData.email || '',
        role: userData.role,
      });
    } catch (error) {
      console.error('Failed to publish user registered event:', error);
      // Don't interrupt registration if Kafka is unavailable
    }

    return {
      _id: user._id,
      email: user.email,
      phone: user.phone,
      username: user.username,
      role: user.role,
    };
  }

  /**
   * Login user
   */
  static async login(identifier: string, password: string) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const query = isEmail ? { email: identifier } : { phone: identifier };

    const user = await User.findOne(query);
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
      phone: user.phone,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
    };

    // 📤 Publish Kafka event for user login
    try {
      await EventPublisher.publishUserLogin({
        userId: user._id.toString(),
        userEmail: user.email || '',
      });
    } catch (error) {
      console.error('Failed to publish user login event:', error);
      // Don't interrupt login if Kafka is unavailable
    }

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
