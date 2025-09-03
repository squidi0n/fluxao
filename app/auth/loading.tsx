export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-gray-200 animate-spin border-t-indigo-600"></div>
        </div>
        <p className="text-gray-600">Anmeldung wird geladen...</p>
      </div>
    </div>
  );
}
