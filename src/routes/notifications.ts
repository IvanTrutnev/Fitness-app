import express from 'express';
import jwt from 'jsonwebtoken';
import {
  authMiddleware,
  type AuthRequest,
} from '../middleware/authMiddleware';
import { NotificationService } from '../services/notificationService';
import { SSEManager } from '../sse/sseManager';

const router = express.Router();

function resolveUserIdFromToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };
    return decoded.id;
  } catch {
    return null;
  }
}

/** SSE: EventSource cannot send Authorization header — token via query */
router.get('/stream', (req, res) => {
  const token =
    (typeof req.query.token === 'string' ? req.query.token : null) ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null);

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const userId = resolveUserIdFromToken(token);
  if (!userId) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write(': connected\n\n');

  SSEManager.add(userId, res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(heartbeat);
    SSEManager.remove(userId, res);
  });
});

router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = Math.min(
      parseInt(String(req.query.limit ?? '50'), 10) || 50,
      100,
    );

    const [notifications, unreadCount] = await Promise.all([
      NotificationService.getForUser(userId, { limit, unreadOnly }),
      NotificationService.getUnreadCount(userId),
    ]);

    res.json({
      success: true,
      data: notifications.map((n) => ({
        id: n._id.toString(),
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        metadata: n.metadata,
        createdAt: n.createdAt,
      })),
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const unreadCount = await NotificationService.getUnreadCount(userId);
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

router.patch('/read-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const modifiedCount = await NotificationService.markAllRead(userId);
    res.json({ success: true, modifiedCount });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notifications read' });
  }
});

router.patch('/:id/read', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const notification = await NotificationService.markRead(req.params.id, userId);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: {
        id: notification._id.toString(),
        isRead: notification.isRead,
      },
    });
  } catch (error) {
    console.error('Error marking notification read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification read' });
  }
});

export default router;
