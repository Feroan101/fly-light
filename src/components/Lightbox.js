'use client';

import { useEffect, useCallback } from 'react';

export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (currentIndex === null || currentIndex === undefined) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        &times;
      </button>
      <button
        className="lightbox-nav lightbox-prev"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Previous image"
      >
        &#10094;
      </button>
      <img
        src={images[currentIndex]}
        alt={`Gallery image ${currentIndex + 1}`}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="lightbox-nav lightbox-next"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Next image"
      >
        &#10095;
      </button>
    </div>
  );
}
