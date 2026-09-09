export default function HeroBanner({ title, image }) {
  return (
    <section className="page-hero">
      <div className="hero-bg">
        <img src={image} alt={title} />
      </div>
      <div className="hero-overlay" />
      <div className="page-hero-content">
        <h1>{title}</h1>
      </div>
    </section>
  );
}
