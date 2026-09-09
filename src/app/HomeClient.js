'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

const rankingPlayers = [
  { serial: '01', name: 'Monisha', image: '/img/achive/monistate.jpeg', category: 'U-17 & U-19 Girls Singles', rank: '#20 (U-17) · #22 (U-19)' },
  { serial: '02', name: 'Nithin', image: '/img/achive/nithinstate.jpeg', category: 'U-17 Boys Doubles', rank: '#17' },
  { serial: '03', name: 'Gowtham', image: '/img/achive/Gowtham.jpeg', category: 'U-11 Boys Singles', rank: '#17' },
  { serial: '04', name: 'Porchezhiyan & Harinesh', image: '/img/achive/Porchezihan.jpeg', category: 'U-11 Boys Doubles', rank: '#16' },
];

const locations = [
  {
    name: 'Rally Point Badminton Academy',
    address: 'Teachers Colony, Nenmeli, Chengalpattu, Tamil Nadu 603003',
    link: 'https://maps.app.goo.gl/3R7NELGZptXPYzLh6',
  },
  {
    name: 'Avalanche Badminton Academy',
    address: 'Big Maniyakara St, Gokulapuram, Tamil Nadu 603001',
    link: 'https://maps.app.goo.gl/Ttk7doMvT4jTS19w9',
  },
  {
    name: 'D 2 Badminton Academy',
    address: 'P2P2+76C, Mahindra World City, Tamil Nadu 603004',
    link: 'https://maps.app.goo.gl/2HBtE1wxPudZDcRQ6',
  },
];

const trainingPrograms = [
  {
    img: '/img/beg-img.jpeg',
    tag: 'FOUNDATION | BEGINNERS BATCH',
    badgeTag: 'Indoor',
    title: 'Beginner Program',
    desc: 'Perfect for those starting their badminton journey. Learn the fundamentals, proper grip, and basic footwork while developing a true love for the game.',
    link: 'tel:+919629525180',
  },
  {
    img: '/img/inter-img.jpeg',
    tag: 'DEVELOPMENT | COMPETITIVE SQUAD',
    badgeTag: 'Outdoor area',
    title: 'Intermediate Program',
    desc: 'Develop advanced court movement, technical precision, and competitive stamina. Build on core fundamentals with complex game strategies.',
    link: 'tel:+919629525180',
  },
  {
    img: '/img/pro-img.jpeg',
    tag: 'ADVANCED | PRO LEVEL COACHING',
    badgeTag: 'Pro court',
    title: 'Professional Coaching',
    desc: 'Elite tactical training and physical conditioning for advanced and ranking players. Refine your competitive edge under high-performance plans.',
    link: 'tel:+919629525180',
  },
];

const generalFaq = [
  {
    id: 'g1',
    q: 'Do you offer a trial session for new students?',
    a: 'Yes! We offer a free 1-hour trial session for beginners and intermediate players to evaluate their skills and find the right batch. Please register in advance by calling or emailing us.'
  },
  {
    id: 'g2',
    q: 'What age groups do you accept for coaching?',
    a: 'We train players of all ages, starting from children as young as 5 years old (for our Beginners Batch) up to adults and competitive senior players.'
  },
  {
    id: 'g3',
    q: 'What equipment do I need to bring for the first class?',
    a: 'You should bring your own badminton racket, non-marking sports shoes, and comfortable athletic wear. Shuttlecocks are provided by the academy during training sessions.'
  },
  {
    id: 'g4',
    q: 'Who will be coaching the sessions?',
    a: 'All sessions are led or supervised by our head coach Lokeshmaran (former national player) and senior NIS certified coach Kirthi Vasan.'
  },
  {
    id: 'g5',
    q: 'How do you determine player levels (Beginner, Intermediate, Pro)?',
    a: 'During the trial class, our coaches assess footwork, grip, shot consistency, and match play to place the student in the most appropriate skill level.'
  }
];

