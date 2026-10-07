# Menu/cart verification

Date: 2026-10-07 (Asia/Manila). Branch: `feature/menu-cart`.
Participating member: Mikyla Cabillo (`cabillopretty`), participation confirmed in chat.

## Baseline and scope

The shared repository had one commit, `8c16b540dbd3376054e94b807699a726cc2957c8`, titled "Add AI-assisted Bite & Brew POS baseline", authored as Cabillo with Mikyla's email. This is the observed Git metadata, not proof that Mikyla independently implemented the application. Existing tracked application files match the completed working folder after newline normalization. No past development stages were reconstructed.

The remote omitted `database.js`, `seed.js`, `package-lock.json`, `.gitignore`, and `.env.example`, even though its server imports the database module and its README describes these files. They were restored from the completed working folder as baseline packaging repair, not newly authored menu features. The secret `.env` was not copied. Generated files are ignored. The original application source and visual design are unchanged.

## Existing coverage audit

`npm test` has eight existing logic tests. They already cover the six products, peso formatting, the 175/220/140-peso scenarios, removal, cart retention after Back, prevention of negative quantities, empty checkout, and payment/receipt state cases. These were retained rather than duplicated.

`tests/browser-check.js` is a historical browser script with an absolute workstation Playwright path, fixed port 4173, old cash-button text, and assumptions about the earlier receipt navigation. It was not run as evidence for the current application. Its payment/receipt updates belong to the later members' audit; no claim is made that it currently passes.

## Missing verification added

`tests/menu-cart-browser.js` uses a repository-local Playwright dependency and an isolated static server on an ephemeral loopback port. It never connects to Neon or submits payments. It verifies actual DOM interactions:

| Scenario | Observed result |
| --- | --- |
| All, Drinks, Food, Snacks filters | Exact expected product membership; one selected category |
| Switch category with populated cart | Coffee, sandwich and soft drink remain; total stays ₱175.00 |
| Coffee quantity increase/decrease | ₱220.00 then ₱175.00 |
| Remove soft drink | ₱140.00 |
| Review and Back | Item quantities, total and selected category retained |
| Decrease coffee to zero | Coffee removed; no zero-quantity row |
| Remove final item | ₱0.00 and disabled Review order |
| Keyboard category activation | Enter activates Food filter |
| Widths 320, 390, 660, 900, 1440 pixels | No horizontal page overflow, including populated cart after Back |
| Add/plus/minus/remove/review controls | Bounding boxes at least 44 × 44 CSS pixels |
| Mobile cart shortcut | Visible at applicable widths and navigates to `#cart` |
| Browser errors | None observed |

## Actual commands and results

In the separate checkout, with the installed Microsoft Edge browser:

```powershell
npm ci
$env:BROWSER_CHANNEL = 'msedge'
npm run test:menu-cart
npm test
```

The browser suite passed, and all eight existing logic tests passed. The tests were executed by Codex on the shared PC on the date above. `npm ci` is the reproducible installation command; the initial preparation used `npm install --save-dev playwright` and recorded the lockfile. For another computer, omit `BROWSER_CHANNEL` after installing Chromium with `npx playwright install chromium`.

Limitations: external fonts/photos are blocked in the automated browser suite to isolate menu behavior. This is not a full visual audit, screen-reader audit, real touchscreen test, or proof of accessibility for every user. No full database-connected end-to-end run was performed in this separate checkout because credentials were intentionally not copied. The original working app remains untouched.

## AI assistance and member evaluation

Codex audited coverage, wrote the additional browser checks, restored omitted support files, ran verification, and drafted this report. Mikyla's personal evaluation and understanding are pending her own response. No commit, push, or PR is attributed to her yet; GitHub CLI authentication as `cabillopretty` must first be verified. A teammate review is required before merge.
