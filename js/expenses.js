// expenses.js

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const page = path.split("/").pop().toLowerCase();
  if (page === "dashboard.html") {
    initDashboardPage();
  }
});

function initDashboardPage() {
  const user = requireAuth();
  if (!user) return;

  const greeting = document.getElementById("userGreeting");
  if (greeting) {
    greeting.textContent = `Signed in as ${user.name} (${user.email})`;
  }

  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  const form = document.getElementById("expenseForm");
  const formAlert = document.getElementById("expenseFormAlert");
  const resetBtn = document.getElementById("expenseFormResetBtn");

  const table = document.getElementById("expensesTable");
  const tableBody = document.getElementById("expensesTableBody");
  const emptyState = document.getElementById("expensesEmptyState");

  const filterText = document.getElementById("filterText");
  const filterCategory = document.getElementById("filterCategory");
  const filterSort = document.getElementById("filterSort");

  const summaryTotal = document.getElementById("summaryTotal");
  const summaryThisMonth = document.getElementById("summaryThisMonth");
  const summaryCount = document.getElementById("summaryCount");
  const expenseIdInput = document.getElementById("expenseId");
  const expenseTitleInput = document.getElementById("expenseTitle");
  const expenseAmountInput = document.getElementById("expenseAmount");
  const expenseCategoryInput = document.getElementById("expenseCategory");
  const expenseDateInput = document.getElementById("expenseDate");
  const expenseDescriptionInput = document.getElementById(
    "expenseDescription"
  );
  const submitLabel = document.getElementById("expenseFormSubmitLabel");

  // Default date to today
  if (expenseDateInput) {
    expenseDateInput.value = toDateInputValue(new Date());
  }

  let expenses = getExpensesForUser(user.id);

  function refreshSummaries(currentExpenses) {
    const total = currentExpenses.reduce(
      (sum, e) => sum + Number(e.amount || 0),
      0
    );

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthTotal = currentExpenses.reduce((sum, e) => {
      const d = parseDate(e.date);
      if (!d) return sum;
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return sum + Number(e.amount || 0);
      }
      return sum;
    }, 0);

    if (summaryTotal) summaryTotal.textContent = formatCurrency(total);
    if (summaryThisMonth)
      summaryThisMonth.textContent = formatCurrency(thisMonthTotal);
    if (summaryCount) summaryCount.textContent = String(currentExpenses.length);
  }

  function applyFilters(rawExpenses) {
    let filtered = [...rawExpenses];

    const text = (filterText?.value || "").trim().toLowerCase();
    if (text) {
      filtered = filtered.filter((e) => {
        const t = e.title.toLowerCase();
        const d = (e.description || "").toLowerCase();
        return t.includes(text) || d.includes(text);
      });
    }

    const cat = filterCategory?.value || "";
    if (cat) {
      filtered = filtered.filter((e) => e.category === cat);
    }

    const sort = filterSort?.value || "date_desc";
    filtered.sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return (parseDate(a.date) || 0) - (parseDate(b.date) || 0);
        case "date_desc":
          return (parseDate(b.date) || 0) - (parseDate(a.date) || 0);
        case "amount_asc":
          return a.amount - b.amount;
        case "amount_desc":
          return b.amount - a.amount;
        default:
          return 0;
      }
    });

    return filtered;
  }

  function renderExpenses() {
    const visibleExpenses = applyFilters(expenses);
    refreshSummaries(expenses);

    if (!tableBody || !table || !emptyState) return;

    tableBody.innerHTML = "";

    if (visibleExpenses.length === 0) {
      table.classList.add("table--hidden");
      emptyState.style.display = "block";
      return;
    }

    table.classList.remove("table--hidden");
    emptyState.style.display = "none";

    visibleExpenses.forEach((exp) => {
      const tr = document.createElement("tr");

      const tdTitle = document.createElement("td");
      tdTitle.textContent = exp.title;

      const tdCategory = document.createElement("td");
      tdCategory.textContent = exp.category;

      const tdDate = document.createElement("td");
      tdDate.textContent = exp.date;

      const tdAmount = document.createElement("td");
      tdAmount.classList.add("table__cell--right");
      tdAmount.textContent = formatCurrency(exp.amount);

      const tdActions = document.createElement("td");
      tdActions.classList.add("table__cell--actions");

      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "btn btn--outline";
      editBtn.textContent = "Edit";
      editBtn.addEventListener("click", () => {
        startEditExpense(exp);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn btn--outline text-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        deleteExpenseHandler(exp);
      });

      tdActions.appendChild(editBtn);
      tdActions.appendChild(deleteBtn);

      tr.appendChild(tdTitle);
      tr.appendChild(tdCategory);
      tr.appendChild(tdDate);
      tr.appendChild(tdAmount);
      tr.appendChild(tdActions);

      tableBody.appendChild(tr);
    });
  }

  function resetForm() {
    if (!form) return;
    form.reset();
    if (expenseIdInput) expenseIdInput.value = "";
    if (expenseDateInput) {
      expenseDateInput.value = toDateInputValue(new Date());
    }
    if (submitLabel) submitLabel.textContent = "Add Expense";
    hideAlert(formAlert);
  }

  function startEditExpense(expense) {
    if (!form) return;
    expenseIdInput.value = expense.id;
    expenseTitleInput.value = expense.title;
    expenseAmountInput.value = expense.amount;
    expenseCategoryInput.value = expense.category;
    expenseDateInput.value = expense.date;
    expenseDescriptionInput.value = expense.description || "";
    if (submitLabel) submitLabel.textContent = "Update Expense";
    expenseTitleInput.focus();
  }

  function deleteExpenseHandler(expense) {
    const confirmed = window.confirm(
      `Delete expense "${expense.title}" of ${formatCurrency(
        expense.amount
      )}?`
    );
    if (!confirmed) return;
    const result = deleteExpense(user.id, expense.id);
    if (!result.success) {
      window.alert(result.error || "Failed to delete expense.");
      return;
    }
    expenses = getExpensesForUser(user.id);
    renderExpenses();
  }

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      hideAlert(formAlert);

      const id = expenseIdInput.value || null;
      const title = expenseTitleInput.value.trim();
      const amount = expenseAmountInput.value;
      const category = expenseCategoryInput.value;
      const date = expenseDateInput.value;
      const description = expenseDescriptionInput.value;

      if (!title || !amount || !category || !date) {
        showAlert(formAlert, "Please fill in all required fields.", "error");
        return;
      }

      const amountNumber = Number(amount);
      if (Number.isNaN(amountNumber) || amountNumber <= 0) {
        showAlert(
          formAlert,
          "Amount must be a positive number greater than zero.",
          "error"
        );
        return;
      }

      if (!parseDate(date)) {
        showAlert(formAlert, "Please provide a valid date.", "error");
        return;
      }

      if (!id) {
        // create
        addExpense(user.id, {
          title,
          amount: amountNumber,
          category,
          date,
          description,
        });
        showAlert(formAlert, "Expense added successfully.", "success");
      } else {
        // update
        const result = updateExpense(user.id, id, {
          title,
          amount: amountNumber,
          category,
          date,
          description,
        });
        if (!result.success) {
          showAlert(
            formAlert,
            result.error || "Failed to update expense.",
            "error"
          );
          return;
        }
        showAlert(formAlert, "Expense updated successfully.", "success");
      }

      expenses = getExpensesForUser(user.id);
      renderExpenses();
      resetForm();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      resetForm();
    });
  }

  if (filterText) {
    filterText.addEventListener("input", () => {
      renderExpenses();
    });
  }

  if (filterCategory) {
    filterCategory.addEventListener("change", () => {
      renderExpenses();
    });
  }

  if (filterSort) {
    filterSort.addEventListener("change", () => {
      renderExpenses();
    });
  }

  // Initial render
  renderExpenses();
}
