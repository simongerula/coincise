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

    assets = await response.json();

    const container = document.getElementById("assets");
    container.innerHTML = "";
    let total = 0;

    assets.forEach((asset, index) => {
      total += asset.balance;

      const div = document.createElement("div");
      div.className = "asset";

      const nameSpan = document.createElement("span");
      nameSpan.className = "asset-name";
      nameSpan.innerHTML = `<strong>${
        asset.name
      }</strong><br><span class="balance">$${asset.balance.toFixed(2)}</span>`;

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "asset-buttons";

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
      buttonContainer.appendChild(kebabBtn);
      buttonContainer.appendChild(dropdown);
      div.appendChild(nameSpan);
      div.appendChild(buttonContainer);
      container.appendChild(div);
    });

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

document.addEventListener("DOMContentLoaded", loadAssets);

document.addEventListener("click", (e) => {
  if (!e.target.matches(".kebab-menu")) {
    document.querySelectorAll(".dropdown-content.show").forEach((dropdown) => {
      dropdown.classList.remove("show");
    });
  }
});
