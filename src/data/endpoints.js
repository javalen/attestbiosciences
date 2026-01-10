export const API_BASE = import.meta.env.VITE_PUBLIC_API_BASE?.replace(
  /\/+$/,
  ""
);

export const ENDPOINTS = {
  teams: () => `${API_BASE}/api/public/teams`,
  categories: () => `${API_BASE}/api/public/categories`,
  tests: () => `${API_BASE}/api/public/tests`,
  testById: (id) => `${API_BASE}/api/public/tests/${id}`,
};
