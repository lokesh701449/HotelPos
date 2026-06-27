import React, { useEffect, useMemo, useState } from "react";
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
  WifiOff
} from "lucide-react";
import "./styles.css";

const STORAGE_KEY = "hotelpos-state-v1";
const CHANNEL = "hotelpos-live";
const TAX_RATE = 0.05;

const menu = [
  {
    id: "m1",
    name: "Paneer Tikka",
    outletId: "out-roof",
    price: 340,
    station: "Hot",
    prepMins: 12,
    stock: 8,
    modifiers: ["Extra chutney", "Less spice", "No onion"]
  },
  {
    id: "m2",
    name: "Smoked Corn Tacos",
    outletId: "out-roof",
    price: 290,
    station: "Grill",
    prepMins: 9,
    stock: 2,
    modifiers: ["No cheese", "Extra salsa", "Jain"]
  },
  {
    id: "m3",
    name: "Masala Fries",
    outletId: "out-roof",
    price: 210,
    station: "Fry",
    prepMins: 6,
    stock: 0,
    modifiers: ["Extra peri peri", "No mayo"]
  },
  {
    id: "m4",
    name: "Filter Coffee",
    outletId: "out-cafe",
    price: 140,
    station: "Beverage",
    prepMins: 4,
    stock: 30,
    modifiers: ["No sugar", "Extra strong"]
  },
  {
    id: "m5",
    name: "Ghee Roast Dosa",
    outletId: "out-cafe",
    price: 260,
    station: "Live",
    prepMins: 10,
    stock: 14,
    modifiers: ["Extra sambar", "No ghee", "Jain"]
  },
  {
    id: "m6",
    name: "Hyderabadi Veg Biryani",
    outletId: "out-banquet",
    price: 420,
    station: "Hot",
    prepMins: 15,
    stock: 18,
    modifiers: ["Raita extra", "Less spice"]
  }
];

const properties = [
  {
    id: "prop-hyd",
    city: "Hyderabad",
    name: "Terralogic Grand Hyderabad",
    outlets: [
      { id: "out-roof", name: "Skyline Rooftop", type: "Bar & Grill" },
      { id: "out-cafe", name: "Atrium Cafe", type: "All-day dining" }
    ]
  },
  {
    id: "prop-blr",
    city: "Bengaluru",
    name: "Terralogic Grand Bengaluru",
    outlets: [{ id: "out-banquet", name: "Mysore Hall", type: "Banquet" }]
  }
];

const tables = [
  { id: "t1", name: "T1", seats: 2, outletId: "out-roof" },
  { id: "t2", name: "T2", seats: 4, outletId: "out-roof" },
  { id: "t3", name: "T3", seats: 4, outletId: "out-roof" },
  { id: "t4", name: "T4", seats: 6, outletId: "out-roof" },
  { id: "t5", name: "C1", seats: 2, outletId: "out-cafe" },
  { id: "t6", name: "C2", seats: 4, outletId: "out-cafe" },
  { id: "t7", name: "B1", seats: 8, outletId: "out-banquet" },
  { id: "t8", name: "B2", seats: 10, outletId: "out-banquet" }
];

const seededOrders = [
  {
    id: "ord-101",
    propertyId: "prop-hyd",
    outletId: "out-roof",
    tableId: "t2",
    status: "preparing",
    createdAt: Date.now() - 11 * 60 * 1000,
    paidAt: null,
    items: [
      itemFromMenu("m1", ["Less spice"], "preparing"),
      itemFromMenu("m2", ["Extra salsa"], "sent")
    ],
    payments: [],
    discount: 0,
    approval: null
  },
  {
    id: "ord-102",
    propertyId: "prop-hyd",
    outletId: "out-cafe",
    tableId: "t5",
    status: "sent",
    createdAt: Date.now() - 5 * 60 * 1000,
    paidAt: null,
    items: [itemFromMenu("m5", ["Extra sambar"], "sent")],
    payments: [],
    discount: 0,
    approval: null
  },
  {
    id: "ord-099",
    propertyId: "prop-blr",
    outletId: "out-banquet",
    tableId: "t8",
    status: "paid",
    createdAt: Date.now() - 23 * 60 * 60 * 1000,
    paidAt: Date.now() - 21 * 60 * 60 * 1000,
    items: [itemFromMenu("m6", ["Raita extra"], "completed")],
    payments: [{ method: "UPI", amount: 441, ref: "UPI-8841" }],
    discount: 0,
    approval: null
  }
];

