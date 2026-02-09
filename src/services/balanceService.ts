// src/services/balanceService.ts
import mongoose from 'mongoose';
import { Balance } from '../models/Balance';
import { VisitHistory } from '../models/VisitHistory';

export class BalanceService {
  /**
   * Add visits to existing balance or create new one
   */
  static async addOrCreateBalance(
    userId: string,
    visits: number,
    dueDate: Date,
    price?: number,
    notes?: string,
  ) {
    // Check if user has active balance
    const existingBalance = await BalanceService.getActiveBalance(userId);

    if (existingBalance) {
      // Update existing balance
      existingBalance.visits += visits;

      // Extend due date if new date is later
      if (dueDate > existingBalance.dueDate) {
        existingBalance.dueDate = dueDate;
      }

      // Add price to existing if provided
      if (price) {
        existingBalance.price = (existingBalance.price || 0) + price;
      }

      // Add notes if provided
      if (notes) {
        existingBalance.notes = existingBalance.notes
          ? `${existingBalance.notes}\n---\n${notes}`
          : notes;
      }

      return existingBalance.save();
    } else {
      // Create new balance
      return BalanceService.createBalance(
        userId,
        visits,
        dueDate,
        price,
        notes,
      );
    }
  }

  /**
   * Create new balance for user
   */
  static async createBalance(
    userId: string,
    visits: number,
    dueDate: Date,
    price?: number,
    notes?: string,
  ) {
    const balance = new Balance({
      userId,
      visits,
      dueDate,
      price,
      notes,
      isActive: true,
    });

    return balance.save();
  }

  /**
   * Get user's active balance
   */
  static async getActiveBalance(userId: string) {
    return Balance.findOne({
      userId,
      isActive: true,
      visits: { $gt: 0 },
      dueDate: { $gt: new Date() },
    }).sort({ dueDate: 1 });
  }

  /**
   * Get all user's balances
   */
  static async getUserBalances(userId: string) {
    return Balance.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Use one visit
   */
  static async useVisit(
    userId: string,
    notes?: string,
  ): Promise<{ success: boolean; message: string; remainingVisits?: number }> {
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // Find active balance
      const balance = await BalanceService.getActiveBalance(userId);

      if (!balance) {
        return {
          success: false,
          message: 'You have no active balance or visits have run out',
        };
      }

      if (balance.dueDate < new Date()) {
        // Deactivate expired balance
        balance.isActive = false;
        await balance.save({ session });

        return {
          success: false,
          message: 'Balance has expired',
        };
      }

      // Deduct visit
      balance.visits -= 1;
      if (balance.visits === 0) {
        balance.isActive = false;
      }
      await balance.save({ session });

      // Record in history
      const visitHistory = new VisitHistory({
        userId,
        balanceId: balance._id,
        visitDate: new Date(),
        notes,
      });
      await visitHistory.save({ session });

      await session.commitTransaction();

      return {
        success: true,
        message: 'Visit successfully deducted',
        remainingVisits: balance.visits,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Add visits to balance (top up existing balance)
   */
  static async addVisitsToBalance(balanceId: string, additionalVisits: number) {
    const balance = await Balance.findById(balanceId);

    if (!balance) {
      throw new Error('Balance not found');
    }

    balance.visits += additionalVisits;
    if (balance.visits > 0) {
      balance.isActive = true;
    }

    return balance.save();
  }

  /**
   * Get user statistics
   */
  static async getUserStats(userId: string) {
    const [activeBalance, totalBalances, visitHistory] = await Promise.all([
      BalanceService.getActiveBalance(userId),
      Balance.countDocuments({ userId }),
      VisitHistory.find({ userId }).sort({ visitDate: -1 }).limit(10),
    ]);

    const totalVisitsUsed = await VisitHistory.countDocuments({ userId });
    const thisMonthVisits = await VisitHistory.countDocuments({
      userId,
      visitDate: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    });

    return {
      activeBalance: activeBalance
        ? {
            visits: activeBalance.visits,
            dueDate: activeBalance.dueDate,
            isExpired: activeBalance.dueDate < new Date(),
          }
        : null,
      totalBalances,
      totalVisitsUsed,
      thisMonthVisits,
      recentVisits: visitHistory,
    };
  }

  /**
   * Deactivate expired balances (can be run via cron)
   */
  static async deactivateExpiredBalances() {
    const result = await Balance.updateMany(
      {
        isActive: true,
        dueDate: { $lt: new Date() },
      },
      {
        $set: { isActive: false },
      },
    );

    return result.modifiedCount;
  }
}
