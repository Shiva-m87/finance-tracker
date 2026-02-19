import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import {
  signOut,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import "./PersonalFinanceTracker.css";

const CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Entertainment",
  "Health",
  "Shopping",
  "Salary",
  "Freelance",
  "Other",
];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function PersonalFinanceTracker() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [darkMode, setDarkMode] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food",
    date: "",
    type: "expense",
  });
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [settingsMsg, setSettingsMsg] = useState(null);
  const [savingPassword, setSavingPassword] = useState(false);

  const user = auth.currentUser;

  // ── Firestore listener ────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "transactions"),
      where("uid", "==", user.uid),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  // ── Calculations ──────────────────────────────────────────────────────────
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || t.type === filterType;
    const matchCat = filterCategory === "all" || t.category === filterCategory;
    return matchSearch && matchType && matchCat;
  });

  // ── Analytics data ────────────────────────────────────────────────────────
  const categorySpend = CATEGORIES.map((cat) => ({
    cat,
    amount: transactions
      .filter((t) => t.type === "expense" && t.category === cat)
      .reduce((s, t) => s + t.amount, 0),
  }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  const maxSpend = Math.max(...categorySpend.map((c) => c.amount), 1);

  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const income = transactions
      .filter((t) => t.type === "income" && t.date?.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense" && t.date?.startsWith(key))
      .reduce((s, t) => s + t.amount, 0);
    return { label: MONTHS[d.getMonth()], income, expense };
  });
  const maxMonthly = Math.max(
    ...monthlyData.flatMap((m) => [m.income, m.expense]),
    1,
  );
  const topCategory = categorySpend[0] || null;
  const savingsRate =
    totalIncome > 0
      ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;
  const avgExpense =
    transactions.filter((t) => t.type === "expense").length > 0
      ? Math.round(
          totalExpense /
            transactions.filter((t) => t.type === "expense").length,
        )
      : 0;

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingTx(null);
    setForm({
      title: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().split("T")[0],
      type: "expense",
    });
    setErrors({});
    setShowModal(true);
  };
  const openEdit = (tx) => {
    setEditingTx(tx);
    setForm({
      title: tx.title,
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      type: tx.type,
    });
    setErrors({});
    setShowModal(true);
  };
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
      e.amount = "Enter a valid amount";
    if (!form.date) e.date = "Date is required";
    return e;
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      if (editingTx) {
        await updateDoc(doc(db, "transactions", editingTx.id), {
          title: form.title,
          amount: Number(form.amount),
          category: form.category,
          date: form.date,
          type: form.type,
        });
        showToast("Transaction updated!");
      } else {
        await addDoc(collection(db, "transactions"), {
          uid: user.uid,
          title: form.title,
          amount: Number(form.amount),
          category: form.category,
          date: form.date,
          type: form.type,
          createdAt: serverTimestamp(),
        });
        showToast("Transaction added!");
      }
      setShowModal(false);
    } catch (err) {
      showToast("Error: " + err.message, "danger");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));
      showToast("Transaction deleted!", "danger");
    } catch (err) {
      showToast("Error: " + err.message, "danger");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleChangePassword = async () => {
    setSettingsMsg(null);
    if (!currentPassword) {
      setSettingsMsg({ text: "Enter your current password.", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setSettingsMsg({
        text: "New password must be at least 6 characters.",
        type: "error",
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setSettingsMsg({ text: "Passwords do not match.", type: "error" });
      return;
    }
    setSavingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setSettingsMsg({
        text: "Password changed successfully!",
        type: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      const msgs = {
        "auth/wrong-password": "Current password is incorrect.",
        "auth/invalid-credential": "Current password is incorrect.",
      };
      setSettingsMsg({ text: msgs[err.code] || err.message, type: "error" });
    }
    setSavingPassword(false);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE: DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  const renderDashboard = () => (
    <>
      <section className="summary-grid">
        <div className="summary-card balance">
          <div className="card-label">Net Balance</div>
          <div className="card-amount">${balance.toLocaleString()}</div>
          <div className="card-sub">
            {balance >= 0 ? "▲ You're in the green" : "▼ Watch your spending"}
          </div>
          <div className="card-orb" />
        </div>
        <div className="summary-card income">
          <div className="card-label">Total Income</div>
          <div className="card-amount">+${totalIncome.toLocaleString()}</div>
          <div className="card-sub">
            {transactions.filter((t) => t.type === "income").length}{" "}
            transactions
          </div>
          <div className="card-orb" />
        </div>
        <div className="summary-card expense">
          <div className="card-label">Total Expenses</div>
          <div className="card-amount">-${totalExpense.toLocaleString()}</div>
          <div className="card-sub">
            {transactions.filter((t) => t.type === "expense").length}{" "}
            transactions
          </div>
          <div className="card-orb" />
        </div>
      </section>

      <div className="content-grid">
        <section className="transactions-panel">
          <div className="filters-row">
            <div className="search-wrap">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                placeholder="Search transactions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="tx-list">
            {loading && (
              <div className="tx-empty">
                <span className="loading-spinner" /> Loading transactions…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="tx-empty">
                No transactions found. Add one using the + button!
              </div>
            )}
            {!loading &&
              filtered.map((tx) => (
                <div key={tx.id} className={`tx-card ${tx.type}`}>
                  <div className="tx-icon">
                    {tx.type === "income" ? "↑" : "↓"}
                  </div>
                  <div className="tx-info">
                    <div className="tx-title">{tx.title}</div>
                    <div className="tx-meta">
                      <span className="tx-category">{tx.category}</span>
                      <span className="tx-date">
                        {tx.date
                          ? new Date(tx.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="tx-right">
                    <div className={`tx-amount ${tx.type}`}>
                      {tx.type === "income" ? "+" : "-"}$
                      {tx.amount?.toLocaleString()}
                    </div>
                    <div className="tx-actions">
                      <button className="btn-edit" onClick={() => openEdit(tx)}>
                        Edit
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(tx.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="analytics-panel">
          <div className="panel-header">Spending by Category</div>
          {categorySpend.length === 0 ? (
            <div
              className="tx-empty"
              style={{ padding: "1rem 0", fontSize: "0.82rem" }}
            >
              No expense data yet.
            </div>
          ) : (
            <div className="bar-chart">
              {categorySpend.map((c) => (
                <div key={c.cat} className="bar-row">
                  <div className="bar-label">{c.cat}</div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{ width: `${(c.amount / maxSpend) * 100}%` }}
                    />
                  </div>
                  <div className="bar-value">${c.amount}</div>
                </div>
              ))}
            </div>
          )}
          <div className="panel-header" style={{ marginTop: "2rem" }}>
            Income vs Expenses
          </div>
          <div className="donut-wrap">
            <svg viewBox="0 0 120 120" className="donut-svg">
              <circle
                cx="60"
                cy="60"
                r="45"
                fill="none"
                stroke="var(--track)"
                strokeWidth="14"
              />
              {totalIncome + totalExpense > 0 && (
                <>
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="var(--income-color)"
                    strokeWidth="14"
                    strokeDasharray={`${(totalIncome / (totalIncome + totalExpense)) * 283} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="45"
                    fill="none"
                    stroke="var(--expense-color)"
                    strokeWidth="14"
                    strokeDasharray={`${(totalExpense / (totalIncome + totalExpense)) * 283} 283`}
                    strokeLinecap="round"
                    transform={`rotate(${-90 + (totalIncome / (totalIncome + totalExpense)) * 360} 60 60)`}
                  />
                </>
              )}
              <text
                x="60"
                y="55"
                textAnchor="middle"
                className="donut-label-main"
              >
                {Math.round(
                  (totalIncome / (totalIncome + totalExpense || 1)) * 100,
                )}
                %
              </text>
              <text
                x="60"
                y="70"
                textAnchor="middle"
                className="donut-label-sub"
              >
                Income
              </text>
            </svg>
            <div className="donut-legend">
              <div className="legend-item">
                <span className="dot income" />
                Income ${totalIncome.toLocaleString()}
              </div>
              <div className="legend-item">
                <span className="dot expense" />
                Expense ${totalExpense.toLocaleString()}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE: ANALYTICS
  // ─────────────────────────────────────────────────────────────────────────
  const renderAnalytics = () => (
    <div className="page-section">
      <div className="page-title">Analytics</div>
      <div className="page-subtitle">
        A detailed breakdown of your financial activity
      </div>

      <div className="analytics-stats-grid">
        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div
            className="stat-value"
            style={{
              color:
                savingsRate >= 0
                  ? "var(--income-color)"
                  : "var(--expense-color)",
            }}
          >
            {savingsRate}%
          </div>
          <div className="stat-sub">of income saved</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Top Spending</div>
          <div className="stat-value" style={{ color: "var(--accent)" }}>
            {topCategory ? topCategory.cat : "—"}
          </div>
          <div className="stat-sub">
            {topCategory
              ? `$${topCategory.amount.toLocaleString()} spent`
              : "No expenses yet"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Expense</div>
          <div className="stat-value" style={{ color: "var(--expense-color)" }}>
            ${avgExpense.toLocaleString()}
          </div>
          <div className="stat-sub">per transaction</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value" style={{ color: "var(--balance-color)" }}>
            {transactions.length}
          </div>
          <div className="stat-sub">all time</div>
        </div>
      </div>

      <div className="analytics-big-card">
        <div className="panel-header">Monthly Overview — Last 6 Months</div>
        <div className="monthly-chart">
          {monthlyData.map((m, i) => (
            <div key={i} className="month-col">
              <div className="month-bars">
                <div className="month-bar-wrap">
                  <div
                    className="month-bar income-bar"
                    style={{ height: `${(m.income / maxMonthly) * 140}px` }}
                    title={`Income: $${m.income}`}
                  />
                </div>
                <div className="month-bar-wrap">
                  <div
                    className="month-bar expense-bar"
                    style={{ height: `${(m.expense / maxMonthly) * 140}px` }}
                    title={`Expense: $${m.expense}`}
                  />
                </div>
              </div>
              <div className="month-label">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="monthly-legend">
          <div className="legend-item">
            <span className="dot income" />
            Income
          </div>
          <div className="legend-item">
            <span className="dot expense" />
            Expense
          </div>
        </div>
      </div>

      <div className="analytics-big-card">
        <div className="panel-header">Full Category Breakdown</div>
        {categorySpend.length === 0 ? (
          <div className="tx-empty">No expense data yet.</div>
        ) : (
          categorySpend.map((c) => (
            <div key={c.cat} className="cat-breakdown-row">
              <div className="cat-name">{c.cat}</div>
              <div className="cat-track">
                <div
                  className="cat-fill"
                  style={{ width: `${(c.amount / maxSpend) * 100}%` }}
                />
              </div>
              <div className="cat-amount">${c.amount.toLocaleString()}</div>
              <div className="cat-pct">
                {totalExpense > 0
                  ? Math.round((c.amount / totalExpense) * 100)
                  : 0}
                %
              </div>
            </div>
          ))
        )}
      </div>

      <div className="analytics-big-card">
        <div className="panel-header">Recent Transactions</div>
        <div className="tx-list">
          {transactions.slice(0, 5).map((tx) => (
            <div key={tx.id} className={`tx-card ${tx.type}`}>
              <div className="tx-icon">{tx.type === "income" ? "↑" : "↓"}</div>
              <div className="tx-info">
                <div className="tx-title">{tx.title}</div>
                <div className="tx-meta">
                  <span className="tx-category">{tx.category}</span>
                  <span className="tx-date">
                    {tx.date
                      ? new Date(tx.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </div>
              </div>
              <div className="tx-right">
                <div className={`tx-amount ${tx.type}`}>
                  {tx.type === "income" ? "+" : "-"}$
                  {tx.amount?.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="tx-empty">No transactions yet.</div>
          )}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // PAGE: SETTINGS
  // ─────────────────────────────────────────────────────────────────────────
  const renderSettings = () => (
    <div className="page-section">
      <div className="page-title">Settings</div>
      <div className="page-subtitle">Manage your account and preferences</div>

      <div className="settings-card">
        <div className="settings-card-title">👤 Profile Information</div>
        <div className="settings-row">
          <div className="settings-label">Email Address</div>
          <div className="settings-value">{user?.email}</div>
        </div>
        <div className="settings-row">
          <div className="settings-label">Account Created</div>
          <div className="settings-value">
            {user?.metadata?.creationTime
              ? new Date(user.metadata.creationTime).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" },
                )
              : "—"}
          </div>
        </div>
        <div className="settings-row">
          <div className="settings-label">Last Sign In</div>
          <div className="settings-value">
            {user?.metadata?.lastSignInTime
              ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                  "en-US",
                  { month: "long", day: "numeric", year: "numeric" },
                )
              : "—"}
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-title">🎨 Appearance</div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Theme Mode</div>
            <div className="settings-hint">
              Switch between dark and light mode
            </div>
          </div>
          <div className="toggle-switch-wrap">
            <span className="toggle-label">{darkMode ? "Dark" : "Light"}</span>
            <button
              className={`toggle-switch ${darkMode ? "on" : ""}`}
              onClick={() => setDarkMode(!darkMode)}
            >
              <div className="toggle-knob" />
            </button>
          </div>
        </div>
      </div>

      <div className="settings-card">
        <div className="settings-card-title">🔒 Change Password</div>
        {settingsMsg && (
          <div className={`settings-msg ${settingsMsg.type}`}>
            {settingsMsg.text}
          </div>
        )}
        <div className="form-group">
          <label>Current Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Min. 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input
            type="password"
            className="form-input"
            placeholder="Re-enter new password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
          />
        </div>
        <button
          className="btn-save-password"
          onClick={handleChangePassword}
          disabled={savingPassword}
        >
          {savingPassword ? (
            <span
              className="loading-spinner"
              style={{ width: 16, height: 16 }}
            />
          ) : (
            "Update Password"
          )}
        </button>
      </div>

      <div className="settings-card danger-card">
        <div className="settings-card-title">⚠️ Account Actions</div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Sign Out</div>
            <div className="settings-hint">
              Log out of your Finova account on this device
            </div>
          </div>
          <button className="btn-logout-settings" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`app ${darkMode ? "dark" : "light"}`}>
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-logo">◈</span>
          <span className="nav-title">Finova</span>
        </div>
        <div className="nav-links">
          {["Dashboard", "Analytics", "Settings"].map((link) => (
            <button
              key={link}
              className={`nav-link ${activeNav === link ? "active" : ""}`}
              onClick={() => setActiveNav(link)}
            >
              {link}
            </button>
          ))}
        </div>
        <div className="nav-actions">
          <span className="nav-email">{user?.email}</span>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀" : "◑"}
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            ⏻ Logout
          </button>
        </div>
      </nav>

      <main className="main">
        {activeNav === "Dashboard" && renderDashboard()}
        {activeNav === "Analytics" && renderAnalytics()}
        {activeNav === "Settings" && renderSettings()}
      </main>

      {activeNav === "Dashboard" && (
        <button className="fab" onClick={openAdd}>
          +
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav">
        {[
          { key: "Dashboard", icon: "⊞", label: "Dashboard" },
          { key: "Analytics", icon: "◎", label: "Analytics" },
          { key: "Settings", icon: "⚙", label: "Settings" },
        ].map((item) => (
          <button
            key={item.key}
            className={`mobile-nav-btn ${activeNav === item.key ? "active" : ""}`}
            onClick={() => setActiveNav(item.key)}
          >
            <span className="mob-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTx ? "Edit Transaction" : "Add Transaction"}</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="type-toggle">
              <button
                className={`type-btn ${form.type === "expense" ? "active-expense" : ""}`}
                onClick={() => setForm((f) => ({ ...f, type: "expense" }))}
              >
                Expense
              </button>
              <button
                className={`type-btn ${form.type === "income" ? "active-income" : ""}`}
                onClick={() => setForm((f) => ({ ...f, type: "income" }))}
              >
                Income
              </button>
            </div>
            <div className="form-group">
              <label>Title</label>
              <input
                className={`form-input ${errors.title ? "error" : ""}`}
                placeholder="e.g. Grocery Run"
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
              />
              {errors.title && <span className="err-msg">{errors.title}</span>}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  className={`form-input ${errors.amount ? "error" : ""}`}
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, amount: e.target.value }))
                  }
                />
                {errors.amount && (
                  <span className="err-msg">{errors.amount}</span>
                )}
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  className={`form-input ${errors.date ? "error" : ""}`}
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
                {errors.date && <span className="err-msg">{errors.date}</span>}
              </div>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-submit"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <span className="auth-spinner" />
                ) : editingTx ? (
                  "Save Changes"
                ) : (
                  "Add Transaction"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
