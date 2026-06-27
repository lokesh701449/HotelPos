import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  BadgeIndianRupee,
  Bell,
  Building2,
  Check,
  ChefHat,
  CircleDollarSign,
  Clock3,
  CreditCard,
  FileText,
  Flame,
  Grid3X3,
  Hotel,
  IndianRupee,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Minus,
  Plus,
  Printer,
  QrCode,
  ReceiptText,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Split,
  Store,
  Utensils,
  Wifi,
  WifiOff,
} from "lucide-react";
import { io } from "socket.io-client";
import "./styles.css";

const API_BASE = "http://localhost:5003/api";
const SOCKET_URL = "http://localhost:5003";
const TAX_RATE = 0.05;

// ─── API helpers ─────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}, token = null) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "API Error");
  return json.data;
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────
function getStoredAuth() {
  try { return JSON.parse(localStorage.getItem("pos-auth") || "null"); }
  catch { return null; }
}
function setStoredAuth(data) {
  if (data) localStorage.setItem("pos-auth", JSON.stringify(data));
  else localStorage.removeItem("pos-auth");
}

// ─── Status helpers ────────────────────────────────────────────────────────────
function statusLabel(s) {
  const m = {
    AVAILABLE: "Free", OCCUPIED: "Occupied", RESERVED: "Reserved", BILLING: "Billing",
    OPEN: "Open", PREPARING: "Preparing", READY: "Ready", SERVED: "Served",
    PAID: "Paid", CANCELLED: "Cancelled",
    PENDING: "Pending", COMPLETED: "Completed", FAILED: "Failed",
    free: "Free", open: "Open", sent: "Kitchen", preparing: "Preparing",
    ready: "Ready", paid: "Paid", completed: "Completed", pending: "Pending",
    approved: "Approved", denied: "Denied",
  };
  return m[s] || s;
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("admin-roof@hotelpos.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setStoredAuth(data);
      onLogin(data);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-brand">
          <Hotel size={36} />
          <h1>HotelPOS</h1>
          <p>Restaurant &amp; Hotel Point of Sale</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p className="login-error"><AlertTriangle size={14} /> {error}</p>}
          <button className="primary-action login-btn" type="submit" disabled={loading}>
            {loading ? <Loader2 size={20} className="spin" /> : <LogIn size={20} />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-hints">
          <p><strong>Quick credentials (all passwords: password123)</strong></p>
          <ul>
            <li>admin-roof@hotelpos.com (Skyline Rooftop)</li>
            <li>admin-cafe@hotelpos.com (Atrium Cafe)</li>
            <li>admin-banquet@hotelpos.com (Mysore Hall)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [auth, setAuth] = useState(getStoredAuth);
  const [activeRole, setActiveRole] = useState(() => window.location.hash.replace("#", "") || "waiter");
  const socketRef = useRef(null);

  // Live data state
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [kitchenTickets, setKitchenTickets] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = auth?.token;
  const tenantId = auth?.user?.tenantId;
  const userRole = auth?.user?.role;

  // Fetch all live data
  const fetchAll = useCallback(async () => {
    if (!token) return;
    try {
      const [t, m, o, k] = await Promise.all([
        apiFetch("/tables", {}, token),
        apiFetch("/menu-items", {}, token),
        apiFetch("/orders", {}, token),
        apiFetch("/kitchen", {}, token),
      ]);
      setTables(t || []);
      setMenuItems(m || []);
      setOrders(o || []);
      setKitchenTickets(k || []);

      // Dashboard only for ADMIN/MANAGER
      if (["ADMIN", "MANAGER"].includes(userRole)) {
        const d = await apiFetch("/dashboard/summary", {}, token);
        setDashboard(d);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [token, userRole]);

  // Socket.IO real-time sync
  useEffect(() => {
    if (!token || !tenantId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-tenant", tenantId);
    });

    socket.on("order-created", () => fetchAll());
    socket.on("order-updated", () => fetchAll());
    socket.on("ticket-updated", () => fetchAll());
    socket.on("ticket-ready", () => fetchAll());
    socket.on("table-updated", () => fetchAll());
    socket.on("payment-completed", () => fetchAll());
    socket.on("dashboard-updated", () => fetchAll());

    return () => socket.disconnect();
  }, [token, tenantId, fetchAll]);

  // Initial data load
  useEffect(() => {
    if (auth) fetchAll();
  }, [auth, fetchAll]);

  useEffect(() => {
    const onHash = () => setActiveRole(window.location.hash.replace("#", "") || "waiter");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const setRole = (role) => {
    window.location.hash = role;
    setActiveRole(role);
  };

  const handleLogin = (data) => {
    setAuth(data);
    setLoading(true);
  };

  const handleLogout = () => {
    setStoredAuth(null);
    setAuth(null);
    setTables([]); setMenuItems([]); setOrders([]); setKitchenTickets([]);
    setDashboard(null);
  };

  if (!auth) return <LoginScreen onLogin={handleLogin} />;

  let allowedRoles = [];
  if (["ADMIN", "MANAGER"].includes(userRole)) allowedRoles = ["waiter", "kds", "cashier", "manager"];
  else if (userRole === "WAITER") allowedRoles = ["waiter"];
  else if (userRole === "CHEF") allowedRoles = ["kds"];
  else if (userRole === "CASHIER") allowedRoles = ["cashier"];

  const routeRole = allowedRoles.includes(activeRole) ? activeRole : allowedRoles[0];

  const activeTickets = kitchenTickets.filter((t) => ["PENDING", "PREPARING", "READY"].includes(t.status));

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark"><Hotel size={22} /></div>
          <div>
            <strong>HotelPOS</strong>
            <span>{auth.user.name}</span>
          </div>
        </div>
        <nav className="role-nav" aria-label="POS surfaces">
          {(["ADMIN", "MANAGER", "WAITER"].includes(userRole)) && (
            <NavButton active={routeRole === "waiter"} onClick={() => setRole("waiter")} icon={<Smartphone />} label="Waiter" />
          )}
          {(["ADMIN", "MANAGER", "CHEF"].includes(userRole)) && (
            <NavButton active={routeRole === "kds"} onClick={() => setRole("kds")} icon={<ChefHat />} label={`KDS ${activeTickets.length > 0 ? `(${activeTickets.length})` : ""}`} />
          )}
          {(["ADMIN", "MANAGER", "CASHIER"].includes(userRole)) && (
            <NavButton active={routeRole === "cashier"} onClick={() => setRole("cashier")} icon={<ReceiptText />} label="Cashier" />
          )}
          {(["ADMIN", "MANAGER"].includes(userRole)) && (
            <NavButton active={routeRole === "manager"} onClick={() => setRole("manager")} icon={<LayoutDashboard />} label="Manager" />
          )}
        </nav>
        <div className="sync-card">
          <span className="dot online" />
          <div>
            <strong>Live Backend</strong>
            <span>{auth.user.role} · Tenant Connected</span>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}><LogOut size={16} /> Logout</button>
      </aside>

      <main className="surface">
        {loading ? (
          <div className="loading-screen">
            <Loader2 size={48} className="spin" />
            <p>Loading live data from backend...</p>
          </div>
        ) : (
          <>
            {routeRole === "waiter" && <WaiterView tables={tables} menuItems={menuItems} orders={orders} token={token} onRefresh={fetchAll} />}
            {routeRole === "kds" && <KdsView kitchenTickets={kitchenTickets} token={token} onRefresh={fetchAll} />}
            {routeRole === "cashier" && <CashierView orders={orders} token={token} onRefresh={fetchAll} />}
            {routeRole === "manager" && <ManagerView dashboard={dashboard} orders={orders} tables={tables} onRefresh={fetchAll} />}
          </>
        )}
      </main>
    </div>
  );
}

// ─── Waiter View ──────────────────────────────────────────────────────────────
function WaiterView({ tables, menuItems, orders, token, onRefresh }) {
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availTables = tables.filter((t) => t.status === "AVAILABLE" || t.status === "OCCUPIED");
  const selectedTable = tables.find((t) => t.id === selectedTableId) || availTables[0];
  const tableOrder = orders.find((o) => o.tableId === selectedTable?.id && ["OPEN", "PREPARING", "READY"].includes(o.status));
  const selectedItem = menuItems.find((m) => m.id === selectedItemId) || menuItems.find((m) => m.available);

  const createOrder = async () => {
    if (!selectedTable || !selectedItem) return;
    setSubmitting(true); setError("");
    try {
      if (tableOrder) {
        // Add item to existing order
        await apiFetch(`/orders/${tableOrder.id}/items`, {
          method: "POST",
          body: JSON.stringify({ menuItemId: selectedItem.id, quantity: qty, notes }),
        }, token);
      } else {
        // Create new order
        await apiFetch("/orders", {
          method: "POST",
          body: JSON.stringify({ tableId: selectedTable.id, items: [{ menuItemId: selectedItem.id, quantity: qty, notes }] }),
        }, token);
      }
      setNotes(""); setQty(1);
      await onRefresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="view waiter-grid">
      <Header icon={<Smartphone />} title="Waiter App" subtitle="Live ordering connected to SQLite backend"
        right={<button className="icon-button" onClick={onRefresh} title="Refresh"><RefreshCw size={18} /></button>} />

      {/* Tables Panel */}
      <div className="panel floor-panel">
        <div className="section-title"><h2>Tables</h2><span>{tables.length} total</span></div>
        <div className="floor-grid">
          {tables.map((t) => {
            const hasOrder = orders.some((o) => o.tableId === t.id && !["PAID", "CANCELLED"].includes(o.status));
            const status = hasOrder ? (t.status === "AVAILABLE" ? "OCCUPIED" : t.status) : t.status;
            return (
              <button key={t.id}
                className={`table-tile ${selectedTable?.id === t.id ? "selected" : ""} ${status.toLowerCase()}`}
                onClick={() => setSelectedTableId(t.id)}>
                <strong>T{t.number}</strong>
                <span>{t.capacity} seats</span>
                <em>{statusLabel(status)}</em>
              </button>
            );
          })}
        </div>
      </div>

      {/* Order Panel */}
      <div className="panel order-panel">
        <div className="section-title">
          <h2>Table {selectedTable?.number} — Order</h2>
          <span>{tableOrder ? `${tableOrder.orderItems?.length} items` : "No active order"}</span>
        </div>
        <div className="order-list">
          {tableOrder?.orderItems?.map((item) => (
            <div className="line-item" key={item.id}>
              <div>
                <strong>{item.menuItem?.name}</strong>
                <span>×{item.quantity}{item.notes ? ` · ${item.notes}` : ""}</span>
              </div>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          )) || <Empty icon={<Grid3X3 />} text="Select a table and add items below." />}
        </div>
        {tableOrder && (
          <div className="order-totals">
            <span>Subtotal: <strong>₹{tableOrder.subtotal?.toFixed(2)}</strong></span>
            <span>Tax: <strong>₹{tableOrder.tax?.toFixed(2)}</strong></span>
            <span className="grand">Total: <strong>₹{tableOrder.total?.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      {/* Menu Panel */}
      <div className="panel menu-panel">
        <div className="section-title"><h2>Menu</h2><span>{menuItems.filter((m) => m.available).length} available</span></div>
        <div className="menu-list">
          {menuItems.map((dish) => (
            <button key={dish.id}
              className={`menu-row ${selectedItemId === dish.id ? "active" : ""} ${!dish.available ? "disabled" : ""}`}
              disabled={!dish.available}
              onClick={() => setSelectedItemId(dish.id)}>
              <div>
                <strong>{dish.name}</strong>
                <span>{dish.category?.name} · {dish.prepTime} min</span>
              </div>
              <em>{dish.available ? `₹${dish.price}` : "Unavail."}</em>
            </button>
          ))}
        </div>

        {selectedItem && selectedTable && (
          <div className="mod-box">
            <strong>Add: {selectedItem.name}</strong>
            <div className="stepper">
              <button className="icon-button" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
              <span>{qty}</span>
              <button className="icon-button" onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
            </div>
            <input className="notes-input" placeholder="Special instructions..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            {error && <p className="error-msg"><AlertTriangle size={14} /> {error}</p>}
            <button className="secondary-action" onClick={createOrder} disabled={submitting}>
              {submitting ? <Loader2 size={18} className="spin" /> : <Plus size={18} />}
              {tableOrder ? "Add to Order" : "Create Order"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── KDS View ─────────────────────────────────────────────────────────────────
function KdsView({ kitchenTickets, token, onRefresh }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);

  const activeTickets = kitchenTickets.filter((t) => ["PENDING", "PREPARING", "READY"].includes(t.status));

  const updateStatus = async (ticketId, status) => {
    try {
      await apiFetch(`/kitchen/${ticketId}`, { method: "PATCH", body: JSON.stringify({ status }) }, token);
      await onRefresh();
    } catch (err) { console.error(err); }
  };

  return (
    <section className="view kds-view">
      <Header icon={<ChefHat />} title="Kitchen Display System" subtitle="Live tickets from SQLite — real-time updates"
        right={<div className="live-badge"><span className="pulse" /> Live</div>} />
      <div className="ticket-grid">
        {activeTickets.map((ticket) => {
          const order = ticket.order;
          const ageMs = now - new Date(ticket.createdAt).getTime();
          const age = Math.floor(ageMs / 60000);
          const urgent = age > 12;
          return (
            <article key={ticket.id} className={`ticket ${urgent ? "urgent" : ""}`}>
              <div className="ticket-head">
                <div>
                  <strong>Table {order?.table?.number}</strong>
                  <span>Order #{order?.id?.slice(-6)}</span>
                </div>
                <div className="timer"><Clock3 size={18} /> {age}m</div>
              </div>
              <StatusPill status={ticket.status} />
              <div className="ticket-items">
                {order?.orderItems?.map((item) => (
                  <div key={item.id} className="kds-item">
                    <strong>{item.menuItem?.name} ×{item.quantity}</strong>
                    {item.notes && <span>· {item.notes}</span>}
                  </div>
                ))}
              </div>
              <div className="ticket-actions">
                {ticket.status === "PENDING" && (
                  <button className="kds-button" onClick={() => updateStatus(ticket.id, "PREPARING")}>
                    <Flame size={22} /> Start
                  </button>
                )}
                {ticket.status === "PREPARING" && (
                  <button className="kds-button ready" onClick={() => updateStatus(ticket.id, "READY")}>
                    <Bell size={22} /> Ready
                  </button>
                )}
                {ticket.status === "READY" && (
                  <button className="kds-button done" onClick={() => updateStatus(ticket.id, "SERVED")}>
                    <Check size={22} /> Served
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {!activeTickets.length && <Empty icon={<ChefHat />} text="No active tickets. Orders fired by waiter appear here instantly." />}
      </div>
    </section>
  );
}

// ─── Cashier View ─────────────────────────────────────────────────────────────
function CashierView({ orders, token, onRefresh }) {
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [method, setMethod] = useState("CASH");
  const [processing, setProcessing] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");

  const openOrders = orders.filter((o) => !["PAID", "CANCELLED"].includes(o.status));
  const selected = openOrders.find((o) => o.id === selectedOrderId) || openOrders[0];

  const processPayment = async () => {
    if (!selected) return;
    setProcessing(true); setError("");
    try {
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify({ orderId: selected.id, method, amount: selected.total }),
      }, token);
      await onRefresh();
      setSelectedOrderId(null);
    } catch (err) { setError(err.message); }
    finally { setProcessing(false); }
  };

  const fetchInvoice = async (paymentId) => {
    try {
      const res = await fetch(`${API_BASE}/payments/${paymentId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      setInvoice(text);
    } catch (err) { console.error(err); }
  };

  const paidOrders = orders.filter((o) => o.status === "PAID").slice(0, 5);

  return (
    <section className="view cashier-grid">
      <Header icon={<ReceiptText />} title="Cashier Terminal" subtitle="Live billing connected to backend payments API"
        right={<button className="tool-button" onClick={onRefresh}><RefreshCw size={18} /> Refresh</button>} />

      <div className="panel open-checks">
        <div className="section-title"><h2>Open Checks</h2><span>{openOrders.length} orders</span></div>
        {openOrders.length === 0 && <Empty icon={<ReceiptText />} text="No open orders." />}
        {openOrders.map((o) => (
          <button key={o.id} className={`check-row ${selected?.id === o.id ? "active" : ""}`} onClick={() => setSelectedOrderId(o.id)}>
            <div>
              <strong>Table {o.table?.number}</strong>
              <span><StatusPill status={o.status} /> · {o.orderItems?.length} items</span>
            </div>
            <em>₹{o.total?.toFixed(2)}</em>
          </button>
        ))}
      </div>

      <div className="panel bill-panel">
        {selected ? (
          <>
            <div className="section-title"><h2>Table {selected.table?.number} Bill</h2><StatusPill status={selected.status} /></div>
            {selected.orderItems?.map((item) => (
              <div className="bill-line" key={item.id}>
                <div><strong>{item.menuItem?.name}</strong><span>×{item.quantity}{item.notes ? ` · ${item.notes}` : ""}</span></div>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="totals">
              <span>Subtotal <strong>₹{selected.subtotal?.toFixed(2)}</strong></span>
              <span>Tax (5%) <strong>₹{selected.tax?.toFixed(2)}</strong></span>
              <span className="grand">Total <strong>₹{selected.total?.toFixed(2)}</strong></span>
            </div>
          </>
        ) : <Empty icon={<ReceiptText />} text="Select an open order." />}
      </div>

      <div className="panel payment-panel">
        <div className="section-title"><h2>Payment</h2><span>Select method</span></div>
        <div className="method-grid">
          {[["CASH", <IndianRupee size={20} />], ["CARD", <CreditCard size={20} />], ["UPI", <QrCode size={20} />]].map(([label, icon]) => (
            <button key={label} className={method === label ? "method active" : "method"} onClick={() => setMethod(label)}>
              {icon}{label}
            </button>
          ))}
        </div>
        {error && <p className="error-msg"><AlertTriangle size={14} /> {error}</p>}
        <button className="primary-action" disabled={!selected || processing} onClick={processPayment}>
          {processing ? <Loader2 size={20} className="spin" /> : <Printer size={20} />}
          {processing ? "Processing..." : `Pay ₹${selected?.total?.toFixed(2) || "0.00"} via ${method}`}
        </button>

        {/* Recent paid orders */}
        {paidOrders.length > 0 && (
          <>
            <div className="section-title" style={{ marginTop: "1rem" }}><h2>Recent Paid</h2></div>
            {paidOrders.map((o) => (
              <div key={o.id} className="check-row">
                <div><strong>Table {o.table?.number}</strong><span>₹{o.total?.toFixed(2)}</span></div>
                {o.payments?.[0] && (
                  <button className="tool-button" style={{ fontSize: "0.7rem" }} onClick={() => fetchInvoice(o.payments[0].id)}>
                    <FileText size={14} /> Invoice
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {invoice && (
          <div className="invoice-modal" onClick={() => setInvoice(null)}>
            <pre className="invoice-text">{invoice}</pre>
            <button className="secondary-action" onClick={() => setInvoice(null)}>Close</button>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Manager View ─────────────────────────────────────────────────────────────
function ManagerView({ dashboard, orders, tables, onRefresh }) {
  return (
    <section className="view manager-view">
      <Header icon={<LayoutDashboard />} title="Manager Dashboard" subtitle="Live analytics from SQLite backend"
        right={<><button className="tool-button" onClick={onRefresh}><RefreshCw size={18} /> Refresh</button><div className="live-badge"><span className="pulse" /> Live</div></>} />

      <div className="metric-grid">
        <Metric icon={<BadgeIndianRupee />} label="Today's Revenue" value={`₹${dashboard?.todayRevenue?.toFixed(2) || "0.00"}`} />
        <Metric icon={<Utensils />} label="Tables Occupied" value={`${dashboard?.tableOccupancy?.occupiedTables || 0} / ${dashboard?.tableOccupancy?.totalTables || 0}`} />
        <Metric icon={<CircleDollarSign />} label="Occupancy Rate" value={`${dashboard?.tableOccupancy?.occupancyRate || 0}%`} />
        <Metric icon={<ChefHat />} label="Kitchen Queue" value={dashboard?.kitchenQueue?.totalActive || 0} />
      </div>

      <div className="manager-grid">
        {/* Table Status */}
        <div className="panel">
          <div className="section-title"><h2>Table Status</h2><span>Live</span></div>
          {tables.map((t) => (
            <div className="health-row" key={t.id}>
              <div><strong>Table {t.number}</strong><span>{t.capacity} seats</span></div>
              <StatusPill status={t.status} />
            </div>
          ))}
        </div>

        {/* Popular Items */}
        <div className="panel">
          <div className="section-title"><h2>Top Selling Items</h2><span>All time</span></div>
          {dashboard?.popularItems?.length > 0 ? dashboard.popularItems.map((item) => (
            <div className="health-row" key={item.id}>
              <div><strong>{item.name}</strong><span>{item.categoryName} · {item.quantitySold} sold</span></div>
              <em>₹{item.price}</em>
            </div>
          )) : <Empty icon={<Utensils />} text="No sales data yet." />}
        </div>

        {/* Kitchen Queue */}
        <div className="panel">
          <div className="section-title"><h2>Kitchen Queue</h2><span>Live</span></div>
          <div className="health-row">
            <div><strong>Pending</strong><span>Not started</span></div>
            <em>{dashboard?.kitchenQueue?.pending || 0}</em>
          </div>
          <div className="health-row">
            <div><strong>Preparing</strong><span>In progress</span></div>
            <em>{dashboard?.kitchenQueue?.preparing || 0}</em>
          </div>
          <div className="health-row">
            <div><strong>Ready</strong><span>For serving</span></div>
            <em>{dashboard?.kitchenQueue?.ready || 0}</em>
          </div>
        </div>

        {/* Open Orders Summary */}
        <div className="panel">
          <div className="section-title"><h2>Active Orders</h2><span>{orders.filter((o) => !["PAID", "CANCELLED"].includes(o.status)).length} open</span></div>
          {orders.filter((o) => !["PAID", "CANCELLED"].includes(o.status)).map((o) => (
            <div className="health-row" key={o.id}>
              <div><strong>Table {o.table?.number}</strong><span>{o.orderItems?.length} items</span></div>
              <StatusPill status={o.status} />
            </div>
          ))}
          {orders.filter((o) => !["PAID", "CANCELLED"].includes(o.status)).length === 0 && (
            <Empty icon={<ReceiptText />} text="No active orders." />
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Shared Components ────────────────────────────────────────────────────────
function NavButton({ active, onClick, icon, label }) {
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick} title={label}>
      {React.cloneElement(icon, { size: 20 })}
      <span>{label}</span>
    </button>
  );
}

function Header({ icon, title, subtitle, right }) {
  return (
    <header className="page-header">
      <div className="title-block">
        <div className="title-icon">{React.cloneElement(icon, { size: 24 })}</div>
        <div><h1>{title}</h1><p>{subtitle}</p></div>
      </div>
      {right}
    </header>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="metric">
      {React.cloneElement(icon, { size: 22 })}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusPill({ status }) {
  return <span className={`status ${status?.toLowerCase()}`}>{statusLabel(status)}</span>;
}

function Empty({ icon, text }) {
  return (
    <div className="empty">
      {React.cloneElement(icon, { size: 34 })}
      <span>{text}</span>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
