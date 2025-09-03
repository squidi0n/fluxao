'use client';

import { Facebook, Twitter, Instagram, Youtube, Mail } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          {/* Logo & Links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-block">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                FluxAO
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/category/ki-tech" className="hover:text-white transition-colors">
                KI & Tech
              </Link>
              <Link href="/category/mensch-gesellschaft" className="hover:text-white transition-colors">
                Gesellschaft
              </Link>
              <Link href="/category/style-aesthetik" className="hover:text-white transition-colors">
                Style
              </Link>
              <Link href="/category/gaming-kultur" className="hover:text-white transition-colors">
                Gaming
              </Link>
              <span className="text-gray-600">|</span>
              <Link href="/about" className="hover:text-white transition-colors">
                Über uns
              </Link>
            </nav>
          </div>

          {/* Social & Legal */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <a href="#" className="hover:text-white transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
            <div className="hidden md:flex items-center gap-3 text-xs text-gray-500">
              <span>© {currentYear} FluxAO</span>
              <Link href="/datenschutz" className="hover:text-gray-300">
                Datenschutz
              </Link>
              <Link href="/impressum" className="hover:text-gray-300">
                Impressum
              </Link>
              <Link href="/agb" className="hover:text-gray-300">
                AGB
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile Legal Links */}
        <div className="md:hidden flex justify-center gap-3 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-800">
          <span>© {currentYear}</span>
          <Link href="/datenschutz" className="hover:text-gray-300">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-gray-300">
            Impressum
          </Link>
          <Link href="/agb" className="hover:text-gray-300">
            AGB
          </Link>
        </div>
      </div>
    </footer>
  );
}
