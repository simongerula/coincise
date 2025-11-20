/**
 * Returns an array of the last 6 months as short month names
 */
export function getLastSixMonths() {
  const months = [];
  const today = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(date.toLocaleString("default", { month: "short" }));
  }
  return months;
}

/**
 * Formats a period string "YYYY-MM" into "Mon YYYY"
 */
export function formatMonthLabel(period) {
  const [year, month] = period.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleString("default", { month: "short", year: "numeric" });
}

/**
 * Sort assets descending by balance
 */
export function sortAssetsByBalance(assets) {
  return assets.slice().sort((a, b) => b.balance - a.balance);
}

/**
 * Calculates the percentage of a value relative to a total
 */
export function calculatePercent(value, total) {
  if (!total || total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Toggles the display of an element
 */
export function toggleDisplay(element, show = null) {
  if (show === null) {
    element.style.display = element.style.display === "none" ? "block" : "none";
  } else {
    element.style.display = show ? "block" : "none";
  }
}

/**
 * Formats a Date object to a readable string
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString();
}
