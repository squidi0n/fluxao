export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
        <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Featured Post Skeleton (Desktop) */}
      <div className="hidden md:block mb-12">
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
          <div className="md:flex">
            <div className="md:w-3/5 aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="md:w-2/5 p-8">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="h-8 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-3" />
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
            <div className="aspect-video bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="p-4">
              <div className="h-6 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
