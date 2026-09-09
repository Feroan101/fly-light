import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import ScrollToTop from '@/components/ScrollToTop';

export const metadata = {
  title: 'Video Gallery — Fly Light',
  description: 'Watch training videos, tournament highlights, and coaching sessions from Fly Light badminton academy.',
};

const videos = [
  { id: 'VIDEO_ID_1', title: 'Training Session 1' },
  { id: 'VIDEO_ID_2', title: 'Training Session 2' },
  { id: 'VIDEO_ID_3', title: 'Training Session 3' },
  { id: 'VIDEO_ID_4', title: 'Tournament Highlights 1' },
  { id: 'VIDEO_ID_5', title: 'Tournament Highlights 2' },
];

export default function VideoGalleryPage() {
  return (
    <>
      <Header />
      <HeroBanner title="Video Gallery" image="/img/gallery-head.jpeg" />

      <main>
        <section className="section">
          <div className="container">
            <div className="video-grid">
              {videos.map((video, i) => (
                <div key={i} className="video-wrapper">
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
