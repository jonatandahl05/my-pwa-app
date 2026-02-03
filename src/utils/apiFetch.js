export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch failed: ${res.status} ${res.statusText} ${text}`);
  }

  if (res.status === 204) return null;

  return res.json();
}
