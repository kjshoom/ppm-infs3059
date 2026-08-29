# PPM — Project Portfolio Management

A focused web experience for the INFS3059 project. The landing page uses a bold editorial portfolio treatment, while the review workspace follows a search–filter–list–detail pattern.

The prototype reflects the current agreed direction after the professor's feedback:

- focus on IT project proposals;
- prioritise the decision-support framework;
- identify missing proposal information;
- support, rather than replace, human judgement; and
- exclude scoring rules, weights, and approval automation until the team agrees on them.

## Open the prototype

Open `index.html` in a browser. The primary prototype is static and has no build or database dependency.

Public demo: https://kjshoom.github.io/ppm-infs3059/

## Continue developing

The main prototype is intentionally easy to extend:

- `index.html` contains the page structure, copy, proposal workspace, comparison dialog, and review form.
- `app/globals.css` contains the Toss-inspired visual system, responsive layout, and scroll-reveal motion.
- `app.js` contains search, filters, sorting, compare selection, proposal details, and locally saved reviewer notes.
- `public/` contains the folder visual and other static assets.

Edit these files on a branch, open the page locally, and use a pull request when you want the team to review a change.

For a local URL, run:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Working interactions

- Search proposals by project, owner, category, or description.
- Filter by missing information, manual review, or ready state.
- Sort by update order, project title, or number of information gaps.
- Select a proposal to inspect its information and illustrative review pathway.
- Compare up to three proposals side by side.
- Save reviewer notes locally in the current browser.

The sample pathways are illustrative. The site does not include final scores, weights, ranking, approval, or rejection logic.

## Current scope

Included: structured proposal review, information-gap warnings, human-led review, and sample data for testing.

Excluded: final criteria scores or weights, ROI calculations, live production deployment, enterprise-system integration, external database integration, and automated final decisions.

## Editable design

Figma: https://www.figma.com/design/tUSOosUXvR7HbQx3P4Axpj
