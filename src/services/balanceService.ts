// src/services/balanceService.ts
import { Balance } from '../models/Balance';
import { VisitHistory } from '../models/VisitHistory';
import { EventPublisher } from '../kafka/eventPublisher';
import { KAFKA_ENABLED } from '../kafka/config';
import { NotificationService } from './notificationService';

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

      const saved = await existingBalance.save();

      try {
        await EventPublisher.publishBalanceCreated({
          userId,
          balanceId: saved._id.toString(),
          visits,
          dueDate: saved.dueDate,
          price,
          notes,
        });
      } catch (error) {
        console.error('Failed to publish balance topped up event:', error);
      }

      if (!KAFKA_ENABLED) {
        try {
          await NotificationService.createBalanceCreated({
            userId,
            visits,
            dueDate: saved.dueDate,
          });
        } catch (error) {
          console.error('Failed to create balance topped up notification:', error);
        }
      }

      return saved;
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

    const savedBalance = await balance.save();

    // 📤 Publish Kafka event
    try {
      await EventPublisher.publishBalanceCreated({
        userId,
        balanceId: savedBalance._id.toString(),
        visits,
        dueDate,
        price,
        notes,
      });
    } catch (error) {
      console.error('Failed to publish balance created event:', error);
      // Не прерываем выполнение, если Kafka недоступна
    }

    if (!KAFKA_ENABLED) {
      try {
        await NotificationService.createBalanceCreated({
          userId,
          visits,
          dueDate,
        });
      } catch (error) {
        console.error('Failed to create balance created notification:', error);
      }
    }

    return savedBalance;
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
   * Use one visit (atomic operation)
   */
  static async useVisit(
    userId: string,
    notes?: string,
  ): Promise<{
    success: boolean;
    message: string;
    remainingVisits?: number;
    balanceId?: any;
  }> {
    try {
      // Atomic operation: find balance and decrease visits in one go
      const balance = await Balance.findOneAndUpdate(
        {
          userId,
          isActive: true,
          visits: { $gt: 0 }, // Only if visits > 0
          dueDate: { $gt: new Date() }, // Only if not expired
        },
        {
          $inc: { visits: -1 }, // Atomically decrease visits
        },
        {
          new: true, // Return updated document
        },
      );

      if (!balance) {
        return {
          success: false,
          message:
            'You have no active balance, visits have run out, or balance has expired',
        };
      }

      // If visits reached 0, deactivate balance
      if (balance.visits === 0) {
        await Balance.findByIdAndUpdate(balance._id, {
          isActive: false,
        });
      }

      // Record in history (if this fails, balance is already decremented, but that's acceptable)
      try {
        const visitHistory = new VisitHistory({
          userId,
          balanceId: balance._id,
          visitDate: new Date(),
          notes,
        });
        await visitHistory.save();
      } catch (error) {
        console.error('Failed to save visit history:', error);
        // Continue - history is not critical for business logic
      }

      // 📤 Publish Kafka event for visit usage
      try {
        await EventPublisher.publishBalanceVisitUsed({
          userId,
          balanceId: balance._id.toString(),
          previousVisits: balance.visits + 1, // Before decrement
          remainingVisits: balance.visits,
          notes,
        });
      } catch (error) {
        console.error('Failed to publish balance visit used event:', error);
        // Don't interrupt execution if Kafka is unavailable
      }

      if (!KAFKA_ENABLED) {
        const balanceId = balance._id.toString();
        const remaining = balance.visits;
        try {
          if (remaining === 0) {
            await NotificationService.createBalanceEmpty({ userId, balanceId });
          } else if (remaining <= 3) {
            await NotificationService.createBalanceLow({
              userId,
              remainingVisits: remaining,
              balanceId,
            });
          }
        } catch (error) {
          console.error('Failed to create visit used notification:', error);
        }
      }

      return {
        success: true,
        message: 'Visit successfully deducted',
        remainingVisits: balance.visits,
        balanceId: balance._id,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refund visit (compensation method)
   */
  static async refundVisit(balanceId: string) {
    try {
      // Atomically increase visits back
      const balance = await Balance.findByIdAndUpdate(
        balanceId,
        {
          $inc: { visits: 1 },
          $set: { isActive: true }, // Reactivate if needed
        },
        { new: true },
      );

      // Remove the latest visit history record for this balance
      await VisitHistory.findOneAndDelete(
        {
          balanceId,
          userId: balance?.userId,
        },
        {
          sort: { visitDate: -1 }, // Remove the latest one
        },
      );

      return balance;
    } catch (error) {
      console.error('Failed to refund visit:', error);
      throw error;
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
    const expiredBalances = await Balance.find({
      isActive: true,
      dueDate: { $lt: new Date() },
    });

    if (expiredBalances.length === 0) {
      return 0;
    }

    await Balance.updateMany(
      { _id: { $in: expiredBalances.map((b) => b._id) } },
      { $set: { isActive: false } },
    );

    for (const balance of expiredBalances) {
      const userId = balance.userId.toString();
      const balanceId = balance._id.toString();

      try {
        await EventPublisher.publishBalanceExpired({
          userId,
          balanceId,
          visits: balance.visits,
          dueDate: balance.dueDate,
        });
      } catch (error) {
        console.error('Failed to publish balance expired event:', error);
      }

      if (!KAFKA_ENABLED) {
        try {
          await NotificationService.createBalanceExpired({
            userId,
            visits: balance.visits,
            dueDate: balance.dueDate,
            balanceId,
          });
        } catch (error) {
          console.error('Failed to create balance expired notification:', error);
        }
      }
    }

    return expiredBalances.length;
  }
}
