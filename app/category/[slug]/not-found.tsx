import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-indigo-600">404</h1>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Seite nicht gefunden</h2>
        <p className="text-gray-600 mb-8">Die gesuchte Seite existiert nicht.</p>
        <Link
          href="/"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Zur Startseite
        </Link>
      </div>
    </div>
  );
}
