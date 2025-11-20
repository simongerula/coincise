export interface Asset {
  id: number;
  name: string;
  balance: number;
}

export interface AssetCardCallbacks {
  onAddFunds: (asset: Asset) => void;
  onSubtractFunds: (asset: Asset) => void;
  onTransfer: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

/**
 * Creates a DOM element representing an asset card
 */
export function createAssetCard(
  asset: Asset,
  total: number,
  callbacks: AssetCardCallbacks
): HTMLDivElement {
  const { onAddFunds, onSubtractFunds, onTransfer, onDelete } = callbacks;

  const div = document.createElement("div");
  div.className = "asset";
  div.dataset.assetId = String(asset.id);

  div.innerHTML = `
    <span class="asset-name">
      <strong>${asset.name}</strong><br>
      <span class="balance">$${asset.balance}</span>
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

  const addBtn = div.querySelector<HTMLDivElement>(".add-funds");
  const subtractBtn = div.querySelector<HTMLDivElement>(".subtract-funds");
  const transferBtn = div.querySelector<HTMLDivElement>(".transfer");
  const deleteBtn = div.querySelector<HTMLDivElement>(".delete");

  addBtn?.addEventListener("click", () => onAddFunds(asset));
  subtractBtn?.addEventListener("click", () => onSubtractFunds(asset));
  transferBtn?.addEventListener("click", () => onTransfer(asset));
  deleteBtn?.addEventListener("click", () => onDelete(asset));

  return div;
}
