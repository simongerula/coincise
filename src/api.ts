// src/api.ts

export interface Asset {
  id: number;
  name: string;
  balance: number;
  [key: string]: any;
}

/**
 * Helper to get authorization headers
 */
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Fetches all assets and total worth
 */
export async function fetchAssets(): Promise<{
  assets: Asset[];
  totalWorth: number;
}> {
  const response = await fetch(
    "https://coincise-api.simongerula.workers.dev/assets/",
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch assets");
  return response.json();
}

/**
 * Deletes an asset by ID
 */
export async function deleteAsset(asset: Asset): Promise<any> {
  const response = await fetch(
    `https://coincise-api.simongerula.workers.dev/assets/${asset.id}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
}

/**
 * Fetches movements for a specific asset
 */
export async function fetchAssetMovements(assetId: number): Promise<any[]> {
  const response = await fetch(
    `https://coincise-api.simongerula.workers.dev/asset-movements?assetId=${assetId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch movements");
  return response.json();
}

/**
 * Fetches worth history for the user
 */
export async function fetchWorthHistory(userId: number): Promise<any> {
  const response = await fetch(
    `https://coincise-api.simongerula.workers.dev/worth-history?accountId=${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load worth history");
  return response.json();
}

/**
 *  Creates a new asset
 */
export async function createAsset(
  name: string,
  balance: number
): Promise<Asset> {
  const response = await fetch(
    "https://coincise-api.simongerula.workers.dev/assets/",
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, balance }),
    }
  );
  if (!response.ok) throw new Error("Failed to create asset");
  return response.json();
}

/**
 * Updates an asset's balance
 */
export async function updateAssetBalance(
  index: number,
  amount: number,
  assets: Asset[]
): Promise<Asset> {
  assets[index].balance += amount;
  const response = await fetch(
    `https://coincise-api.simongerula.workers.dev/assets/${assets[index].id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ balance: assets[index].balance }),
    }
  );
  if (!response.ok) throw new Error("Failed to update asset balance");
  return response.json();
}

/**
 * User login
 */
export async function login(username: string, password: string): Promise<any> {
  const response = await fetch(
    "https://coincise-api.simongerula.workers.dev/auth",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }
  );
  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

/**
 * User signup
 */
export async function signup(
  email: string,
  username: string,
  password: string
): Promise<any> {
  const response = await fetch(
    "https://coincise-api.simongerula.workers.dev/signup",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    }
  );
  if (!response.ok) throw new Error("Signup failed");
  return response.json();
}

/**
 * Transfers funds between assets
 */
export async function transferFunds(
  fromAsset: Asset,
  toAssetId: number,
  amount: number
): Promise<any> {
  const response = await fetch(
    "https://coincise-api.simongerula.workers.dev/transfer",
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fromAssetId: fromAsset.id,
        toAssetId,
        amount,
      }),
    }
  );
  if (!response.ok) throw new Error("Transfer failed");
  return response.json();
}
