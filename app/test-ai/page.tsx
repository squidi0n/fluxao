export default function TestAIPage() {
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          🤖 FluxAO AI Central - Test
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">✅ AI-System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800">Claude (Anthropic)</h3>
              <p className="text-sm text-green-600">Main Intelligence Engine</p>
              <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Ready</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800">GPT-4 (OpenAI)</h3>
              <p className="text-sm text-blue-600">Content Generation</p>
              <span className="inline-block mt-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Ready</span>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h3 className="font-medium text-purple-800">Writer System</h3>
              <p className="text-sm text-purple-600">20+ Expert Modes</p>
              <span className="inline-block mt-2 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Integrated</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Features implementiert</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>5-Provider AI-System (Claude, GPT-4, Gemini, LLaMA, Command R)</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Writer-System komplett integriert</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Master-Prompt System für Sicherheit</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>24/7 System-Monitoring</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>AI-Chat Widget im Admin</span>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <strong>Hinweis:</strong> Die vollständige AI-Zentrale ist unter `/admin/ai/central` verfügbar (Login als Admin erforderlich).
          </p>
        </div>
      </div>
    </div>
  );
}