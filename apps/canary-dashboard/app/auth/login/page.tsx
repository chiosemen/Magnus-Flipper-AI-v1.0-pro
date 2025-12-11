'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        // Set cookie and redirect
        document.cookie = `dashboard_token=${token}; path=/; max-age=86400`;
        router.push('/');
      } else {
        setError('Invalid token');
      }
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card rounded-lg border p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">🔐 Dashboard Login</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Admin Token
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-background border rounded px-3 py-2"
              placeholder="Enter dashboard admin token"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground rounded px-4 py-2 hover:bg-primary/90"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
