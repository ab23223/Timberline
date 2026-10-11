# Landscape Supply — Loader Orders

A standalone HTML/CSS/JavaScript prototype inspired by the supplied loader-screen mock-up. No build tools, libraries, or paid services are required to run the demo.

## What works in this prototype
- Responsive loader order dashboard
- Active and completed order queues
- Select an order and view customer, vehicle, product quantities, and notes
- Mark individual products loaded
- Complete and reopen orders
- Add demo orders through a form
- Product catalogue and settings pages
- Demo data saved in this browser's local storage
- Search and sample reset controls

## Important limitations
This is a **front-end prototype only**. It is not connected to Zulu and does not synchronise separate tablets. Browser local storage is local to one browser/device (and the storage event only helps between tabs on the same origin). The “Connected to Zulu” state in the reference mock-up is deliberately replaced by “Demo mode · local data”.

To connect two separate loader devices, the app needs a shared backend/service accessible on the yard network. To connect Zulu, a server-side integration must use a Zulu-supported API, webhook, or approved export. Never place Zulu API keys or passwords in `app.js` or any public GitHub repository.

## Run locally
1. Download/unzip this project.
2. Open `index.html` in Chrome or Edge.
3. Try selecting orders, toggling loaded items, completing an order, and adding a demo order.

For a better local test, use a simple local web server rather than opening the file directly. For example, if Python is installed, run `python -m http.server 8000` from this folder, then visit `http://localhost:8000`.

## Put it on GitHub
1. Create a new repository, e.g. `loader-orders`.
2. Upload all files in this folder to the repository root.
3. In GitHub, open **Settings → Pages**.
4. Choose **Deploy from a branch**, select `main` and `/(root)`, then save.
5. Wait for the site to publish.

GitHub Pages hosts static files; it cannot run the backend server required for secure Zulu credentials or shared live synchronisation. Also, a public GitHub Pages site should be treated as publicly accessible. Do not use real customer names, order details, API keys, or business secrets in this demo.

## Files
- `index.html` — all page structure and dialogs
- `styles.css` — responsive styling
- `app.js` — demo state and interactions
- `zulu-integration.md` — integration plan and starter backend outline
