// src/services/userService.ts
import { User } from '../models/User';
import { BalanceService } from './balanceService';
import { UserRole } from '../constants/user';

export class UserService {
  /**
   * Get all users with optional role filter and balances
   */
  static async getAllUsers(roleFilter?: string) {
    const filter: any = {};
    if (roleFilter) {
      filter.role = roleFilter;
    }

    const users = await User.find(filter, '_id email avatarUrl role');

    // Get active balances for USER role in parallel
    const usersWithBalances = await Promise.all(
      users.map(async (user) => {
        const userObj = {
          _id: user._id,
          email: user.email,
          avatarUrl: user.avatarUrl,
          role: user.role,
          activeBalance: null as any,
        };

        // Get active balance only for USER role
        if (user.role === UserRole.USER) {
          try {
            const balance = await BalanceService.getActiveBalance(
              user._id.toString(),
            );
            if (balance) {
              userObj.activeBalance = {
                id: balance._id,
                visits: balance.visits,
                dueDate: balance.dueDate,
                isExpired: balance.dueDate < new Date(),
                purchaseDate: balance.purchaseDate,
              };
            }
          } catch (balanceError) {
            console.error(
              'Error getting balance for user:',
              user._id,
              balanceError,
            );
            // Continue without balance if there's an error
          }
        }

        return userObj;
      }),
    );

    return usersWithBalances;
  }

  /**
   * Get current user with balance info
   */
  static async getCurrentUser(userId: string) {
    const user = await User.findById(
      userId,
      '_id email avatarUrl phone username role',
    );

    if (!user) {
      throw new Error('User not found');
    }

    let activeBalance = null;

    // Get active balance only for USER role
    if (user.role === UserRole.USER) {
      try {
        const balance = await BalanceService.getActiveBalance(userId);
        if (balance) {
          activeBalance = {
            id: balance._id,
            visits: balance.visits,
            dueDate: balance.dueDate,
            isExpired: balance.dueDate < new Date(),
            purchaseDate: balance.purchaseDate,
          };
        }
      } catch (balanceError) {
        console.error('Error getting balance:', balanceError);
        // Continue without balance if there's an error
      }
    }

    return {
      _id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      username: user.username,
      role: user.role,
      activeBalance,
    };
  }

  /**
   * Get user by ID (simplified)
   */
  static async getUserById(id: string) {
    const user = await User.findById(id, '_id email avatarUrl');
    if (!user) {
      throw new Error('User not found');
    }

    return {
      _id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Update user avatar
   */
  static async updateAvatar(userId: string, avatarUrl: string) {
    const user = await User.findByIdAndUpdate(
      userId,
      { avatarUrl },
      { new: true, select: '_id email avatarUrl' },
    );

    if (!user) {
      throw new Error('User not found');
    }

    return {
      _id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  }

  /**
   * Update user settings
   */
  static async updateSettings(
    userId: string,
    updates: { username?: string; phone?: string; avatarUrl?: string },
  ) {
    const updateFields: Record<string, any> = {};
    if (updates.username !== undefined)
      updateFields.username = updates.username;
    if (updates.phone !== undefined) updateFields.phone = updates.phone;
    if (updates.avatarUrl !== undefined)
      updateFields.avatarUrl = updates.avatarUrl;

    if (Object.keys(updateFields).length === 0) {
      throw new Error('No fields to update');
    }

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateFields },
        { new: true, select: '_id email avatarUrl phone username role' },
      );

      if (!user) {
        throw new Error('User not found');
      }

      return {
        _id: user._id,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        username: user.username,
        role: user.role,
      };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }
}
