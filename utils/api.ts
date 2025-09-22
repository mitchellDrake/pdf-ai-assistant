'use client';
const API_URL = process.env.NEXT_PUBLIC_EXTERNAL_API_URL;

import { useAuth } from '../context/AuthContext';

export function useApi() {
  const { token } = useAuth();

  async function apiFetch(
    endpoint: string,
    options: RequestInit = {},
    isFormData = false
  ) {
    // Start with token header if present
    const authHeader: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    // If not FormData, add JSON Content-Type
    if (!isFormData) {
      authHeader['Content-Type'] = 'application/json';
    }

    // Merge with any headers passed in options
    const headers: HeadersInit = {
      ...authHeader,
      ...(options.headers || {}),
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      body: options.body
        ? isFormData
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
    });

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody.error) message = errBody.error;
      } catch {}
      throw new Error(message);
    }

    return res.json();
  }

  return apiFetch;
}

export async function signup(email: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Handle non-2xx status
    if (!res.ok) {
      let message = `Signup failed with status ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody.error) message = errBody.error;
      } catch {
        // response body not JSON, ignore
      }
      return { error: message };
    }

    // Success
    return await res.json();
  } catch (error) {
    console.error('Network/Fetch error:', error);
    return { error: 'Network error, please try again.' };
  }
}

export async function loginAPI(email: string, password: string) {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    // Handle non-2xx status
    if (!res.ok) {
      let message = `Login failed with status ${res.status}`;
      try {
        const errBody = await res.json();
        if (errBody.error) message = errBody.error;
      } catch {
        // response body not JSON, ignore
      }
      return { error: message };
    }

    // Success
    return await res.json();
  } catch (error) {
    console.error('Network/Fetch error:', error);
    return { error: 'Network error, please try again.' };
  }
}
