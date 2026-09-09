import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import ScrollToTop from '@/components/ScrollToTop';

export const metadata = {
  title: 'Resources — Fly Light',
  description: 'Badminton resources and educational PDFs for players - rules, tactics, nutrition, footwork, and injury prevention guides.',
};

const pdfs = [
  { title: 'Badminton Steps to Success', file: 'Badminton_Steps_to_Success.pdf' },
  { title: 'Laws of Badminton', file: 'Laws_of_Badminton.pdf' },
  { title: 'Introduction to Nutrition Guide', file: 'introduction-to-nutrition.pdf' },
  { title: 'Food for Badminton Players', file: 'food_bad.pdf' },
  { title: 'Nutrition Presentation Specific for Badminton', file: 'Nutrition-Presentation-specific-for-Badminton.pdf' },
  { title: 'General Competition Regulations', file: 'GENERAL_COMPETITION_REGULATIONS.pdf' },
  { title: 'Footwork Guide', file: 'footwork_guide.pdf' },
  { title: 'Tactics in Badminton Singles', file: 'TacticsInBadmintonSingles.pdf' },
  { title: 'Tactics in Badminton Doubles', file: 'Badminton_Doubles.pdf' },
  { title: 'Badminton-Related Musculoskeletal Injuries', file: 'Badminton_injuries.pdf' },
  { title: 'General Badminton Injuries', file: 'Badminton_injuries_2.pdf' },
  { title: 'Badminton Injuries: Incidence, Characteristics and Risk Factors', file: 'badminton_injuries_3.pdf' },
  { title: 'Journal of Physical Education & Sports', file: 'journal.pdf' },
];

export default function ResourcesPage() {
  return (
    <>
      <Header />
      <HeroBanner title="Resources" image="/img/resources.jpg" />

      <main>
        <section className="section">
          <div className="container">
            {pdfs.map((pdf, i) => (
              <div key={i} className="pdf-item">
                <h3 className="pdf-heading">{pdf.title}</h3>
                <div className="pdf-container">
                  <iframe
                    loading="lazy"
                    src={`/pdf-files/${pdf.file}`}
                    title={pdf.title}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
