# PPM

INFS3059 prototype for reviewing project proposals and comparing portfolio options.

- Website: https://kjshoom.github.io/ppm-infs3059/
- Source code: https://github.com/kjshoom/ppm-infs3059

## How it works

The Portfolio Manager sets objectives, budget and staff capacity. Project Proposers submit proposals, Reviewers assess them against five criteria, and the Portfolio Manager compares projects, checks scenarios against available resources and records a decision.

The system shows each criterion separately. It does not rank projects or make the final decision.

The sample workspace is read-only. Sign in to work with proposals, reviews and portfolio scenarios. Signed-in users share the workspace, which is saved in PostgreSQL through the Java backend.

## Run locally

The website link above works without any setup. To run the source code, open Terminal in the repository folder and start a local server:

```sh
python3 -m http.server 4173
```

Leave the server running, then open http://127.0.0.1:4173/ in your browser. Press `Ctrl+C` in Terminal to stop it.

## Backend

The API uses Java 17+, Spring Boot and PostgreSQL. `render.yaml` contains the Render deployment setup. Add the database connection and allowed website origins in Render's environment settings, then set the API address in `api-config.js`.

Password reset needs SMTP settings in Render. Keep database and email credentials out of GitHub. Backend tests can be run with `cd backend && mvn test`.
