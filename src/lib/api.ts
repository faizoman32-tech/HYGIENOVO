export async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
  bearerToken?: string | null
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data && typeof data.error === 'string' && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}
