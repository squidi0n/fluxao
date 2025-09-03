export default function SEOPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SEO Optimierung</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          FluxAO SEO-Tools für deutsche AI/Tech-Keywords (Coming Soon)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SEO Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">SEO Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">SEO Score</span>
              <span className="font-semibold text-green-600">87/100</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Indexierte Seiten</span>
              <span className="font-semibold">142</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Backlinks</span>
              <span className="font-semibold">28</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Organischer Traffic</span>
              <span className="font-semibold text-blue-600">+12.4%</span>
            </div>
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Keywords</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">KI Deutschland</span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">#15</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">ChatGPT deutsch</span>
              <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">#28</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">AI Tools 2025</span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">#42</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Tech Trends</span>
              <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">#67</span>
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder für zukünftige Features */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-blue-800 dark:text-blue-200 font-semibold mb-2">🚀 Geplante SEO-Features</h3>
        <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-sm">
          <li>• Keyword-Tracking Dashboard</li>
          <li>• Content-SEO-Analyzer</li>
          <li>• Google Search Console Integration</li>
          <li>• Automatische Meta-Tag-Generierung</li>
          <li>• Backlink-Monitoring</li>
          <li>• Core Web Vitals Tracking</li>
        </ul>
      </div>
    </div>
  );
}