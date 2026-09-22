const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

type SupabaseOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

export async function supabaseFetch<T = unknown>(
  path: string,
  options: SupabaseOptions = {}
): Promise<T> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }

  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function supabaseSignIn(email: string, password: string) {
  return supabaseFetch<{ access_token: string; refresh_token: string; user: { id: string; email?: string } }>(
    '/auth/v1/token?grant_type=password',
    { method: 'POST', body: { email, password } }
  );
}

export function getSupabaseAccessToken(): string | null {
  try {
    return sessionStorage.getItem('halalshop_supabase_access_token');
  } catch {
    return null;
  }
}

export function setSupabaseAccessToken(token: string | null) {
  try {
    if (token) sessionStorage.setItem('halalshop_supabase_access_token', token);
    else sessionStorage.removeItem('halalshop_supabase_access_token');
  } catch {
    // Ignore unavailable session storage.
  }
}
