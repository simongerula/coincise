import { fetchAssets } from "./dist/api.js";

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
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
  document.getElementById("logoutBtn").style.display = "inline-block";
  document.getElementById("yearChartBtn").style.display = "inline-block";

  try {
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

      let html = `<strong>${asset.name}</strong><br>
              <span class="balance">$${asset.balance.toFixed(2)}</span>`;

      if (asset.annual_interest && asset.annual_interest !== 0) {
        html += `<br><span class="annual-interest">${asset.annual_interest.toFixed(
          2
        )}% p.a.</span>`;
      }

      nameSpan.innerHTML = html;
      div.appendChild(nameSpan);

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

      const assetGrowth = document.createElement("span");
      assetGrowth.className = `asset-growth`;
      assetGrowth.id = `asset-growth-${asset.id}`;
      assetGrowth.textContent = "";

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

      // const showTotalGainsBtn = document.createElement("div");
      // showTotalGainsBtn.className = "dropdown-item";
      // showTotalGainsBtn.textContent = "Total Gains";

      // showTotalGainsBtn.onclick = () => {
      //   updateTotalGainsModal();
      //   document.getElementById("totalGainsModal").classList.remove("hidden");
      // };
      const showTotalGainsBtn = document.createElement("div");
      showTotalGainsBtn.className = "dropdown-item";
      showTotalGainsBtn.textContent = "Total Gains";

      showTotalGainsBtn.onclick = () => {
        const assetId = asset.id; // <--- from your existing render loop
        const assetName = asset.name;

        const history = window.assetsHistory?.[assetId];

        let initial = null;
        let current = null;

        if (history && history.length > 0) {
          const sorted = history.sort((a, b) =>
            a.period.localeCompare(b.period)
          );

          console.log("Sorted history for asset:", assetName, sorted);
          initial = sorted[0].worth;
          console.log("Initial worth:", initial);
          current = sorted[sorted.length - 1].worth;
          console.log("Current worth:", current);
        }

        updateTotalGainsModal(assetName, initial, current);
        document.getElementById("totalGainsModal").classList.remove("hidden");
      };

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

      dropdown.appendChild(showTotalGainsBtn);
      dropdown.appendChild(addAction);
      dropdown.appendChild(subtractAction);
      dropdown.appendChild(transferAction);
      dropdown.appendChild(deleteAction);

      buttonContainer.appendChild(assetGrowth);
      buttonContainer.appendChild(percentDiv);
      buttonContainer.appendChild(kebabBtn);
      buttonContainer.appendChild(dropdown);

      div.appendChild(nameSpan);
      div.appendChild(buttonContainer);

      container.appendChild(div);

      const movementContainer = document.createElement("div");
      movementContainer.className = "asset-movements";
      movementContainer.style.display = "none";
      container.appendChild(movementContainer);

      div.addEventListener("click", async (e) => {
        if (e.target.closest(".asset-buttons")) return;

        const assetId = div.dataset.assetId;
        if (!assetId) return;

        try {
          document.querySelectorAll(".asset-movements").forEach((mc) => {
            if (mc !== movementContainer) mc.style.display = "none";
          });

          const response = await fetch(
            `https://coincise-api.simongerula.workers.dev/asset-movements?assetId=${assetId}`,
            { headers: getAuthHeaders() }
          );
          if (!response.ok) throw new Error("Failed to fetch movements");

          const movements = await response.json();
          movements.sort((a, b) => b.id - a.id);

          movementContainer.innerHTML = "";

          if (movements.length === 0) {
            const empty = document.createElement("div");
            empty.className = "movement-empty";
            empty.textContent = "No movements yet";
            movementContainer.appendChild(empty);

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
            const amount = `$${Math.abs(m.amount).toFixed(2)}`;
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

            // ---- ADJUSTMENT LOGIC ----
            else if (m.note === "Value adjustment") {
              noteText = "Value adjustment";

              if (asset.id === m.fromAssetId) {
                // value decreased
                sign = "-";
                color = "red";
              } else if (asset.id === m.toAssetId) {
                // value increased
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
    const assetsHistory = data.assetsHistory || {};

    window.assetsHistory = assetsHistory;

    const worthChangeEl = document.querySelector("#worthChange");

    // --- Prepare months and total values ---
    const sorted = history.sort((a, b) => a.period.localeCompare(b.period));
    const months = sorted.map((i) => i.period); // use raw period for mapping
    // --- Build fixed Jan-Dec monthly change table ---
    const year = months[0]?.split("-")[0] || new Date().getFullYear();
    const fixedMonths = Array.from(
      { length: 12 },
      (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`
    );

    // Build lookup for pct and $ changes
    const changeLookup = {};
    for (let i = 1; i < months.length; i++) {
      const prev = totalValues[i - 1];
      const curr = totalValues[i];

      let pct = null;
      let abs = null;

      if (prev > 0) {
        pct = ((curr - prev) / prev) * 100;
        abs = curr - prev;
      }

      changeLookup[months[i]] = { pct, abs };
    }

    // Build final 12-month list
    const monthlyTotalChanges = fixedMonths.map((m) => ({
      month: m,
      pct: changeLookup[m]?.pct ?? null,
      abs: changeLookup[m]?.abs ?? null,
    }));

    renderMonthGrid(monthlyTotalChanges);

    if (change !== null && totalValues.length >= 2) {
      const lastWorth = totalValues[totalValues.length - 1];
      const prevWorth = totalValues[totalValues.length - 2];
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

    // --- Prepare each asset ---
    const assetLines = {};
    const monthlyChanges = {}; // assetId → percent change

    for (const assetId in assetsHistory) {
      const entries = assetsHistory[assetId];

      // Map period → worth
      const worthByPeriod = {};
      entries.forEach((e) => {
        worthByPeriod[e.period] = e.worth;
      });

      const values = months.map((m) => worthByPeriod[m] || 0);

      // Build values aligned with months
      assetLines[assetId] = {
        name: entries[0].name,
        values: values,
      };

      // ---- Calculate monthly change ----
      let pct = null;
      if (values.length >= 2) {
        const prev = values[values.length - 2];
        const curr = values[values.length - 1];

        if (prev > 0) {
          pct = ((curr - prev) / prev) * 100;
        }
      }

      monthlyChanges[assetId] = pct;
    }

    // --- Update asset growth UI ---
    updateAssetGrowthUI(monthlyChanges);
    // --- Update chart ---
    updateWorthChartStacked(months, assetLines);
  } catch (err) {
    console.error("Error loading worth history:", err);
  }
}

function updateWorthChartStacked(months, assetLines = {}) {
  const traces = [];
  const colors = [
    "rgb(75, 192, 192)",
    "rgb(255, 99, 132)",
    "rgb(54, 162, 235)",
    "rgb(255, 206, 86)",
    "rgb(153, 102, 255)",
    "rgb(255, 159, 64)",
    "rgb(100, 255, 218)",
    "rgb(144, 238, 144)",
    "rgb(221, 160, 221)",
    "rgb(135, 206, 250)",
  ];

  let colorIndex = 0;

  for (const assetId in assetLines) {
    const asset = assetLines[assetId];

    traces.push({
      x: months,
      y: asset.values,
      name: asset.name,
      type: "bar",
      marker: { color: colors[colorIndex++ % colors.length] },
    });
  }

  const layout = {
    barmode: "stack",
    xaxis: { automargin: true, type: "category", fixedrange: true },
    yaxis: { automargin: true, fixedrange: true },
    legend: { orientation: "h", yanchor: "top", y: -0.25 },
    margin: { l: 40, r: 10, t: 10, b: 30, pad: 0 },
    font: { color: "#ffffff" },
    paper_bgcolor: "#2c2c2c",
    plot_bgcolor: "#2c2c2c",
  };

  const config = {
    displayModeBar: false,
    responsive: true,
    scrollZoom: false,
    staticPlot: false,
  };

  Plotly.newPlot("worthChart", traces, layout, config);
}

function formatMonthLabel(period) {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
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

        <label>
          Does it have an annual return?
          <input type="number" step="0.01" id="assetAnnualReturn" placeholder="Optional" />
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
    const annualReturnInput = document
      .getElementById("assetAnnualReturn")
      .value.trim();

    const annualReturn =
      annualReturnInput === "" ? null : Number(annualReturnInput);

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
          body: JSON.stringify({ name, balance, annualReturn }),
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

function changeBalance(index, amount, isValueAdjustment = false) {
  assets[index].balance += amount;

  fetch(
    `https://coincise-api.simongerula.workers.dev/assets/${assets[index].id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        balance: assets[index].balance,
        isValueAdjustment: isValueAdjustment,
      }),
    }
  )
    .then((response) => {
      if (!response.ok) throw new Error("Network response was not ok");
      loadAssets();
    })
    .catch((err) => console.error(err));
}

function showLoginCard() {
  delete window.assetsHistory;
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
document.getElementById("addAssetBtn").addEventListener("click", addAsset);
document.getElementById("logoutBtn").addEventListener("click", logout);

document.getElementById("yearChartBtn").onclick = () => {
  document.querySelector("#monthGridModal").classList.remove("hidden");
};

document.querySelector("#closeMonthGrid").onclick = () => {
  document.querySelector("#monthGridModal").classList.add("hidden");
};

document.getElementById("closeTotalGains").addEventListener("click", () => {
  document.getElementById("totalGainsModal").classList.add("hidden");
});

function updateTotalGainsModal(assetName, initialTotalWorth, totalWorth) {
  if (initialTotalWorth == null || totalWorth == null) {
    document.getElementById("totalGainsContent").innerHTML =
      "<div class='gain-line'>No history available</div>";
    return;
  }

  const diff = totalWorth - initialTotalWorth;
  const pct = ((diff / initialTotalWorth) * 100).toFixed(2);

  const html = `
    <div class="gain-line"><strong>Asset:</strong> ${assetName}</div>

    <div class="gain-line">
      <strong>Initial Balance:</strong> $${initialTotalWorth.toFixed(2)}
    </div>

    <div class="gain-line">
      <strong>Current Balance:</strong> $${totalWorth.toFixed(2)}
    </div>

    <div class="gain-line">
      <strong>Change ($):</strong> 
      <span style="color:${diff >= 0 ? "green" : "red"}">
        ${diff >= 0 ? "+" : ""}$${diff.toFixed(2)}
      </span>
    </div>

    <div class="gain-line">
      <strong>Change (%):</strong>
      <span style="color:${diff >= 0 ? "green" : "red"}">
        ${diff >= 0 ? "+" : ""}${pct}%
      </span>
    </div>
  `;

  document.getElementById("totalGainsContent").innerHTML = html;
}

function logout() {
  if (confirm("Are you sure you want to log out?")) {
    delete window.assetsHistory;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    document.getElementById("logoutBtn").style.display = "none";
    document.getElementById("yearChartBtn").style.display = "none";
    loadAssets();
  }
}

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
        Value adjustment?
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

    const isValueAdjustment = document.getElementById(
      "valueAdjustmentCheckbox"
    ).checked;
    changeBalance(index, amount, isValueAdjustment);

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
        Value adjustment?
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

    const isValueAdjustment = document.getElementById(
      "valueAdjustmentCheckbox"
    ).checked;
    changeBalance(index, -amount, isValueAdjustment);

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
        To:
        <select id="transferTargetAsset"></select>
      </label>
      <br>
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

function updateAssetGrowthUI(changes) {
  Object.keys(changes).forEach((assetId) => {
    const pct = changes[assetId];
    const el = document.querySelector(`#asset-growth-${assetId}`);

    if (pct === null) {
      // no data for previous month
      el.textContent = "";
      return;
    }

    const icon = document.createElement("span");
    icon.style.marginRight = "4px";

    if (pct > 0) {
      icon.textContent = "▲";
      icon.style.color = "limegreen";
      el.style.color = "limegreen";
    } else if (pct < 0) {
      icon.textContent = "▼";
      icon.style.color = "red";
      el.style.color = "red";
    } else {
      icon.textContent = "→";
      icon.style.color = "#aaa";
      el.style.color = "#aaa";
    }

    el.appendChild(icon);
    el.appendChild(document.createTextNode(`${pct.toFixed(1)}%`));
  });
}

function renderMonthGrid(changes) {
  const el = document.getElementById("monthGridContainer");
  if (!el) return;

  el.innerHTML = "";

  const monthNames = {
    "01": "Jan",
    "02": "Feb",
    "03": "Mar",
    "04": "Apr",
    "05": "May",
    "06": "Jun",
    "07": "Jul",
    "08": "Aug",
    "09": "Sep",
    10: "Oct",
    11: "Nov",
    12: "Dec",
  };

  changes.forEach((entry) => {
    const raw = entry.month.split("-")[1];
    const short = monthNames[raw] ?? entry.month;

    let showingPercent = true;

    function formatCell() {
      if (entry.pct === null) return "–";

      if (showingPercent) {
        return (entry.pct >= 0 ? "+" : "") + entry.pct.toFixed(1) + "%";
      }

      const amt = entry.abs ?? 0;
      return (amt >= 0 ? "+$" : "-$") + Math.abs(amt).toFixed(0);
    }

    let color = "#ccc";
    if (entry.pct !== null) {
      color = entry.pct >= 0 ? "lightgreen" : "salmon";
    }

    const cell = document.createElement("div");
    cell.className = "month-cell";
    cell.innerHTML = `
      <div class="month-name">${short}</div>
      <div class="month-change" style="color:${color}">
        ${formatCell()}
      </div>
    `;

    // --- TOGGLE on click (%, $) ---
    cell.onclick = () => {
      if (entry.pct === null) return; // nothing to show

      showingPercent = !showingPercent;
      const changeEl = cell.querySelector(".month-change");
      changeEl.innerHTML = formatCell();
    };

    el.appendChild(cell);
  });
}
