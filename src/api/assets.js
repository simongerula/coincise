import { BASE_URL, getAuthHeaders } from "../utils/auth.js";

/**
 * Fetches all assets and total worth
 */
export async function fetchAssets() {
  const response = await fetch(`${BASE_URL}/assets/`, {
    headers: getAuthHeaders(),
  });
  if (response.status === 401 || response.status === 403) {
    throw new Error("Unauthorized");
  }
  if (!response.ok) throw new Error("Failed to fetch assets");
  return response.json();
}

/**
 * Deletes an asset by ID
 */
export async function deleteAsset(asset) {
  const response = await fetch(`${BASE_URL}/assets/${asset.id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
}

/**
 *  Creates a new asset
 */
export async function createAsset(name, balance) {
  const response = await fetch(`${BASE_URL}/assets/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ name, balance }),
  });
  if (!response.ok) throw new Error("Failed to create asset");
  return response.json();
}

/**
 * Updates an asset's balance
 */
export async function updateAssetBalance(index, amount, assets) {
  assets[index].balance += amount;
  const response = await fetch(`${BASE_URL}/assets/${assets[index].id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ balance: assets[index].balance }),
  });
  if (!response.ok) throw new Error("Failed to update asset balance");
  return response.json();
}

/**
 * Transfers funds between assets
 */
export async function transferFunds(fromAsset, toAssetId, amount) {
  const response = await fetch(`${BASE_URL}/transfer`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      fromAssetId: fromAsset.id,
      toAssetId,
      amount,
    }),
  });
  if (!response.ok) throw new Error("Transfer failed");
  return response.json();
}
