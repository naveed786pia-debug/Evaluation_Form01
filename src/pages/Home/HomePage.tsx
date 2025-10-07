import "./home-page.css";

const featureHighlights = [
  {
    title: "Instant Preview",
    description:
      "Launch the development server with npm run dev and explore changes in real time.",
  },
  {
    title: "TypeScript Ready",
    description:
      "Grow the codebase confidently with full TypeScript support and strict settings.",
  },
  {
    title: "Routing Included",
    description:
      "Extend the app with new pages using React Router without additional setup.",
  }
];

export const HomePage = () => (
  <section className="home-hero">
    <div className="hero-card">
      <h1 className="hero-title">Welcome to your Builder workspace</h1>
      <p className="hero-subtitle">
        Everything is wired up and ready for you to start building rich experiences.
      </p>
      <div className="highlight-grid">
        {featureHighlights.map(({ title, description }) => (
          <article key={title} className="highlight-tile">
            <h2 className="highlight-title">{title}</h2>
            <p className="highlight-description">{description}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
