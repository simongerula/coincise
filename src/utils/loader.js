export function showLoader() {
  const loader = document.querySelector(".loader-container");
  if (loader) loader.style.display = "flex";
}

export function hideLoader() {
  const loader = document.querySelector(".loader-container");
  if (loader) loader.style.display = "none";
}
