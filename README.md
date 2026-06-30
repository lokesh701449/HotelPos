# Integrated HotelPOS & StockRoom Workspace

This repository contains the integrated **Front-of-House (HotelPOS)** and **Back-of-House (StockRoom)** restaurant management systems. The projects run independently on their respective databases (SQLite and MongoDB) and communicate in real-time via REST APIs.

---

## 🏗️ Architecture & Decoupling

* **HotelPOS (FOH)**: Runs on a local SQLite database (via Prisma) for maximum operational resilience, fast sales processing, and offline capabilities.
* **StockRoom (BOH)**: Runs on a MongoDB database (via Mongoose) to manage flexible nested structures like recipe books, purchase orders, and audit transaction ledgers.
* **Communication Layer**: All updates (menu availability checks, pre-checkout stock validations, and Chef ready deductions) happen dynamically via secure API endpoints on loopback ports.

---

## 🚀 Port Configuration & Setup

Run each service in a separate terminal tab:

### 1. StockRoom Back-of-House (BOH)
* **Backend API (Port `5001`)**:
  ```bash
  cd "Modern SaaS Dashboard Design"
  npm install
  node server/server.js
  ```
* **Frontend UI (Port `5175`)**:
  ```bash
  cd "Modern SaaS Dashboard Design"
  npx vite --port 5175
  ```

### 2. HotelPOS Front-of-House (FOH)
* **Backend API (Port `5005`)**:
  ```bash
  cd backend
  npm install
  npx tsx src/server.ts
  ```
* **Frontend UI (Port `5174` or `5173`)**:
  ```bash
  npm install
  npm run dev
  ```

---

## 🗄️ Database Seeding

To seed the initial menu catalog, properties, matching recipes, and starting ingredients stock:

* **HotelPOS (SQLite)**:
  ```bash
  cd backend
  npx prisma db seed
  ```
* **StockRoom (MongoDB)**:
  ```bash
  cd "Modern SaaS Dashboard Design"
  node server/seed/seeder.js
  ```

---

## 🔑 Login Credentials

All seeded accounts across both applications share the password: **`password123`**

### HotelPOS (FOH)
* **Admin**: `admin-roof@hotelpos.com`
* **Waiter**: `waiter-roof@hotelpos.com`
* **Chef (KDS)**: `chef-roof@hotelpos.com`
* **Cashier**: `cashier-roof@hotelpos.com`

### StockRoom (BOH)
* **Admin**: `admin@stockroom.com`
* **Store Keeper**: `storekeeper@stockroom.com`

---

## 🔄 Core Integration Flows

1. **Dynamic Menu Availability**: When HotelPOS loads `/api/menu-items`, it checks ingredient balances in StockRoom. If any raw material (e.g. *Chicken Breast* or *Tomatoes*) falls below what is required for a single portion, the item automatically switches to **Unavailable** in the POS menu.
2. **Waiter Pre-Checkout Validation**: When a waiter places an order, the FOH validates stock levels in StockRoom to prevent checking out items that cannot be prepared.
3. **KDS Stock Deduction**: When the Chef marks a kitchen ticket as `"READY"`, the POS calls the StockRoom API, which automatically scales the corresponding recipe's ingredient list (e.g., calculating exactly how much chicken and rice is consumed for `2` portions) and deducts it from MongoDB.
4. **Procurement Ledger**: In StockRoom, managers can bundle approved **Purchase Requests** into a **Purchase Order (PO)**. Marking the PO delivery as received automatically logs a receipt transaction, increasing the stock balance.
