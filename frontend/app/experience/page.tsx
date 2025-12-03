import Link from "next/link";

const birthFields = [
  { label: "Name", hint: "Preferred spelling" },
  { label: "Date of Birth", hint: "DD / MM / YYYY" },
  { label: "Time of Birth", hint: "24h" },
  { label: "Place of Birth", hint: "City, Country" },
];

const dashboardSections = [
  { title: "Identity (Ascendant)", tone: "Auric clarity", detail: "Gentle badge for rising sign and core traits." },
  { title: "Planetary Themes", tone: "Orbit balance", detail: "One-line vectors for each planet without jargon." },
  { title: "Rahu–Ketu Axis", tone: "North / South", detail: "Clean dual card showing the pull between lessons." },
  { title: "Element Balance", tone: "Tattva mix", detail: "Minimal bar set for fire, earth, air, water." },
  { title: "Symbolic Insights", tone: "Quiet lore", detail: "Tiny glyph row with tooltips for context." },
];

const chatLog = [
  { sender: "MindVibe Guide", text: "Welcome back. Ready for a calm reading?" },
  { sender: "You", text: "Yes, focus on career and travel." },
  { sender: "MindVibe Guide", text: "Noted. I will surface a focused directive with minimal ritual steps." },
];

const insightCards = [
  { label: "Dawn", text: "Slow breathwork; let the chart render before outreach." },
  { label: "Midday", text: "Send one invitation. Keep tones warm, minimal." },
  { label: "Evening", text: "Journal gratitude; keep screens dim." },
];

const matches = [
  { name: "Seeker A", score: "83", note: "Shared rituals, calm communication." },
  { name: "Seeker B", score: "78", note: "Aligned travel windows." },
];

const pastLifeMoments = [
  { era: "River-side hermitage", cue: "Quiet study", lesson: "Patience in craft" },
  { era: "Desert caravan", cue: "Trade winds", lesson: "Trust in small crews" },
];

const futureSteps = [
  { title: "Week", action: "One clear ask to allies" },
  { title: "Month", action: "Plan a gentle retreat" },
  { title: "Quarter", action: "Build a service ritual" },
];

