// Public Supabase client configuration. These values are safe to ship in a browser app.
// Authorization is enforced by Supabase RLS and the halal_is_admin() database function.
const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://sypwzqawdxgxzmwimjbp.supabase.co'
).replace(/\/$/, '');
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_bnI3nXmXgqf9CQIfMdVR4w_rftT8yPj';

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

  let response = await fetch(`${SUPABASE_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  // Access tokens expire. Refresh once on 401 and retry the authenticated request.
  if (response.status === 401 && options.token && !path.startsWith('/auth/v1/')) {
    const refreshed = await supabaseRefreshSession();
    if (refreshed?.access_token) {
      headers.Authorization = `Bearer ${refreshed.access_token}`;
      response = await fetch(`${SUPABASE_URL}${path}`, {
        method: options.method || 'GET',
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Supabase request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;
  const responseText = await response.text();
  if (!responseText.trim()) return undefined as T;
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error('Supabase returned an invalid JSON response.');
  }
}

export async function supabaseSendPasswordResetEmail(email: string, redirectTo?: string) {
  return supabaseFetch('/auth/v1/recover', {
    method: 'POST',
    body: {
      email: email.trim(),
      ...(redirectTo ? { redirect_to: redirectTo } : {}),
    },
  });
}

export async function supabaseUpdatePassword(accessToken: string, password: string) {
  return supabaseFetch('/auth/v1/user', {
    method: 'PUT',
    token: accessToken,
    body: { password },
  });
}

export async function supabaseSignIn(email: string, password: string) {
  return supabaseFetch<{ access_token: string; refresh_token: string; user: { id: string; email?: string } }>(
    '/auth/v1/token?grant_type=password',
    { method: 'POST', body: { email, password } }
  );
}

const ACCESS_TOKEN_KEY = 'halalshop_supabase_access_token';
const REFRESH_TOKEN_KEY = 'halalshop_supabase_refresh_token';

export function getSupabaseAccessToken(): string | null {
  try {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getSupabaseRefreshToken(): string | null {
  try {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSupabaseSession(accessToken: string | null, refreshToken: string | null) {
  try {
    if (accessToken) sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    else sessionStorage.removeItem(ACCESS_TOKEN_KEY);

    if (refreshToken) sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    else sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // Ignore unavailable session storage.
  }
}

export function setSupabaseAccessToken(token: string | null) {
  setSupabaseSession(token, getSupabaseRefreshToken());
}

export function clearSupabaseSession() {
  setSupabaseSession(null, null);
}

export async function supabaseRefreshSession() {
  const refreshToken = getSupabaseRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    clearSupabaseSession();
    return null;
  }

  const data = await response.json() as {
    access_token: string;
    refresh_token?: string;
  };

  setSupabaseSession(data.access_token, data.refresh_token || refreshToken);
  return data;
}


export async function supabaseIsAdmin(token: string): Promise<boolean> {
  return supabaseFetch<boolean>('/rest/v1/rpc/halal_is_admin', {
    method: 'POST',
    body: {},
    token,
  });
}

export async function supabaseSignOut(token: string | null) {
  if (!token) return;
  try {
    await supabaseFetch('/auth/v1/logout', { method: 'POST', token });
  } catch {
    // Ignore remote logout errors; local session is still cleared.
  }
}
