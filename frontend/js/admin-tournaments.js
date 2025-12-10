// ==================== ADMIN TOURNAMENT MANAGEMENT ====================

document.addEventListener('DOMContentLoaded', async () => {
  checkAdminAuth();
  await loadTournaments();
  setupEventListeners();
});

function checkAdminAuth() {
  const user = db.getCurrentUser();
  if (!user || user.role !== 'admin') {
    window.location.href = 'index.html';
  }
}

async function loadTournaments() {
  try {
    showLoading(true);
    const tournaments = await api.getAdminTournaments();
    displayTournaments(tournaments);
  } catch (error) {
    showAlert('Failed to load tournaments', 'error');
  } finally {
    showLoading(false);
  }
}

function displayTournaments(tournaments) {
  const container = document.getElementById('tournaments-table') || document.body;
  
  if (tournaments.length === 0) {
    container.innerHTML = '<p>No tournaments yet. Create one!</p>';
    return;
  }

  let html = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f8f9fa;">
          <th style="padding: 12px; text-align: left;">Name</th>
          <th style="padding: 12px;">Venue</th>
          <th style="padding: 12px;">Date</th>
          <th style="padding: 12px;">Price</th>
          <th style="padding: 12px;">Status</th>
          <th style="padding: 12px;">Capacity</th>
          <th style="padding: 12px;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  tournaments.forEach(tournament => {
    const startDate = formatDate(tournament.start_date);
    html += `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${tournament.name}</td>
        <td style="padding: 12px;">${tournament.venue}</td>
        <td style="padding: 12px;">${startDate}</td>
        <td style="padding: 12px;">₹${tournament.price}</td>
        <td style="padding: 12px;">
          <span style="background: ${tournament.status === 'scheduled' ? '#10B981' : '#FF6B35'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${tournament.status}
          </span>
        </td>
        <td style="padding: 12px;">${tournament.capacity}</td>
        <td style="padding: 12px;">
          <button onclick="editTournament('${tournament.id}')" style="background: #3B82F6; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Edit</button>
          <button onclick="deleteTournament('${tournament.id}')" style="background: #EF4444; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer;">Delete</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function setupEventListeners() {
  const form = document.getElementById('tournament-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveTournament();
    });
  }
}

async function saveTournament() {
  const form = document.getElementById('tournament-form');
  const formData = new FormData(form);

  try {
    showLoading(true);
    
    const id = formData.get('tournament_id');
    
    if (id) {
      await api.updateTournament(id, formData);
      showAlert('Tournament updated successfully!', 'success');
    } else {
      await api.createTournament(formData);
      showAlert('Tournament created successfully!', 'success');
    }

    form.reset();
    document.getElementById('tournament_id').value = '';
    await loadTournaments();
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

async function editTournament(id) {
  try {
    const tournaments = await api.getAdminTournaments();
    const tournament = tournaments.find(t => t.id === id);
    
    if (!tournament) {
      showAlert('Tournament not found', 'error');
      return;
    }

    // Populate form
    document.getElementById('tournament_id').value = tournament.id;
    document.getElementById('name').value = tournament.name;
    document.getElementById('venue').value = tournament.venue;
    document.getElementById('gmaps_link').value = tournament.gmaps_link || '';
    document.getElementById('start_date').value = tournament.start_date;
    document.getElementById('start_time').value = tournament.start_time;
    document.getElementById('end_date').value = tournament.end_date;
    document.getElementById('end_time').value = tournament.end_time;
    document.getElementById('price').value = tournament.price;
    document.getElementById('status').value = tournament.status;
    document.getElementById('capacity').value = tournament.capacity;

    // Scroll to form
    document.getElementById('tournament-form').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    showAlert('Failed to load tournament', 'error');
  }
}

async function deleteTournament(id) {
  if (!confirm('Are you sure you want to delete this tournament?')) {
    return;
  }

  try {
    showLoading(true);
    await api.deleteTournament(id);
    showAlert('Tournament deleted successfully!', 'success');
    await loadTournaments();
  } catch (error) {
    showAlert(error.message, 'error');
  } finally {
    showLoading(false);
  }
}

function addBracketToTournament(tournamentId) {
  // Navigate to bracket manager
  window.location.href = `admin-bracket.html?tournament_id=${tournamentId}`;
}

function viewRegistrations(tournamentId) {
  // Navigate to registrations view
  window.location.href = `admin-registrations.html?tournament_id=${tournamentId}`;
}
