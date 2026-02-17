import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { UserService } from '../services/userService';
import { DocumentService } from '../services/documentService';
import {
  cloudinaryUpload,
  cloudinaryDocumentUpload,
} from '../middleware/cloudinaryUpload';

import type { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET ALL USERS
router.get('/', authMiddleware, async (req, res) => {
  try {
    const roleFilter = req.query.role as string | undefined;
    const users = await UserService.getAllUsers(roleFilter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users', error: err });
  }
});

// GET CURRENT USER
router.get('/current', authMiddleware, async (req: AuthRequest, res) => {
  console.log('get current user', req.user?.id);
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const user = await UserService.getCurrentUser(userId);
    console.log('current user:', user);

    // Headers to prevent caching of the response
    // res.set({
    //   'Cache-Control': 'no-cache, no-store, must-revalidate', // Отключить кеширование
    //   Pragma: 'no-cache',
    //   Expires: '0',
    // });

    res.json(user);
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    res
      .status(500)
      .json({ message: 'Failed to fetch current user', error: err });
  }
});

// GET USER DOCUMENTS (поставить перед /:id чтобы избежать конфликта роутов)
router.get('/documents', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const documents = await DocumentService.getUserDocuments(userId);
    res.json(documents);
  } catch (err) {
    console.error('Failed to fetch documents:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// GET USER BY ID
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await UserService.getUserById(id);
    res.json(user);
  } catch (err) {
    if (err instanceof Error && err.message === 'User not found') {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(500).json({ message: 'Failed to fetch user', error: err });
  }
});

router.post(
  '/upload-avatar',
  authMiddleware,
  cloudinaryUpload.single('avatar'),
  async (req: AuthRequest, res) => {
    console.log('upload-avatar');
    const userId = req.user?.id;
    const file = req.file as Express.Multer.File & { path?: string };

    if (!file || !file.path) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const user = await UserService.updateAvatar(userId, file.path);
      res.json({
        message: 'Avatar uploaded',
        user,
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'User not found') {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(500).json({ message: 'Failed to upload avatar', error: err });
    }
  },
);

// UPDATE USER SETTINGS (username, phone, avatarUrl)
router.patch('/settings', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { username, phone, avatarUrl } = req.body;

  try {
    const user = await UserService.updateSettings(userId, {
      username,
      phone,
      avatarUrl,
    });

    res.json({
      message: 'User settings updated',
      user,
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'User not found') {
        return res.status(404).json({ message: 'User not found' });
      }
      if (err.message === 'No fields to update') {
        return res.status(400).json({ message: 'No fields to update' });
      }
      if (err.message === 'Username already exists') {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    res
      .status(500)
      .json({ message: 'Failed to update user settings', error: err });
  }
});

// UPLOAD DOCUMENT TO CLOUDINARY
router.post(
  '/upload-document',
  authMiddleware,
  cloudinaryDocumentUpload.single('document'),
  async (req: AuthRequest, res) => {
    const userId = req.user?.id;
    const file = req.file as Express.Multer.File & { path?: string };

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const document = await DocumentService.uploadDocument(userId, file);
      res.json({
        message: 'Document uploaded successfully',
        document,
      });
    } catch (err) {
      console.error('❌ Failed to save document:', err);
      res.status(500).json({
        message: 'Failed to save document',
        error: err instanceof Error ? err.message : String(err),
      });
    }
  },
);

// DELETE DOCUMENT
router.delete(
  '/documents/:id',
  authMiddleware,
  async (req: AuthRequest, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const result = await DocumentService.deleteDocument(id, userId);
      res.json(result);
    } catch (err) {
      if (err instanceof Error && err.message === 'Document not found') {
        return res.status(404).json({ message: 'Document not found' });
      }
      console.error('Failed to delete document:', err);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  },
);

export default router;
