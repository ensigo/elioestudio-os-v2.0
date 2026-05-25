let _userId: string | null = null;

export function setAuthUserId(id: string | null): void {
  _userId = id;
}

export function getAuthUserId(): string | null {
  return _userId;
}

export function authFetch(url: string, options?: RequestInit): Promise<Response> {
  if (_userId && (url.startsWith('/api/') || url.startsWith('/api'))) {
    const headers = new Headers(options?.headers as HeadersInit | undefined);
    headers.set('X-User-Id', _userId);
    return fetch(url, { ...options, headers });
  }
  return fetch(url, options);
}
