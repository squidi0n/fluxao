'use client';

import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useState, useCallback } from 'react';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ onImageUploaded, className = '' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleUpload = async (file: File) => {
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Bitte nur Bilddateien hochladen');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Datei ist zu groß. Maximum 5MB erlaubt.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setPreview(data.url);
      onImageUploaded(data.url);
    } catch (error) {
      // console.error('Upload error:', error);
      alert('Fehler beim Hochladen des Bildes');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0]);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Bild wird hochgeladen...</p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="relative mx-auto w-full max-w-md">
              <Image
                src={preview}
                alt="Upload preview"
                width={400}
                height={300}
                className="rounded-lg w-full h-auto"
              />
              <button
                onClick={() => {
                  setPreview(null);
                }}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400">
              ✓ Bild erfolgreich hochgeladen
            </p>
          </div>
        ) : (
          <>
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Bild hier ablegen oder klicken zum Auswählen
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF bis zu 5MB</p>
          </>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
      </div>
    </div>
  );
}
