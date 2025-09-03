'use client';

import { useState, useEffect } from 'react';
import ShareBox from './ShareBox';

interface SmartSidebarProps {
  articleUrl: string;
  articleTitle: string;
}

export default function SmartSidebar({ articleUrl, articleTitle }: SmartSidebarProps) {
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    const updateMaxHeight = () => {
      const coverImage = document.getElementById('cover-image');
      const header = document.querySelector('header');
      
      if (coverImage && header) {
        const headerHeight = header.offsetHeight;
        const coverImageRect = coverImage.getBoundingClientRect();
        const coverImageTop = coverImageRect.top + window.scrollY;
        const coverImageBottom = coverImageTop + coverImageRect.height;
        
        // Sidebar should not go beyond the bottom of the cover image
        const calculatedMaxHeight = Math.max(300, coverImageBottom - coverImageTop);
        setMaxHeight(calculatedMaxHeight);
      }
    };

    // Update on mount and resize
    updateMaxHeight();
    window.addEventListener('resize', updateMaxHeight);
    
    return () => window.removeEventListener('resize', updateMaxHeight);
  }, []);

  return (
    <div 
      className="sticky space-y-4"
      style={{ 
        top: '130px', // Adjust to stay below header properly
        maxHeight: maxHeight ? `${maxHeight}px` : '400px',
        overflow: 'hidden'
      }}
    >
      {/* Share Box */}
      <ShareBox articleUrl={articleUrl} articleTitle={articleTitle} />

      {/* Newsletter - only show if there's space */}
      {maxHeight && maxHeight > 250 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold mb-2 text-gray-900">📬 Newsletter</h3>
          <p className="text-sm mb-4 text-gray-600">Erhalte die neuesten Tech-News</p>
          <input
            type="email"
            placeholder="Deine E-Mail"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none mb-3"
          />
          <div className="w-full py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors mb-3 text-center cursor-pointer">
            Abonnieren
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Mit der Anmeldung akzeptierst du unsere{' '}
            <button 
              onClick={() => window.open('/privacy', '_blank')}
              className="text-purple-600 hover:underline cursor-pointer border-none bg-transparent p-0"
            >
              Datenschutzerklärung
            </button>
            . Du kannst dich jederzeit abmelden.
          </p>
        </div>
      )}

      {/* Voting - only show if there's even more space */}
      {maxHeight && maxHeight > 400 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Artikel bewerten</h3>
          <p className="text-sm text-gray-600 text-center mb-4">Wie findest du diesen Artikel?</p>
          <div className="flex justify-center gap-3">
            <div className="flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-b from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 rounded-xl transition-all hover:shadow-md group cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 group-hover:scale-110 transition-transform">
                <path d="M7 10v12"/>
                <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>
              </svg>
              <div className="text-center">
                <div className="font-bold text-lg">0</div>
                <div className="text-xs text-green-600">Gefällt mir</div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 px-6 py-4 bg-gradient-to-b from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 text-red-700 rounded-xl transition-all hover:shadow-md group cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 group-hover:scale-110 transition-transform">
                <path d="M17 14V2"/>
                <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>
              </svg>
              <div className="text-center">
                <div className="font-bold text-lg">0</div>
                <div className="text-xs text-red-600">Gefällt mir nicht</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}