function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function getLastSixMonths() {
  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(date.toLocaleString("default", { month: "short" }));
  }
  return months;
}

async function loadAssets() {
  const token = localStorage.getItem("auth_token");
  const userId = localStorage.getItem("user_id");
  if (!token) {
    showLoginCard();
    return;
  }

  const loader = document.querySelector(".loader-container") || createLoader();
  loader.style.display = "flex";

  try {
    const response = await fetch(
      "https://coincise-api.simongerula.workers.dev/assets/",
      {
        method: "GET",
        headers: getAuthHeaders(),
      }
    );

    if (response.status === 403 || response.status === 401) {
      localStorage.removeItem("auth_token");
      showLoginCard();
      return;
    }

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // ✅ Extract both values
    //const data = await response.json();
    //const { assets, totalWorth } = data;
    const data = await response.json();
    assets = data.assets; // ✅ make sure global assets array is updated
    const total = data.totalWorth || 0;

    const container = document.getElementById("assets");
    container.innerHTML = "";

    // ✅ Use totalWorth directly
    //const total = totalWorth || 0;

    assets.forEach((asset, index) => {
      const div = document.createElement("div");
      div.className = "asset";

      const nameSpan = document.createElement("span");
      nameSpan.className = "asset-name";
      nameSpan.innerHTML = `<strong>${
        asset.name
      }</strong><br><span class="balance">$${asset.balance.toFixed(2)}</span>`;

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "asset-buttons";

      // ✅ Use totalWorth for percentage
      const percent = total > 0 ? (asset.balance / total) * 100 : 0;

      const percentDiv = document.createElement("div");
      percentDiv.className = "asset-percent";
      percentDiv.innerHTML = `<img src="/src/pie-chart-icon.svg" alt="Pie Chart" class="icon-pie" />${Math.round(
        percent
      )}%`;

      const kebabBtn = document.createElement("button");
      kebabBtn.className = "kebab-menu";
      kebabBtn.innerHTML = "⋮";
      kebabBtn.onclick = (e) => {
        e.stopPropagation();
        const dropdown = kebabBtn.nextElementSibling;
        dropdown.classList.toggle("show");
        document.querySelectorAll(".dropdown-content.show").forEach((menu) => {
          if (menu !== dropdown) menu.classList.remove("show");
        });
      };

      const dropdown = document.createElement("div");
      dropdown.className = "dropdown-content";

      const addAction = document.createElement("div");
      addAction.className = "dropdown-item";
      addAction.textContent = "Add funds";
      addAction.onclick = () => {
        const input = prompt(`Add amount to ${asset.name}:`);
        const amount = parseFloat(input);
        if (!isNaN(amount)) changeBalance(index, amount);
      };

      const subtractAction = document.createElement("div");
      subtractAction.className = "dropdown-item";
      subtractAction.textContent = "Subtract funds";
      subtractAction.onclick = () => {
        const input = prompt(`Subtract amount from ${asset.name}:`);
        const amount = parseFloat(input);
        if (!isNaN(amount)) changeBalance(index, -amount);
      };

      const deleteAction = document.createElement("div");
      deleteAction.className = "dropdown-item delete";
      deleteAction.textContent = "Delete asset";
      deleteAction.onclick = async () => {
        if (confirm(`Are you sure you want to delete ${asset.name}?`)) {
          try {
            const response = await fetch(
              `https://coincise-api.simongerula.workers.dev/assets/${asset.id}`,
              { method: "DELETE", headers: getAuthHeaders() }
            );
            if (!response.ok) throw new Error("Network response was not ok");
            await loadAssets();
          } catch (error) {
            console.error("Error removing asset:", error);
            alert("Failed to remove asset. Please try again.");
          }
        }
      };

      dropdown.appendChild(addAction);
      dropdown.appendChild(subtractAction);
      dropdown.appendChild(deleteAction);

      buttonContainer.appendChild(percentDiv);
      buttonContainer.appendChild(kebabBtn);
      buttonContainer.appendChild(dropdown);

      div.appendChild(nameSpan);
      div.appendChild(buttonContainer);
      container.appendChild(div);
    });

    // ✅ Use total from API
    document.getElementById("total").textContent = total.toFixed(2);
    updateWorthChart(total);

    if (userId) {
      await loadWorthHistory(userId);
    }
  } catch (error) {
    console.error("Error loading assets:", error);
    document.getElementById("assets").innerHTML = `
      <div class="error">Failed to load assets. Please try again later.</div>
    `;
  } finally {
    loader.style.display = "none";
  }
}

