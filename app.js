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
    nameSpan.textContent = `${acc.name} $${acc.balance.toFixed(2)}`;

    const buttonContainer = document.createElement("div");
    buttonContainer.className = "account-buttons";

    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.onclick = () => changeBalance(index, 50);

    const minusBtn = document.createElement("button");
    minusBtn.textContent = "−";
    minusBtn.className = "minus";
    minusBtn.onclick = () => changeBalance(index, -50);

    buttonContainer.appendChild(plusBtn);
    buttonContainer.appendChild(minusBtn);

    div.appendChild(nameSpan);
    div.appendChild(buttonContainer);
    container.appendChild(div);
  });

  document.getElementById("total").textContent = total.toFixed(2);
}

function addAccount() {
  const name = prompt("Enter account name:");
  if (!name) return;

  const balanceStr = prompt("Initial balance:");
  const balance = parseFloat(balanceStr);
  if (isNaN(balance)) return alert("Invalid balance");

  const newAccount = {
    id: Date.now(),
    name,
    balance,
  };

  accounts.push(newAccount);
  updateDisplay();
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
