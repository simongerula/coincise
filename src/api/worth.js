import { BASE_URL, getAuthHeaders } from "../utils/auth.js";

/**
 * Fetches worth history for the user
 */
export async function fetchWorthHistory(userId) {
  const response = await fetch(
    `${BASE_URL}/worth-history?accountId=${userId}`,
    { headers: await getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load worth history");
  return response.json();
}
