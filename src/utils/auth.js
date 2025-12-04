/**
 * API base URL
 */
export const BASE_URL = "https://coincise-api.simongerula.workers.dev";

/**
 * Helper to get authorization headers
 */
export async function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

/**
 * Show login card
 */
export function showLoginCard() {
  const loginCard = document.getElementById("loginCard");
  if (loginCard) {
    loginCard.style.display = "block";
  }
}
