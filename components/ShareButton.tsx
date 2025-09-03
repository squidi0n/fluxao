'use client';

import { Share2, Facebook, Linkedin, Copy, Check } from 'lucide-react';
import { X } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  url: string;
  className?: string;
  showFullOptions?: boolean;
}

export function ShareButton({ title, url, className = '', showFullOptions = false }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (error) {
        // User cancelled or share not available
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const shareLinks = {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} - ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  };

  if (showFullOptions) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={handleNativeShare}
            className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            aria-label="Share article"
          >
            <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Teilen</span>
          </button>
          
          <div className="flex items-center gap-1">
            <a
              href={shareLinks.x}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-white hover:bg-black rounded-lg transition-all duration-300 hover:scale-110"
              aria-label="Share on X (formerly Twitter)"
            >
              <X className="w-4 h-4" />
            </a>
            <a
              href={shareLinks.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-white hover:bg-green-500 rounded-lg transition-all duration-300 hover:scale-110"
              aria-label="Share on WhatsApp"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.520-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
              </svg>
            </a>
            <a
              href={shareLinks.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-white hover:bg-blue-500 rounded-lg transition-all duration-300 hover:scale-110"
              aria-label="Share on Telegram"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.820 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <a
              href={shareLinks.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-300 hover:scale-110"
              aria-label="Share on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href={shareLinks.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-white hover:bg-blue-700 rounded-lg transition-all duration-300 hover:scale-110"
              aria-label="Share on LinkedIn"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <button
              onClick={copyToClipboard}
              className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                copied
                  ? 'text-green-600 bg-green-100'
                  : 'text-gray-600 hover:text-white hover:bg-gray-600'
              }`}
              aria-label="Copy link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleNativeShare}
      className={`group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${className}`}
      aria-label="Share article"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span className="font-medium">Kopiert!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="font-medium">Teilen</span>
        </>
      )}
    </button>
  );
}
