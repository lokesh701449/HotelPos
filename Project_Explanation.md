# HotelPOS - Architecture & Tech Stack Explanation

This document explains the technical decisions, architecture, and workflow of the HotelPOS application. You can use this as a reference if you are asked to explain the project during an interview or presentation.

---

## 1. The Technology Stack

### Frontend
- **React.js**: We used React for building the user interface because of its component-based architecture. This allows us to build reusable pieces (like `WaiterView`, `KdsView`, `NavButton`) and manage complex states (orders, tables) efficiently.
- **Vite**: Instead of Create React App, we used Vite. **Why?** Vite is significantly faster. It uses native ES modules during development, resulting in near-instant server starts and lightning-fast Hot Module Replacement (HMR).
- **Socket.io-client**: Used for real-time communication with the backend.

### Backend
- **Node.js & Express.js**: The backend server is built on Node/Express. **Why?** Node.js is asynchronous and event-driven, which makes it perfect for applications requiring high concurrency and real-time features (like POS systems where multiple waiters and kitchens are acting simultaneously).
- **TypeScript**: We used TypeScript on the backend. **Why?** It catches errors during development by enforcing static typing, making the codebase much more predictable and easier to debug than plain JavaScript.
- **Socket.io**: Enables WebSockets for real-time, bi-directional communication between the server and the frontend clients.

### Database & ORM
- **SQLite**: The database used is SQLite. **Why?** SQLite is a file-based, serverless database. It requires zero configuration, making it incredibly easy to set up, test, and distribute for a prototype or single-server application. If the app scales massively later, the ORM makes it easy to swap to PostgreSQL.
- **Prisma ORM**: Used to interact with the database. **Why not raw SQL or Sequelize?** Prisma provides a modern, type-safe database client. It automatically generates queries based on our schema, prevents SQL injection by default, and makes writing complex database relations (like Orders -> OrderItems -> MenuItems) very simple.

---

## 2. Core Architecture: How it Works

The application operates on a **Client-Server Architecture** with **Real-time Event-Driven Synchronization**.

### A. Authentication & Role-Based Access Control (RBAC)
1. **Login Flow**: When a user logs in, the frontend sends credentials to the backend. The backend validates the password using `bcrypt` and returns the user's role (Waiter, Chef, Cashier, Manager).
2. **UI Restriction**: The React frontend uses this role to conditionally render the sidebar navigation. A Chef cannot see the Cashier screen, and a Waiter cannot see the Kitchen Display System (KDS). The UI actively restricts access based on `auth.user.role`.

### B. The Real-Time Order Flow (Step-by-Step)
If you are asked *"What happens when a waiter places an order?"*, explain this flow:

1. **WaiterView (Frontend)**: The Waiter selects a table, adds menu items, and clicks "Send to Kitchen" (Create Order).
2. **API Request**: The React app sends an HTTP `POST` request to the Express backend (`/orders`).
3. **Database Write (Prisma)**: The backend calculates totals, creates the Order, creates OrderItems, and creates a KitchenTicket with a `PENDING` status. It saves all of this into the SQLite database via Prisma.
4. **Real-time Broadcast (Socket.io)**: Instead of the KDS (Kitchen) needing to refresh the page, the backend server emits a Socket.io event called `order-created` to all connected clients in that specific restaurant.
5. **KDS Update (Frontend)**: The Chef's tablet (running the KDS View) receives the `order-created` event via WebSockets and instantly triggers a re-fetch of the data. The new ticket magically pops up on the Chef's screen with zero delay.
6. **Fulfillment**: The Chef clicks "Start" -> "Ready". This sends a `PATCH` request to the backend to update the ticket status, which emits another socket event, instantly notifying the Waiter that the food is ready.

### C. Multi-Tenancy
The database is designed to support **Multi-Tenancy**. This means a single database and server can run multiple distinct restaurants (e.g., Skyline Rooftop, Atrium Cafe, Mysore Hall) at the same time.
- **How?** Every Table, Order, Menu Item, and User belongs to a specific `tenantId`. When a user logs in, they only ever fetch and interact with data linked to their specific `tenantId`.

---

## 3. Common Interview Questions & Answers

**Q: Why didn't you use Redux for state management?**
**A:** Redux is powerful but introduces a lot of boilerplate. Because our application relies heavily on real-time server state (the source of truth is the backend), simple React `useState` and `useEffect` hooks combined with Socket.io fetching were sufficient and kept the codebase lightweight and easy to maintain.

**Q: Why use WebSockets (Socket.io) instead of HTTP Polling?**
**A:** If we used HTTP polling, the kitchen display would have to ask the server "Any new orders?" every 3 seconds. This wastes bandwidth and server resources. WebSockets keep an open, lightweight connection so the server can instantly push updates to the clients only when an event actually happens.

**Q: How does the app handle a lost connection?**
**A:** Socket.io has built-in auto-reconnection. If the server goes down or the Wi-Fi drops, the client will continuously try to reconnect in the background and resync data once back online.

**Q: Why is Prisma better than writing SQL?**
**A:** Prisma provides Type Safety. If I misspell a column name like `menItem` instead of `menuItem`, Prisma will throw a TypeScript error before the app even compiles. With raw SQL, that error would crash the app at runtime in production.

**Q: Does the system support multiple waiters working at the same time?**
**A:** Yes! The database schema includes a `waiterId` on every `Order`. The Manager can use the "Staff Management" screen to create accounts for unlimited waiters. Because of WebSockets, if Waiter A opens an order for Table 2 on their mobile device, Waiter B's screen will instantly update to show Table 2 as "Occupied", preventing duplicate orders. The system permanently records exactly which waiter placed which order.
