'use client';

import { usePathname } from 'next/navigation';

import HeaderWrapper from './HeaderWrapper';
import SimpleFooter from './SimpleFooter';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  // Don't render header/footer on admin pages
  if (isAdminPage) {
    return <>{children}</>;
  }

  // Render header and footer for all other pages
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderWrapper />
      <main className="flex-grow">{children}</main>
      <SimpleFooter />
    </div>
  );
}
