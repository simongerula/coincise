import { fetchAssets } from "./dist/src/api.js";

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
    // const response = await fetch(
    //   "https://coincise-api.simongerula.workers.dev/assets/",
    //   {
    //     method: "GET",
    //     headers: getAuthHeaders(),
    //   }
    // );

    // if (response.status === 403 || response.status === 401) {
    //   localStorage.removeItem("auth_token");
    //   showLoginCard();
    //   return;
    // }

    // if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    // const data = await response.json();
    // assets = data.assets;
    // assets.sort((a, b) => b.balance - a.balance);
    const data = await fetchAssets(); // ✅ replaced direct fetch
    assets = data.assets;
    assets.sort((a, b) => b.balance - a.balance);
    const total = data.totalWorth || 0;

    const container = document.getElementById("assets");
    container.innerHTML = "";

    assets.forEach((asset, index) => {
      const div = document.createElement("div");
      div.className = "asset";
      div.dataset.assetId = asset.id; // store asset id

      const nameSpan = document.createElement("span");
      nameSpan.className = "asset-name";
      nameSpan.innerHTML = `<strong>${
        asset.name
      }</strong><br><span class="balance">$${asset.balance.toFixed(2)}</span>`;

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "asset-buttons";

      const percent = total > 0 ? (asset.balance / total) * 100 : 0;
      const percentDiv = document.createElement("div");
      percentDiv.className = "asset-percent";

      const pieIcon = document.createElement("img");
      pieIcon.src = "/src/images/pie-chart-icon.svg";
      pieIcon.className = "icon-pie";
      percentDiv.appendChild(pieIcon);
      percentDiv.appendChild(
        document.createTextNode(`${Math.round(percent)}%`)
      );

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
        showAddFundsModal(asset, index);
      };

      const subtractAction = document.createElement("div");
      subtractAction.className = "dropdown-item";
      subtractAction.textContent = "Subtract funds";

      subtractAction.onclick = () => {
        showSubtractFundsModal(asset, index);
      };

      const transferAction = document.createElement("div");
      transferAction.className = "dropdown-item";
      transferAction.textContent = "Move funds";

      transferAction.onclick = () => {
        showTransferModal(asset);
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
      dropdown.appendChild(transferAction);
      dropdown.appendChild(deleteAction);

      buttonContainer.appendChild(percentDiv);
      buttonContainer.appendChild(kebabBtn);
      buttonContainer.appendChild(dropdown);

      div.appendChild(nameSpan);
      div.appendChild(buttonContainer);

      container.appendChild(div);

      // ✅ Movement container BELOW the asset card
      const movementContainer = document.createElement("div");
      movementContainer.className = "asset-movements";
      movementContainer.style.display = "none";
      container.appendChild(movementContainer);

      div.addEventListener("click", async (e) => {
        if (e.target.closest(".asset-buttons")) return; // ignore kebab clicks

        const assetId = div.dataset.assetId;
        if (!assetId) return;

        try {
          // 🔥 CLOSE ANY OTHER OPEN MOVEMENT CONTAINER
          document.querySelectorAll(".asset-movements").forEach((mc) => {
            if (mc !== movementContainer) mc.style.display = "none";
          });

          const response = await fetch(
            `https://coincise-api.simongerula.workers.dev/asset-movements?assetId=${assetId}`,
            { headers: getAuthHeaders() }
          );
          if (!response.ok) throw new Error("Failed to fetch movements");

          const movements = await response.json();
          movements.sort((a, b) => b.id - a.id); // descending by id

          // clear previous
          movementContainer.innerHTML = "";

          // no movements
          if (movements.length === 0) {
            const empty = document.createElement("div");
            empty.className = "movement-empty";
            empty.textContent = "No movements yet";
            movementContainer.appendChild(empty);

            // toggle this container
            movementContainer.style.display =
              movementContainer.style.display === "none" ? "block" : "none";

            return;
          }

          movements.forEach((m) => {
            const line = document.createElement("div");
            line.className = "movement-line";

            let sign = "";
            let color = "#ffffff";
            let noteText = m.note;
            const amount = `$${Math.abs(m.amount)}`;
            const date = new Date(m.dateCreated).toLocaleDateString();

            // ---- TRANSFER LOGIC ----
            if (m.note === "Transfer") {
              // This asset is the source
              if (asset.id === m.fromAssetId) {
                noteText = `Transfer to ${m.toAssetName}`;
                sign = "-";
                color = "red";

                // This asset is the destination
              } else if (asset.id === m.toAssetId) {
                noteText = `Transfer from ${m.fromAssetName}`;
                sign = "+";
                color = "green";
              }
            }

            // ---- DEPOSIT / WITHDRAWAL ----
            else if (m.note === "Deposit") {
              sign = "+";
              color = "green";
            } else if (m.note === "Withdrawal") {
              sign = "-";
              color = "red";
            }

            // ---- RENDER ELEMENTS ----
            const left = document.createElement("span");
            left.textContent = `${noteText} on ${date}`;

            const right = document.createElement("span");
            right.textContent = `${sign}${amount}`;
            right.style.color = color;

            line.appendChild(left);
            line.appendChild(right);
            movementContainer.appendChild(line);
          });

          // toggle this container (now that others are closed)
          movementContainer.style.display =
            movementContainer.style.display === "none" ? "block" : "none";
        } catch (err) {
          console.error("Error fetching movements:", err);
        }
      });
    });

    document.getElementById("total").textContent = total.toFixed(2);
    updateWorthChart(total);

    if (userId) {
      await loadWorthHistory(userId);
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      localStorage.removeItem("auth_token");
      showLoginCard();
      return;
    }
    console.error("Error loading assets:", error);
    document.getElementById(
      "assets"
    ).innerHTML = `<div class="error">Failed to load assets. Please try again later.</div>`;
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

    if (change !== null && values.length >= 2) {
      const lastWorth = values[values.length - 1];
      const prevWorth = values[values.length - 2];
      const absoluteChange = lastWorth - prevWorth;

      const formattedPercent = `${change >= 0 ? "+" : ""}${change.toFixed(
        1
      )}% since last month`;
      const formattedAmount = `${
        absoluteChange >= 0 ? "+" : ""
      }$${absoluteChange.toFixed(0)} since last month`;

      // default display → percentage
      worthChangeEl.textContent = formattedPercent;
      worthChangeEl.style.color = change >= 0 ? "green" : "red";

      // toggle on click
      let showingPercent = true;
      worthChangeEl.style.cursor = "pointer";
      worthChangeEl.title = "Click to toggle between % and $ change";
      worthChangeEl.onclick = () => {
        showingPercent = !showingPercent;
        worthChangeEl.textContent = showingPercent
          ? formattedPercent
          : formattedAmount;
      };
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
  // Create modal HTML (does NOT replace your page)
  const modal = document.createElement("div");
  modal.id = "addAssetModal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Add Asset</h3>
      <form id="addAssetForm">
        <label>
          Asset Name:
          <input type="text" id="assetNameInput" required />
        </label>

        <label>
          Initial Balance:
          <input type="number" step="0.01" id="assetBalanceInput" required />
        </label>

        <div class="modal-buttons">
          <button type="submit" class="btn-primary">Add Asset</button>
          <button type="button" id="closeAddAssetModal" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `;

  // Add modal on top of screen
  document.body.appendChild(modal);

  const form = modal.querySelector("#addAssetForm");
  const closeButton = modal.querySelector("#closeAddAssetModal");

  // CLOSE MODAL
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  // SUBMIT ASSET
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("assetNameInput").value.trim();
    const balance = parseFloat(
      document.getElementById("assetBalanceInput").value.trim()
    );

    if (!name || isNaN(balance)) {
      alert("Please enter valid asset data");
      return;
    }

    try {
      const response = await fetch(
        "https://coincise-api.simongerula.workers.dev/assets/",
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, balance }),
        }
      );

      if (!response.ok) throw new Error("Error creating asset");

      modal.remove();
      await loadAssets(); // reload list without hiding anything
    } catch (error) {
      console.error("Add Asset error:", error);
      alert("Failed to add asset.");
    }
  });
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
    const password2 = document
      .getElementById("signupConfirmPassword")
      .value.trim();

    if (!email || !username || !password)
      return alert("All fields are required");

    if (password !== password2) return alert("Passwords do not match");

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

function showAddFundsModal(asset, index) {
  // Create modal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "addFundsModal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Add Funds to "${asset.name}"</h3>

      <form id="addFundsForm">
        <label>
          Amount:
          <input type="number" step="0.01" id="addFundsInput" required />
        </label>
        <label class="inline-checkbox">
        <input type="checkbox" id="valueAdjustmentCheckbox" />
        Value adjustment (don’t record movement)
        </label>
        <div class="modal-buttons">
          <button type="submit" class="btn-primary">Add</button>
          <button type="button" id="closeAddFundsModal" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `;

  // Add to page
  document.body.appendChild(modal);

  const form = modal.querySelector("#addFundsForm");
  const closeButton = modal.querySelector("#closeAddFundsModal");

  // Close modal
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  // Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const amount = parseFloat(
      document.getElementById("addFundsInput").value.trim()
    );

    if (isNaN(amount)) {
      alert("Please enter a valid amount.");
      return;
    }

    // Call your existing logic
    changeBalance(index, amount);

    modal.remove();
  });
}

