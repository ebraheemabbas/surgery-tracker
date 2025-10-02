
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function api(path, options={}){
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers||{}) },
    ...options,
  });
  if (!res.ok){
    const err = await res.json().catch(()=>({error: res.statusText}));
    throw new Error(err.error ? JSON.stringify(err.error) : res.statusText);
  }
  return res.json();
}
