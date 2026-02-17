// src/services/documentService.ts
import { Document } from '../models/Document';
import { cloudinary } from '../utils/cloudinary';

export class DocumentService {
  /**
   * Get user documents
   */
  static async getUserDocuments(userId: string) {
    const documents = await Document.find({ userId }).sort({ uploadDate: -1 });

    return documents.map((doc) => ({
      _id: doc._id,
      originalName: doc.originalName,
      mimeType: doc.mimeType,
      size: doc.size,
      url: doc.url,
      category: doc.category,
      uploadDate: doc.uploadDate,
    }));
  }

  /**
   * Upload and save document
   */
  static async uploadDocument(
    userId: string,
    file: Express.Multer.File & { path?: string },
  ) {
    if (!file || !file.path) {
      throw new Error('No file uploaded');
    }

    console.log('=== Document Upload Debug ===');
    console.log('User ID:', userId);
    console.log('File received:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      filename: file.filename,
    });

    // Fix file name encoding
    let fixedOriginalName = file.originalname;
    try {
      // Try to fix double UTF-8 encoding
      const bytes = Buffer.from(file.originalname, 'latin1');
      fixedOriginalName = bytes.toString('utf8');
      console.log('Fixed original name:', fixedOriginalName);
    } catch (encodingError) {
      console.log('Failed to fix encoding, using original name');
    }

    // Determine file category
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
      originalName: fixedOriginalName,
      mimeType: file.mimetype,
      size: file.size,
      url: file.path,
      category,
    });

    await document.save();
    console.log('✅ Document saved successfully');

    return {
      _id: document._id,
      originalName: document.originalName,
      mimeType: document.mimeType,
      size: document.size,
      url: document.url,
      category: document.category,
      uploadDate: document.uploadDate,
    };
  }

  /**
   * Delete document
   */
  static async deleteDocument(documentId: string, userId: string) {
    const document = await Document.findOne({ _id: documentId, userId });

    if (!document) {
      throw new Error('Document not found');
    }

    // Extract public_id from Cloudinary URL
    try {
      const urlParts = document.url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const publicIdWithExtension = urlParts.slice(-2).join('/'); // folder/file
      const publicId = publicIdWithExtension.split('.')[0]; // remove extension

      console.log('Deleting from Cloudinary:', {
        url: document.url,
        publicId: publicId,
        category: document.category,
      });

      // Delete file from Cloudinary
      if (document.category === 'image') {
        await cloudinary.uploader.destroy(publicId);
      } else {
        // For documents use resource_type: 'raw'
        await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw',
        });
      }

      console.log('✅ File deleted from Cloudinary');
    } catch (cloudinaryError) {
      console.error('⚠️ Failed to delete from Cloudinary:', cloudinaryError);
      // Continue execution even if failed to delete from Cloudinary
    }

    // Delete record from DB
    await Document.findByIdAndDelete(documentId);

    return { message: 'Document deleted successfully' };
  }
}
