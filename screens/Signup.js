'use client';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { signup } from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      console.log('user already logged in');
      router.push('/dashboard');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(email, password);
    const data = await signup(email, password);
    console.log(data);
    if (data.error) {
      setError(data.error);
    } else {
      // Save token to localStorage or context
      localStorage.setItem('token', data.token);
      console.log('Logged in user:', data.user);
      setError('Account created. Please log in to continue.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Sign Up</h1>
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
            Sign Up
          </button>
          {error && <p>{error}</p>}
        </form>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button className="text-blue-600" onClick={() => router.push('/')}>
            Log In
          </button>
        </p>
      </div>
    </div>
  );
}
