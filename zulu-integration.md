# Zulu integration plan (placeholder)

This file is planning documentation, **not a working Zulu connector**. Wait for Zulu to confirm the supported API/webhook contract before implementing requests.

## Desired flow

1. POS sale is completed in Zulu.
2. A supported Zulu API/webhook/export makes the sale available to a private integration service.
3. The service validates the event, filters sales that need bulk loading, maps the POS line items to the dispatch order format, and stores them.
4. Loader tablets open this web app and connect to the service over the yard's local network.
5. When a loader claims, updates, or completes an order, the service stores that change and broadcasts it to the other screen(s).
6. If the internet/Zulu feed is unavailable, existing local orders remain visible and the UI clearly marks the feed as stale. The system must not silently imply it is up to date.

## Questions for Zulu

- Can the API retrieve completed POS sales/receipts in near real time?
- Are line items, quantities, units, receipt/order IDs, customer identifiers, vehicle details, and notes available?
- Are webhooks supported for completed sales, or only for other record types?
- Is API access enabled for this business/account and what permissions or subscription are needed?
- Is there an approved report/export or integration route if POS sales endpoints are not available?
- How are refunds, voids, edited receipts, and duplicate webhook deliveries represented?
- What authentication method, rate limits, and webhook signature verification are required?

Do not assume a webhook event exists until Zulu confirms it. Do not scrape the POS UI or automate register clicks as a first choice.

## Suggested backend architecture

A small Node.js service can run on an office computer or a small always-on machine on the yard LAN. It would provide:
- `GET /api/health` — service status and last successful Zulu sync timestamp
- `GET /api/orders?status=active` — current active queue
- `POST /api/orders/:id/claim` — claim an order
- `PATCH /api/orders/:id/items/:itemId` — mark an item loaded/unloaded
- `POST /api/orders/:id/complete` — complete order
- A WebSocket or Server-Sent Events stream for updates across tablets
- A private Zulu adapter that calls the actual documented Zulu API or validates incoming webhook events
- Durable storage (SQLite is enough for a small prototype), duplicate-event protection, and logs

These are proposed internal routes, not Zulu endpoints. They should be protected against accidental access from outside the yard network. Add authentication/PINs if needed, especially before connecting real customer data.

## Normalised order format (internal example)

```json
{
  "id": "POS-1842",
  "source": "zulu",
  "customer": "Smith",
  "vehicle": "White trailer",
  "createdAt": "2026-10-12T10:00:00+13:00",
  "status": "pending",
  "notes": "Keep mulch separate from soil.",
  "items": [
    { "id": "line-1", "name": "ARB mulch", "quantity": 2, "unit": "m3", "loaded": false },
    { "id": "line-2", "name": "Topsoil", "quantity": 0.5, "unit": "m3", "loaded": false }
  ]
}
```

## Example adapter skeleton (pseudocode only)

```js
// Replace this with the exact API/webhook contract supplied by Zulu.
// Do not add API secrets to browser files or commit them to GitHub.
async function importCompletedSale(zuluEvent) {
  // 1. Verify event authenticity using Zulu's documented method.
  // 2. Deduplicate using the stable Zulu receipt/sale ID.
  // 3. Confirm this sale contains bulk products requiring loader fulfilment.
  // 4. Map line items and notes into the internal order schema.
  // 5. Save the order and broadcast it to connected loader screens.
}
```

## Why the demo isn't yet a multi-device app

The current `app.js` uses browser `localStorage` for demo data. It is useful for demonstrating layout and interactions, but each physical tablet has its own local storage. Shared state requires the backend above. GitHub Pages can host the static front end, but it cannot run this Node.js service; run the service on the yard network or host it somewhere private and reachable.
