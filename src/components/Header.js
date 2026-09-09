'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (path) => pathname === path;

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-inner">
          <div className="header-left">
            <Link href="/" className="header-logo">
              <img src="/img/white-logo.png" alt="Fly Light" />
            </Link>

            <nav className="header-nav">
              <Link href="/" className={isActive('/') ? 'active' : ''}>Home</Link>
              <Link href="/achievements" className={isActive('/achievements') ? 'active' : ''}>Achievements</Link>

              <div className="nav-dropdown">
                <button className="nav-dropdown-trigger">
                  Gallery
                </button>
                <div className="nav-dropdown-menu">
                  <Link href="/gallery">Images</Link>
                  <Link href="/gallery/videos">Videos</Link>
                </div>
              </div>

              <Link href="/resources" className={isActive('/resources') ? 'active' : ''}>Resources</Link>
              <a href="tel:+919629525180" className={isActive('tel:+919629525180') ? 'active' : ''}>Contact Us</a>
            </nav>
          </div>


          <button
            className={`mobile-toggle ${mobileOpen ? 'open' : ''}`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        className={`mobile-nav-overlay ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile nav drawer */}
      <nav className={`mobile-nav ${mobileOpen ? 'open' : ''}`}>
        <Link href="/" className={isActive('/') ? 'active' : ''}>Home</Link>
        <Link href="/achievements" className={isActive('/achievements') ? 'active' : ''}>Achievements</Link>
        <Link href="/gallery">Gallery — Images</Link>
        <div className="mobile-nav-sub">
          <Link href="/gallery/videos">Gallery — Videos</Link>
        </div>
        <Link href="/resources" className={isActive('/resources') ? 'active' : ''}>Resources</Link>
        <div style={{ paddingTop: '24px' }}>
          <a href="tel:+919629525180" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Contact Us</a>
        </div>
      </nav>
    </>
  );
}
