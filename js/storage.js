// storage.js

const STORAGE_KEYS = {
  USERS: "expense_tracker_users",
  SESSION: "expense_tracker_session",
  EXPENSES: "expense_tracker_expenses",
};

/**
 * Get all users from localStorage.
 */
function getAllUsers() {
  const raw = localStorage.getItem(STORAGE_KEYS.USERS);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save users array to localStorage.
 */
function saveAllUsers(users) {
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

/**
 * Find user by email (case-insensitive).
 */
function findUserByEmail(email) {
  const users = getAllUsers();
  const target = email.trim().toLowerCase();
  return users.find((u) => u.email === target) || null;
}

/**
 * Register user in localStorage.
 */
async function registerUser({ name, email, password }) {
  const users = getAllUsers();
  const exists = findUserByEmail(email);
  if (exists) {
    return { success: false, error: "Email is already registered." };
  }
  const passwordHash = await hashStringSHA256(password);
  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveAllUsers(users);
  return { success: true, user };
}

/**
 * Authenticate user with email/password.
 */
async function authenticateUser({ email, password }) {
  const user = findUserByEmail(email);
  if (!user) {
    return { success: false, error: "Invalid email or password." };
  }
  const passwordHash = await hashStringSHA256(password);
  if (passwordHash !== user.passwordHash) {
    return { success: false, error: "Invalid email or password." };
  }
  return { success: true, user };
}

/**
 * Get current session user from localStorage.
 */
function getCurrentSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session || !session.userId) return null;
    return session;
  } catch {
    return null;
  }
}

/**
 * Set current session user.
 */
function setCurrentSession(user) {
  const session = {
    userId: user.id,
    email: user.email,
    name: user.name,
    loggedInAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
}

/**
 * Clear current session.
 */
function clearCurrentSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

/**
 * Get current user object from users storage based on session.
 */
function getCurrentUser() {
  const session = getCurrentSession();
  if (!session) return null;
  const users = getAllUsers();
  return users.find((u) => u.id === session.userId) || null;
}

/**
 * Ensure user is authenticated on protected pages.
 * Redirects to login if not authenticated.
 */
function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html";
  }
  return user;
}

/**
 * Get all expenses from localStorage (array).
 */
function getAllExpenses() {
  const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save all expenses array.
 */
function saveAllExpenses(expenses) {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

/**
 * Get expenses for a specific userId.
 */
function getExpensesForUser(userId) {
  const all = getAllExpenses();
  return all.filter((e) => e.userId === userId);
}

/**
 * Add new expense for user.
 */
function addExpense(userId, expense) {
  const all = getAllExpenses();
  const newExpense = {
    id: crypto.randomUUID(),
    userId,
    title: expense.title.trim(),
    amount: Number(expense.amount),
    category: expense.category,
    date: expense.date,
    description: expense.description ? expense.description.trim() : "",
    createdAt: new Date().toISOString(),
  };
  all.push(newExpense);
  saveAllExpenses(all);
  return newExpense;
}

/**
 * Update existing expense.
 */
function updateExpense(userId, expenseId, updates) {
  const all = getAllExpenses();
  const index = all.findIndex(
    (e) => e.id === expenseId && e.userId === userId
  );
  if (index === -1) return { success: false, error: "Expense not found." };

  const target = all[index];
  const updated = {
    ...target,
    ...updates,
    amount:
      updates.amount !== undefined ? Number(updates.amount) : target.amount,
    title: updates.title !== undefined ? updates.title.trim() : target.title,
    category: updates.category ?? target.category,
    date: updates.date ?? target.date,
    description:
      updates.description !== undefined
        ? updates.description.trim()
        : target.description,
    updatedAt: new Date().toISOString(),
  };

  all[index] = updated;
  saveAllExpenses(all);
  return { success: true, expense: updated };
}

/**
 * Delete expense by id for user.
 */
function deleteExpense(userId, expenseId) {
  const all = getAllExpenses();
  const index = all.findIndex(
    (e) => e.id === expenseId && e.userId === userId
  );
  if (index === -1) return { success: false, error: "Expense not found." };
  all.splice(index, 1);
  saveAllExpenses(all);
  return { success: true };
}
