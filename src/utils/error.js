export const showFailedToLoadAssets = () => {
  document.getElementById(
    "assets"
  ).innerHTML = `<div class="error">Failed to load assets. Please try again later.</div>`;
};
