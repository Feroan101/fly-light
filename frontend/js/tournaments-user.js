// ==================== TOURNAMENTS PAGE (USER) ====================

document.addEventListener('DOMContentLoaded', async () => {
  await loadTournaments();
});

async function loadTournaments() {
  try {
    showLoading(true);
    const tournaments = await api.getTournaments();
    displayTournaments(tournaments);
  } catch (error) {
    console.error('Error loading tournaments:', error);
    showAlert('Failed to load tournaments', 'error');
  } finally {
    showLoading(false);
  }
}

function displayTournaments(tournaments) {
  const container = document.getElementById('tournaments-container') || document.body;
  
  if (tournaments.length === 0) {
    container.innerHTML = '<p style="text-align: center; padding: 40px;">No tournaments available yet.</p>';
    return;
  }

  let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">';

  tournaments.forEach(tournament => {
    const startDate = formatDate(tournament.start_date);
    const endDate = formatDate(tournament.end_date);
    const statusColor = tournament.status === 'scheduled' ? '#10B981' : tournament.status === 'ongoing' ? '#FF6B35' : '#6B7280';
    
    html += `
      <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.3s ease;">
        <div style="height: 200px; background: linear-gradient(135deg, #2C3E50 0%, #1a252f 100%); position: relative; overflow: hidden;">
          ${tournament.poster_url ? `<img src="${tournament.poster_url}" style="width: 100%; height: 100%; object-fit: cover;">` : ''}
          <div style="position: absolute; top: 10px; right: 10px; background: ${statusColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
            ${tournament.status.toUpperCase()}
          </div>
        </div>
        <div style="padding: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #2C3E50; font-size: 20px;">${tournament.name}</h3>
          <p style="color: #666; margin: 0 0 15px 0; font-size: 14px; line-height: 1.6;">
            <strong>📍 Venue:</strong> ${tournament.venue}<br>
            <strong>📅 Dates:</strong> ${startDate} to ${endDate}<br>
            <strong>💰 Price:</strong> ${formatCurrency(tournament.price)}<br>
            <strong>👥 Capacity:</strong> ${tournament.capacity} players
          </p>
          <div style="display: flex; gap: 10px;">
            <button onclick="viewTournamentDetails('${tournament.id}')" style="flex: 1; background: #3B82F6; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">View Details</button>
            ${tournament.status !== 'completed' ? `<button onclick="joinTournament('${tournament.id}')" style="flex: 1; background: #10B981; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: 600;">Join</button>` : ''}
          </div>
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;
}

function viewTournamentDetails(tournamentId) {
  window.location.href = `tournament-details.html?id=${tournamentId}`;
}

async function joinTournament(tournamentId) {
  const modal = createModal('Join Tournament', createJoinForm(tournamentId));
  modal.show();
}

function createJoinForm(tournamentId) {
  return `
    <form id="join-form" style="display: flex; flex-direction: column; gap: 15px;">
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Full Name *</label>
        <input type="text" name="name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Phone Number *</label>
        <input type="tel" name="phone" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Email *</label>
        <input type="email" name="email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Academy Name</label>
        <input type="text" name="academy_name" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
      </div>
      <div>
        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Select Venue *</label>
        <select name="selected_venue" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px;">
          <option value="">Choose venue...</option>
          <option value="Main Venue">Main Venue</option>
          <option value="Secondary Venue">Secondary Venue</option>
          <option value="Online">Online</option>
        </select>
      </div>
      <button type="button" onclick="submitJoinForm('${tournamentId}')" style="background: #10B981; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 16px;">Proceed to Payment</button>
    </form>
  `;
}

async function submitJoinForm(tournamentId) {
  const form = document.getElementById('join-form');
  const formData = new FormData(form);

  try {
    showLoading(true);

    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email'),
      academy_name: formData.get('academy_name'),
      selected_venue: formData.get('selected_venue')
    };

    const tournament = await api.getTournament(tournamentId);
    const registration = await api.joinTournament(tournamentId, data);

    // Store registration info for payment
    sessionStorage.setItem('pendingRegistration', JSON.stringify({
      registration_id: registration.registration_id,
      tournament_id: tournamentId,
      tournament_name: tournament.name,
      amount: tournament.price,
      user_email: data.email,
      reference_type: 'tournament'
    }));

    // Proceed to payment
    window.location.href = `payment.html?type=tournament&tournament_id=${tournamentId}`;
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function createModal(title, content) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
  `;

  modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2 style="margin: 0;">${title}</h2>
      <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">×</button>
    </div>
    ${content}
  `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  return {
    show: () => {},
    close: () => modal.remove()
  };
}