async function loadWorthHistory(userId) {
  if (!userId) return;
  try {
    const response = await fetch(
      `https://coincise-api.simongerula.workers.dev/worth-history?accountId=${userId}`,
      { headers: getAuthHeaders() }
    );
    if (!response.ok) throw new Error("Failed to load worth history");

    const data = await response.json();
    const history = data.history || [];
    const change = data.changePercent;
    const worthChangeEl = document.getElementById("worthChange");

    const sorted = history.sort((a, b) => a.period.localeCompare(b.period));
    const months = sorted.map((item) => formatMonthLabel(item.period));
    const values = sorted.map((item) => item.worth);

    if (change !== null) {
      const formatted = change.toFixed(1) + "%";
      worthChangeEl.textContent =
        (change >= 0 ? "+" : "") + formatted + " since last month";
      worthChangeEl.style.color = change >= 0 ? "green" : "red";
    } else {
      worthChangeEl.textContent = "";
    }

    updateWorthChart(values, months);
  } catch (error) {
    console.error("Error loading worth history:", error);
  }
}

function formatMonthLabel(period) {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

function updateWorthChart(data, months) {
  const ctx = document.getElementById("worthChart");
  if (window.worthLineChart) window.worthLineChart.destroy();
  if (!data || !data.length) return;

  window.worthLineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Total Worth",
          data: data,
          borderColor: "rgb(75, 192, 192)",
          tension: 0.3,
          fill: false,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => "$" + context.parsed.y.toFixed(2),
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => "$" + value.toFixed(2),
          },
        },
      },
    },
  });
}

function createLoader() {
  const container = document.createElement("div");
  container.className = "loader-container";
  const spinner = document.createElement("div");
  spinner.className = "loader";
  container.appendChild(spinner);
  document.body.appendChild(container);
  return container;
}

async function addAsset() {
  const name = prompt("Enter asset name:");
  if (!name) return;
  const balanceStr = prompt("Initial balance:");
  const balance = parseFloat(balanceStr);
  if (isNaN(balance)) return alert("Invalid balance");

  try {
    const response = await fetch(
      "https://coincise-api.simongerula.workers.dev/assets/",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, balance }),
      }
    );
    if (!response.ok) throw new Error("Network response was not ok");
    await loadAssets();
  } catch (error) {
    console.error("Error adding asset:", error);
    alert("Failed to add asset. Please try again.");
  }
}

function changeBalance(index, amount) {
  assets[index].balance += amount;
  fetch(
    `https://coincise-api.simongerula.workers.dev/assets/${assets[index].id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ balance: assets[index].balance }),
    }
  ).then((response) => {
    if (!response.ok) throw new Error("Network response was not ok");
    loadAssets();
  });
}

function showLoginCard() {
  const chart = document.querySelector(".chart");
  const actionButtons = document.querySelector(".action-buttons");
  const totalCard = document.querySelector(".total-card");

  if (chart) chart.style.display = "none";
  if (actionButtons) actionButtons.style.display = "none";
  if (totalCard) totalCard.style.display = "none";

  const container = document.getElementById("assets");
  container.innerHTML = `
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
          <div class="modal-buttons">
            <button type="submit" class="btn-primary">Sign Up</button>
            <button type="button" id="closeSignupModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const loginLink = container.querySelector("#loginLink");
  const signupLink = container.querySelector("#signupLink");

  const loginModal = container.querySelector("#loginModal");
  const signupModal = container.querySelector("#signupModal");

  const closeLoginModal = container.querySelector("#closeLoginModal");
  const closeSignupModal = container.querySelector("#closeSignupModal");

  const loginForm = container.querySelector("#loginForm");
  const signupForm = container.querySelector("#signupForm");

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
      const response = await fetch(
        "https://coincise-api.simongerula.workers.dev/auth",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      if (response.status === 201) {
        const data = await response.json();
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("user_id", data.accountId);
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

    if (!email || !username || !password)
      return alert("All fields are required");

    try {
      const response = await fetch(
        "https://coincise-api.simongerula.workers.dev/signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username, password }),
        }
      );

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

document.addEventListener("DOMContentLoaded", loadAssets);

document.addEventListener("click", (e) => {
  if (!e.target.matches(".kebab-menu")) {
    document.querySelectorAll(".dropdown-content.show").forEach((dropdown) => {
      dropdown.classList.remove("show");
    });
  }
});
