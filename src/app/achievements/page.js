import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import ScrollToTop from '@/components/ScrollToTop';
import AchievementsClient from './AchievementsClient';

export const metadata = {
  title: 'Achievements — Fly Light',
  description: 'Explore the achievements of Fly Light badminton academy players in district championships, state tournaments, and national competitions.',
};

export default function AchievementsPage() {
  return (
    <>
      <Header />
      <HeroBanner title="Achievements" image="/img/achivements-head.jpg" />
      <main>
        <AchievementsClient />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
