export function renderAssets(assets, total) {
  const container = document.getElementById("assets");
  container.innerHTML = "";

  console.log("Total worth:", total);
  assets.forEach((asset, index) => {
    const el = createAssetElement(asset, index, total);
    container.appendChild(el);
  });
}

const createAssetElement = (asset, index, total) => {
  console.log("Rendering asset:", asset);
  const assetName = document.createElement("div");
  assetName.textContent = asset.name || "Unnamed Asset";
  assetName.className = "asset-name";

  // const assetDiv = document.createElement("div");
  // assetDiv.className = "asset";

  // const rankDiv = document.createElement("div");
  // rankDiv.className = "asset-rank";
  // rankDiv.textContent = index + 1;

  // const infoDiv = document.createElement("div");
  // infoDiv.className = "asset-info";

  // const nameDiv = document.createElement("div");
  // nameDiv.className = "asset-name";
  // nameDiv.textContent = asset.name;

  // const balanceDiv = document.createElement("div");
  // balanceDiv.className = "asset-balance";
  // balanceDiv.textContent = `${asset.balance} ${asset.symbol}`;

  // const worthDiv = document.createElement("div");
  // worthDiv.className = "asset-worth";
  // worthDiv.textContent = `$${asset.worth.toFixed(2)}`;

  // const percentageDiv = document.createElement("div");
  // percentageDiv.className = "asset-percentage";
  // const percentage = total ? ((asset.worth / total) * 100).toFixed(2) : "0.00";
  // percentageDiv.textContent = `${percentage}%`;

  // infoDiv.appendChild(nameDiv);
  // infoDiv.appendChild(balanceDiv);

  // assetDiv.appendChild(rankDiv);
  // assetDiv.appendChild(infoDiv);
  // assetDiv.appendChild(worthDiv);
  // assetDiv.appendChild(percentageDiv);

  return assetName;
};