const houses = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function ExperiencePage() {
  return (
    <div className="flow-shell">
      <div className="flow-hero">
        <div>
          <p className="eyebrow">Minimal cosmic studio</p>
          <h1>MindVibe Companion UI flow.</h1>
          <p className="muted">
            Clean, futuristic, and calm screens that move from intake to interpretation with Bharat-inspired geometry and soft gradients.
          </p>
          <div className="hero-actions">
            <Link href="/" className="button-link ghost-link">
              Back to studio hub
            </Link>
            <Link href="#birth" className="button-link">
              View the flow
            </Link>
          </div>
        </div>
        <div className="geo-orbit" aria-hidden>
          <div className="geo-node" />
          <div className="geo-node" />
          <div className="geo-node" />
          <div className="geo-ring" />
          <div className="geo-ring" />
        </div>
      </div>

      <section id="birth" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Birth input screen</p>
            <h2>Essentials-only intake</h2>
            <p className="muted">Soft card fields, generous spacing, and a quiet geometric backdrop keep focus on accuracy.</p>
          </div>
          <span className="badge">Live preview</span>
        </header>
        <div className="panel-grid">
          <div className="screen-preview soft-form">
            <div className="form-top">
              <p className="pill">Cosmic form</p>
              <p className="microcopy">Auto-validates before generating the chart.</p>
            </div>
            <div className="field-grid">
              {birthFields.map((field) => (
                <label key={field.label} className="field-card">
                  <span>{field.label}</span>
                  <input placeholder={field.hint} aria-label={field.label} />
                </label>
              ))}
            </div>
            <button className="button-link">Generate chart</button>
          </div>
          <div className="notes-card">
            <p className="eyebrow">Design notes</p>
            <ul>
              <li>Whitespace + rounded geometry for calm focus.</li>
              <li>Hints stay short; iconography only where needed.</li>
              <li>Soft glow panel anchors the entry flow.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="chart" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Chart generation</p>
            <h2>12 houses, clear at a glance</h2>
            <p className="muted">Minimal colors and subtle orbits emphasize clarity over ornament.</p>
          </div>
          <span className="badge">Interactive ready</span>
        </header>
        <div className="panel-grid">
          <div className="radial-preview" aria-label="12-house chart">
            <div className="radial-core" />
            {houses.map((house) => (
              <div key={house} className="house-chip">
                <span className="microcopy">House</span>
                <strong>{house}</strong>
              </div>
            ))}
          </div>
          <div className="notes-card">
            <p className="eyebrow">Interaction</p>
            <p className="muted">Tap a house to highlight, reveal short focus text, and expand the corresponding dashboard card.</p>
            <div className="mini-grid">
              <div className="mini-card">
                <p className="pill">Labels</p>
                <p className="microcopy">Top-aligned, no clutter.</p>
              </div>
              <div className="mini-card">
                <p className="pill">Glow</p>
                <p className="microcopy">Soft accent follows touch.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="dashboard" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Interpretation dashboard</p>
            <h2>Sectioned clarity</h2>
            <p className="muted">Cards with micro-animations and gradient highlights keep the reading serene and legible.</p>
          </div>
          <span className="badge">Calm motion</span>
        </header>
        <div className="panel-grid">
          <div className="stacked-cards">
            {dashboardSections.map((section) => (
              <article key={section.title} className="section-card">
                <div className="section-card__header">
                  <h3>{section.title}</h3>
                  <span className="pill">{section.tone}</span>
                </div>
                <p className="microcopy">{section.detail}</p>
                <div className="section-card__glow" aria-hidden />
              </article>
            ))}
          </div>
          <div className="notes-card">
            <p className="eyebrow">Navigation</p>
            <ul>
              <li>Scroll-snap between sections with soft gradient markers.</li>
              <li>Active card lifts slightly; rest stay muted.</li>
              <li>Tooltips keep explanations brief.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="chat" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Chat module</p>
            <h2>MindVibe Guide, conversational</h2>
            <p className="muted">Modern chat bubbles, floating input, and a minimal avatar keep focus on the exchange.</p>
          </div>
          <span className="badge">Soft mode</span>
        </header>
        <div className="panel-grid">
          <div className="chat-preview">
            <div className="chat-avatar" aria-hidden>BG</div>
            <div className="chat-window" aria-label="Chat conversation">
              {chatLog.map((item) => (
                <div key={item.text} className={`chat-bubble ${item.sender === "You" ? "chat-bubble--you" : ""}`}>
                  <p className="microcopy">{item.sender}</p>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
            <div className="chat-input" aria-label="Message input">
              <span className="microcopy">Type to ask the guide…</span>
              <button className="button-link">Send</button>
            </div>
          </div>
          <div className="notes-card">
            <p className="eyebrow">Flow</p>
            <p className="muted">Supports light and dark palettes, uses subtle dividers, and keeps the send bar floating for thumb reach.</p>
          </div>
        </div>
      </section>

      <section id="insights" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Daily insights</p>
            <h2>Calm cards, symbolic cues</h2>
            <p className="muted">Short, shareable lines with clean iconography and generous breathing room.</p>
          </div>
          <span className="badge">One-glance</span>
        </header>
        <div className="panel-grid">
          <div className="insight-grid">
            {insightCards.map((insight) => (
              <div key={insight.label} className="insight-pill">
                <p className="microcopy">{insight.label}</p>
                <p>{insight.text}</p>
              </div>
            ))}
          </div>
          <div className="notes-card">
            <p className="eyebrow">Delivery</p>
            <ul>
              <li>Cards slide subtly when tapped.</li>
              <li>Use gentle icons only where clarity improves.</li>
              <li>Responsive layout keeps text short and centered.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="matchmaking" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Matchmaking & timelines</p>
            <h2>Dual profiles, sacred geometry</h2>
            <p className="muted">Centered score wheels and dual cards keep the experience balanced and serene.</p>
          </div>
          <span className="badge">Guided flow</span>
        </header>
        <div className="panel-grid">
          <div className="match-grid">
            {matches.map((match) => (
              <div key={match.name} className="match-card">
                <p className="microcopy">{match.name}</p>
                <div className="score-wheel" aria-hidden>
                  <span>{match.score}</span>
                </div>
                <p className="muted">{match.note}</p>
              </div>
            ))}
          </div>
          <div className="notes-card">
            <p className="eyebrow">Balance</p>
            <p className="muted">Score wheels align at center; more details stay behind taps to keep the view uncluttered.</p>
          </div>
        </div>
      </section>

      <section id="past" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Past lives</p>
            <h2>Flow + information</h2>
            <p className="muted">Soft cards for era, cue, and lesson keep the story lightweight.</p>
          </div>
          <span className="badge">Story-ready</span>
        </header>
        <div className="panel-grid">
          <div className="past-grid">
            {pastLifeMoments.map((moment) => (
              <div key={moment.era} className="past-card">
                <p className="microcopy">{moment.era}</p>
                <p className="muted">{moment.cue}</p>
                <p>{moment.lesson}</p>
              </div>
            ))}
          </div>
          <div className="notes-card">
            <p className="eyebrow">Flow</p>
            <p className="muted">Swipe through eras, open a deeper view only when requested, and keep remedies to concise lines.</p>
          </div>
        </div>
      </section>

      <section id="future" className="ui-panel">
        <header className="panel-header">
          <div>
            <p className="eyebrow">Future directives</p>
            <h2>Quiet, guided layout</h2>
            <p className="muted">Each action is a single card with a soft gradient highlight on focus.</p>
          </div>
          <span className="badge">Action light</span>
        </header>
        <div className="panel-grid">
          <div className="future-grid">
            {futureSteps.map((step) => (
              <div key={step.title} className="future-card">
                <p className="microcopy">{step.title}</p>
                <p>{step.action}</p>
              </div>
            ))}
          </div>
          <div className="notes-card">
            <p className="eyebrow">Flow</p>
            <p className="muted">Micro-animations guide focus; users can tap to save or share without leaving the calm viewport.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
