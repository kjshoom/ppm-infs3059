const agreedSupport = [
  {
    number: '01',
    title: 'Review proposal information',
    text: 'Bring the key information needed for a consistent human review into one place.',
  },
  {
    number: '02',
    title: 'Highlight information gaps',
    text: 'Make missing or problematic proposal content visible before evaluation begins.',
  },
  {
    number: '03',
    title: 'Support the reviewer',
    text: 'Keep the final judgement with people while the framework provides structure.',
  },
];

const included = [
  'IT project proposals only',
  'Structured proposal review',
  'Missing-information warnings',
  'Human-led decision support',
  'Sample data for testing',
];

const excluded = [
  'ROI or financial-return calculations',
  'Live production deployment',
  'Enterprise-system integration',
  'External database integration',
  'Automated final decisions',
];

function CheckIcon({ attention = false }: { attention?: boolean }) {
  return (
    <span className={attention ? 'check check--attention' : 'check'} aria-hidden="true">
      {attention ? '!' : '✓'}
    </span>
  );
}

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="PPM home">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            <strong>PPM</strong>
            <small>Decision support</small>
          </span>
        </a>

        <nav aria-label="Prototype sections">
          <p className="nav-label">Product</p>
          <a className="nav-item nav-item--active" href="#overview" aria-current="page">
            <span>01</span> Overview
          </a>
          <a className="nav-item" href="#example">
            <span>02</span> Proposal check
          </a>
          <a className="nav-item" href="#scope">
            <span>03</span> Product focus
          </a>
        </nav>

        <div className="sidebar-note">
          <span className="pulse" aria-hidden="true" />
          <div>
            <strong>Human-led</strong>
            <p>This prototype does not make a final project decision.</p>
          </div>
        </div>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar">
          <a className="mobile-brand" href="#top">
            Project Portfolio Management
          </a>
          <p>INFS3059 · 2026</p>
          <a className="scope-link" href="#scope">
            View product focus <span aria-hidden="true">↘</span>
          </a>
        </header>

        <div className="content">
          <section className="intro" id="overview">
            <div>
              <p className="eyebrow">PPM · Product experience</p>
              <h1>Project portfolio management, made clearer.</h1>
              <p className="lede">
                A focused interface for checking whether an IT project proposal is ready for
                structured human evaluation.
              </p>
            </div>
            <div className="intro-tags" aria-label="Prototype principles">
              <span>IT projects only</span>
              <span>Framework first</span>
              <span>Decision support</span>
            </div>
          </section>

          <section className="process-card" aria-labelledby="process-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">How it works</p>
                <h2 id="process-heading">One simple review flow</h2>
              </div>
              <span className="status-pill">Focused scope</span>
            </div>

            <div className="process-grid">
              {agreedSupport.map((item, index) => (
                <article className="process-step" key={item.number}>
                  <div className="step-topline">
                    <span className="step-number">{item.number}</span>
                    {index < agreedSupport.length - 1 && <span className="step-line" />}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="review-grid" id="example">
            <article className="review-card">
              <div className="section-heading compact">
                <div>
                <p className="eyebrow">Example review</p>
                  <h2>Proposal readiness check</h2>
                </div>
                <span className="attention-pill">Needs attention</span>
              </div>

              <div className="proposal-title">
                <div className="project-avatar" aria-hidden="true">
                  IT
                </div>
                <div>
                  <strong>Internal Service Desk Upgrade</strong>
                  <p>Example IT project proposal</p>
                </div>
              </div>

              <ul className="check-list">
                <li>
                  <CheckIcon />
                  <span>
                    <strong>Project description</strong>
                    <small>Information provided</small>
                  </span>
                </li>
                <li>
                  <CheckIcon />
                  <span>
                    <strong>Expected timeline</strong>
                    <small>Information provided</small>
                  </span>
                </li>
                <li>
                  <CheckIcon attention />
                  <span>
                    <strong>Risk analysis</strong>
                    <small>Information missing</small>
                  </span>
                </li>
              </ul>
            </article>

            <aside className="alert-card" aria-labelledby="alert-heading">
              <div className="alert-icon" aria-hidden="true">
                !
              </div>
              <div>
                <p className="eyebrow">Framework signal</p>
                <h2 id="alert-heading">Risk analysis is missing</h2>
                <p>
                  The proposal should be flagged for human attention. No score, ranking, or
                  approval outcome is produced at this stage.
                </p>
              </div>
              <div className="review-route">
                <span>Next step</span>
                <strong>Manual review</strong>
              </div>
            </aside>
          </section>

          <section className="scope-card" id="scope" aria-labelledby="scope-heading">
            <div className="section-heading scope-heading">
              <div>
                <p className="eyebrow">Product focus</p>
                <h2 id="scope-heading">Focused by design</h2>
              </div>
              <p>
                This interface keeps the review focused on the information and signals that
                help people make a clear decision.
              </p>
            </div>

            <div className="scope-columns">
              <div>
                <h3><span className="scope-dot scope-dot--in" /> Included</h3>
                <ul>
                  {included.map((item) => (
                    <li key={item}><span aria-hidden="true">✓</span>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3><span className="scope-dot scope-dot--out" /> Not in this prototype</h3>
                <ul>
                  {excluded.map((item) => (
                    <li key={item}><span aria-hidden="true">—</span>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <footer>
            <p>PPM Decision-Support Framework · Product experience</p>
            <p>INFS3059 · Canberra · 2026</p>
          </footer>
        </div>
      </section>
    </main>
  );
}