const billingFaq = [
  {
    id: 'b1',
    q: 'Is the coaching fee paid monthly or quarterly?',
    a: 'Fees can be paid monthly, quarterly, or half-yearly. We offer special discounts for quarterly and annual packages.'
  },
  {
    id: 'b2',
    q: 'Can I choose or change my batch timings?',
    a: 'Yes, subject to slot availability. We have multiple weekday and weekend batches (morning and evening). You can request a batch change through our administration.'
  },
  {
    id: 'b3',
    q: 'What is your policy for missed classes?',
    a: 'No rearrangement or makeup sessions will be provided for missed classes.'
  },
  {
    id: 'b4',
    q: 'Are there admissions open for intermediate/pro levels?',
    a: 'Yes! Admissions are open year-round for all levels. However, advanced/pro batches require a mandatory assessment by the head coach before enrollment.'
  },
  {
    id: 'b5',
    q: 'How does the training calendar work?',
    a: 'We follow a structured monthly syllabus focusing on footwork, stamina, technical shots, and match tactics. Periodic reviews are conducted to track student progress.'
  }
];

export default function HomeClient() {
  const [showSplash, setShowSplash] = useState(false);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealMission, setRevealMission] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [playersList, setPlayersList] = useState(rankingPlayers);

  const toggleFaq = (id) => {
    setOpenFaq(prev => prev === id ? null : id);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        if (Array.isArray(data)) {
          setPlayersList(data);
        }
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
      }
    };
    fetchLeaderboard();
  }, []);

  const missionRef = (el) => {
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setRevealMission(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(el);
  };

  useEffect(() => {
    // Check if splash screen has been shown in the current session
    const hasShown = sessionStorage.getItem('splashShown');
    if (!hasShown) {
      setShowSplash(true);
      document.body.style.overflow = 'hidden';
      
      // Trigger smooth fade-out exit transition at 1.4s
      const exitTimer = setTimeout(() => {
        setFadeOutSplash(true);
      }, 1400);

      // Unmount splash overlay and restore scrolling at 1.8s
      const unmountTimer = setTimeout(() => {
        setShowSplash(false);
        document.body.style.overflow = '';
        sessionStorage.setItem('splashShown', 'true');
      }, 1800);

      return () => {
        document.body.style.overflow = '';
        clearTimeout(exitTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, []);

  return (
    <>
      {/* Cinematic Logo Splash Screen */}
      {showSplash && (
        <div className={`splash-overlay active ${fadeOutSplash ? 'fade-out' : ''}`}>
          <div className="splash-container">
            <div className="splash-logo-wrap">
              <img
                src="/img/white-logo.png"
                alt="FlyLight Badminton Academy"
                className="splash-logo-img"
              />
            </div>
          </div>
        </div>
      )}

      <Header />

      {/* Hero Section */}
      <section className="hero-premium">
        <div className="hero-bg">
          <video autoPlay loop muted playsInline style={{ objectFit: 'cover', width: '100%', height: '100%' }}>
            <source src="/img/hero-bg.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="hero-overlay" />
        
        {/* Main large text in the center/right */}
        <div className="hero-main-container">
          <div className="hero-bg-text">
            <div>CHAMPIONS AREN&apos;T</div>
            <div>MADE IN ONE DAY ,</div>
          </div>
          <h1 className="hero-title-premium">
            <span className="hero-script-text">don&apos;t give up</span>
          </h1>
        </div>

        {/* Bottom Left: Signature and Coach Info */}
        <div className="hero-bottom-left">
          <div className="hero-signature">
            <img src="/img/loki-signature.png" alt="Lokeshmaran Signature" />
          </div>
          <div className="hero-author-name">Lokeshmaran</div>
          <div className="hero-author-title">
            Former National Player &amp; Head Coach
            <br />
            FlyLight School of Badminton
          </div>
        </div>

        {/* Bottom Right: Floating CTA Strip */}
        <div className="hero-bottom-right">
          <div className="cta-strip">
            <span className="cta-badge">ADMISSIONS OPEN</span>
            <a href="tel:+919629525180" className="cta-button">
              join our coaching
            </a>
          </div>
        </div>
      </section>

      <main>
        {/* Mission Section with Scroll Reveal */}
        <section ref={missionRef} className={`mission-section ${revealMission ? 'reveal' : ''}`}>
          <div className="container">
            <div className="mission-layout">
              <div className="mission-title-col">
                <h2 className="mission-title">our mission</h2>
              </div>
              <div className="mission-text-col">
                <p className="mission-text">
                  Nurturing and shaping the talent of the kids and laying the foundation to their badminton journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Training Programs */}
        <section className="section" id="training-programs">
          <div className="container">
            <div className="programs-layout">
              {/* Left Column: Static Pitch */}
              <div className="programs-left">
                <span className="programs-badge">our programs</span>
                <h2 className="programs-heading">
                  {trainingPrograms[activeIndex].desc}
                </h2>
                <a href="tel:+919629525180" className="programs-cta-btn">
                  Get in touch
                  <span className="btn-arrow-circle">↗</span>
                </a>
              </div>

              {/* Right Column: Sliding Active Cards */}
              <div className="programs-right">
                <div className="programs-slider-container">
                  <div className="programs-slider-viewport">
                    <div 
                      className="programs-slider-row"
                      style={{ transform: `translateX(-${activeIndex * 352}px)` }}
                    >
                      {trainingPrograms.map((program, i) => (
                        <div 
                          key={i} 
                          className={`program-slide-card ${i === activeIndex ? 'active' : ''}`}
                          onClick={() => setActiveIndex(i)}
                        >
                          <div className="program-slide-card-overlay" />
                          <img src={program.img} alt={program.title} />
                           <a 
                            href={program.link} 
                            className="program-slide-card-arrow"
                            onClick={(e) => e.stopPropagation()}
                          >
                            ↗
                          </a>
                          <span className="program-slide-card-label">{program.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="program-slider-bottom">
                    <div className="program-slider-controls">
                      <button 
                        className="program-slider-arrow-btn"
                        onClick={() => setActiveIndex((prev) => (prev - 1 + trainingPrograms.length) % trainingPrograms.length)}
                        aria-label="Previous batch"
                      >
                        &larr;
                      </button>
                      <button 
                        className={`program-slider-arrow-btn active`}
                        onClick={() => setActiveIndex((prev) => (prev + 1) % trainingPrograms.length)}
                        aria-label="Next batch"
                      >
                        &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TNBA Ranking Players */}
        <section className="section-minimal" id="ranking">
          <div className="container-minimal">
            <div className="minimal-section-header">
              <span className="minimal-badge">ranking players</span>
              <h2 className="minimal-title">TNBA Ranking Players</h2>
            </div>
            
            <div className="ranking-list-minimal">
              <div className="ranking-header-minimal">
                <span>#</span>
                <span>Player</span>
                <span>Category</span>
                <span>Rank</span>
              </div>
              {playersList.map((player, i) => (
                <div key={i} className="ranking-row-minimal">
                  <div className="ranking-serial-minimal">{player.serial}</div>
                  <div className="ranking-player-minimal">
                    <img className="ranking-avatar-minimal" src={player.image} alt={player.name} />
                    <span className="ranking-name-minimal">{player.name}</span>
                  </div>
                  <div className="ranking-category-minimal">{player.category}</div>
                  <div className="ranking-rank-minimal">{player.rank}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Coaches Preview */}
        <section className="section-minimal-light" id="coaches">
          <div className="container-minimal">
            <div className="minimal-section-header">
              <span className="minimal-badge">+ our team</span>
              <h2 className="minimal-title">our coaches</h2>
            </div>
          </div>

          <div className="coaches-board">
            <div className="coaches-grid">
              <div className="coach-item">
                <div className="coach-info">
                  <span className="coach-name">lokeshmaran</span>
                  <span className="coach-role">former national player &amp; head coach</span>
                </div>
                <div className="coach-img-wrap">
                  <img src="/img/loki_coach.jpeg" alt="Lokeshmaran - Head Coach" />
                </div>
              </div>

              <div className="coach-item">
                <div className="coach-info">
                  <span className="coach-name">kirthi vasan</span>
                  <span className="coach-role">nis certified coach</span>
                </div>
                <div className="coach-img-wrap">
                  <img src="/img/kiri_coach.jpeg" alt="Kirthi Vasan - Coach" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section" id="faq">
          <div className="container-minimal">
            
            {/* Category 1: General */}
            <div className="faq-category-block">
              <div className="faq-sidebar">
                <h2 className="faq-category-title">General FAQs</h2>
                <p className="faq-sidebar-text">
                  Everything you need to know about the academy and our coaching programs. Can&apos;t find an answer? <a href="tel:+919629525180" className="faq-chat-link">Call our team</a>.
                </p>
              </div>
              <div className="faq-accordion-list">
                {generalFaq.map((item) => {
                  const isOpen = openFaq === item.id;
                  return (
                    <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button className="faq-question-btn" onClick={() => toggleFaq(item.id)}>
                        <span className="faq-question">{item.q}</span>
                        <span className="faq-icon-wrap">
                          {isOpen ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </span>
                      </button>
                      <div className="faq-answer-wrap">
                        <div className="faq-answer">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category 2: Billing & Coaching */}
            <div className="faq-category-block divider">
              <div className="faq-sidebar">
                <h2 className="faq-category-title">Billing FAQs</h2>
                <p className="faq-sidebar-text">
                  Everything you need to know about fees, admissions, and scheduling. Can&apos;t find an answer? <a href="mailto:flylight@gmail.com" className="faq-chat-link">Email our team</a>.
                </p>
              </div>
              <div className="faq-accordion-list">
                {billingFaq.map((item) => {
                  const isOpen = openFaq === item.id;
                  return (
                    <div key={item.id} className={`faq-item ${isOpen ? 'open' : ''}`}>
                      <button className="faq-question-btn" onClick={() => toggleFaq(item.id)}>
                        <span className="faq-question">{item.q}</span>
                        <span className="faq-icon-wrap">
                          {isOpen ? (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          ) : (
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="12" y1="8" x2="12" y2="16"></line>
                              <line x1="8" y1="12" x2="16" y2="12"></line>
                            </svg>
                          )}
                        </span>
                      </button>
                      <div className="faq-answer-wrap">
                        <div className="faq-answer">
                          <p>{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* Locations */}
        <section className="section-minimal-light" id="locations" style={{ paddingBottom: '80px' }}>
          <div className="container-minimal">
            <div className="minimal-section-header">
              <span className="minimal-badge">+ where we train</span>
              <h2 className="minimal-title">locations</h2>
            </div>

            <div className="locations-grid">
              {locations.map((loc, i) => (
                <a
                  key={i}
                  href={loc.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-item-minimal"
                >
                  <div className="location-item-top">
                    <span className="location-number">0{i + 1}</span>
                    <span className="location-arrow">↗</span>
                  </div>
                  <h3 className="location-name-minimal">{loc.name}</h3>
                  <p className="location-addr-minimal">{loc.address}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Strip */}
        <section className="contact-strip">
          <a href="tel:+919629525180" className="contact-item">
            <div className="contact-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <h3>+91 96295 25180</h3>
              <p>Call us anytime!</p>
            </div>
          </a>
          <a href="mailto:flylight@gmail.com" className="contact-item">
            <div className="contact-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <div>
              <h3>flylight@gmail.com</h3>
              <p>Contact us anytime!</p>
            </div>
          </a>
        </section>
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
