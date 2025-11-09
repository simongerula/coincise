// 🧩 Helper: Get authorization headers
function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return token
    ? {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

// 🗓️ Generate last 6 months labels
function getLastSixMonths() {
  const months = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(date.toLocaleString("default", { month: "short" }));
  }

  return months;
}

// 🧠 Load all accounts
async function loadAccounts() {
  const token = localStorage.getItem("auth_token");
  const accountId = localStorage.getItem("account_id");
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

    const accounts = await response.json();

    const container = document.getElementById("accounts");
    container.innerHTML = "";
    let total = 0;

    accounts.forEach((acc, index) => {
      total += acc.balance;

      const div = document.createElement("div");
      div.className = "account";

      const nameSpan = document.createElement("span");
      nameSpan.className = "account-name";
      nameSpan.innerHTML = `<strong>${
        acc.name
      }</strong><br><span class="balance">$${acc.balance.toFixed(2)}</span>`;

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "account-buttons";

      // kebab dropdown menu
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
        const input = prompt(`Add amount to ${acc.name}:`);
        const amount = parseFloat(input);
        if (!isNaN(amount)) changeBalance(index, amount);
      };

      const subtractAction = document.createElement("div");
      subtractAction.className = "dropdown-item";
      subtractAction.textContent = "Subtract funds";
      subtractAction.onclick = () => {
        const input = prompt(`Subtract amount from ${acc.name}:`);
        const amount = parseFloat(input);
        if (!isNaN(amount)) changeBalance(index, -amount);
      };

      const deleteAction = document.createElement("div");
      deleteAction.className = "dropdown-item delete";
      deleteAction.textContent = "Delete account";
      deleteAction.onclick = async () => {
        if (confirm(`Are you sure you want to delete ${acc.name}?`)) {
          try {
            const response = await fetch(
              `https://coincise-api.simongerula.workers.dev/assets/${acc.id}`,
              { method: "DELETE", headers: getAuthHeaders() }
            );
            if (!response.ok) throw new Error("Network response was not ok");
            await loadAccounts();
          } catch (error) {
            console.error("Error removing account:", error);
            alert("Failed to remove account. Please try again.");
          }
        }
      };

      dropdown.appendChild(addAction);
      dropdown.appendChild(subtractAction);
      dropdown.appendChild(deleteAction);

      buttonContainer.appendChild(kebabBtn);
      buttonContainer.appendChild(dropdown);

      div.appendChild(nameSpan);
      div.appendChild(buttonContainer);
      container.appendChild(div);
    });

    document.getElementById("total").textContent = total.toFixed(2);

    if (accountId) {
      await loadWorthHistory(accountId);
      await loadWorthChange();
    }
  } catch (error) {
    console.error("Error loading accounts:", error);
    document.getElementById("accounts").innerHTML = `
      <div class="error">Failed to load accounts. Please try again later.</div>
    `;
  } finally {
    loader.style.display = "none";
  }
}

// 📊 Load worth history and render chart
async function loadWorthHistory(accountId) {
  try {
    const token = localStorage.getItem("auth_token");

    const response = await fetch(
      `https://coincise-api.simongerula.workers.dev/worth-history?accountId=${accountId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!response.ok) throw new Error("Failed to load worth history");

    const data = await response.json();
    const history = data.history || [];

    const sorted = history.sort((a, b) => a.period.localeCompare(b.period));

    const months = sorted.map((item) => formatMonthLabel(item.period));
    const values = sorted.map((item) => item.worth);

    updateWorthChart(values, months);
  } catch (error) {
    console.error("Error loading worth history:", error);
  }
}

// 📈 Load and display % change
async function loadWorthChange() {
  const accountId = localStorage.getItem("account_id");
  if (!accountId) return;

  const res = await fetch(
    `https://coincise-api.simongerula.workers.dev/worth-history?accountId=${accountId}`,
    { headers: getAuthHeaders() }
  );

  if (!res.ok) return;
  const data = await res.json();

  const change = data.changePercent;
  const worthChangeEl = document.getElementById("worthChange");

  if (change !== null) {
    const formatted = change.toFixed(1) + "%";
    worthChangeEl.textContent =
      (change >= 0 ? "+" : "") + formatted + " since last month";
    worthChangeEl.style.color = change >= 0 ? "green" : "red";
  } else {
    worthChangeEl.textContent = "";
  }
}

// 🧾 Format YYYY-MM → "Nov 2025"
function formatMonthLabel(period) {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

// 🎨 Draw worth chart
function updateWorthChart(data, months) {
  const ctx = document.getElementById("worthChart");
  if (!ctx) return;

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
          ticks: { callback: (v) => "$" + v.toFixed(2) },
        },
        x: { ticks: { maxRotation: 0, minRotation: 0 } },
      },
    },
  });
}

