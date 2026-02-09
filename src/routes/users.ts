import { Router } from 'express';
import { User } from '../models/User';
import { Document } from '../models/Document';
import { authMiddleware } from '../middleware/authMiddleware';
import { BalanceService } from '../services/balanceService';
import { UserRole } from '../constants/user';
import {
  cloudinaryUpload,
  cloudinaryDocumentUpload,
} from '../middleware/cloudinaryUpload';
import { cloudinary } from '../utils/cloudinary';

import type { AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// GET ALL USERS
router.get('/', authMiddleware, async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.role) {
      filter.role = req.query.role;
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

    res.json(usersWithBalances);
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
    const user = await User.findById(
      userId,
      '_id email avatarUrl phone username role',
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    console.log('current user:', user);

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

    res.json({
      _id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      username: user.username,
      role: user.role,
      activeBalance,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Failed to fetch current user', error: err });
  }
});

// GET USER DOCUMENTS (поставить перед /:id чтобы избежать конфликта роутов)
router.get('/documents', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;

  try {
    const documents = await Document.find({ userId }).sort({ uploadDate: -1 });

    const mappedDocuments = documents.map((doc) => ({
      _id: doc._id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      url: doc.url,
      category: doc.category,
      uploadDate: doc.uploadDate,
    }));

    res.json(mappedDocuments);
  } catch (err) {
    console.error('Failed to fetch documents:', err);
    res.status(500).json({ message: 'Failed to fetch documents' });
  }
});

// GET USER BY ID
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id, '_id email avatarUrl');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id: user._id,
      email: user.email,
      avatarUrl: user.avatarUrl,
    });
  } catch (err) {
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

    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { avatarUrl: file.path },
        { new: true, select: '_id email avatarUrl' },
      );

      res.json({
        message: 'Avatar uploaded',
        user: user
          ? {
              _id: user._id,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }
          : null,
      });
    } catch (err) {
      res.status(500).json({ message: 'Failed to upload avatar', error: err });
    }
  },
);

// UPDATE USER SETTINGS (username, phone, avatarUrl)
router.patch('/settings', authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  const { username, phone, avatarUrl } = req.body;

  const updateFields: Record<string, any> = {};
  if (username !== undefined) updateFields.username = username;
  if (phone !== undefined) updateFields.phone = phone;
  if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;

  if (Object.keys(updateFields).length === 0) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, select: '_id email avatarUrl phone username role' },
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'User settings updated',
      user: {
        _id: user._id,
        email: user.email,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Username already exists' });
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
    console.log('=== Document Upload Debug ===');
    const userId = req.user?.id;
    const file = req.file as Express.Multer.File & { path?: string };

    console.log('User ID:', userId);
    console.log(
      'File received:',
      file
        ? {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            path: file.path,
            filename: file.filename,
          }
        : 'No file',
    );

    if (!file || !file.path) {
      console.log('❌ No file or path');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Исправляем кодировку имени файла
      let fixedOriginalName = file.originalname;
      try {
        // Попробуем исправить двойное кодирование UTF-8
        const bytes = Buffer.from(file.originalname, 'latin1');
        fixedOriginalName = bytes.toString('utf8');
        console.log('Fixed original name:', fixedOriginalName);
      } catch (encodingError) {
        console.log('Failed to fix encoding, using original name');
      }

      // Определяем категорию файла
      let category = 'document';
      if (file.mimetype.startsWith('image/')) {
        category = 'image';
      }

      console.log('Creating document record:', {
        userId,
        filename: file.filename || fixedOriginalName,
        originalName: fixedOriginalName,
        mimeType: file.mimetype,
        size: file.size,
        url: file.path,
        category,
      });

      const document = new Document({
        userId,
        filename: file.filename || fixedOriginalName,
        originalName: fixedOriginalName, // Используем исправленное имя
        mimeType: file.mimetype,
        size: file.size,
        url: file.path,
        category,
      });

      await document.save();
      console.log('✅ Document saved successfully');

      res.json({
        message: 'Document uploaded successfully',
        document: {
          _id: document._id,
          originalName: document.originalName,
          mimeType: document.mimeType,
          size: document.size,
          url: document.url,
          category: document.category,
          uploadDate: document.uploadDate,
        },
      });
    } catch (err) {
      console.error('❌ Failed to save document:', err);
      res
        .status(500)
        .json({ message: 'Failed to save document', error: err.message });
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

    try {
      const document = await Document.findOne({ _id: id, userId });

      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Извлекаем public_id из URL Cloudinary
      try {
        const urlParts = document.url.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicIdWithExtension = urlParts.slice(-2).join('/'); // папка/файл
        const publicId = publicIdWithExtension.split('.')[0]; // убираем расширение

        console.log('Deleting from Cloudinary:', {
          url: document.url,
          publicId: publicId,
          category: document.category,
        });

        // Удаляем файл из Cloudinary
        if (document.category === 'image') {
          await cloudinary.uploader.destroy(publicId);
        } else {
          // Для документов используем resource_type: 'raw'
          await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw',
          });
        }

        console.log('✅ File deleted from Cloudinary');
      } catch (cloudinaryError) {
        console.error('⚠️ Failed to delete from Cloudinary:', cloudinaryError);
        // Продолжаем выполнение даже если не удалось удалить из Cloudinary
      }

      // Удаляем запись из БД
      await Document.findByIdAndDelete(id);

      res.json({ message: 'Document deleted successfully' });
    } catch (err) {
      console.error('Failed to delete document:', err);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  },
);

export default router;
