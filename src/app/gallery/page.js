import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HeroBanner from '@/components/HeroBanner';
import ScrollToTop from '@/components/ScrollToTop';
import GalleryClient from './GalleryClient';

import fs from 'fs/promises';
import path from 'path';

export const metadata = {
  title: 'Gallery — Fly Light',
  description: 'View photos from Fly Light badminton academy training sessions, tournaments, and events.',
};

async function getGalleryImages() {
  try {
    const dataFilePath = path.join(process.cwd(), 'src', 'data', 'gallery.json');
    const data = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading gallery data on server:', error);
    return Array.from({ length: 54 }, (_, i) => `/img/gallery-${i + 1}.jpeg`);
  }
}

export default async function GalleryPage() {
  const galleryImages = await getGalleryImages();

  return (
    <>
      <Header />
      <HeroBanner title="Gallery" image="/img/gallery-head.jpeg" />
      <main>
        <section className="section">
          <GalleryClient images={galleryImages} />
        </section>
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
}
