// src/middleware/cloudinaryUpload.ts

import { cloudinary } from '../utils/cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    console.log('CloudinaryStorage');
    return {
      folder: 'avatars',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      format: 'webp',
      transformation: [{ width: 300, height: 300, crop: 'limit' }],
    };
  },
});

// Отдельное хранилище для документов
const documentStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    console.log(
      'CloudinaryStorage - Document upload:',
      file.originalname,
      file.mimetype
    );

    // Исправляем кодировку имени файла
    let fixedFilename = file.originalname;

    try {
      // Попробуем исправить двойное кодирование UTF-8
      // Сначала кодируем в latin-1, потом декодируем как UTF-8
      const bytes = Buffer.from(file.originalname, 'latin1');
      fixedFilename = bytes.toString('utf8');
      console.log('Fixed filename:', fixedFilename);
    } catch (error) {
      console.log('Failed to fix encoding, using original:', error);
      fixedFilename = file.originalname;
    }

    // Определяем тип файла и настройки
    let folder = 'documents';
    let resourceType = 'auto';

    if (file.mimetype.startsWith('image/')) {
      folder = 'documents/images';
      resourceType = 'image';
    } else {
      resourceType = 'raw'; // Для документов используем 'raw'
    }

    return {
      folder,
      resource_type: resourceType,
      // Сохраняем оригинальное имя для отображения пользователю
    };
  },
});

export const cloudinaryUpload = multer({ storage });
export const cloudinaryDocumentUpload = multer({ storage: documentStorage });
