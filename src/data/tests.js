import { apiGet } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export async function fetchTests() {
  const data = await apiGet(ENDPOINTS.tests());
  return data?.tests || [];
}

export async function fetchTestById(id) {
  const data = await apiGet(ENDPOINTS.testById(id));
  return data?.test || null;
}
