const API_BASE = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

function resolveUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (!API_BASE) return p;
  return `${API_BASE}${p}`;
}

async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  const trimmed = text.trimStart();
  const ct = res.headers.get('content-type') || '';

  if (trimmed.startsWith('<')) {
    throw new Error(
      'The app received a web page instead of API data. Start the backend on port 4000, or set VITE_API_BASE_URL to your API URL (e.g. http://localhost:4000).'
    );
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    if (!/application\/json/i.test(ct)) {
      throw new Error(`Expected JSON from API, got: ${ct || 'unknown content type'}`);
    }
    throw new Error('Invalid JSON from API. Is the backend running?');
  }
}

export function getToken(): string {
  return localStorage.getItem('token') || '';
}

/** Read JWT payload (unsigned). Used only for route guards; API still validates the token. */
export function parseJwtPayload(token: string): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getAuthRole(): 'manager' | 'employee' | null {
  const role = parseJwtPayload(getToken())?.role;
  return role === 'manager' || role === 'employee' ? role : null;
}

/** Public API calls (no JWT), e.g. auth status and first-time registration. */
export async function publicFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const target = resolveUrl(url);
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(target, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await readJsonOrThrow<{ message?: string }>(res);
      if (data?.message) message = data.message;
    } catch (e) {
      if (e instanceof Error && !e.message.startsWith('Request failed')) message = e.message;
    }
    throw new Error(message);
  }

  return readJsonOrThrow<T>(res);
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const target = resolveUrl(url);
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };

  if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(target, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await readJsonOrThrow<{ message?: string }>(res);
      if (data?.message) message = data.message;
    } catch (e) {
      if (e instanceof Error && !e.message.startsWith('Request failed')) message = e.message;
    }
    throw new Error(message);
  }

  return readJsonOrThrow<T>(res);
}
