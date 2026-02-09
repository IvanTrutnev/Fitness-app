// src/routes/balance.ts
import express from 'express';
import { BalanceService } from '../services/balanceService';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware';
import type { AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// Get current user's active balance
router.get('/active', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const balance = await BalanceService.getActiveBalance(userId);

    if (!balance) {
      return res.status(404).json({
        success: false,
        message: 'Active balance not found',
      });
    }

    res.json({
      success: true,
      data: {
        id: balance._id,
        visits: balance.visits,
        dueDate: balance.dueDate,
        isExpired: balance.dueDate < new Date(),
        purchaseDate: balance.purchaseDate,
      },
    });
  } catch (error) {
    console.error('Error getting active balance:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting balance',
    });
  }
});

// Get all user balances
router.get('/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const balances = await BalanceService.getUserBalances(userId);

    res.json({
      success: true,
      data: balances,
    });
  } catch (error) {
    console.error('Error getting balance history:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting balance history',
    });
  }
});

// Create new balance (for admins)
router.post(
  '/',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { userId, visits, dueDate, price, notes } = req.body;

      console.log('Creating balance request:', {
        userId,
        visits,
        dueDate,
        price,
        notes,
        adminUser: req.user?.email,
      });

      if (!userId || !visits || !dueDate) {
        return res.status(400).json({
          success: false,
          message: 'Required fields: userId, visits, dueDate',
        });
      }

      const balance = await BalanceService.addOrCreateBalance(
        userId,
        visits,
        new Date(dueDate),
        price,
        notes,
      );

      console.log('Balance processed successfully:', balance._id);

      res.status(201).json({
        success: true,
        data: balance,
        message:
          balance.visits > visits
            ? `Added ${visits} visits to existing balance`
            : 'New balance created successfully',
      });
    } catch (error) {
      console.error('Error creating balance:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating balance',
      });
    }
  },
);

// Use visit
router.post('/use-visit', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { notes } = req.body;

    const result = await BalanceService.useVisit(userId, notes);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error using visit:', error);
    res.status(500).json({
      success: false,
      message: 'Error using visit',
    });
  }
});

// Get user statistics
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const stats = await BalanceService.getUserStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user stats',
    });
  }
});

// Top up balance (for admins)
router.patch(
  '/:balanceId/add-visits',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res) => {
    try {
      const { balanceId } = req.params;
      const { visits } = req.body;

      if (!visits || visits <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Must specify positive number of visits',
        });
      }

      const balance = await BalanceService.addVisitsToBalance(
        balanceId,
        visits,
      );

      res.json({
        success: true,
        data: balance,
        message: 'Visits successfully added',
      });
    } catch (error) {
      console.error('Error adding visits:', error);
      res.status(500).json({
        success: false,
        message: 'Error adding visits to balance',
      });
    }
  },
);

export default router;
