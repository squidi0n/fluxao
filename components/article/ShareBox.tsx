'use client';

import { Copy, Facebook, Linkedin, Star } from 'lucide-react';
import { useState } from 'react';

interface ShareBoxProps {
  articleUrl?: string;
  articleTitle?: string;
}

export default function ShareBox({ articleUrl, articleTitle }: ShareBoxProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log('Link copied:', url);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href);
    console.log('Facebook share:', url);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(window.location.href);
    console.log('LinkedIn share:', url);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleSaveAsFavorite = () => {
    // TODO: Implement favorite saving functionality
    alert('Favorit-Funktion wird demnächst implementiert!');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 max-h-[400px]">
      <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">Artikel teilen</h3>
      <div className="space-y-2">
        {/* Copy Link */}
        <button 
          onClick={handleCopyLink}
          className="w-full flex items-center gap-2 p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors group"
        >
          <Copy className="w-4 h-4" />
          <span className="text-xs font-medium">
            {copied ? 'Kopiert!' : 'Link kopieren'}
          </span>
        </button>
        
        {/* Facebook */}
        <button 
          onClick={handleFacebookShare}
          className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
        >
          <Facebook className="w-4 h-4" />
          <span className="text-xs font-medium">Facebook</span>
        </button>
        
        {/* LinkedIn */}
        <button 
          onClick={handleLinkedInShare}
          className="w-full flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
        >
          <Linkedin className="w-4 h-4" />
          <span className="text-xs font-medium">LinkedIn</span>
        </button>
        
        {/* Save as Favorite */}
        <button 
          onClick={handleSaveAsFavorite}
          className="w-full flex items-center gap-2 p-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg transition-colors"
        >
          <Star className="w-4 h-4" />
          <span className="text-xs font-medium">Als Favorit speichern</span>
        </button>
      </div>
    </div>
  );
}