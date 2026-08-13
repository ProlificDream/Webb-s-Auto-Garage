# Webb's Auto Garage — Garage Website

A small Node.js website for an auto garage with two working flows:

1. **Book an Appointment** — a work-order-styled form that saves requests to the server.
2. **Parts Counter (shop)** — a product grid with a cart and checkout that saves orders to the server.

There's also a lightweight **/admin.html** dashboard to view submitted appointments and orders.

No payment processor is wired up yet (you said you weren't sure how you want to handle payments). Orders are captured as "pay on pickup / delivery" for now — see **Adding real payments** below for how to plug in Stripe later.

## What's inside

```
garage-site/
├─ server.js          Express server + API (appointments, orders, products, services)
├─ package.json
├─ data/               JSON "database" files (created automatically)
│   ├─ appointments.json
│   └─ orders.json
└─ public/             The website itself
   ├─ index.html        Home page
   ├─ appointments.html Booking form
   ├─ shop.html          Product grid + cart
   ├─ checkout.html      Order form
   ├─ admin.html         Staff dashboard (view requests/orders)
   ├─ styles.css
   └─ main.js / booking.js / shop.js / checkout.js
```

## Running it locally

You need [Node.js](https://nodejs.org) 18 or newer installed.

```bash
npm install
npm start
```

Then open **http://localhost:3000** in your browser.

## Editing your services and shop items

Open `server.js` and edit the `SERVICES` and `PRODUCTS` arrays near the top of the file — each entry is plain JSON, no code changes needed elsewhere. Prices, names, descriptions, and stock counts all live there.

## Viewing submitted appointments & orders

Go to `/admin.html` on your site and enter the admin key. By default the key is `change-me-admin-key` — **change this before going live** by setting an environment variable:

```bash
ADMIN_KEY=some-long-random-string npm start
```

This is intentionally simple (a shared password, not individual logins). It's fine for a small shop with one or two staff members checking a dashboard, but don't treat it as bank-grade security — anyone with the key can see customer names, phone numbers, and emails.

## Where the data goes

Appointment requests and orders are saved to `data/appointments.json` and `data/orders.json` on the server's disk. That's simple and works well for a single small server, but two things to know:

- **Back it up.** These are just files — if the server's disk is wiped, the data goes with it.
- **Some hosts wipe disk storage on redeploy** (see hosting notes below). If you outgrow this, the natural next step is a real database (e.g. Postgres) — happy to help with that migration when you're ready.

## Deploying so it's live on the internet

You don't need to pick a payment processor to go live — the site works today with "confirm by phone, pay on pickup" for both bookings and orders. Here are the easiest paths, roughly in order of simplicity:

### Option A — Render.com (recommended, has a free tier)
1. Push this folder to a GitHub repository.
2. On [render.com](https://render.com), click **New → Web Service**, connect your repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add an environment variable `ADMIN_KEY` with your own secret value.
5. Deploy. Render gives you a URL like `ironclad-auto.onrender.com` — you can later point your own domain at it.

*Note: Render's free tier disk isn't guaranteed to persist forever across redeploys. Fine to start; ask about adding a real database before you rely on it long-term.*

### Option B — Railway.app
Same idea as Render: connect the GitHub repo, it detects Node.js automatically, set `ADMIN_KEY`, deploy. Railway's free tier is usage-limited but very quick to set up.

### Option C — A traditional VPS (DigitalOcean, Linode, etc.)
If you want full control: spin up a small Ubuntu droplet, install Node.js, copy this folder over, run `npm install && npm start` (ideally under a process manager like `pm2` so it restarts if it crashes), and put it behind Nginx with a free SSL certificate from Let's Encrypt.

### Domain name
Any of the above let you point a custom domain (e.g. `ironcladauto.com`) at the deployed site — buy the domain from any registrar (Namecheap, Google Domains successor Squarespace Domains, etc.) and follow that host's instructions for connecting a custom domain.

## Adding real payments later

When you're ready to actually charge cards online:

1. Create a [Stripe](https://stripe.com) account (or another processor).
2. The cleanest first step is **Stripe Checkout** — instead of building a card form yourself, your server creates a "checkout session" and redirects the customer to a Stripe-hosted payment page. This keeps you out of PCI-compliance scope.
3. I can wire this into `checkout.js` / `server.js` for you whenever you're ready — it's a fairly small, contained change since the order data model already exists.

## Notes on the design

The visual style is meant to feel like an actual garage work order / parts counter — the booking form looks like a carbon-copy repair ticket, and the type/color choices (steel blue, safety amber, mono "part number" style labels) are meant to feel shop-specific rather than a generic template. Everything is in `styles.css` if you want to adjust colors, fonts, or the shop name/copy (currently placeholder: "Ironclad Auto", address, phone, and hours in `index.html`).
