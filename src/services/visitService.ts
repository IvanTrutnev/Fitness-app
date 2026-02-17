// src/services/visitService.ts
import { Visit } from '../models/Visit';
import { BalanceService } from './balanceService';
import { UserRole } from '../constants/user';

export class VisitService {
  /**
   * Create new visit with compensation pattern
   */
  static async createVisit(data: {
    userId: string;
    trainerId?: string;
    date?: Date;
    price?: number;
    notes?: string;
    useBalance?: boolean; // whether to deduct from user's balance
  }) {
    let compensationActions: Array<() => Promise<void>> = [];

    try {
      const visitData: any = {
        userId: data.userId,
        date: data.date || new Date(),
        notes: data.notes,
        wasBalanceUsed: false,
      };

      // Add trainer if provided
      if (data.trainerId) {
        visitData.trainerId = data.trainerId;
      }

      // Handle balance deduction or one-time payment
      if (data.useBalance) {
        const balanceResult = await BalanceService.useVisit(
          data.userId,
          data.notes,
        );

        if (!balanceResult.success) {
          throw new Error(balanceResult.message);
        }

        visitData.wasBalanceUsed = true;
        visitData.balanceId = balanceResult.balanceId;

        // Add compensation action for balance rollback
        compensationActions.push(async () => {
          if (balanceResult.balanceId) {
            await BalanceService.refundVisit(balanceResult.balanceId);
          }
        });
      } else {
        // One-time visit with price
        if (data.price) {
          visitData.price = data.price;
        }
      }

      const visit = new Visit(visitData);
      await visit.save();

      // Add compensation action for visit deletion
      compensationActions.push(async () => {
        await Visit.findByIdAndDelete(visit._id);
      });

      // Populate trainer info if exists
      await visit.populate('trainerId', 'email username avatarUrl');
      await visit.populate('userId', 'email username avatarUrl');

      return visit;
    } catch (error) {
      // Execute compensation actions in reverse order
      for (let i = compensationActions.length - 1; i >= 0; i--) {
        try {
          await compensationActions[i]();
        } catch (compensationError) {
          console.error('Compensation action failed:', compensationError);
          // Log but don't throw - we're already in error state
        }
      }
      throw error;
    }
  }

  /**
   * Get visits by user
   */
  static async getUserVisits(
    userId: string,
    options?: { limit?: number; skip?: number; trainerId?: string },
  ) {
    const filter: any = { userId };

    if (options?.trainerId) {
      filter.trainerId = options.trainerId;
    }

    const visits = await Visit.find(filter)
      .populate('trainerId', 'email username avatarUrl role')
      .populate('userId', 'email username avatarUrl')
      .sort({ date: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0);

    return visits;
  }

  /**
   * Get visits by trainer
   */
  static async getTrainerVisits(
    trainerId: string,
    options?: { limit?: number; skip?: number; userId?: string },
  ) {
    const filter: any = { trainerId };

    if (options?.userId) {
      filter.userId = options.userId;
    }

    const visits = await Visit.find(filter)
      .populate('userId', 'email username avatarUrl')
      .populate('trainerId', 'email username avatarUrl')
      .sort({ date: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0);

    return visits;
  }

  /**
   * Get all visits (for admins)
   */
  static async getAllVisits(options?: {
    limit?: number;
    skip?: number;
    userId?: string;
    trainerId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const filter: any = {};

    if (options?.userId) filter.userId = options.userId;
    if (options?.trainerId) filter.trainerId = options.trainerId;

    if (options?.dateFrom || options?.dateTo) {
      filter.date = {};
      if (options.dateFrom) filter.date.$gte = options.dateFrom;
      if (options.dateTo) filter.date.$lte = options.dateTo;
    }

    const visits = await Visit.find(filter)
      .populate('userId', 'email username avatarUrl')
      .populate('trainerId', 'email username avatarUrl role')
      .sort({ date: -1 })
      .limit(options?.limit || 50)
      .skip(options?.skip || 0);

    const total = await Visit.countDocuments(filter);

    return { visits, total };
  }

  /**
   * Get visit statistics
   */
  static async getVisitStats(
    userId?: string,
    trainerId?: string,
    period?: 'day' | 'week' | 'month' | 'year',
  ) {
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (trainerId) filter.trainerId = trainerId;

    // Calculate period dates
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    if (period) {
      filter.date = { $gte: startDate };
    }

    const [totalVisits, revenueFromVisits, balanceVisits] = await Promise.all([
      Visit.countDocuments(filter),
      Visit.aggregate([
        { $match: { ...filter, price: { $exists: true, $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$price' } } },
      ]),
      Visit.countDocuments({ ...filter, wasBalanceUsed: true }),
    ]);

    return {
      totalVisits,
      revenue: revenueFromVisits[0]?.total || 0,
      balanceVisits,
      paidVisits: totalVisits - balanceVisits,
    };
  }

  /**
   * Update visit
   */
  static async updateVisit(
    visitId: string,
    updates: {
      trainerId?: string;
      date?: Date;
      price?: number;
      notes?: string;
    },
  ) {
    const visit = await Visit.findByIdAndUpdate(
      visitId,
      { $set: updates },
      { new: true },
    )
      .populate('userId', 'email username avatarUrl')
      .populate('trainerId', 'email username avatarUrl role');

    if (!visit) {
      throw new Error('Visit not found');
    }

    return visit;
  }

  /**
   * Delete visit
   */
  static async deleteVisit(visitId: string) {
    const visit = await Visit.findByIdAndDelete(visitId);

    if (!visit) {
      throw new Error('Visit not found');
    }

    return { message: 'Visit deleted successfully' };
  }
}
