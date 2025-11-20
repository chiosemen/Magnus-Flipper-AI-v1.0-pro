// mobile/lib/magnusClient.ts
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[Magnus API] Error', res.status, text);
    throw new Error(text || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

/* ---------- AUTH ---------- */

export const login = (email: string, password: string) =>
  request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const signup = (email: string, password: string) =>
  request('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

export const logoutApi = () =>
  request('/api/auth/logout', {
    method: 'POST',
  });

/* ---------- PRODUCTS ---------- */

export const getProducts = () => request('/api/products');

export const createProduct = (data: any) =>
  request('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });

/* ---------- EXTENSIONS ---------- */

export const aiValuation = (productName: string) =>
  request('/api/extensions/ai-valuation', {
    method: 'POST',
    body: JSON.stringify({ name: productName }),
  });

export const getMarketInsights = () =>
  request('/api/extensions/market-insights');
