import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true }, // filename im storage
  originalName: { type: String, required: true }, // originam filename
  mimeType: { type: String, required: true }, // file type
  size: { type: Number, required: true }, // size on bytes
  url: { type: String, required: true }, // URL for download
  category: {
    type: String,
    enum: ['document', 'image', 'other'],
    default: 'document',
  },
  uploadDate: { type: Date, default: Date.now },
});

export const Document = mongoose.model('Document', DocumentSchema);
