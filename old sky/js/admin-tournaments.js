// ==================== ADMIN TOURNAMENT MANAGEMENT ====================

document.addEventListener('DOMContentLoaded', async () => {
    checkAdminAuth();
    await loadTournaments();
    setupEventListeners();
});

async function loadTournaments() {
    try {
        showLoading(true);
        const tournaments = await api.getAdminTournaments();
        displayTournaments(tournaments);
    } catch (error) {
        showAlert(`Failed to load tournaments: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function displayTournaments(tournaments) {
    const container = document.getElementById('tournaments-table');
    if (!container) return;
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p>No tournaments yet. Create one!</p>';
        return;
    }
    
    let html = `
        <table style="width: 100%; border-collapse: collapse;">
            <thead>
                <tr style="background: #f3f4f6; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px; text-align: left;">Name</th>
                    <th style="padding: 12px; text-align: left;">Venue</th>
                    <th style="padding: 12px; text-align: left;">Date</th>
                    <th style="padding: 12px; text-align: left;">Price</th>
                    <th style="padding: 12px; text-align: left;">Status</th>
                    <th style="padding: 12px; text-align: left;">Entries</th>
                    <th style="padding: 12px; text-align: left;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    tournaments.forEach(tournament => {
        const startDate = tournament.start_date ? new Date(tournament.start_date).toLocaleDateString('en-IN') : 'N/A';
        
        html += `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px;">${escapeHtml(tournament.name)}</td>
                <td style="padding: 12px;">${escapeHtml(tournament.venue)}</td>
                <td style="padding: 12px;">${startDate}</td>
                <td style="padding: 12px;">₹${tournament.price}</td>
                <td style="padding: 12px;">
                    <span style="padding: 4px 8px; border-radius: 4px; background: ${getStatusColor(tournament.status)}; color: white;">
                        ${tournament.status}
                    </span>
                </td>
                <td style="padding: 12px;">
                    ${tournament.accept_entries ? '✓ Open' : '✗ Closed'}
                </td>
                <td style="padding: 12px;">
                    <button onclick="editTournament('${tournament.id}')" style="padding: 6px 12px; margin-right: 4px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Edit</button>
                    <button onclick="deleteTournament('${tournament.id}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function getStatusColor(status) {
    const colors = {
        'upcoming': '#3b82f6',
        'ongoing': '#f59e0b',
        'completed': '#10b981'
    };
    return colors[status] || '#6b7280';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function editTournament(id) {
    try {
        showLoading(true);
        const tournament = await api.getTournament(id);
        
        // Populate form with tournament data
        document.getElementById('tournament-name').value = tournament.name;
        document.getElementById('tournament-description').value = tournament.description || '';
        document.getElementById('tournament-venue').value = tournament.venue;
        document.getElementById('tournament-gmaps').value = tournament.gmaps_link || '';
        document.getElementById('tournament-price').value = tournament.price;
        document.getElementById('tournament-capacity').value = tournament.capacity;
        document.getElementById('tournament-start-date').value = tournament.start_date;
        document.getElementById('tournament-start-time').value = tournament.start_time;
        document.getElementById('tournament-end-date').value = tournament.end_date;
        document.getElementById('tournament-end-time').value = tournament.end_time;
        document.getElementById('tournament-status').value = tournament.status;
        
        // Store ID for update
        document.getElementById('create-tournament-btn').dataset.editId = id;
        document.getElementById('create-tournament-btn').textContent = 'Update Tournament';
        
        // Scroll to form
        document.getElementById('tournament-form').scrollIntoView({ behavior: 'smooth' });
        
        showLoading(false);
    } catch (error) {
        showAlert(`Failed to load tournament: ${error.message}`, 'error');
        showLoading(false);
    }
}

async function deleteTournament(id) {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    
    try {
        showLoading(true);
        await api.deleteTournament(id);
        showAlert('Tournament deleted successfully', 'success');
        await loadTournaments();
    } catch (error) {
        showAlert(`Failed to delete tournament: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

function setupEventListeners() {
    const form = document.getElementById('tournament-form');
    const btn = document.getElementById('create-tournament-btn');
    
    if (!form || !btn) return;
    
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        await saveTournament();
    });
}

async function saveTournament() {
    try {
        const editId = document.getElementById('create-tournament-btn').dataset.editId;
        
        // Validate required fields
        const name = document.getElementById('tournament-name').value.trim();
        const venue = document.getElementById('tournament-venue').value.trim();
        const startDate = document.getElementById('tournament-start-date').value;
        const startTime = document.getElementById('tournament-start-time').value;
        const endDate = document.getElementById('tournament-end-date').value;
        const endTime = document.getElementById('tournament-end-time').value;
        
        if (!name || !venue || !startDate || !startTime || !endDate || !endTime) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', document.getElementById('tournament-description').value);
        formData.append('venue', venue);
        formData.append('gmaps_link', document.getElementById('tournament-gmaps').value);
        formData.append('price', document.getElementById('tournament-price').value);
        formData.append('capacity', document.getElementById('tournament-capacity').value);
        formData.append('start_date', startDate);
        formData.append('start_time', startTime);
        formData.append('end_date', endDate);
        formData.append('end_time', endTime);
        formData.append('status', document.getElementById('tournament-status').value);
        
        const posterFile = document.getElementById('tournament-poster').files[0];
        if (posterFile) {
            formData.append('poster', posterFile);
        }
        
        showLoading(true);
        
        if (editId) {
            await api.updateTournament(editId, formData);
            showAlert('Tournament updated successfully', 'success');
            delete document.getElementById('create-tournament-btn').dataset.editId;
            document.getElementById('create-tournament-btn').textContent = 'Create Tournament';
        } else {
            await api.createTournament(formData);
            showAlert('Tournament created successfully', 'success');
        }
        
        // Reset form
        document.getElementById('tournament-form').reset();
        
        // Reload tournaments
        await loadTournaments();
        
    } catch (error) {
        showAlert(`Failed to save tournament: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}