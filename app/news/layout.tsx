export default function NewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main id="content" className="focus:outline-none">
        {children}
      </main>
    </div>
  );
}
