// auth.js

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const page = path.split("/").pop().toLowerCase();

  if (page === "login.html") {
    initLoginPage();
  } else if (page === "register.html") {
    initRegisterPage();
  } else if (page === "dashboard.html") {
    // Handled in expenses.js but enforce auth here too
    requireAuth();
  }
});

function initLoginPage() {
  const form = document.getElementById("loginForm");
  const alertEl = document.getElementById("loginAlert");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertEl);

    const email = form.email.value.trim();
    const password = form.password.value;

    if (!email || !password) {
      showAlert(alertEl, "Please enter both email and password.", "error");
      return;
    }

    try {
      const result = await authenticateUser({ email, password });
      if (!result.success) {
        showAlert(alertEl, result.error || "Login failed.", "error");
        return;
      }

      setCurrentSession(result.user);
      showAlert(alertEl, "Login successful. Redirecting...", "success");
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 700);
    } catch {
      showAlert(alertEl, "Unexpected error during login.", "error");
    }
  });
}

function initRegisterPage() {
  const form = document.getElementById("registerForm");
  const alertEl = document.getElementById("registerAlert");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert(alertEl);

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    if (!name || !email || !password || !confirmPassword) {
      showAlert(alertEl, "All fields are required.", "error");
      return;
    }

    if (password.length < 6) {
      showAlert(
        alertEl,
        "Password must be at least 6 characters long.",
        "error"
      );
      return;
    }

    if (password !== confirmPassword) {
      showAlert(alertEl, "Passwords do not match.", "error");
      return;
    }

    try {
      const result = await registerUser({ name, email, password });
      if (!result.success) {
        showAlert(alertEl, result.error || "Registration failed.", "error");
        return;
      }

      showAlert(
        alertEl,
        "Registration successful. Redirecting to login...",
        "success"
      );
      setTimeout(() => {
        window.location.href = "login.html";
      }, 900);
    } catch {
      showAlert(alertEl, "Unexpected error during registration.", "error");
    }
  });
}

/**
 * Logout handler used from dashboard page.
 */
function handleLogout() {
  clearCurrentSession();
  window.location.href = "login.html";
}
