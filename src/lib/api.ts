export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON from ${path}. Make sure the API server is running on port 3001 and Vite is proxying /api.`);
  }

  const data = await response.json() as T;
  if (!response.ok) {
    const message = typeof data === 'object' && data !== null && 'error' in data
      ? String(data.error)
      : `Request failed for ${path}`;
    throw new Error(message);
  }

  return data;
}
