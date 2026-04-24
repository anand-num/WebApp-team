# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

RentFit — a Mongolian clothing rental web app built as a class project. Pure client-side: plain HTML, CSS, and vanilla JavaScript served from the `public/` directory. There is **no build step, no package manager, no test suite, and no backend**. Data lives in JSON files under `public/json/` and user state in `localStorage`.

UI text and most code comments are in Mongolian.

## Running the app

There are no npm scripts or CLI commands. Serve the repo root over a static HTTP server (e.g. VS Code Live Server, `python -m http.server`) and open `public/html/index.html`. Opening HTML files via `file://` will break `fetch()` calls to JSON.

Pages load absolute paths like `/public/json/products.json`, so **the server root must be the repo root** (not `public/`). Most `fetch()` calls in the code try both `/public/json/X.json` and `../json/X.json` to tolerate either configuration — preserve that dual-path pattern when adding new fetches.

## Architecture

### Multi-page structure
Each page in `public/html/` has a matching entry script in `public/js/`:

| Page | Script | Role |
|---|---|---|
| `index.html` | `home.js` | Landing + featured products |
| `browse.html` | `browse.js` | Catalog with filters/search/pagination |
| `product.html` | `product.js` | Product detail + reviews |
| `cart.html` | `cart.js` | Multi-step checkout |
| `liked.html` | `liked.js` | Wishlist |
| `my-rentals.html` | `my-rentals.js` | User profile + rental history |
| `admin.html` | `admin/admin.js` | Admin SPA (see below) |

### ES modules vs plain scripts
This boundary matters — don't move code across it without checking.

- **`type="module"` entries**: `home.js`, `browse.js`, `product.js`, `cart.js`, `liked.js`, `auth.js`, `card-actions.js`, and everything under `admin/`. These `import`/`export` and can use the shared classes in `public/js/modules/`.
- **Plain scripts**: `cart-side.js`, `request-modal.js`, `my-rentals.js`. These expose **global functions** (e.g. `openRequestModal()`, `renderCartSide()`, `switchToTab()`) called from inline `onclick=` or from module scripts on the same page. Keep them plain unless you also convert every caller.

### Shared modules (`public/js/modules/`)
- **`Auth.js`** — session management. Session key `rf_user`, registered-users key `rf_registered`. `getAllUsers()` merges `users.json` + registered signups.
- **`Cart.js`** — cart storage under `rf_cart`. `addProduct()` normalizes the product.json shape (including `sizes` as either array or single value) into cart item shape.

### localStorage keys (the `rf_` namespace)
| Key | Written by | Read by |
|---|---|---|
| `rf_user` | `auth.js` on login | every page (header avatar, my-rentals) |
| `rf_registered` | `auth.js` signup | `Auth.getAllUsers()` |
| `rf_cart` | `Cart.js`, `cart-side.js`, `cart.js` | same + `my-rentals.js` |
| `rf_liked` | `browse.js`, `home.js`, product page heart | `liked.js` |

The cart sidebar on non-cart pages (`cart-side.js`) and the full cart page (`cart.js`) both read/write `rf_cart` — changes in one must stay consistent with the other.

### Data sources (`public/json/`)
- `product.json` — catalog (fields: `id`, `brand`, `item_name`, `sizes`, `img_src`, `status` of Premium/Standard, `category`, etc.)
- `users.json` — seed users for login (email/password plaintext — class project, not production)
- `review.json` — reviews keyed by `product_id`
- `promocode.json` — checkout promo codes

Image filenames in `img_src` are resolved against `/public/source/`.

### Admin subsystem (`public/js/admin/`)
A self-contained hash-routed SPA, separate from the storefront:

- `admin.js` — router; `location.hash` → page (`#admin/dashboard`, `#admin/products`, etc.)
- `api.js` — fetches JSON into `DB`
- `store.js` — `DB` singleton holding products/users/orders/filters
- `models.js` — shapes raw JSON rows
- `pages.js` — view renderers per route
- `ui.js` — shared UI helpers (table rows, badges)
- `constants.js` — `SIZES`, `CATS`, `STATUS_LABEL`, `JSON_PATHS`

Admin routes are independent of the storefront's multi-page structure. Do not cross-import between `admin/` and top-level JS.

### CSS organization
Loaded in this order on most pages: `global.css` → `layout.css` → `styles.css` → page-specific (e.g. `browse.css`). CSS variables live in `global.css` (colors, fonts) except `--ink` which is only defined in `my-rentals.css:root` and is a known quirk when referenced elsewhere.

`cart-side.css` duplicates the cart-sidebar rules from `browse.css` because `browse.html` loads `browse.css` only, while other pages load `cart-side.css` only. Keep them in sync.

## Conventions

- Comments are often in Mongolian and sometimes explain JavaScript fundamentals (e.g. `async`/`await` definitions) — this is a class project. Match the existing language/tone when adding comments near existing ones, and don't strip the explanatory comments as "obvious."
- Dynamic dates in the codebase target ~2026 (test data). The default currency symbol is `₮`.
- HTML uses `class="mid-nav"` (not `middle-nav`) and `id="btn-wish"` (not `.btn-wish`) — past bugs came from these naming mismatches in CSS.
