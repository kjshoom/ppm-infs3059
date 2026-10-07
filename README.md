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
4. **Portfolio manager** filters projects, views one-project radar profiles or compares two to four projects, checks a Scenario A or B against budget and staff, then records a human decision.

Objectives entered in Organisation setup are available in the proposal form. Signed-in workspace changes sync to that account in PostgreSQL; the optional Test MVP mode uses temporary test data in the current tab.

After sign-in, the saved role filters the workspace screens: Project Proposers see proposal entry, Reviewers see evaluation, and Portfolio Managers see Investment Context and the portfolio screens (04–09). This is a prototype interface filter, not a security boundary. The prototype does not create an overall score, automatic ranking, recommended portfolio, or automatic final decision.

Account sign-in uses the Java API in `backend/`. The same account can be used on more than one device. After sign-in, proposal, review, comment, organisation, shortlist, scenario, and decision changes sync to that account's workspace in PostgreSQL. A sync status appears in the workplace header. If the service is unavailable, changes remain on the current device and the header offers a retry.

Visitors without an account role see a read-only demo with sample projects. They can search, inspect, and compare samples or start the Live demo tour. Proposal submission, evaluations, shortlist changes, scenario editing, and decisions require sign-in. The guest demo does not read or write saved portfolio data.

After signing in, open the profile circle and choose **Manage your PPM account** to update the name, email, or workspace role. The role is a prototype preference, not an access-control permission. Account settings remain outside the workplace workflow; the workplace sidebar no longer has an Account screen.

Account settings also lets a signed-in user permanently delete their PPM sign-in, profile, and synced workspace after confirming the action.

## Shared account API

The API uses Java 17+, Spring Boot, and PostgreSQL. It stores account credentials (as BCrypt hashes), profile details, and revocable sign-in sessions. GitHub Pages serves the frontend as static files; it does not run the Java server or provide an application database.

The API stores each signed-in account's workspace separately. This enables the same person to use the same proposals and portfolio from another device after signing in. It does not yet provide team sharing between different accounts; that requires an organisation/team membership model and permissions.

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

When the API URL is set, account registration, sign-in, profile edits, sign-out, account deletion, and password reset use the shared account service. Password recovery uses a single-use link that expires after 30 minutes; passwords are never retrievable or partially displayed. To enable email delivery, configure `PPM_PASSWORD_RESET_MAIL_ENABLED=true`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and a verified `PPM_MAIL_FROM` address in Render's environment settings. Keep mail credentials out of Git. Until a mail provider is configured, the recovery screen explains that email reset is unavailable. Run the backend tests with `cd backend && mvn test`; the integration tests use an in-memory database. This student prototype does not include email verification, distributed rate limiting, backups, or production monitoring, so it should not be used for sensitive accounts.

## Main files

- `index.html` — page structure and role views
- `app/globals.css` — responsive visual design and motion
- `app.js` — sample data, forms, review flow, comparison, scenarios, and local storage
- `auth-ui.js` / `api-config.js` — sign-in UI and the optional shared-account API address
- `account.html` — signed-in profile settings
- `backend/` — Java account API and PostgreSQL schema
- `docs/process-flow.md` — review process
