export const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';
export async function api(path: string, opts: any = {}) {
  const r = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  if (!r.ok) { const t = await r.text(); throw new Error(t || `API ${r.status}`); }
  return r.json();
}
