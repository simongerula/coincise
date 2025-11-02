async function loadAccounts() {
  const loader = document.querySelector(".loader-container") || createLoader();
  loader.style.display = "flex";

  try {
    const response = await fetch(
      "https://coincise-api.simongerula.workers.dev/assets/"
    );

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

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "account-checkbox";
      checkbox.onclick = () => updateRemoveButton();

      const plusBtn = document.createElement("button");
      plusBtn.textContent = "+";
      plusBtn.onclick = () => {
        const input = prompt(`Add amount to ${acc.name}:`);
        const amount = parseFloat(input);
        if (!isNaN(amount)) changeBalance(index, amount);
      };

      const minusBtn = document.createElement("button");
      minusBtn.textContent = "−";
      minusBtn.className = "minus";

      buttonContainer.appendChild(checkbox);
      buttonContainer.appendChild(plusBtn);
      buttonContainer.appendChild(minusBtn);

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
        headers: {
          "Content-Type": "application/json",
        },
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
      headers: {
        "Content-Type": "application/json",
      },
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

document.addEventListener("DOMContentLoaded", loadAccounts);
