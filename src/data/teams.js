import { apiGet } from "./apiClient";
import { ENDPOINTS } from "./endpoints";

export async function fetchTeams() {
  const data = await apiGet(ENDPOINTS.teams());
  return data?.teams || [];
}
