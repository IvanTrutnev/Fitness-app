// src/routes/visits.ts
import express from 'express';
import { VisitService } from '../services/visitService';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import type { AuthRequest } from '../middleware/authMiddleware';
import { UserRole } from '../constants/user';

const router = express.Router();

// Create new visit
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId, trainerId, date, price, notes, useBalance } = req.body;
    const currentUser = req.user;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'UserId is required',
      });
    }

    // Authorization check
    const canCreateVisit =
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.TRAINER ||
      currentUser?.id === userId;

    if (!canCreateVisit) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create visit for this user',
      });
    }

    const visit = await VisitService.createVisit({
      userId,
      trainerId,
      date: date ? new Date(date) : undefined,
      price,
      notes,
      useBalance,
    });

    res.status(201).json({
      success: true,
      data: visit,
      message: 'Visit created successfully',
    });
  } catch (error) {
    console.error('Error creating visit:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error creating visit',
    });
  }
});

// Get all visits (admin only)
router.get(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const {
        limit = '50',
        skip = '0',
        userId,
        trainerId,
        dateFrom,
        dateTo,
      } = req.query;

      const options = {
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
        userId: userId as string | undefined,
        trainerId: trainerId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const result = await VisitService.getAllVisits(options);

      res.json({
        success: true,
        data: result.visits,
        total: result.total,
        pagination: {
          limit: options.limit,
          skip: options.skip,
          hasMore: result.total > options.skip + options.limit,
        },
      });
    } catch (error) {
      console.error('Error getting visits:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting visits',
      });
    }
  },
);

// Get current user's visits
router.get('/my', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { limit = '50', skip = '0', trainerId, dateFrom, dateTo } = req.query;

    const options = {
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
      trainerId: trainerId as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const visits = await VisitService.getUserVisits(userId, options);

    res.json({
      success: true,
      data: visits,
    });
  } catch (error) {
    console.error('Error getting user visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting visits',
    });
  }
});

// Get visits by user ID (admin/trainer only)
router.get('/user/:userId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;

    // Authorization check
    const canViewUserVisits =
      currentUser?.role === UserRole.ADMIN ||
      currentUser?.role === UserRole.TRAINER ||
      currentUser?.id === userId;

    if (!canViewUserVisits) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view visits for this user',
      });
    }

    const { limit = '50', skip = '0', trainerId, dateFrom, dateTo } = req.query;

    const options = {
      limit: parseInt(limit as string),
      skip: parseInt(skip as string),
      trainerId: trainerId as string | undefined,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    };

    const visits = await VisitService.getUserVisits(userId, options);

    res.json({
      success: true,
      data: visits,
    });
  } catch (error) {
    console.error('Error getting user visits:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting visits',
    });
  }
});

// Get visits by trainer ID
router.get(
  '/trainer/:trainerId',
  authMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { trainerId } = req.params;
      const currentUser = req.user;

      // Authorization check
      const canViewTrainerVisits =
        currentUser?.role === UserRole.ADMIN || currentUser?.id === trainerId;

      if (!canViewTrainerVisits) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view visits for this trainer',
        });
      }

      const { limit = '50', skip = '0', userId, dateFrom, dateTo } = req.query;

      const options = {
        limit: parseInt(limit as string),
        skip: parseInt(skip as string),
        userId: userId as string | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const visits = await VisitService.getTrainerVisits(trainerId, options);

      res.json({
        success: true,
        data: visits,
      });
    } catch (error) {
      console.error('Error getting trainer visits:', error);
      res.status(500).json({
        success: false,
        message: 'Error getting visits',
      });
    }
  },
);

// Get visit statistics
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { userId, trainerId, period } = req.query;
    const currentUser = req.user;

    // Authorization check for specific user/trainer stats
    if (userId || trainerId) {
      const canViewStats =
        currentUser?.role === UserRole.ADMIN ||
        currentUser?.id === userId ||
        currentUser?.id === trainerId;

      if (!canViewStats) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view these statistics',
        });
      }
    }

    const stats = await VisitService.getVisitStats(
      userId as string | undefined,
      trainerId as string | undefined,
      period as 'day' | 'week' | 'month' | 'year' | undefined,
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting visit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting statistics',
    });
  }
});

// Update visit (admin/trainer only)
router.put('/:visitId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { visitId } = req.params;
    const { trainerId, date, price, notes } = req.body;
    const currentUser = req.user;

    // Only admin and trainers can update visits
    if (
      currentUser?.role !== UserRole.ADMIN &&
      currentUser?.role !== UserRole.TRAINER
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update visits',
      });
    }

    const updates = {
      trainerId,
      date: date ? new Date(date) : undefined,
      price,
      notes,
    };

    const visit = await VisitService.updateVisit(visitId, updates);

    res.json({
      success: true,
      data: visit,
      message: 'Visit updated successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Visit not found') {
      return res.status(404).json({
        success: false,
        message: 'Visit not found',
      });
    }
    console.error('Error updating visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating visit',
    });
  }
});

// Delete visit (admin only)
router.delete(
  '/:visitId',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { visitId } = req.params;

      const result = await VisitService.deleteVisit(visitId);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Visit not found') {
        return res.status(404).json({
          success: false,
          message: 'Visit not found',
        });
      }
      console.error('Error deleting visit:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting visit',
      });
    }
  },
);

export default router;
