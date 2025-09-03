'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav 
      className={`flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 mb-4 ${className}`}
      aria-label="Breadcrumb"
    >
      <Link 
        href="/" 
        className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        aria-label="Startseite"
      >
        Home
      </Link>
      
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-1">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {item.name}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}