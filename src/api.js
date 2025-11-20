export async function fetchAssets() {
  const response = await fetch(
    "https://coincise-api.simongerula.workers.dev/assets/",
    {
      headers: getAuthHeaders(),
    }
  );
  if (!response.ok) throw new Error("Failed to fetch assets");
  return response.json();
}

export async function deleteAsset(asset) {
  const response = await fetch(
    `https://coincise-api.simongerula.workers.dev/assets/${asset.id}`,
    { method: "DELETE", headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Network response was not ok");
  return response.json();
}

export async function fetchAssetMovements(assetId) {
  const response = await fetch(
    `https://coincise-api.simongerula.workers.dev/asset-movements?assetId=${assetId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to fetch movements");
  return response.json();
}

export async function fetchWorthHistory(userId) {
  const response = await fetch(
    `https://coincise-api.simongerula.workers.dev/worth-history?accountId=${userId}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error("Failed to load worth history");
  return response.json();
}

export async function createAsset(name, balance) {
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

export async function updateAssetBalance(index, amount) {
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

export async function login(username, password) {
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

export async function signup(email, username, password) {
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

export async function transferFunds(fromAsset, toAssetId, amount) {
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
