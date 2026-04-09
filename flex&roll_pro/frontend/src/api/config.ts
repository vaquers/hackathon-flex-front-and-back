// ─── API Configuration ───────────────────────────────────────────────────────
// Toggle VITE_USE_MOCK=true in .env to use mock data (no backend required).
// Switch to false to connect the real FastAPI backend.

export const API_CONFIG = {
  // Switch to false when backend is ready:
  useMock: import.meta.env.VITE_USE_MOCK !== 'false',
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 10_000,
  mockDelayMs: 400, // Simulates network latency in mock mode
}
