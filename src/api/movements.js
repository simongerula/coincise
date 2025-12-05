import { BASE_URL, getAuthHeaders } from "../utils/auth.js";

/**
 * Fetches movements for a specific asset
 */
export async function fetchAssetMovements(assetId) {
  const response = await fetch(
    `${BASE_URL}/asset-movements?assetId=${assetId}`,
    { headers: await getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch movements");
  return response.json();
}
