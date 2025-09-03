'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EmergencyLoginPage() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleEmergencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/emergency-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminSecret: secret }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Emergency login successful! Redirecting...');
        setTimeout(() => {
          router.push('/admin');
          router.refresh();
        }, 1000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage('❌ Emergency login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full border-2 border-red-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-red-600">🚨 NOTFALL-ADMIN LOGIN</h1>
          <p className="text-gray-600 mt-2">Nur für Development-Testing!</p>
        </div>

        <form onSubmit={handleEmergencyLogin} className="space-y-4">
          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-gray-700">
              Admin-Secret:
            </label>
            <input
              type="password"
              id="secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="EMERGENCY_ADMIN_123"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {loading ? 'Anmeldung...' : '🚨 NOTFALL-LOGIN'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-gray-100 border rounded-md text-sm">
            {message}
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
          <h3 className="font-medium text-yellow-800">Schnell-Login Daten:</h3>
          <p className="text-yellow-700 mt-1">
            <strong>Secret:</strong> EMERGENCY_ADMIN_123<br/>
            <strong>Email:</strong> adam.freundt@gmail.com<br/>
            <strong>Rolle:</strong> ADMIN
          </p>
        </div>

        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
          ⚠️ WARNUNG: Dieses System nur für Development verwenden!<br/>
          In Produktion: EMERGENCY_ADMIN_MODE=false setzen!
        </div>
      </div>
    </div>
  );
}