// ⏳ Loader element
function createLoader() {
  const container = document.createElement("div");
  container.className = "loader-container";
  const spinner = document.createElement("div");
  spinner.className = "loader";
  container.appendChild(spinner);
  document.body.appendChild(container);
  return container;
}

// ➕ Add account
async function addAccount() {
  const name = prompt("Enter account name:");
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

    if (!response.ok) throw new Error("Failed to add account");
    await loadAccounts();
  } catch (error) {
    console.error("Error adding account:", error);
    alert("Failed to add account. Please try again.");
  }
}

// 💰 Adjust balance
function changeBalance(index, amount) {
  const acc = accounts[index];
  acc.balance += amount;

  fetch(`https://coincise-api.simongerula.workers.dev/assets/${acc.id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ balance: acc.balance }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Network error");
      loadAccounts();
    })
    .catch((err) => console.error(err));
}

// 🔐 Authentication UI
function showLoginCard() {
  const chart = document.querySelector(".chart");
  const actionButtons = document.querySelector(".action-buttons");
  const totalCard = document.querySelector(".total-card");

  if (chart) chart.style.display = "none";
  if (actionButtons) actionButtons.style.display = "none";
  if (totalCard) totalCard.style.display = "none";

  const container = document.getElementById("accounts");
  container.innerHTML = `
    <div class="auth-card">
      <h2>Authentication Required</h2>
      <p>
        Please <a href="#" id="loginLink">log in</a> 
        or <a href="#" id="signupLink">sign up</a> to view your accounts.
      </p>
    </div>

    <div id="loginModal" class="modal hidden">
      <div class="modal-content">
        <h3>Log In</h3>
        <form id="loginForm">
          <label>Username:<input type="text" id="loginUsername" required /></label>
          <label>Password:<input type="password" id="loginPassword" required /></label>
          <div class="modal-buttons">
            <button type="submit" class="btn-primary">Log In</button>
            <button type="button" id="closeLoginModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>

    <div id="signupModal" class="modal hidden">
      <div class="modal-content">
        <h3>Sign Up</h3>
        <form id="signupForm">
          <label>Email:<input type="email" id="signupEmail" required /></label>
          <label>Username:<input type="text" id="signupUsername" required /></label>
          <label>Password:<input type="password" id="signupPassword" required /></label>
          <div class="modal-buttons">
            <button type="submit" class="btn-primary">Sign Up</button>
            <button type="button" id="closeSignupModal" class="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `;

  const loginModal = container.querySelector("#loginModal");
  const signupModal = container.querySelector("#signupModal");

  container.querySelector("#loginLink").addEventListener("click", (e) => {
    e.preventDefault();
    loginModal.classList.remove("hidden");
  });

  container.querySelector("#signupLink").addEventListener("click", (e) => {
    e.preventDefault();
    signupModal.classList.remove("hidden");
  });

  container
    .querySelector("#closeLoginModal")
    .addEventListener("click", () => loginModal.classList.add("hidden"));
  container
    .querySelector("#closeSignupModal")
    .addEventListener("click", () => signupModal.classList.add("hidden"));

  // LOGIN
  container
    .querySelector("#loginForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("loginUsername").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

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
          localStorage.setItem("account_id", data.accountId);
          loginModal.classList.add("hidden");

          if (chart) chart.style.display = "block";
          if (actionButtons) actionButtons.style.display = "block";
          if (totalCard) totalCard.style.display = "block";

          loadAccounts();
        } else alert("Invalid credentials");
      } catch (error) {
        console.error("Login error:", error);
        alert("Login failed.");
      }
    });

  // SIGNUP
  container
    .querySelector("#signupForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value.trim();
      const username = document.getElementById("signupUsername").value.trim();
      const password = document.getElementById("signupPassword").value.trim();

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
          signupModal.classList.add("hidden");

          const authCard = document.querySelector(".auth-card");
          const successCard = document.createElement("div");
          successCard.className = "success-card";
          successCard.innerHTML = `
          <div class="success-message">
            ✅ Account created successfully! You can now <a href="#" id="openLoginFromSuccess">log in</a>.
          </div>
        `;
          authCard.parentNode.insertBefore(successCard, authCard);

          const openLogin = successCard.querySelector("#openLoginFromSuccess");
          openLogin.addEventListener("click", (ev) => {
            ev.preventDefault();
            successCard.remove();
            loginModal.classList.remove("hidden");
          });
        } else alert("Signup failed");
      } catch (error) {
        console.error("Signup error:", error);
        alert("Signup failed.");
      }
    });
}

document.addEventListener("DOMContentLoaded", loadAccounts);
document.addEventListener("click", (e) => {
  if (!e.target.matches(".kebab-menu"))
    document
      .querySelectorAll(".dropdown-content.show")
      .forEach((d) => d.classList.remove("show"));
});
