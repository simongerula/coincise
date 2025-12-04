import { BASE_URL, getAuthHeaders } from "../utils/auth";

/**
 * Fetches worth history for the user
 */
export async function fetchWorthHistory(userId) {
  const response = await fetch(
    `${BASE_URL}/worth-history?accountId=${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load worth history");
  return response.json();
}
