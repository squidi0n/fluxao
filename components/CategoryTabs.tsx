'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { useCategories } from '@/hooks/useCategories';

export default function CategoryTabs() {
  const pathname = usePathname();
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLAnchorElement>(null);
  const { categories } = useCategories();

  // Extract category from pathname
  const currentCategory = pathname.split('/')[2] || (categories[0]?.slug || '');

  // Scroll active tab into view
  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const tabsContainer = tabsRef.current;
      const activeTab = activeTabRef.current;
      const tabLeft = activeTab.offsetLeft;
      const tabWidth = activeTab.offsetWidth;
      const containerWidth = tabsContainer.offsetWidth;
      const scrollLeft = tabsContainer.scrollLeft;

      if (tabLeft < scrollLeft) {
        tabsContainer.scrollLeft = tabLeft - 20;
      } else if (tabLeft + tabWidth > scrollLeft + containerWidth) {
        tabsContainer.scrollLeft = tabLeft + tabWidth - containerWidth + 20;
      }
    }
  }, [currentCategory]);

  return (
    <nav className="border-b border-gray-200 dark:border-gray-700" aria-label="Kategorien">
      <div
        ref={tabsRef}
        className="flex overflow-x-auto scrollbar-hide space-x-1 px-4 sm:px-6 lg:px-8"
        role="tablist"
        aria-orientation="horizontal"
      >
        {categories.map((category) => {
          const isActive = currentCategory === category.slug;
          return (
            <Link
              key={category.id}
              ref={isActive ? activeTabRef : null}
              href={`/category/${category.slug}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${category.slug}`}
              className={`
                relative whitespace-nowrap px-4 py-3 text-sm font-medium transition-all
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
                ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }
              `}
            >
              {category.name}
              {isActive && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                  aria-hidden="true"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Add keyboard navigation
if (typeof window !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target as HTMLElement).getAttribute('role') === 'tab') {
      const tabs = Array.from(document.querySelectorAll('[role="tab"]')) as HTMLElement[];
      const currentIndex = tabs.indexOf(e.target as HTMLElement);

      let nextIndex: number | null = null;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : tabs.length - 1;
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = currentIndex + 1 < tabs.length ? currentIndex + 1 : 0;
          break;
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIndex = tabs.length - 1;
          break;
      }

      if (nextIndex !== null) {
        tabs[nextIndex].focus();
        tabs[nextIndex].click();
      }
    }
  });
}
