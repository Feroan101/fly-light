'use client';

import { useState, useMemo } from 'react';

const championships = [
  {
    heading: 'School Games Federation of India (SGFI) Regional Level 2026',
    category: 'State & SGFI',
    items: [
      { image: '/img/achive/sgfi_2026_monisha.jpg', name: 'Monisha', category: 'Selected to Represent at SGFI 2026', rank: '🎯 Selected' },
      { image: '/img/achive/sgfi_2026_chris_jones.jpg', name: 'Chris Jones', category: 'Selected to Play at SGFI 2026', rank: '🎯 Selected' },
    ],
  },
  {
    heading: 'School State 2026',
    category: 'State & SGFI',
    items: [
      { image: '/img/achive/school_state_2026_nithin_raghav.png', name: 'Nithin & Raghav', category: 'Doubles District Winners (School State)', rank: '🥇 District Winner' },
      { image: '/img/achive/school_state_2026_nithin_singles.png', name: 'Nithin', category: 'Singles District Winner (School State)', rank: '🥇 District Winner' },
      { image: '/img/achive/school_state_2026_chris_jones_squad.png', name: 'Chris Jones', category: 'District Winner - Representing Chengalpattu in School State', rank: '🥇 District Winner' },
    ],
  },
  {
    heading: 'Chengalpattu District Championship 2026',
    category: 'District 2026',
    items: [
      { image: '/img/achive/cdbc2026_u17_doubles_nithin.png', name: 'Nithin', category: 'U-17 Doubles', rank: '🥇 Winner' },
      { image: '/img/achive/cdbc2026_u17_singles_monisha.png', name: 'Monisha', category: 'U-17 Girls Singles', rank: '🥉 3rd Place' },
      { image: '/img/achive/cdbc2026_u11_doubles_runner_gowtham.jpg', name: 'Gowtham', category: 'U-11 Boys Doubles', rank: '🥈 Runner-Up' },
      { image: '/img/achive/cdbc2026_u11_doubles_3rd_harinesh_porchezian.jpg', name: 'Harinesh & Porchezian', category: 'U-11 Boys Doubles', rank: '🥉 3rd Place' },
      { image: '/img/achive/cdbc2026_u11_singles_3rd_gowtham.jpg', name: 'Gowtham', category: 'U-11 Boys Singles', rank: '🥉 3rd Place' },
    ],
  },
  {
    heading: 'Chengalpattu District Championship 2025',
    category: 'District 2025',
    items: [
      { image: '/img/achive/ragvgiri.jpeg', name: 'Giri & Raghav', category: 'U-19 Boys Doubles', rank: '🥈 2nd Place' },
      { image: '/img/achive/nithinragv.jpeg', name: 'Nithin & Raghav', category: 'U-17 Boys Doubles', rank: '🥇 1st Place' },
      { image: '/img/achive/nithin25.jpeg', name: 'Nithin', category: 'U-17 Boys Singles', rank: '🥈 2nd Place' },
      { image: '/img/achive/chris25.jpeg', name: 'Chris Jones', category: 'U-15 Boys Doubles', rank: '🥉 3rd Place' },
    ],
  },
  {
    heading: 'Chengalpattu District Championship 2024',
    category: 'District 2024',
    items: [
      { image: '/img/achive/nithin24.jpeg', name: 'Nithin', category: 'U-15 Doubles', rank: '🥇 1st Place' },
      { image: '/img/achive/nithinmoni.jpeg', name: 'Nithin & Monisha', category: 'U-15 Mixed Doubles', rank: '🥉 3rd Place' },
      { image: '/img/achive/chrisvarsh.jpeg', name: 'Chris Jones & Varshini', category: 'U-15 Mixed Doubles', rank: 'Semi-Finals' },
      { image: '/img/achive/varshmoni.jpeg', name: 'Varshini & Monisha', category: 'U-17 Doubles', rank: '🥇 1st Place' },
      { image: '/img/achive/giri24.jpeg', name: 'Saktheeswar & Giri', category: 'U-19 Doubles', rank: '🥈 2nd Place' },
    ],
  },
  {
    heading: 'School State',
    category: 'State & SGFI',
    items: [
      { image: '/img/achive/jeevs.jpeg', name: 'Jeevitha', category: 'School State Representative', rank: 'Participant' },
      { image: '/img/achive/chrisvasi.jpeg', name: 'Vaseegaran & Chris Jones', category: 'School State Doubles', rank: 'Participant' },
    ],
  },
  {
    heading: 'CM Trophy',
    category: 'CM Trophy',
    items: [
      { image: '/img/achive/cmtrophy.jpeg', name: 'Tharun & Sri Ram', category: 'Doubles', rank: '🥉 3rd Place' },
      { image: '/img/achive/cmtrophy.jpeg', name: 'Raghav', category: 'Singles', rank: '🥇 1st Place' },
      { image: '/img/achive/cmtrophy.jpeg', name: 'Nithin & Raghav', category: 'Doubles', rank: '🥈 2nd Place' },
    ],
  },
  {
    heading: 'SGFI Regional Selection',
    category: 'State & SGFI',
    items: [
      { image: '/img/achive/nithin_sfgi.jpeg', name: 'Nithin', category: 'U-19 Boys Singles', rank: '🥈 2nd Place' },
      { image: '/img/achive/giri_sfgi.jpeg', name: 'Giridharan', category: 'U-19 Boys Singles', rank: '🥉 3rd Place' },
      { image: '/img/achive/sfgi1.jpeg', name: 'FlyLight Squad', category: 'SGFI Regional', rank: 'Participants' },
      { image: '/img/achive/sfgi2.jpeg', name: 'FlyLight Doubles', category: 'SGFI Regional', rank: 'Participants' },
    ],
  },
];

export default function AchievementsClient() {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'District 2026', 'District 2025', 'District 2024', 'CM Trophy', 'State & SGFI'];

  const filteredChampionships = useMemo(() => {
    if (activeCategory === 'All') return championships;
    return championships.filter((champ) => champ.category === activeCategory);
  }, [activeCategory]);

  return (
    <section className="section">
      <div className="container">
        {/* Category Tabs */}
        <div className="achievements-filter-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`achievements-filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Championships Grids */}
        <div className="tournaments-list">
          {filteredChampionships.map((champ, i) => (
            <div key={i} className="tournament-section">
              <h3 className="tournament-title">{champ.heading}</h3>
              <div className="achievements-grid">
                {champ.items.map((item, idx) => (
                  <div key={idx} className="achievement-card">
                    <div className="card-image">
                      <img src={item.image} alt={item.name} />
                      {item.rank && (
                        <span className="card-rank-badge">{item.rank}</span>
                      )}
                    </div>
                    <div className="card-content">
                      <h4>{item.name}</h4>
                      {item.category && <span className="category">{item.category}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
