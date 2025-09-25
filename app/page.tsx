'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { loginAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await loginAPI(email, password);

    if (data.error) {
      setError(data.error);
    } else {
      login(data.user, data.token);
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border rounded-lg px-3 py-2"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg px-3 py-2"
          >
            Login
          </button>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </form>
        <p className="text-center text-sm text-gray-600">
          <button
            type="button"
            className="text-blue-600"
            onClick={() => router.push('/signup')}
          >
            If you dont have an account please click here to generate a fake
            one!
          </button>
        </p>
      </div>
    </div>
  );
}
