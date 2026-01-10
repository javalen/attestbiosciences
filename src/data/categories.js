import { apiGet } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export async function fetchCategories() {
  const data = await apiGet(ENDPOINTS.categories());
  return data?.categories || [];
}
