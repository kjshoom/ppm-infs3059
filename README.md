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

After signing in, open the profile circle and choose **Manage your PPM account** to update the name, email, or workspace role. The role is a prototype preference, not an access-control permission. Account settings remain outside the workplace workflow; the workplace sidebar no longer has an Account screen.

Account settings also lets a signed-in user permanently delete their PPM sign-in and profile after confirming the action. Proposals and portfolio data are separate browser-stored prototype data and are not removed with the account.

## Shared account API

The API uses Java 17+, Spring Boot, and PostgreSQL. It stores account credentials (as BCrypt hashes), profile details, and revocable sign-in sessions. GitHub Pages serves the frontend as static files; it does not run the Java server or provide an application database.

Proposal, review, organisation, scenario, and portfolio data are still saved in the current browser. The account API does not sync that workspace data between devices.

### Deploy the API

The repository includes a Render Blueprint in `render.yaml` and a production Spring profile. The intended no-cost student setup is a Render free web service plus a Supabase free PostgreSQL project. Expect the API to sleep after 15 minutes without traffic and take about a minute to wake; Supabase may pause a free project after a week of low database activity. The free database has no automatic backups. This is a demonstration setup, not a production service or a place for sensitive credentials. Do not add a payment method unless the team explicitly agrees to paid hosting, and check the providers’ current limits before creating resources.

1. Create a Supabase project and save the database password somewhere private. In Supabase, open **Project Settings → Database → Connection string**, choose the **Session pooler**, and copy its host, port, database, and username. Use port `5432` and an SSL JDBC URL, for example `jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require`; use the actual values and pooler username shown for your project.
2. In Render, create a new **Blueprint** from `https://github.com/kjshoom/ppm-infs3059`. Render reads `render.yaml` and asks for the three database variables. Enter the JDBC URL, pooler username, and database password. Do not put those values in this repository or in `api-config.js`.
3. Wait for the Render deploy to become healthy. Check `https://<your-render-service>.onrender.com/api/health`; it should return `{"status":"ok"}`.
4. Put the public Render service origin (without `/api`) in `api-config.js` and publish that one-line frontend configuration:

```js
window.PPM_CONFIG = Object.freeze({ apiBaseUrl: "https://your-render-service.onrender.com" });
```

The Blueprint configures these server variables (never commit the database credentials):

- `SPRING_PROFILES_ACTIVE=production` — requires the external PostgreSQL settings; it will not fall back to local credentials
- `SPRING_DATASOURCE_URL` — PostgreSQL JDBC URL for the provider's session pooler, with `sslmode=require`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `PPM_ALLOWED_ORIGINS` — the GitHub Pages origin and local development origins
- `PPM_SESSION_HOURS` — sign-in token lifetime (default: 168 hours)

When the API URL is set, account registration, sign-in, profile edits, sign-out, and account deletion use the shared database, so the same account can be used from another device. Existing browser-only accounts are not migrated; create an account again after the API is connected. Run the backend tests with `cd backend && mvn test`; the integration tests use an in-memory database. This student prototype does not include email verification, password reset, distributed rate limiting, backups, or production monitoring, so it should not be used for sensitive accounts.

## Main files

- `index.html` — page structure and role views
- `app/globals.css` — responsive visual design and motion
- `app.js` — sample data, forms, review flow, comparison, scenarios, and local storage
- `auth-ui.js` / `api-config.js` — sign-in UI and the optional shared-account API address
- `account.html` — signed-in profile settings
- `backend/` — Java account API and PostgreSQL schema
- `docs/process-flow.md` — review process
