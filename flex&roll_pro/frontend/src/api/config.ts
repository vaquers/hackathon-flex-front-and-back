// ─── API Configuration ───────────────────────────────────────────────────────
// Toggle VITE_USE_MOCK=true in .env to use mock data (no backend required).
// Switch to false to connect the real FastAPI backend.

export const API_CONFIG = {
  // Real backend by default; set VITE_USE_MOCK=true to use mock data
  useMock: import.meta.env.VITE_USE_MOCK === 'true',
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15_000,
  mockDelayMs: 400,
}
