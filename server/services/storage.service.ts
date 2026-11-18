import fs from 'fs';
import { safeDeleteUpload } from '../config/upload';

export interface StoredFileResult {
  url: string;
  publicId?: string;
}

export interface IStorageProvider {
  saveFile(file: Express.Multer.File, folder?: string): Promise<StoredFileResult>;
  deleteFile(fileUrl?: string | null): Promise<void>;
}

class LocalDiskStorageProvider implements IStorageProvider {
  async saveFile(file: Express.Multer.File): Promise<StoredFileResult> {
    return { url: `/uploads/${file.filename}` };
  }

  async deleteFile(fileUrl?: string | null): Promise<void> {
    safeDeleteUpload(fileUrl);
  }
}

class CloudinaryStorageProvider implements IStorageProvider {
  private isConfigured = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    this.isConfigured = Boolean(cloudName && apiKey && apiSecret);
  }

  async saveFile(file: Express.Multer.File, folder = 'adei-ensaf'): Promise<StoredFileResult> {
    if (!this.isConfigured) {
      console.warn('⚠️ Cloudinary non configuré dans .env. Utilisation du stockage local.');
      return { url: `/uploads/${file.filename}` };
    }

    try {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });

      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'auto'
      });

      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id
      };
    } catch (error) {
      console.error('❌ Échec du téléversement Cloudinary:', error);
      return { url: `/uploads/${file.filename}` };
    }
  }

  async deleteFile(fileUrl?: string | null): Promise<void> {
    if (!fileUrl) return;

    if (fileUrl.startsWith('/uploads/')) {
      safeDeleteUpload(fileUrl);
      return;
    }

    if (fileUrl.includes('cloudinary.com') && this.isConfigured) {
      try {
        const cloudinary = require('cloudinary').v2;
        const matches = fileUrl.match(/\/v\d+\/(adei-ensaf\/[^.]+)/);
        if (matches && matches[1]) {
          await cloudinary.uploader.destroy(matches[1]);
        }
      } catch (err) {
        console.error('⚠️ Erreur lors de la suppression sur Cloudinary:', err);
      }
    }
  }
}

function createStorageService(): IStorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.toLowerCase();
  if (provider === 'cloudinary' || process.env.CLOUDINARY_CLOUD_NAME) {
    return new CloudinaryStorageProvider();
  }
  return new LocalDiskStorageProvider();
}

export const storageService = createStorageService();