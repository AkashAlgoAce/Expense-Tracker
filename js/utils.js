// utils.js

/**
 * Hash a string using SHA-256 and return a hex string.
 */
async function hashStringSHA256(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Show an alert div with message and style type: "error" | "success"
 */
function showAlert(el, message, type) {
  if (!el) return;
  el.textContent = message;
  el.classList.remove("alert--hidden", "alert--error", "alert--success");
  if (type === "error") {
    el.classList.add("alert--error");
  } else if (type === "success") {
    el.classList.add("alert--success");
  }
}

/**
 * Hide alert element
 */
function hideAlert(el) {
  if (!el) return;
  el.classList.add("alert--hidden");
}

/**
 * Format a number as INR currency string.
 */
function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  });
}

/**
 * Parse date string (yyyy-mm-dd) to Date safely.
 */
function parseDate(value) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * Get yyyy-mm-dd from Date.
 */
function toDateInputValue(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
