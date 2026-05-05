// js/api.js
export async function api(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (e) {
    console.error(`API Error (${url}):`, e);
    throw e;
  }
}
