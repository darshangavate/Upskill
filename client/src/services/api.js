const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    const msg = data?.message || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data.data;
}

export const api = {
  getDashboard: (userId) => request(`/api/user/${userId}/dashboard`),

  // ✅ asset details (uses your existing catalog route)
  getAssetById: (assetId) => request(`/api/catalog/assets/${encodeURIComponent(assetId)}`),

  getQuiz: (userId, topic) =>
    request(`/api/engine/${userId}/quiz?topic=${encodeURIComponent(topic)}`),

  submitQuiz: (userId, payload) =>
    request(`/api/engine/${userId}/quiz/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
