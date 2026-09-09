'use client';

import { useState, useCallback, useEffect } from 'react';

export default function Carousel({ items, heading }) {
  const [current, setCurrent] = useState(0);
  const total = items.length;

  const goTo = useCallback((index) => {
    setCurrent((index + total) % total);
  }, [total]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, prev]);

  return (
    <div className="carousel-section">
      {heading && <h3 className="carousel-heading">{heading}</h3>}
      <div className="carousel-container">
        <div className="carousel-viewport">
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {items.map((item, i) => (
              <div key={i} className="carousel-slide">
                <div className="achievement-card">
                  <div className="card-image">
                    <img src={item.image} alt={item.name} />
                  </div>
                  <div className="card-content">
                    <h4>{item.name}</h4>
                    <span className="category">{item.category}</span>
                    <span className="rank">{item.rank}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {total > 1 && (
          <>
            <button className="carousel-btn carousel-btn-prev" onClick={prev} aria-label="Previous">
              ❮
            </button>
            <button className="carousel-btn carousel-btn-next" onClick={next} aria-label="Next">
              ❯
            </button>
            <div className="carousel-dots">
              {items.map((_, i) => (
                <button
                  key={i}
                  className={`carousel-dot ${i === current ? 'active' : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
