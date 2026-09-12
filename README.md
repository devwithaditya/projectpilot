# ProjectPilot MVP

ProjectPilot is a dependency-free, browser-based MVP for planning U.S. home projects. It includes:

- Paint project cost calculator
- Flooring cost calculator
- Concrete quantity calculator
- Fence project cost calculator
- DIY versus contractor comparison

Each tool has its own crawlable URL:

- `/paint-calculator/`
- `/flooring-calculator/`
- `/concrete-calculator/`
- `/fence-calculator/`
- `/diy-vs-contractor/`

Supporting pages:

- `/privacy/`
- `/terms/`
- `/disclaimer/`
- `/contact/`

The Contact page uses `rajadityafeb22@gmail.com` as the public feedback address.

On Android, the site behaves as an installable web app. The install banner uses the browser's native install prompt when available, with an “Add to Home screen” fallback for browsers that do not expose the prompt.

Cost tools support USD, EUR, GBP, CAD, AUD, INR, JPY, and MXN. Prices are shown and entered in the selected currency, then normalized with embedded USD-based planning rates; connect a live foreign-exchange service or refresh the rates before using estimates for production billing.

## Run locally

Open `index.html` directly in a browser, or serve the folder with any static web server:

```text
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Structure

- `index.html` — semantic page structure and content
- `styles.css` — responsive visual system and calculator UI
- `app.js` — reusable form helpers, validation, calculation logic, and result rendering
- `tool-page.js` — initializes the shared calculator engine on dedicated tool pages
- `sitemap.xml` and `robots.txt` — SEO crawl files; replace the placeholder domain before launch
- `manifest.webmanifest`, `service-worker.js`, and `icon.svg` — Android/PWA install support

All calculations run in the browser. Cost values are editable planning examples and should be replaced with local quotes or sourced pricing before production monetization.
