# PPM — Project Portfolio Management

INFS3059 prototype for a focused IT project portfolio review process.

## Open it

- Live site: https://kjshoom.github.io/ppm-infs3059/
- Source: https://github.com/kjshoom/ppm-infs3059

Open `index.html`, or run `python3 -m http.server 4173` and visit `http://127.0.0.1:4173/`.

## What the prototype does

1. **Organisation** sets strategic objectives, budget, and available staff.
2. **Proposer** enters a standard IT project proposal: description, benefits, cost, staff, timeline, and risks.
3. **Reviewer** records five separate 1–5 ratings and a reason for each one.
4. **Portfolio manager** filters, compares two to four projects, checks a Scenario A or B against budget and staff, then records a human decision.

Objectives entered in Organisation setup are available in the proposal form. Data is saved only in the current browser with local storage. The optional Test MVP mode uses temporary test data in the current tab.

The role tabs demonstrate the workflow; they are not permission controls. The prototype does not create an overall score, automatic ranking, recommended portfolio, or automatic final decision.

Account sign-in can run in browser-only mode or use the Java API in `backend/`. In browser-only mode, accounts stay in that browser. When a shared API is configured, account credentials and profile details are stored by the API and can be used to sign in from another device. Proposal, review, organisation, and portfolio data still stay in the current browser.

After signing in, open the profile circle and choose **Manage your PPM account** to update the name, email, or workspace role. The role is a prototype preference, not an access-control permission.

## Shared account API

The API uses Java 17+, Spring Boot, and PostgreSQL. GitHub Pages serves the frontend as static files; it does not run the Java server or provide an application database. Deploy the API and PostgreSQL separately, then set the public API origin in `api-config.js`:

```js
window.PPM_CONFIG = Object.freeze({ apiBaseUrl: "https://your-api.example" });
```

Configure these server environment variables in the API host (never commit production credentials):

- `SPRING_DATASOURCE_URL` — PostgreSQL JDBC URL
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `PPM_ALLOWED_ORIGINS` — `https://kjshoom.github.io` and any local development origin, comma-separated
- `PPM_SESSION_HOURS` — sign-in token lifetime (default: 168 hours)

Run the backend tests with `cd backend && mvn test`. The integration tests use an in-memory database. Existing browser-only accounts are not migrated; create an account again after the API is configured. This prototype API does not yet include email verification, password reset, distributed rate limiting, or production monitoring, so it should not be used for sensitive accounts.

## Main files

- `index.html` — page structure and role views
- `app/globals.css` — responsive visual design and motion
- `app.js` — sample data, forms, review flow, comparison, scenarios, and local storage
- `auth-ui.js` / `api-config.js` — sign-in UI and the optional shared-account API address
- `account.html` — signed-in profile settings
- `backend/` — Java account API and PostgreSQL schema
- `docs/process-flow.md` — review process
