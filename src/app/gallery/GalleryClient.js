'use client';

import { useState, useCallback } from 'react';
import Lightbox from '@/components/Lightbox';

export default function GalleryClient({ images }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  return (
    <>
      <div className="gallery-grid">
        {images.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', gridColumn: 'span 3', padding: '40px 0', fontSize: '1.1rem' }}>
            No photos published in the gallery yet.
          </p>
        ) : (
          images.map((src, i) => (
            <div
              key={i}
              className="gallery-item"
              onClick={() => openLightbox(i)}
            >
              <img src={src} alt={`Gallery image ${i + 1}`} loading="lazy" />
            </div>
          ))
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={goPrev}
          onNext={goNext}
        />
      )}
    </>
  );
}