function itemFromMenu(menuId, modifiers = [], status = "draft") {
  const dish = menu.find((entry) => entry.id === menuId);
  return {
    id: `${menuId}-${Math.random().toString(36).slice(2, 8)}`,
    menuId,
    name: dish.name,
    price: dish.price,
    station: dish.station,
    prepMins: dish.prepMins,
    modifiers,
    status
  };
}

function seedState() {
  return {
    brandId: "brand-terralogic",
    activeOutletId: "out-roof",
    selectedTableId: "t1",
    selectedCashierTableId: "t2",
    role: "waiter",
    online: true,
    lastSyncAt: Date.now(),
    offlineQueue: [],
    orders: seededOrders,
    approvals: [
      {
        id: "app-1",
        type: "Discount",
        amount: 150,
        orderId: "ord-101",
        reason: "Guest recovery",
        status: "pending",
        requestedAt: Date.now() - 3 * 60 * 1000
      }
    ],
    zReports: [
      {
        id: "z-1",
        outletId: "out-roof",
        date: "Yesterday",
        sales: 48210,
        tax: 2296,
        cash: 10600,
        card: 22100,
        upi: 15510,
        reconciled: true
      }
    ]
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed?.orders ? parsed : seedState();
  } catch {
    return seedState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function calcTotals(order) {
  const subtotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const discounted = Math.max(0, subtotal - (order.discount || 0));
  const cgst = Math.round(discounted * TAX_RATE * 100) / 100;
  const sgst = Math.round(discounted * TAX_RATE * 100) / 100;
  const total = Math.round((discounted + cgst + sgst) * 100) / 100;
  return { subtotal, discount: order.discount || 0, cgst, sgst, total };
}

function App() {
  const [state, setState] = useState(loadState);
  const [activeRole, setActiveRole] = useState(() => window.location.hash.replace("#", "") || "waiter");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL);
    channel.onmessage = (event) => {
      if (event.data?.type === "state") {
        setState(event.data.payload);
      }
    };
    const onStorage = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        setState(JSON.parse(event.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      channel.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const commit = (updater) => {
    setState((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      const stamped = { ...next, lastSyncAt: Date.now() };
      saveState(stamped);
      new BroadcastChannel(CHANNEL).postMessage({ type: "state", payload: stamped });
      return stamped;
    });
  };

  const actions = useMemo(() => makeActions(commit), []);
  const routeRole = ["waiter", "kds", "cashier", "manager"].includes(activeRole) ? activeRole : "waiter";

  const setRole = (role) => {
    window.location.hash = role;
    setActiveRole(role);
  };

  useEffect(() => {
    const onHash = () => setActiveRole(window.location.hash.replace("#", "") || "waiter");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <div className="app">
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark"><Hotel size={22} /></div>
          <div>
            <strong>HotelPOS</strong>
            <span>Live F&B ops</span>
          </div>
        </div>
        <nav className="role-nav" aria-label="POS surfaces">
          <NavButton active={routeRole === "waiter"} onClick={() => setRole("waiter")} icon={<Smartphone />} label="Waiter" />
          <NavButton active={routeRole === "kds"} onClick={() => setRole("kds")} icon={<ChefHat />} label="KDS" />
          <NavButton active={routeRole === "cashier"} onClick={() => setRole("cashier")} icon={<ReceiptText />} label="Cashier" />
          <NavButton active={routeRole === "manager"} onClick={() => setRole("manager")} icon={<LayoutDashboard />} label="Manager" />
        </nav>
        <div className="sync-card">
          <span className={state.online ? "dot online" : "dot offline"} />
          <div>
            <strong>{state.online ? "Online sync" : "Offline mode"}</strong>
            <span>{state.offlineQueue.length} queued action{state.offlineQueue.length === 1 ? "" : "s"}</span>
          </div>
        </div>
      </aside>

      <main className="surface">
        {routeRole === "waiter" && <WaiterView state={state} actions={actions} now={now} />}
        {routeRole === "kds" && <KdsView state={state} actions={actions} now={now} />}
        {routeRole === "cashier" && <CashierView state={state} actions={actions} />}
        {routeRole === "manager" && <ManagerView state={state} actions={actions} now={now} />}
      </main>
    </div>
  );
}

function makeActions(commit) {
  return {
    reset: () => commit(seedState()),
    setOutlet: (outletId) => commit((state) => ({ ...state, activeOutletId: outletId, selectedTableId: tables.find((t) => t.outletId === outletId)?.id })),
    selectTable: (tableId) => commit((state) => ({ ...state, selectedTableId: tableId })),
    selectCashierTable: (tableId) => commit((state) => ({ ...state, selectedCashierTableId: tableId })),
    toggleOnline: () =>
      commit((state) => {
        const goingOnline = !state.online;
        const syncedOrders = goingOnline
          ? state.orders.map((order) =>
              order.status === "offline"
                ? { ...order, status: "sent", items: order.items.map((item) => ({ ...item, status: "sent" })) }
                : order
            )
          : state.orders;
        return {
          ...state,
          online: goingOnline,
          offlineQueue: goingOnline ? [] : state.offlineQueue,
          orders: syncedOrders
        };
      }),
    addItem: (tableId, menuId, modifiers) =>
      commit((state) => {
        const table = tables.find((entry) => entry.id === tableId);
        const dish = menu.find((entry) => entry.id === menuId);
        if (!dish || dish.stock <= 0) return state;
        const existing = state.orders.find((order) => order.tableId === tableId && order.status !== "paid");
        const nextItem = itemFromMenu(menuId, modifiers, "draft");
        if (existing) {
          return {
            ...state,
            orders: state.orders.map((order) =>
              order.id === existing.id ? { ...order, status: "open", items: [...order.items, nextItem] } : order
            )
          };
        }
        return {
          ...state,
          orders: [
            ...state.orders,
            {
              id: `ord-${Date.now().toString().slice(-5)}`,
              propertyId: propertyForOutlet(table.outletId).id,
              outletId: table.outletId,
              tableId,
              status: "open",
              createdAt: Date.now(),
              paidAt: null,
              items: [nextItem],
              payments: [],
              discount: 0,
              approval: null
            }
          ]
        };
      }),
    fireOrder: (tableId) =>
      commit((state) => ({
        ...state,
        offlineQueue: state.online ? state.offlineQueue : [...state.offlineQueue, { type: "fire", tableId, at: Date.now() }],
        orders: state.orders.map((order) =>
          order.tableId === tableId && order.status !== "paid"
            ? {
                ...order,
                status: state.online ? "sent" : "offline",
                items: order.items.map((item) => ({ ...item, status: state.online ? "sent" : "queued" }))
              }
            : order
        )
      })),
    startTicket: (orderId) =>
      commit((state) => ({
        ...state,
        orders: state.orders.map((order) =>
          order.id === orderId
            ? { ...order, status: "preparing", items: order.items.map((item) => ({ ...item, status: "preparing" })) }
            : order
        )
      })),
    bumpTicket: (orderId) =>
      commit((state) => ({
        ...state,
        orders: state.orders.map((order) =>
          order.id === orderId
            ? { ...order, status: "ready", items: order.items.map((item) => ({ ...item, status: "ready" })) }
            : order
        )
      })),
    completeTicket: (orderId) =>
      commit((state) => ({
        ...state,
        orders: state.orders.map((order) =>
          order.id === orderId
            ? { ...order, status: "completed", items: order.items.map((item) => ({ ...item, status: "completed" })) }
            : order
        )
      })),
    requestDiscount: (orderId, amount) =>
      commit((state) => ({
        ...state,
        approvals: [
          {
            id: `app-${Date.now()}`,
            orderId,
            type: "Discount",
            amount,
            reason: "Cashier requested guest adjustment",
            status: "pending",
            requestedAt: Date.now()
          },
          ...state.approvals
        ],
        orders: state.orders.map((order) => (order.id === orderId ? { ...order, approval: "pending" } : order))
      })),
    decideApproval: (approvalId, status) =>
      commit((state) => {
        const approval = state.approvals.find((entry) => entry.id === approvalId);
        return {
          ...state,
          approvals: state.approvals.map((entry) => (entry.id === approvalId ? { ...entry, status } : entry)),
          orders:
            status === "approved" && approval
              ? state.orders.map((order) =>
                  order.id === approval.orderId ? { ...order, discount: approval.amount, approval: "approved" } : order
                )
              : state.orders
        };
      }),
    pay: (orderId, splitCount, method) =>
      commit((state) => ({
        ...state,
        selectedCashierTableId: state.selectedCashierTableId,
        orders: state.orders.map((order) => {
          if (order.id !== orderId) return order;
          const total = calcTotals(order).total;
          const share = Math.round((total / splitCount) * 100) / 100;
          return {
            ...order,
            status: "paid",
            paidAt: Date.now(),
            payments: Array.from({ length: splitCount }, (_, index) => ({
              method,
              amount: index === splitCount - 1 ? Math.round((total - share * (splitCount - 1)) * 100) / 100 : share,
              ref: `${method.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`
            }))
          };
        })
      })),
    runZ: (outletId) =>
      commit((state) => {
        const paidOrders = state.orders.filter((order) => order.outletId === outletId && order.status === "paid");
        const total = paidOrders.reduce((sum, order) => sum + calcTotals(order).total, 0);
        return {
          ...state,
          zReports: [
            {
              id: `z-${Date.now()}`,
              outletId,
              date: "Tonight",
              sales: total,
              tax: paidOrders.reduce((sum, order) => sum + calcTotals(order).cgst + calcTotals(order).sgst, 0),
              cash: total * 0.2,
              card: total * 0.45,
              upi: total * 0.35,
              reconciled: true
            },
            ...state.zReports
          ]
        };
      })
  };
}

function NavButton({ active, onClick, icon, label }) {
  return (
    <button className={`nav-button ${active ? "active" : ""}`} onClick={onClick} title={label}>
      {React.cloneElement(icon, { size: 20 })}
      <span>{label}</span>
    </button>
  );
}

function WaiterView({ state, actions }) {
  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [mods, setMods] = useState([]);
  const outletTables = tables.filter((table) => table.outletId === state.activeOutletId);
  const table = tables.find((entry) => entry.id === state.selectedTableId) || outletTables[0];
  const order = state.orders.find((entry) => entry.tableId === table?.id && entry.status !== "paid");
  const outletMenu = menu.filter((item) => item.outletId === state.activeOutletId);
  const selectedDish = menu.find((item) => item.id === selectedMenuId) || outletMenu[0];

  useEffect(() => {
    if (outletMenu[0] && !outletMenu.some((dish) => dish.id === selectedMenuId)) {
      setSelectedMenuId(outletMenu[0].id);
      setMods([]);
    }
  }, [state.activeOutletId, selectedMenuId, outletMenu]);

  const addSelected = () => {
    if (!selectedDish) return;
    actions.addItem(table.id, selectedDish.id, mods);
    setMods([]);
  };

  return (
    <section className="view waiter-grid">
      <Header
        icon={<Smartphone />}
        title="Waiter App"
        subtitle="One-handed ordering, honest item state, offline queue"
        right={
          <div className="header-actions">
            <button className="tool-button" onClick={actions.toggleOnline}>{state.online ? <Wifi size={18} /> : <WifiOff size={18} />}{state.online ? "Online" : "Offline"}</button>
            <button className="icon-button" onClick={actions.reset} title="Reset demo"><RefreshCw size={18} /></button>
          </div>
        }
      />
      <div className="panel outlet-strip">
        {properties.flatMap((property) =>
          property.outlets.map((outlet) => (
            <button key={outlet.id} className={state.activeOutletId === outlet.id ? "chip active" : "chip"} onClick={() => actions.setOutlet(outlet.id)}>
              <Store size={16} />
              {outlet.name}
            </button>
          ))
        )}
      </div>
      <div className="panel floor-panel">
        <div className="section-title">
          <h2>Floor Plan</h2>
          <span>{outletTables.length} tables</span>
        </div>
        <div className="floor-grid">
          {outletTables.map((entry) => {
            const liveOrder = state.orders.find((orderEntry) => orderEntry.tableId === entry.id && orderEntry.status !== "paid");
            const status = liveOrder?.status || "free";
            return (
              <button
                key={entry.id}
                className={`table-tile ${state.selectedTableId === entry.id ? "selected" : ""} ${status}`}
                onClick={() => actions.selectTable(entry.id)}
              >
                <strong>{entry.name}</strong>
                <span>{entry.seats} seats</span>
                <em>{statusLabel(status)}</em>
              </button>
            );
          })}
        </div>
      </div>
      <div className="panel order-panel">
        <div className="section-title">
          <h2>{table?.name} Check</h2>
          <span>{order ? `${order.items.length} items` : "No open order"}</span>
        </div>
        <div className="order-list">
          {order?.items.map((item) => (
            <div className="line-item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{item.modifiers.length ? item.modifiers.join(", ") : "No modifiers"}</span>
              </div>
              <StatusPill status={item.status} />
            </div>
          )) || <Empty icon={<Grid3X3 />} text="Tap a dish to start this table." />}
        </div>
        <button className="primary-action" disabled={!order?.items.length || order.status === "sent"} onClick={() => actions.fireOrder(table.id)}>
          <Send size={20} /> Fire to Kitchen
        </button>
      </div>
      <div className="panel menu-panel">
        <div className="section-title">
          <h2>Outlet Menu</h2>
          <span>Stock aware</span>
        </div>
        <div className="menu-list">
          {outletMenu.map((dish) => (
            <button key={dish.id} className={`menu-row ${selectedMenuId === dish.id ? "active" : ""}`} disabled={dish.stock <= 0} onClick={() => setSelectedMenuId(dish.id)}>
              <div>
                <strong>{dish.name}</strong>
                <span>{dish.station} · {dish.prepMins} min</span>
              </div>
              <em>{dish.stock <= 0 ? "Blocked" : `₹${dish.price}`}</em>
            </button>
          ))}
        </div>
        {selectedDish && (
          <div className="mod-box">
            <strong>Modifiers</strong>
            <div className="modifier-grid">
              {selectedDish.modifiers.map((mod) => (
                <button
                  key={mod}
                  className={mods.includes(mod) ? "chip active" : "chip"}
                  onClick={() => setMods((current) => (current.includes(mod) ? current.filter((entry) => entry !== mod) : [...current, mod]))}
                >
                  {mod}
                </button>
              ))}
            </div>
            <button className="secondary-action" onClick={addSelected} disabled={selectedDish.stock <= 0}>
              <Plus size={18} /> Add Dish
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function KdsView({ state, actions, now }) {
  const activeTickets = state.orders.filter((order) => ["sent", "preparing", "ready"].includes(order.status));
  return (
    <section className="view kds-view">
      <Header icon={<ChefHat />} title="Kitchen Display" subtitle="Large ticket queue with visible age and bump controls" right={<LiveBadge />} />
      <div className="ticket-grid">
        {activeTickets.map((order) => {
          const age = Math.floor((now - order.createdAt) / 60000);
          const urgent = age >= Math.max(...order.items.map((item) => item.prepMins), 8);
          return (
            <article key={order.id} className={`ticket ${urgent ? "urgent" : ""}`}>
              <div className="ticket-head">
                <div>
                  <strong>{tableName(order.tableId)}</strong>
                  <span>{outletName(order.outletId)}</span>
                </div>
                <div className="timer"><Clock3 size={18} /> {age}m</div>
              </div>
              <StatusPill status={order.status} />
              <div className="ticket-items">
                {order.items.map((item) => (
                  <div key={item.id} className="kds-item">
                    <strong>{item.name}</strong>
                    <span>{item.modifiers.length ? item.modifiers.join(" · ") : "Standard"}</span>
                  </div>
                ))}
              </div>
              <div className="ticket-actions">
                <button className="kds-button" onClick={() => actions.startTicket(order.id)}><Flame size={24} /> Start</button>
                <button className="kds-button ready" onClick={() => actions.bumpTicket(order.id)}><Bell size={24} /> Ready</button>
                <button className="kds-button done" onClick={() => actions.completeTicket(order.id)}><Check size={24} /> Done</button>
              </div>
            </article>
          );
        })}
        {!activeTickets.length && <Empty icon={<ChefHat />} text="No live tickets. Fired waiter orders appear here instantly." />}
      </div>
    </section>
  );
}

function CashierView({ state, actions }) {
  const [split, setSplit] = useState(2);
  const [method, setMethod] = useState("UPI");
  const openOrders = state.orders.filter((order) => order.status !== "paid");
  const selected = openOrders.find((order) => order.tableId === state.selectedCashierTableId) || openOrders[0];
  const totals = selected ? calcTotals(selected) : null;
  useEffect(() => {
    if (selected && selected.tableId !== state.selectedCashierTableId) actions.selectCashierTable(selected.tableId);
  }, [selected]);

  return (
    <section className="view cashier-grid">
      <Header icon={<ReceiptText />} title="Cashier Terminal" subtitle="Fast check lookup, split payment, GST, receipt, and Z-report" right={<button className="tool-button" onClick={() => actions.runZ(state.activeOutletId)}><FileText size={18} /> Run Z</button>} />
      <div className="panel open-checks">
        <div className="section-title">
          <h2>Open Tables</h2>
          <span>{openOrders.length} checks</span>
        </div>
        {openOrders.map((order) => (
          <button key={order.id} className={`check-row ${selected?.id === order.id ? "active" : ""}`} onClick={() => actions.selectCashierTable(order.tableId)}>
            <div>
              <strong>{tableName(order.tableId)}</strong>
              <span>{outletName(order.outletId)} · {order.items.length} items</span>
            </div>
            <em>₹{calcTotals(order).total.toFixed(2)}</em>
          </button>
        ))}
      </div>
      <div className="panel bill-panel">
        {selected ? (
          <>
            <div className="section-title">
              <h2>{tableName(selected.tableId)} Bill</h2>
              <StatusPill status={selected.status} />
            </div>
            {selected.items.map((item) => (
              <div className="bill-line" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.modifiers.join(", ") || "Standard"}</span>
                </div>
                <span>₹{item.price}</span>
              </div>
            ))}
            <div className="totals">
              <span>Subtotal <strong>₹{totals.subtotal.toFixed(2)}</strong></span>
              <span>Discount <strong>-₹{totals.discount.toFixed(2)}</strong></span>
              <span>CGST 5% <strong>₹{totals.cgst.toFixed(2)}</strong></span>
              <span>SGST 5% <strong>₹{totals.sgst.toFixed(2)}</strong></span>
              <span className="grand">Total <strong>₹{totals.total.toFixed(2)}</strong></span>
            </div>
          </>
        ) : <Empty icon={<ReceiptText />} text="No open checks." />}
      </div>
      <div className="panel payment-panel">
        <div className="section-title">
          <h2>Payment</h2>
          <span>Mock tender</span>
        </div>
        <div className="stepper">
          <button className="icon-button" onClick={() => setSplit(Math.max(1, split - 1))}><Minus size={18} /></button>
          <div><Split size={18} /> {split} guests</div>
          <button className="icon-button" onClick={() => setSplit(split + 1)}><Plus size={18} /></button>
        </div>
        <div className="method-grid">
          {[
            ["Cash", <IndianRupee size={20} />],
            ["Card", <CreditCard size={20} />],
            ["UPI", <QrCode size={20} />]
          ].map(([label, icon]) => (
            <button key={label} className={method === label ? "method active" : "method"} onClick={() => setMethod(label)}>
              {icon}{label}
            </button>
          ))}
        </div>
        <button className="secondary-action" disabled={!selected} onClick={() => selected && actions.requestDiscount(selected.id, 150)}>
          <ShieldCheck size={18} /> Request Discount Approval
        </button>
        <button className="primary-action" disabled={!selected || selected.approval === "pending"} onClick={() => selected && actions.pay(selected.id, split, method)}>
          <Printer size={20} /> Pay & Print Receipt
        </button>
        {selected?.approval === "pending" && <p className="warning"><AlertTriangle size={16} /> Waiting for manager approval before payment.</p>}
      </div>
    </section>
  );
}

function ManagerView({ state, actions, now }) {
  const paid = state.orders.filter((order) => order.status === "paid");
  const open = state.orders.filter((order) => order.status !== "paid");
  const sales = paid.reduce((sum, order) => sum + calcTotals(order).total, 0);
  const moving = Object.values(
    state.orders.flatMap((order) => order.items).reduce((acc, item) => {
      acc[item.name] = acc[item.name] || { name: item.name, qty: 0, sales: 0 };
      acc[item.name].qty += 1;
      acc[item.name].sales += item.price;
      return acc;
    }, {})
  ).sort((a, b) => b.qty - a.qty);

  return (
    <section className="view manager-view">
      <Header icon={<LayoutDashboard />} title="Manager Dashboard" subtitle="Chain-level view across properties and outlets" right={<LiveBadge />} />
      <div className="metric-grid">
        <Metric icon={<BadgeIndianRupee />} label="Paid sales" value={`₹${sales.toFixed(0)}`} />
        <Metric icon={<Utensils />} label="Open tables" value={open.length} />
        <Metric icon={<Building2 />} label="Properties" value={properties.length} />
        <Metric icon={<ShieldCheck />} label="Approvals" value={state.approvals.filter((app) => app.status === "pending").length} />
      </div>
      <div className="manager-grid">
        <div className="panel">
          <div className="section-title"><h2>Outlet Health</h2><span>Live</span></div>
          {properties.flatMap((property) => property.outlets.map((outlet) => {
            const outletOrders = state.orders.filter((order) => order.outletId === outlet.id);
            const waiting = outletOrders.filter((order) => ["sent", "preparing"].includes(order.status)).length;
            return (
              <div className="health-row" key={outlet.id}>
                <div>
                  <strong>{outlet.name}</strong>
                  <span>{property.city} · {waiting} kitchen ticket{waiting === 1 ? "" : "s"}</span>
                </div>
                <em>{outletOrders.filter((order) => order.status !== "paid").length} open</em>
              </div>
            );
          }))}
        </div>
        <div className="panel">
          <div className="section-title"><h2>Moving Items</h2><span>Today</span></div>
          {moving.slice(0, 5).map((item) => (
            <div className="health-row" key={item.name}>
              <div><strong>{item.name}</strong><span>{item.qty} sold</span></div>
              <em>₹{item.sales}</em>
            </div>
          ))}
        </div>
        <div className="panel approvals">
          <div className="section-title"><h2>Approval Gate</h2><span>Manager only</span></div>
          {state.approvals.map((approval) => (
            <div className={`approval ${approval.status}`} key={approval.id}>
              <div>
                <strong>{approval.type} · ₹{approval.amount}</strong>
                <span>{tableName(state.orders.find((order) => order.id === approval.orderId)?.tableId)} · {minutesAgo(now, approval.requestedAt)} ago</span>
              </div>
              {approval.status === "pending" ? (
                <div className="approval-actions">
                  <button className="icon-button approve" onClick={() => actions.decideApproval(approval.id, "approved")}><Check size={18} /></button>
                  <button className="icon-button deny" onClick={() => actions.decideApproval(approval.id, "denied")}><Minus size={18} /></button>
                </div>
              ) : <StatusPill status={approval.status} />}
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="section-title"><h2>Last Close</h2><span>Reconciliation</span></div>
          {state.zReports.slice(0, 3).map((report) => (
            <div className="health-row" key={report.id}>
              <div><strong>{outletName(report.outletId)}</strong><span>{report.date} · tax ₹{report.tax.toFixed(0)}</span></div>
              <em>{report.reconciled ? "Reconciled" : "Mismatch"}</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Header({ icon, title, subtitle, right }) {
  return (
    <header className="page-header">
      <div className="title-block">
        <div className="title-icon">{React.cloneElement(icon, { size: 24 })}</div>
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
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
  return <span className={`status ${status}`}>{statusLabel(status)}</span>;
}

function Empty({ icon, text }) {
  return (
    <div className="empty">
      {React.cloneElement(icon, { size: 34 })}
      <span>{text}</span>
    </div>
  );
}

function LiveBadge() {
  return <div className="live-badge"><span className="pulse" /> Live</div>;
}

function statusLabel(status) {
  const labels = {
    free: "Free",
    open: "Open",
    sent: "Kitchen",
    queued: "Queued",
    offline: "Offline",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Completed",
    paid: "Paid",
    approved: "Approved",
    denied: "Denied",
    pending: "Pending",
    draft: "Draft"
  };
  return labels[status] || status;
}

function propertyForOutlet(outletId) {
  return properties.find((property) => property.outlets.some((outlet) => outlet.id === outletId));
}

function outletName(outletId) {
  return properties.flatMap((property) => property.outlets).find((outlet) => outlet.id === outletId)?.name || "Outlet";
}

function tableName(tableId) {
  return tables.find((table) => table.id === tableId)?.name || "Table";
}

function minutesAgo(now, then) {
  return `${Math.max(0, Math.floor((now - then) / 60000))}m`;
}

createRoot(document.getElementById("root")).render(<App />);
