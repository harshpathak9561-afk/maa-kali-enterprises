# Maa Kali Enterprises — Website

A professional business + store website with a full **Control Panel** — edit everything without coding.

## Run the site

```bash
cd website
python3 server.py 8000
```

- Shop: http://localhost:8000
- Control Panel: http://localhost:8000/admin.html (or the "Image Manager" link in the footer)

## Control Panel (admin.html) — no coding needed

| Tab | What you can do |
|---|---|
| 🛍 Products & Prices | Edit names, prices, MRP, categories, ratings, badges, descriptions, feature bullets · upload each product's photo · add or delete products |
| 🖼 Images | Replace the hero banner and showroom photo |
| ⚙ Site Settings | Site name, tagline, announcement bar, promo code + %, free-shipping limit, contact info, footer line |
| 📦 Orders | See every order placed through checkout (customer, items, total, payment) |

Everything saves to `data.json` / `orders.json` / `images/` and goes live instantly.

## Files

| File | Purpose |
|---|---|
| `index.html` | The shop (home, shop, about, reviews, FAQ, contact) |
| `styles.css` | All styling (navy + gold professional theme) |
| `app.js` | Shop logic — loads live data from the server, falls back to built-in data offline |
| `admin.html` | Control Panel page |
| `server.py` | Server + API (Python standard library only, nothing to install) |
| `data.json` | Settings + product catalogue (edited via Control Panel) |
| `orders.json` | Received orders (auto-created) |
| `images/` | All site photos (incl. `placeholder.jpg` fallback) |

> Notes: the server has no login — it's meant for local/demo use, don't expose it publicly.
> For real payments, connect Razorpay/Stripe to the checkout.
