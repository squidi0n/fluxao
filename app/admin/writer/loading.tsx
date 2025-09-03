import { PenTool } from 'lucide-react';

export default function WriterLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin mb-4">
          <PenTool className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Loading Writer
        </h2>
        <p className="text-gray-600">
          Initializing AI content generation system...
        </p>
      </div>
    </div>
  );
}