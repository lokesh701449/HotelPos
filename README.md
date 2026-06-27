# HotelPOS Frontend

Orange and white React frontend for the HotelPOS build-a-thon brief.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Demo Path

1. In **Waiter**, pick a table, add a menu item with modifiers, and fire it to the kitchen.
2. In **KDS**, the ticket appears in the live queue with age/status controls.
3. In **Cashier**, split the bill, choose Cash/Card/UPI, request approval if needed, then pay and print.
4. In **Manager**, approve discounts and monitor sales, outlet health, moving items, and close reconciliation.

## Notes

- Shared state is persisted in `localStorage` and propagated across browser tabs with `BroadcastChannel`.
- The waiter offline toggle queues fired orders and syncs them when brought online.
- Menu data is scoped by outlet, with low-stock and blocked-item states.
- Bills apply Indian GST as CGST 5% plus SGST 5%.
- Discounts are gated through a manager approval moment before payment.
