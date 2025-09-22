'use client';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { loginAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(email, password);
    const data = await loginAPI(email, password);
    console.log(data);
    if (data.error) {
      setError(data.error);
    } else {
      // Save token to localStorage or context
      console.log('Logged in user:', data.user);
      login(data.user, data.token);
      router.push('/dashboard');
      return;
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
          {error && <p>{error}</p>}
        </form>
        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <button
            className="text-blue-600"
            onClick={() => router.push('/signup')}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
