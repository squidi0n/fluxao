import crypto from 'crypto';
import path from 'path';

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import sharp from 'sharp';

import { prisma } from '@/lib/prisma';
import { auditLogger, AuditAction } from '@/lib/security/audit-log';

// Configure Cloudinary (fallback to local storage if not configured)
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Media types configuration
export const MEDIA_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  VIDEO: ['video/mp4', 'video/webm', 'video/ogg'],
  AUDIO: ['audio/mpeg', 'audio/ogg', 'audio/wav'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
};

export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AUDIO: 50 * 1024 * 1024, // 50MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
};

// Multer storage configuration
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: Math.max(...Object.values(MAX_FILE_SIZES)),
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      ...MEDIA_TYPES.IMAGE,
      ...MEDIA_TYPES.VIDEO,
      ...MEDIA_TYPES.AUDIO,
      ...MEDIA_TYPES.DOCUMENT,
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  },
});

export interface MediaUploadOptions {
  userId: string;
  folder?: string;
  tags?: string[];
  public?: boolean;
  optimize?: boolean;
  thumbnail?: boolean;
  metadata?: Record<string, any>;
}

export interface MediaAsset {
  id: string;
  url: string;
  publicId?: string;
  type: 'image' | 'video' | 'audio' | 'document';
  format: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export class MediaLibrary {
  private static instance: MediaLibrary;

  static getInstance(): MediaLibrary {
    if (!MediaLibrary.instance) {
      MediaLibrary.instance = new MediaLibrary();
    }
    return MediaLibrary.instance;
  }

  async uploadImage(file: Express.Multer.File, options: MediaUploadOptions): Promise<MediaAsset> {
    try {
      // Validate file size
      if (file.size > MAX_FILE_SIZES.IMAGE) {
        throw new Error(`Image size exceeds ${MAX_FILE_SIZES.IMAGE / 1024 / 1024}MB limit`);
      }

      // Process image with Sharp
      let processedBuffer = file.buffer;
      let metadata: any = {};

      if (options.optimize) {
        const sharpInstance = sharp(file.buffer);
        const info = await sharpInstance.metadata();

        metadata = {
          originalWidth: info.width,
          originalHeight: info.height,
          format: info.format,
        };

        // Optimize image
        processedBuffer = await sharpInstance
          .resize(2048, 2048, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      }

      // Upload to storage
      let uploadResult: any;

      if (useCloudinary) {
        // Upload to Cloudinary
        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: options.folder || 'media',
              tags: options.tags,
              resource_type: 'image',
              transformation: options.optimize
                ? [{ quality: 'auto:good' }, { fetch_format: 'auto' }]
                : undefined,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
          uploadStream.end(processedBuffer);
        });
      } else {
        // Local storage fallback
        const fileName = `${crypto.randomBytes(16).toString('hex')}${path.extname(file.originalname)}`;
        const filePath = `/uploads/${options.folder || 'media'}/${fileName}`;

        // In production, you would save to disk or S3
        uploadResult = {
          public_id: fileName,
          secure_url: filePath,
          format: path.extname(file.originalname).slice(1),
          bytes: processedBuffer.length,
          width: metadata.originalWidth,
          height: metadata.originalHeight,
        };
      }

      // Generate thumbnail if requested
      let thumbnailUrl;
      if (options.thumbnail) {
        const thumbnail = await sharp(file.buffer)
          .resize(300, 300, { fit: 'cover' })
          .jpeg({ quality: 70 })
          .toBuffer();

        if (useCloudinary) {
          const thumbResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: `${options.folder || 'media'}/thumbnails`,
                tags: [...(options.tags || []), 'thumbnail'],
                resource_type: 'image',
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              },
            );
            uploadStream.end(thumbnail);
          });
          thumbnailUrl = thumbResult.secure_url;
        } else {
          thumbnailUrl = uploadResult.secure_url.replace(/(\.[^.]+)$/, '_thumb$1');
        }
      }

      // Save to database
      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          userId: options.userId,
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          type: 'IMAGE',
          format: uploadResult.format,
          size: uploadResult.bytes,
          width: uploadResult.width,
          height: uploadResult.height,
          thumbnailUrl,
          metadata: {
            ...metadata,
            ...options.metadata,
            tags: options.tags,
          },
          isPublic: options.public || false,
        },
      });

      // Log the upload
      await auditLogger.logSuccess(AuditAction.MEDIA_UPLOADED, {
        userId: options.userId,
        targetId: mediaAsset.id,
        targetType: 'MediaAsset',
        metadata: {
          fileName: file.originalname,
          size: file.size,
          type: file.mimetype,
        },
      });

      return {
        id: mediaAsset.id,
        url: mediaAsset.url,
        publicId: mediaAsset.publicId || undefined,
        type: 'image',
        format: mediaAsset.format,
        size: mediaAsset.size,
        width: mediaAsset.width || undefined,
        height: mediaAsset.height || undefined,
        thumbnailUrl: mediaAsset.thumbnailUrl || undefined,
        metadata: mediaAsset.metadata as Record<string, any>,
        createdAt: mediaAsset.createdAt,
      };
    } catch (error) {
      await auditLogger.logFailure(AuditAction.MEDIA_UPLOAD_FAILED, 'Failed to upload image', {
        userId: options.userId,
        metadata: {
          fileName: file.originalname,
          error: (error as Error).message,
        },
      });
      throw error;
    }
  }

  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    try {
      const media = await prisma.mediaAsset.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        throw new Error('Media not found');
      }

      if (media.userId !== userId) {
        throw new Error('Unauthorized to delete this media');
      }

      // Delete from storage
      if (useCloudinary && media.publicId) {
        await cloudinary.uploader.destroy(media.publicId);

        // Delete thumbnail if exists
        if (media.thumbnailUrl) {
          const thumbPublicId = media.publicId.replace(/([^/]+)$/, 'thumbnails/$1');
          await cloudinary.uploader.destroy(thumbPublicId);
        }
      }

      // Delete from database
      await prisma.mediaAsset.delete({
        where: { id: mediaId },
      });

      await auditLogger.logSuccess(AuditAction.MEDIA_DELETED, {
        userId,
        targetId: mediaId,
        targetType: 'MediaAsset',
      });
    } catch (error) {
      await auditLogger.logFailure(AuditAction.MEDIA_DELETE_FAILED, 'Failed to delete media', {
        userId,
        targetId: mediaId,
        metadata: { error: (error as Error).message },
      });
      throw error;
    }
  }

  async getMediaLibrary(
    userId: string,
    options: {
      type?: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
      limit?: number;
      offset?: number;
      search?: string;
      tags?: string[];
    } = {},
  ) {
    const where: any = {
      OR: [{ userId }, { isPublic: true }],
    };

    if (options.type) {
      where.type = options.type;
    }

    if (options.search) {
      where.OR.push({
        metadata: {
          path: ['originalName'],
          string_contains: options.search,
        },
      });
    }

    if (options.tags && options.tags.length > 0) {
      where.metadata = {
        path: ['tags'],
        array_contains: options.tags,
      };
    }

    const [items, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        take: options.limit || 50,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        url: item.url,
        publicId: item.publicId || undefined,
        type: item.type.toLowerCase() as 'image' | 'video' | 'audio' | 'document',
        format: item.format,
        size: item.size,
        width: item.width || undefined,
        height: item.height || undefined,
        duration: item.duration || undefined,
        thumbnailUrl: item.thumbnailUrl || undefined,
        metadata: item.metadata as Record<string, any>,
        createdAt: item.createdAt,
      })),
      total,
      hasMore: total > (options.offset || 0) + items.length,
    };
  }

  async generateSignedUrl(mediaId: string, expiresIn: number = 3600): Promise<string> {
    const media = await prisma.mediaAsset.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media not found');
    }

    if (useCloudinary && media.publicId) {
      // Generate signed URL with Cloudinary
      return cloudinary.url(media.publicId, {
        sign_url: true,
        type: 'authenticated',
        expires_at: Math.floor(Date.now() / 1000) + expiresIn,
      });
    }

    // For local storage, you would implement your own signing mechanism
    return media.url;
  }
}

export const mediaLibrary = MediaLibrary.getInstance();

// Add missing audit actions
declare module '@/lib/security/audit-log' {
  export enum AuditAction {
    MEDIA_UPLOADED = 'MEDIA_UPLOADED',
    MEDIA_UPLOAD_FAILED = 'MEDIA_UPLOAD_FAILED',
    MEDIA_DELETED = 'MEDIA_DELETED',
    MEDIA_DELETE_FAILED = 'MEDIA_DELETE_FAILED',
  }
}