function showSubtractFundsModal(asset, index) {
  // Create modal
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.id = "subtractFundsModal";
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Subtract Funds from "${asset.name}"</h3>

      <form id="subtractFundsForm">
        <label>
          Amount:
          <input type="number" step="0.01" id="subtractFundsInput" required />
        </label>
        <label class="inline-checkbox">
        <input type="checkbox" id="valueAdjustmentCheckbox" />
        Value adjustment (don’t record movement)
        </label>

        <div class="modal-buttons">
          <button type="submit" class="btn-primary">Subtract</button>
          <button type="button" id="closeSubtractFundsModal" class="btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `;

  // Add to the page
  document.body.appendChild(modal);

  const form = modal.querySelector("#subtractFundsForm");
  const closeButton = modal.querySelector("#closeSubtractFundsModal");

  // Close modal
  closeButton.addEventListener("click", () => {
    modal.remove();
  });

  // Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const amount = parseFloat(
      document.getElementById("subtractFundsInput").value.trim()
    );

    if (isNaN(amount)) {
      alert("Please enter a valid amount.");
      return;
    }

    // Your logic uses negative values to subtract funds
    changeBalance(index, -amount);

    modal.remove();
  });
}

function showTransferModal(fromAsset) {
  // Create modal container
  const modal = document.createElement("div");
  modal.className = "modal";

  modal.innerHTML = `
    <div class="modal-content">
      <h3>Transfer from ${fromAsset.name}</h3>

      <label>
        Select target asset:
        <select id="transferTargetAsset"></select>
      </label>

      <label>
        Amount:
        <input type="number" step="0.01" id="transferAmountInput" />
      </label>

      <div class="modal-buttons">
        <button id="confirmTransfer" class="btn-primary">Transfer</button>
        <button id="cancelTransfer" class="btn-secondary">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Populate asset list
  const select = modal.querySelector("#transferTargetAsset");
  assets.forEach((a) => {
    if (a.id !== fromAsset.id) {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = a.name;
      select.appendChild(opt);
    }
  });

  // Cancel
  modal.querySelector("#cancelTransfer").onclick = () => modal.remove();

  // Confirm
  modal.querySelector("#confirmTransfer").onclick = async () => {
    const toAssetId = Number(select.value);
    const amount = parseFloat(
      modal.querySelector("#transferAmountInput").value
    );

    if (!amount || isNaN(amount) || amount <= 0) {
      alert("Invalid transfer amount");
      return;
    }

    try {
      const res = await fetch(
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

      if (!res.ok) throw new Error("Transfer failed");

      modal.remove();
      await loadAssets(); // refresh UI
    } catch (err) {
      console.error(err);
      alert("Transfer failed");
    }
  };
}
