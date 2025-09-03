'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  className = ''
}: PaginationProps) {
  const searchParams = useSearchParams();

  const createPageURL = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    return `?${params.toString()}`;
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, -1);
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push(-1, totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  const visiblePages = getVisiblePages();
  const startItem = (currentPage - 1) * 20 + 1;
  const endItem = Math.min(currentPage * 20, totalCount);

  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Results info */}
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Zeige <span className="font-medium">{startItem}</span> bis{' '}
        <span className="font-medium">{endItem}</span> von{' '}
        <span className="font-medium">{totalCount}</span> Einträgen
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Link
          href={createPageURL(currentPage - 1)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            currentPage <= 1
              ? 'pointer-events-none opacity-50 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:block">Vorherige</span>
        </Link>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => {
            if (page === -1) {
              return (
                <div key={`dots-${index}`} className="px-3 py-2 text-gray-500">
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              );
            }

            return (
              <Link
                key={page}
                href={createPageURL(page)}
                className={`inline-flex items-center justify-center w-10 h-10 text-sm font-medium rounded-lg border transition-colors ${
                  currentPage === page
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {page}
              </Link>
            );
          })}
        </div>

        {/* Next button */}
        <Link
          href={createPageURL(currentPage + 1)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            currentPage >= totalPages
              ? 'pointer-events-none opacity-50 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
              : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          <span className="hidden sm:block">Nächste</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}