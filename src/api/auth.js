import { BASE_URL } from "../utils/auth.js";

/**
 * User login
 */
export async function login(username, password) {
  const response = await fetch(`${BASE_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error("Login failed");
  return response.json();
}

/**
 * User signup
 */
export async function signup(email, username, password) {
  const response = await fetch(`${BASE_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password }),
  });
  if (!response.ok) throw new Error("Signup failed");
  return response.json();
}
