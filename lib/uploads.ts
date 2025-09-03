// Upload utilities for development and production
// Development: Local disk storage
// Production: S3 or UploadThing

interface UploadResponse {
  url: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error('Datei ist zu groß. Maximal 10MB erlaubt.');
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Ungültiger Dateityp. Nur JPG, PNG, WebP und GIF erlaubt.');
  }

  // In development, upload to API route
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/admin/uploads', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Upload fehlgeschlagen');
  }

  return response.json();
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Bilddimensionen konnten nicht gelesen werden'));
    };

    img.src = url;
  });
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

// Generate optimized image URLs with transformations
export function getOptimizedImageUrl(
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpg' | 'png';
  },
): string {
  // In production with Cloudinary or similar:
  // return transformImageUrl(url, options)

  // For now, return original URL
  return url;
}

// Validate image URL
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = validExtensions.some((ext) =>
      parsed.pathname.toLowerCase().endsWith(ext),
    );

    return (
      hasValidExtension ||
      parsed.hostname.includes('unsplash.com') ||
      parsed.hostname.includes('cloudinary.com') ||
      parsed.hostname.includes('picsum.photos')
    );
  } catch {
    return false;
  }
}
