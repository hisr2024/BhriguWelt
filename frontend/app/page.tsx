import AnimatedLogo from "../components/AnimatedLogo";
import FeatureCard from "../components/FeatureCard";

const features = [
  {
    title: "Unified insight engine",
    description:
      "Coordinate horoscope, past-life, and future guidance in one session, with a narrative summary that never overwhelms newcomers.",
  },
  {
    title: "Inclusive multilingual responses",
    description:
      "Every result is optimized for clear English and refined Hindi, with room to add regional voices so global seekers feel seen.",
  },
  {
    title: "Action-ready next steps",
    description:
      "Receive precise, compassionate recommendations that translate manuscripts into modern routines, checkpoints, and mentoring cues.",
  },
];

const inputs = [
  {
    eyebrow: "Inputs",
    title: "Birth profile intake",
    description:
      "Collect name, birth date, time, and place with friendly form guidance and inclusive reminders for uncertain time windows.",
  },
  {
    eyebrow: "Inputs",
    title: "Intent & question prompts",
    description:
      "Capture what the seeker wants most—relationships, career, or wellbeing—so the engine can tailor outputs without bias.",
  },
  {
    eyebrow: "Inputs",
    title: "Contextual preferences",
    description:
      "Let users choose tone, language, and delivery style with accessible toggles that support screen readers and keyboard flow.",
  },
];

const outputs = [
  "Personalized manuscript summary with human-first phrasing",
  "Clear karmic timeline with next-step signals",
  "Charts, highlights, and shareable insights",
  "Guided prompts for follow-up questions",
];

const engines = [
  {
    eyebrow: "Engine",
    title: "Horoscope intelligence",
    description: "Precise Panchanga alignment and chart-based reasoning for daily clarity.",
  },
  {
    eyebrow: "Engine",
    title: "Past-life narratives",
    description: "Contextual storytelling that honors tradition while staying sensitive to lived experiences.",
  },
  {
    eyebrow: "Engine",
    title: "Future guidance",
    description: "Actionable projections translated into timelines, rituals, and growth milestones.",
  },
  {
    eyebrow: "Engine",
    title: "Matchmaking harmony",
    description: "Dual-profile compatibility analysis with inclusive partnership language.",
  },
];

export default function Home() {
  return (
    <div id="top" className="app-shell">
      <section className="hero">
        <div>
          <p className="engine-badge">World-class Bhrigu guidance</p>
          <h1 className="hero-title">Illuminate destiny with graceful, human-first astrology.</h1>
          <p className="hero-subtitle">
            BhriguWelt blends ancient manuscripts with modern accessibility. Experience gentle motion, supportive
            typography, and empathetic color so every seeker feels welcomed and guided.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#outputs">
              View live outputs
            </a>
            <a className="button secondary" href="#features">
              Explore features
            </a>
          </div>
        </div>
        <AnimatedLogo />
      </section>

      <section id="features" className="section">
        <div className="section-header">
          <h2 className="section-title">A luminous experience from input to insight</h2>
          <p className="section-description">
            Every screen is designed to highlight the app’s strongest capabilities—capturing precise inputs, rendering
            charts, and delivering outcomes that inspire action.
          </p>
        </div>
        <div className="card-grid">
          {features.map((feature) => (
            <FeatureCard key={feature.title} title={feature.title} description={feature.description} />
          ))}
        </div>
      </section>

      <section id="inputs" className="section">
        <div className="section-header">
          <h2 className="section-title">Thoughtful inputs for trusted outcomes</h2>
          <p className="section-description">
            Inclusive design keeps every form approachable while ensuring the engines receive the details they need to
            respond with precision.
          </p>
        </div>
        <div className="card-grid">
          {inputs.map((input) => (
            <FeatureCard key={input.title} eyebrow={input.eyebrow} title={input.title} description={input.description} />
          ))}
        </div>
      </section>

      <section id="outputs" className="section">
        <div className="section-header">
          <h2 className="section-title">Outputs that feel ready to share</h2>
          <p className="section-description">
            A soft, high-contrast palette and clear hierarchy keep results readable, while hover and focus states bring
            attention to the most important recommendations.
          </p>
        </div>
        <ul className="output-list" aria-label="Output highlights">
          {outputs.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section id="engines" className="section">
        <div className="section-header">
          <h2 className="section-title">Powered by BhriguWelt engines</h2>
          <p className="section-description">
            Each engine is tuned for accuracy, accessibility, and reassurance—so guidance lands with clarity and care.
          </p>
        </div>
        <div className="card-grid">
          {engines.map((engine) => (
            <FeatureCard key={engine.title} eyebrow={engine.eyebrow} title={engine.title} description={engine.description} />
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>
          BhriguWelt respects every journey. Designed with inclusive language, accessible contrast, and calm motion so
          every seeker can engage with confidence.
        </p>
      </footer>
    </div>
  );
}
