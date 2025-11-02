let accounts = [];

function updateDisplay() {
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
    minusBtn.onclick = () => {
      const input = prompt(`Subtract amount from ${acc.name}:`);
      const amount = parseFloat(input);
      if (!isNaN(amount)) changeBalance(index, -amount);
    };

    buttonContainer.appendChild(plusBtn);
    buttonContainer.appendChild(minusBtn);

    div.appendChild(nameSpan);
    div.appendChild(buttonContainer);
    container.appendChild(div);
  });

  document.getElementById("total").textContent = total.toFixed(2);
}

async function addAccount() {
  const name = prompt("Enter account name:");
  if (!name) return;

  const balanceStr = prompt("Initial balance:");
  const balance = parseFloat(balanceStr);
  if (isNaN(totalValue)) return alert("Invalid balance");

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

    accounts.push(newAccount);
    updateDisplay();
  } catch (error) {
    console.error("Error adding account:", error);
    alert("Failed to add account. Please try again.");
  }
}

function removeAccount() {
  if (accounts.length === 0) return alert("No accounts to remove");
  accounts.pop();
  updateDisplay();
}

function changeBalance(index, amount) {
  accounts[index].balance += amount;
  updateDisplay();
}

updateDisplay();
