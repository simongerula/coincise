export function createAssetCard(asset, total, callbacks) {
  const { onAddFunds, onSubtractFunds, onTransfer, onDelete } = callbacks;

  const div = document.createElement("div");
  div.className = "asset";
  div.dataset.assetId = asset.id;

  div.innerHTML = `
    <span class="asset-name">
      <strong>${asset.name}</strong><br>
      <span class="balance">$${asset.balance.toFixed(2)}</span>
    </span>
    <div class="asset-buttons">
      <div class="asset-percent">
        <img src="/src/pie-chart-icon.svg" class="icon-pie" />
        ${total ? Math.round((asset.balance / total) * 100) : 0}%
      </div>
      <button class="kebab-menu">⋮</button>
      <div class="dropdown-content">
        <div class="dropdown-item add-funds">Add funds</div>
        <div class="dropdown-item subtract-funds">Subtract funds</div>
        <div class="dropdown-item transfer">Move funds</div>
        <div class="dropdown-item delete">Delete asset</div>
      </div>
    </div>
  `;

  div.querySelector(".add-funds").onclick = () => onAddFunds(asset);
  div.querySelector(".subtract-funds").onclick = () => onSubtractFunds(asset);
  div.querySelector(".transfer").onclick = () => onTransfer(asset);
  div.querySelector(".delete").onclick = () => onDelete(asset);

  return div;
}
