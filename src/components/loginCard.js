import { login, signup } from "../api/auth.js";
import { loadAssets } from "../../app.js";
/**
 * Show login card
 */
export function showLoginCard() {
  delete window.assetsHistory;
  const chart = document.querySelector(".chart");
  const actionButtons = document.querySelector(".action-buttons");
  const totalCard = document.querySelector(".total-card");

  if (chart) chart.style.display = "none";
  if (actionButtons) actionButtons.style.display = "none";
  if (totalCard) totalCard.style.display = "none";

  const assetsContainer = document.getElementById("assets");
  assetsContainer.style.display = "none";

  const loginCardContainer = document.getElementById("loginCardContainer");
  loginCardContainer.style.display = "block";
  loginCardContainer.innerHTML = `
    <div class="auth-card">
      <h2>Authentication Required</h2>
      <p>
        Please
        <a href="#" class="login-link" id="loginLink">log in</a>
        or
        <a href="#" class="signup-link" id="signupLink">sign up</a>
        to view your assets.
      </p>
    </div>

    <!-- Login Modal -->
    <div id="loginModal" class="modal hidden">
      <div class="modal-content">
        <h3>Log In</h3>
        <form id="loginForm">
          <label>
            Username:
            <input type="text" id="loginUsername" required />
          </label>
          <label>
            Password:
            <input type="password" id="loginPassword" required />
          </label>
          <div class="modal-buttons">
            <button type="submit" class="btn-primary">Log In</button>
            <button type="button" id="closeLoginModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Signup Modal -->
    <div id="signupModal" class="modal hidden">
      <div class="modal-content">
        <h3>Sign Up</h3>
        <form id="signupForm">
          <label>
            Email:
            <input type="email" id="signupEmail" required />
          </label>
          <label>
            Username:
            <input type="text" id="signupUsername" required />
          </label>
          <label>
            Password:
            <input type="password" id="signupPassword" required />
          </label>
          <label>
            Confirm Password:
            <input type="password" id="signupConfirmPassword" required />
        </label>
          <div class="modal-buttons">
            <button type="submit" class="btn-primary">Sign Up</button>
            <button type="button" id="closeSignupModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const loginLink = loginCardContainer.querySelector("#loginLink");
  const signupLink = loginCardContainer.querySelector("#signupLink");

  const loginModal = loginCardContainer.querySelector("#loginModal");
  const signupModal = loginCardContainer.querySelector("#signupModal");

  const closeLoginModal = loginCardContainer.querySelector("#closeLoginModal");
  const closeSignupModal =
    loginCardContainer.querySelector("#closeSignupModal");

  const loginForm = loginCardContainer.querySelector("#loginForm");
  const signupForm = loginCardContainer.querySelector("#signupForm");

  // Open modals
  loginLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.classList.remove("hidden");
  });

  signupLink.addEventListener("click", (e) => {
    e.preventDefault();
    signupModal.classList.remove("hidden");
  });

  // Close modals
  closeLoginModal.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });
  closeSignupModal.addEventListener("click", () => {
    signupModal.classList.add("hidden");
  });

  // Log in
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if (!username || !password) return alert("Please enter both fields");

    try {
      const response = await login(username, password);

      if (response.status === 201) {
        console.log("Login successful:", response);
        localStorage.setItem("auth_token", response.token);
        localStorage.setItem("user_id", response.accountId);
        loginModal.classList.add("hidden");

        if (chart) chart.style.display = "block";
        if (actionButtons) actionButtons.style.display = "block";
        if (totalCard) totalCard.style.display = "block";

        loadAssets();
      } else {
        alert("Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Login failed. Please try again later.");
    }
  });

  // Sign up
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signupEmail").value.trim();
    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const password2 = document
      .getElementById("signupConfirmPassword")
      .value.trim();

    if (!email || !username || !password)
      return alert("All fields are required");

    if (password !== password2) return alert("Passwords do not match");

    try {
      const response = await signup(email, username, password);

      if (response.status === 201) {
        // Hide signup modal
        signupModal.classList.add("hidden");

        // ✅ Show success card above "Authentication Required"
        const authCard = document.querySelector(".auth-card");
        const successCard = document.createElement("div");
        successCard.className = "success-card";
        successCard.innerHTML = `
        <div class="success-message">
          ✅ Account created successfully! You can now <a href="#" id="openLoginFromSuccess">log in</a>.
        </div>
      `;

        authCard.parentNode.insertBefore(successCard, authCard);

        // Attach listener to open login modal directly
        const openLogin = successCard.querySelector("#openLoginFromSuccess");
        openLogin.addEventListener("click", (ev) => {
          ev.preventDefault();
          successCard.remove(); // remove success message
          loginModal.classList.remove("hidden");
        });
      } else {
        const msg = await response.text();
        alert("Signup failed: " + msg);
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Please try again later.");
    }
  });
}
