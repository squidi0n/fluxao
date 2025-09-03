export default function AIPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        🤖 FluxAO AI Central
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h2 className="text-lg font-semibold mb-4">AI-System Status</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <span className="font-medium">Claude (Anthropic)</span>
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">Ready</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="font-medium">GPT-4 (OpenAI)</span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">Ready</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <span className="font-medium">Writer System</span>
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs">Integrated</span>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="font-semibold mb-2">🎯 Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              ✍️ Content mit AI generieren
            </button>
            <button className="w-full text-left px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              📧 Newsletter kuratieren  
            </button>
            <button className="w-full text-left px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              🔍 System-Health Check
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}