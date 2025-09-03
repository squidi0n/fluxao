'use client';

import Link from 'next/link';
import { useCategories } from '@/hooks/useCategories';

const footerLinks = {
  quicklinks: [
    { name: 'Startseite', href: '/' },
    { name: 'Über uns', href: '/about' },
    { name: 'Kontakt', href: '/contact' },
    { name: 'Newsletter', href: '/#newsletter' },
    { name: 'Suche', href: '/search' },
  ],
  legal: [
    { name: 'Impressum', href: '/impressum' },
    { name: 'Datenschutz', href: '/privacy' },
    { name: 'AGB', href: '/terms' },
    { name: 'Cookie-Einstellungen', href: '/cookies' },
  ],
};

export default function SimpleFooter() {
  const { categories } = useCategories();
  return (
    <footer className="border-t bg-gray-50 dark:bg-gray-950">
      <div className="container py-2">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
          {/* Logo & Subclaim - Links */}
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-primary-600">FluxAO</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Magazin für KI, Gesellschaft & Zukunft
            </p>
          </div>

          {/* Kategorien - Dynamisch */}
          <div>
            <h4 className="mb-0.5 text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
              Kategorien
            </h4>
            <ul className="space-y-0">
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/news/kategorie/${category.slug}`}
                    className="inline-block min-h-0 py-0 text-sm leading-tight text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quicklinks */}
          <div>
            <h4 className="mb-0.5 text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
              Quicklinks
            </h4>
            <ul className="space-y-0">
              {footerLinks.quicklinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="inline-block min-h-0 py-0 text-sm leading-tight text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/features"
                  className="inline-block min-h-0 py-0 text-sm leading-tight text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                >
                  ⚡ Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Rechtliches - Rechts */}
          <div>
            <h4 className="mb-0.5 text-sm font-semibold leading-none text-gray-900 dark:text-gray-100">
              Rechtliches
            </h4>
            <ul className="space-y-0">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="inline-block min-h-0 py-0 text-sm leading-tight text-gray-600 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-2 border-t pt-2">
          <p className="text-center text-[11px] text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} FluxAO. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}
