function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function loadAccounts() {
  const token = localStorage.getItem("auth_token");
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    accounts = await response.json();

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

      // Create kebab button and dropdown
      const kebabBtn = document.createElement("button");
      kebabBtn.className = "kebab-menu";
      kebabBtn.innerHTML = "⋮";
      kebabBtn.onclick = (e) => {
        e.stopPropagation();
        const dropdown = kebabBtn.nextElementSibling;
        dropdown.classList.toggle("show");

        // Close other open dropdowns
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
              { method: "DELETE" }
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
  } catch (error) {
    console.error("Error loading accounts:", error);
    document.getElementById("accounts").innerHTML = `
      <div class="error">Failed to load accounts. Please try again later.</div>
    `;
  } finally {
    loader.style.display = "none";
  }
}

// Add this helper function
function createLoader() {
  const container = document.createElement("div");
  container.className = "loader-container";

  const spinner = document.createElement("div");
  spinner.className = "loader";

  container.appendChild(spinner);
  document.body.appendChild(container);

  return container;
}

async function addAccount() {
  const name = prompt("Enter account name:");
  if (!name) return;

  const balanceStr = prompt("Initial balance:");
  const balance = parseFloat(balanceStr);
  if (isNaN(balance)) return alert("Invalid balance");

  const newAccount = {
    id: Date.now(),
    name,
    balance: balance,
  };

  try {
    const response = await fetch(
      "https://coincise-api.simongerula.workers.dev/assets/",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newAccount.name,
          balance: newAccount.balance,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    await loadAccounts(); // Replace updateDisplay with loadAccounts
  } catch (error) {
    console.error("Error adding account:", error);
    alert("Failed to add account. Please try again.");
  }
}

function updateRemoveButton() {
  const removeBtn = document.getElementById("removeBtn");
  const checkboxes = document.querySelectorAll(".account-checkbox");
  const checkedBoxes = Array.from(checkboxes).filter((box) => box.checked);

  removeBtn.disabled = checkedBoxes.length !== 1;
}

async function removeAccount() {
  const checkboxes = document.querySelectorAll(".account-checkbox");
  const selectedIndex = Array.from(checkboxes).findIndex((box) => box.checked);

  if (selectedIndex === -1) return;

  try {
    const accountToRemove = accounts[selectedIndex];
    const response = await fetch(
      `https://coincise-api.simongerula.workers.dev/assets/${accountToRemove.id}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    await loadAccounts();
  } catch (error) {
    console.error("Error removing account:", error);
    alert("Failed to remove account. Please try again.");
  }
}

function changeBalance(index, amount) {
  accounts[index].balance += amount;
  fetch(
    `https://coincise-api.simongerula.workers.dev/assets/${accounts[index].id}`,
    {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        balance: accounts[index].balance,
      }),
    }
  ).then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    loadAccounts();
  });
}

function showLoginCard() {
  const container = document.getElementById("accounts");
  container.innerHTML = `
    <div class="auth-card">
      <h2>Authentication Required</h2>
      <p>Please <a href="#" class="login-link">log in</a> to view your accounts</p>
    </div>
  `;

  // Add click handler for login link
  container
    .querySelector(".login-link")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      const userCode = prompt("Please enter user code:");

      if (!userCode) return;

      try {
        const response = await fetch(
          "https://coincise-api.simongerula.workers.dev/auth",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ userCode }),
          }
        );

        if (response.status === 201) {
          const data = await response.json();
          localStorage.setItem("auth_token", data.token);
          loadAccounts();
        } else {
          alert("Invalid user code. Please try again.");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        alert("Login failed. Please try again later.");
      }
    });
}

document.addEventListener("DOMContentLoaded", loadAccounts);

document.addEventListener("click", (e) => {
  if (!e.target.matches(".kebab-menu")) {
    document.querySelectorAll(".dropdown-content.show").forEach((dropdown) => {
      dropdown.classList.remove("show");
    });
  }
});
