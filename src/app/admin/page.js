'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('leaderboard');

  // Leaderboard state
  const [players, setPlayers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [playerCategory, setPlayerCategory] = useState('');
  const [playerRank, setPlayerRank] = useState('');
  const [playerAvatar, setPlayerAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingPlayerIndex, setEditingPlayerIndex] = useState(null);

  // Gallery state
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check auth in session
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('adminAuth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
      fetchLeaderboard();
      fetchGallery();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === 'flylight2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('adminAuth', 'true');
      setError('');
      fetchLeaderboard();
      fetchGallery();
    } else {
      setError('Invalid password. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('adminAuth');
    setPassword('');
  };

  // Fetch functions
  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPlayers(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    }
  };

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      const data = await res.json();
      if (Array.isArray(data)) {
        setGalleryImages(data);
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
    }
  };

  // Avatar Upload
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', 'flylight2026');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setPlayerAvatar(data.url);
      } else {
        alert(data.error || 'Failed to upload avatar');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Save Leaderboard
  const saveLeaderboard = async (updatedPlayers) => {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'flylight2026',
          data: updatedPlayers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPlayers(updatedPlayers);
        resetPlayerForm();
      } else {
        alert(data.error || 'Failed to save leaderboard');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save data');
    }
  };

  const resetPlayerForm = () => {
    setPlayerName('');
    setPlayerCategory('');
    setPlayerRank('');
    setPlayerAvatar('');
    setEditingPlayerIndex(null);
  };

  const handlePlayerSubmit = (e) => {
    e.preventDefault();
    if (!playerName || !playerCategory || !playerRank) {
      alert('Please fill out Name, Category, and Rank');
      return;
    }

    const playerObj = {
      serial: '', // will recalculate below
      name: playerName,
      image: playerAvatar || '/img/default.jpg',
      category: playerCategory,
      rank: playerRank,
    };

    let updatedPlayers = [...players];
    if (editingPlayerIndex !== null) {
      updatedPlayers[editingPlayerIndex] = playerObj;
    } else {
      updatedPlayers.push(playerObj);
    }

    // Recalculate serials (01, 02, etc.)
    updatedPlayers = updatedPlayers.map((p, idx) => ({
      ...p,
      serial: String(idx + 1).padStart(2, '0'),
    }));

    saveLeaderboard(updatedPlayers);
  };

  const handleEditPlayer = (index) => {
    const player = players[index];
    setPlayerName(player.name);
    setPlayerCategory(player.category);
    setPlayerRank(player.rank);
    setPlayerAvatar(player.image);
    setEditingPlayerIndex(index);
  };

  const handleDeletePlayer = (index) => {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    let updatedPlayers = players.filter((_, idx) => idx !== index);
    // Recalculate serials
    updatedPlayers = updatedPlayers.map((p, idx) => ({
      ...p,
      serial: String(idx + 1).padStart(2, '0'),
    }));
    
    saveLeaderboard(updatedPlayers);
  };

  // Gallery Upload
  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', 'flylight2026');

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setGalleryImages((prev) => [data.image, ...prev]);
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  // Gallery Delete
  const handleGalleryDelete = async (imagePath) => {
    if (!confirm('Are you sure you want to delete this photo from the gallery?')) return;

    try {
      const res = await fetch('/api/gallery', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: 'flylight2026',
          imagePath,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGalleryImages((prev) => prev.filter((img) => img !== imagePath));
      } else {
        alert(data.error || 'Failed to delete photo');
      }
    } catch (err) {
      console.error(err);
      alert('Delete failed');
    }
  };

  return (
    <>
      <Header />
      
      <main className="admin-page-wrap">
        {!isAuthenticated ? (
          /* Login Screen */
          <section className="admin-login-sec">
            <div className="admin-login-card">
              <h2 className="admin-title">Admin Access</h2>
              <p className="admin-sub">Enter password to manage FlyLight website.</p>
              
              <form onSubmit={handleLogin} className="admin-form">
                <input
                  type="password"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="admin-input"
                  required
                />
                {error && <p className="admin-error-text">{error}</p>}
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                  Login
                </button>
              </form>
            </div>
          </section>
        ) : (
          /* Admin Panel Dashboard */
          <section className="admin-dashboard-sec">
            <div className="container-minimal">
              <div className="admin-dash-header">
                <div>
                  <h1 className="admin-dash-title">Admin Control Panel</h1>
                  <p className="admin-dash-sub">Manage achievements leaderboard &amp; gallery photos</p>
                </div>
                <button onClick={handleLogout} className="admin-logout-btn">
                  Logout
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="admin-tabs">
                <button
                  className={`admin-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('leaderboard')}
                >
                  Leaderboard Manager
                </button>
                <button
                  className={`admin-tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                  onClick={() => setActiveTab('gallery')}
                >
                  Gallery Manager
                </button>
              </div>

              {/* TAB 1: Leaderboard Manager */}
              {activeTab === 'leaderboard' && (
                <div className="admin-tab-content">
                  <div className="admin-grid-2">
                    
                    {/* Add/Edit Form */}
                    <div className="admin-card">
                      <h3>{editingPlayerIndex !== null ? 'Edit Player Details' : 'Add New Player'}</h3>
                      <form onSubmit={handlePlayerSubmit} className="admin-form-fields">
                        <div className="admin-form-group">
                          <label>Full Name</label>
                          <input
                            type="text"
                            placeholder="e.g., Monisha"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label>Category</label>
                          <input
                            type="text"
                            placeholder="e.g., U-15 Girls Doubles"
                            value={playerCategory}
                            onChange={(e) => setPlayerCategory(e.target.value)}
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label>State Ranking</label>
                          <input
                            type="text"
                            placeholder="e.g., #9"
                            value={playerRank}
                            onChange={(e) => setPlayerRank(e.target.value)}
                            required
                          />
                        </div>

                        <div className="admin-form-group">
                          <label>Profile Avatar</label>
                          <div className="admin-avatar-row">
                            <img
                              src={playerAvatar || '/img/default.jpg'}
                              alt="Avatar Preview"
                              className="admin-avatar-preview"
                            />
                            <div className="admin-upload-btn-wrap">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                id="avatar-file"
                              />
                              <label htmlFor="avatar-file" className="admin-file-label">
                                {uploadingAvatar ? 'Uploading...' : 'Choose Photo'}
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="admin-form-buttons">
                          <button type="submit" className="btn-primary">
                            {editingPlayerIndex !== null ? 'Save Changes' : 'Add Player'}
                          </button>
                          {editingPlayerIndex !== null && (
                            <button type="button" onClick={resetPlayerForm} className="admin-btn-cancel">
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Current Players Table */}
                    <div className="admin-card">
                      <h3>Active Leaderboard ({players.length} Players)</h3>
                      <div className="admin-players-list">
                        {players.length === 0 ? (
                          <p style={{ color: 'var(--text-muted)' }}>No players found on leaderboard.</p>
                        ) : (
                          players.map((player, idx) => (
                            <div key={idx} className="admin-player-row">
                              <div className="admin-player-meta">
                                <span className="admin-player-serial">{player.serial}</span>
                                <img src={player.image} alt={player.name} className="admin-player-thumb" />
                                <div>
                                  <h4 className="admin-player-name">{player.name}</h4>
                                  <p className="admin-player-cat">{player.category} • <strong style={{ color: 'var(--accent)' }}>{player.rank}</strong></p>
                                </div>
                              </div>
                              <div className="admin-row-actions">
                                <button onClick={() => handlePlayerSubmit} style={{ display: 'none' }} />
                                <button onClick={() => handleEditPlayer(idx)} className="admin-btn-edit">
                                  Edit
                                </button>
                                <button onClick={() => handleDeletePlayer(idx)} className="admin-btn-delete">
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 2: Gallery Manager */}
              {activeTab === 'gallery' && (
                <div className="admin-tab-content">
                  
                  {/* Photo Uploader Widget */}
                  <div className="admin-card" style={{ marginBottom: '32px' }}>
                    <h3>Upload New Photo to Gallery</h3>
                    <div className="admin-drop-zone">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryUpload}
                        id="gallery-file"
                      />
                      <label htmlFor="gallery-file" className="admin-drop-label">
                        {uploadingImage ? (
                          <div className="admin-spinner-row">
                            <span className="admin-spinner"></span>
                            <span>Uploading photo to server...</span>
                          </div>
                        ) : (
                          <>
                            <span className="admin-drop-icon">📷</span>
                            <span className="admin-drop-text">Click here to upload and publish a photo</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Photo Grid list with deletes */}
                  <div className="admin-card">
                    <h3>Published Gallery ({galleryImages.length} Photos)</h3>
                    <div className="admin-gallery-grid">
                      {galleryImages.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)' }}>No images published in gallery.</p>
                      ) : (
                        galleryImages.map((src, idx) => (
                          <div key={idx} className="admin-gallery-item">
                            <img src={src} alt="Gallery item" />
                            <button
                              onClick={() => handleGalleryDelete(src)}
                              className="admin-gallery-delete-btn"
                              title="Delete photo"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </section>
        )}
      </main>

      <Footer />
      <ScrollToTop />
    </>
  );
}
