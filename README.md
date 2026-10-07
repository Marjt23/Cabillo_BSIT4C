# Bite & Brew POS

Run `npm run seed` to create `bite_brew_products` and populate all six products from `pos.js`. Prices use integer centavos (4500 = ₱45.00). The seed runs in a transaction and verifies each saved field. Running it again updates matching product IDs without duplicates or deleting other products. The current app still reads its menu from `pos.js`; this seed populates the database catalog.

A complete campus touchscreen kiosk built with plain HTML, CSS and JavaScript. The original workspace contained no application files. This buildless stack uses a Node.js server and Neon PostgreSQL to persist completed sales.

## Run

Install dependencies with `npm install`, then set `DATABASE_URL` in a local `.env` file (see `.env.example`). Start with Node.js:

```sh
npm start
```

The server connects to PostgreSQL and creates `bite_brew_sales` if needed. Completed sales are stored as receipt snapshots, with amounts in integer centavos. The server validates products, quantities and payment amounts. A failed save leaves the order available to retry; receipt references prevent duplicate inserts. Database credentials stay on the server and `.env` is excluded from Git. Update `.env` after rotating your Neon password, then restart the server. Payments remain simulated.

Open the URL printed by the server; if port 4173 is occupied it tries the next port. Opening `index.html` directly does not support database-backed checkout.

Visit http://127.0.0.1:4173. Use browser fullscreen for a kiosk. To run logic tests:

```sh
npm test
```

The server uses pg and dotenv. Internet access supplies Unsplash product photos and Google Fonts; product icons and system fonts work when those services are unavailable. No payments are real. Active carts live in memory and reset on page reload; completed receipts remain in PostgreSQL.

## Files and structure

- `index.html`: branded application shell, sidebar and accessible feedback region.
- `styles.css`: cream, forest-green and burnt-orange design, responsive layouts, large touch controls and print stylesheet.
- `pos.js`: local products, integer-centavo calculations, cash parsing, cart operations, guarded navigation, asynchronous card simulation and immutable receipt snapshots.
- `app.js`: product filters, cart, review, payment controls, confirmation, receipt, feedback and reset rendering.
- `server.js`: local static server and sales API, restricted to application assets.
- `database.js`: PostgreSQL connection, sales table setup and validated receipt storage.
- `package.json`: dependencies, start and test commands.
- `tests/pos.test.js`: dependency-free Node tests for the required financial and state behavior.
- `tests/browser-check.js`: browser interaction checks used during development. It uses this workstation's bundled Playwright and installed Edge; change the require to your Playwright installation to run elsewhere.
- `tmp/desktop.png`, `tmp/mobile.png`, `tmp/receipt.png`: verification screenshots; `tmp/exam-*.png`: extracted exam pages used for reference review.

All source files are new; there were no existing files to modify.

## State and payment handling

The state machine follows Order → Review → Payment → Success → Receipt. Review and payment Back controls retain items. Payment method and cash input are cleared when returning to edit/review. Cash accepts non-negative decimal values with at most two decimal places, rejects incomplete/invalid/insufficient amounts, and calculates change using integer centavos. QR confirmation records the total as paid. Card processing locks payment and navigation until the simulated delay finishes. A receipt is created only after validation, frozen with its purchased items, and reused on confirmation and receipt screens. References use a random UUID with a timestamp/counter/random fallback. New Transaction clears all customer state and returns to Order.

## Exam requirement checklist

| Exam functionality | Implementation |
| --- | --- |
| 1–2 Six selectable products and tap selection | Six required products with correct prices, photography/icon fallbacks and category filters |
| 3–4 Quantity adjustment and removal | Large plus/minus/remove controls, zero removes an item; negative quantities prevented |
| 5–6 Subtotals and total | Integer-centavo multiplication and sum; recalculated after every cart change |
| 7–8 Summary and return to edit | Full product/quantity/unit-price/subtotal table and Back preserving the cart |
| 9 Three payment methods | Cash, QR Payment, Credit/Debit Card with visible selection |
| 10–12 Cash, insufficient validation, change | Decimal input, touchscreen keypad, quick amounts, clear error feedback and computed change |
| 13 QR simulation | Clearly identified QR placeholder, instructions and Confirm Payment |
| 14 Card simulation | Tap/insert/swipe instructions, Process Payment and processing state |
| 15–16 Confirmation and reference | Payment Successful, brand, UUID reference, total/method/paid/change and View Receipt |
| 17 Digital receipt | Bite & Brew POS heading, actual date/time in Asia/Manila, complete item/payment details and successful status |
| 18–19 New transaction and reset | Clears cart, method, cash, receipt, total, processing and errors |
| 20 Feedback | Product added/removed, insufficient payment, success and new-transaction messages |
| Touch interface and visual reference | Cream background, green sidebar, orange primary actions, rounded white cards; responsive mobile cart shortcut |

## Verification results

Seven Node tests passed and a headless Microsoft Edge browser test passed with no JavaScript errors.

| Requested scenario | Verified result |
| --- | --- |
| Coffee ×2 + Sandwich ×1 + Soft Drink ×1 | ₱175.00 |
| Increase Coffee to ×3; reduce to ×2 | ₱220.00; ₱175.00 |
| Remove Soft Drink | ₱140.00 |
| Back from review | Cart and quantities preserved |
| Pay ₱100.00 against ₱140.00 | Rejected; remains on payment, no receipt |
| Pay ₱200.00 against ₱140.00 | Success; ₱60.00 change |
| Exact cash | Success; ₱0.00 change |
| QR and card | Correct method and total; amount paid equals total; ₱0.00 change |
| New Transaction | Empty cart, ₱0.00 total and disabled checkout; all state cleared |
| Two completed transactions | Different references |
| Branding and amounts | Header/sidebar/confirmation/receipt use Bite & Brew; receipt heading Bite & Brew POS; monetary values use ₱ and two decimals |
| Invalid blank/text/negative/excess decimal/unsafe amount | Rejected with no receipt |
| Duplicate actions and card processing | Repeated payment rejected; navigation locked during processing |
| Responsive layout | Desktop 1440px and mobile 390px inspected; no horizontal page overflow |

Browser checks covered real button interactions, cash entry, exact quick amount, receipt rendering, all payment methods and reset. The final mobile shortcut was added after screenshot inspection and the browser suite rerun. Physical touchscreen hardware, real payment devices/gateways and physical printer output were not tested. These are simulations as requested. The supplied dashboard is adapted to the campus workflow; accounts, marketing navigation and loyalty features are excluded.

The exam refers to separately issued Git/GitHub and AI process rules. None were supplied, and this empty directory has no Git remote. No commit, pull request or deployment was made.

