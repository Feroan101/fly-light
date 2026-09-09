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
        showAlert(`Failed to load tournaments: ${error.message}`, 'error');
        document.getElementById('tournaments-container').innerHTML = '<p>Failed to load tournaments. Please refresh.</p>';
    } finally {
        showLoading(false);
    }
}

function displayTournaments(tournaments) {
    const container = document.getElementById('tournaments-container');
    if (!container) return;
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px;">No tournaments available yet.</p>';
        return;
    }
    
    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">';
    
    tournaments.forEach(tournament => {
        const startDate = tournament.start_date 
            ? new Date(tournament.start_date).toLocaleDateString('en-IN')
            : 'N/A';
        
        const statusColor = {
            'upcoming': '#3b82f6',
            'ongoing': '#f59e0b',
            'completed': '#10b981'
        }[tournament.status] || '#6b7280';
        
        const posterStyle = tournament.poster_url 
            ? `background-image: url('${tournament.poster_url}'); background-size: cover; background-position: center;`
            : `background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);`;
        
        html += `
            <div style="
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                background: white;
                transition: transform 0.3s ease;
            ">
                <div style="
                    height: 200px;
                    ${posterStyle}
                    display: flex;
                    align-items: flex-end;
                    justify-content: flex-start;
                    padding: 20px;
                ">
                    <span style="
                        background: ${statusColor};
                        color: white;
                        padding: 6px 12px;
                        border-radius: 4px;
                        font-size: 12px;
                        font-weight: bold;
                    ">${tournament.status.toUpperCase()}</span>
                </div>
                
                <div style="padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #1f2937;">${escapeHtml(tournament.name)}</h3>
                    
                    <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">
                        📍 ${escapeHtml(tournament.venue)}
                    </p>
                    
                    <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">
                        📅 ${startDate}
                    </p>
                    
                    <p style="margin: 8px 0; color: #1f2937; font-weight: bold; font-size: 16px;">
                        Price: ₹${tournament.price}
                    </p>
                    
                    <p style="margin: 8px 0; color: #6b7280; font-size: 14px;">
                        Capacity: ${tournament.capacity}
                    </p>
                    
                    ${tournament.description ? `
                        <p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.4;">
                            ${escapeHtml(tournament.description.substring(0, 100))}${tournament.description.length > 100 ? '...' : ''}
                        </p>
                    ` : ''}
                    
                    <div style="margin-top: 15px; display: flex; gap: 10px;">
                        <button onclick="viewTournament('${tournament.id}')" 
                                style="flex: 1; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                            View Details
                        </button>
                        <button onclick="registerTournament('${tournament.id}')" 
                                style="flex: 1; padding: 10px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;"
                                ${!tournament.accept_entries ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            ${tournament.accept_entries ? 'Register' : 'Closed'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function viewTournament(id) {
    // Store tournament ID and redirect
    sessionStorage.setItem('selectedTournament', id);
    window.location.href = 'tournament-details.html';
}

async function registerTournament(id) {
    try {
        const tournament = await api.getTournament(id);
        
        if (!tournament.accept_entries) {
            alert('Tournament is closed for registrations');
            return;
        }
        
        await showTournamentRegistrationWithEvents(tournament);
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
}


function showRegistrationForm(tournament) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 8px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        ">
            <h2 style="margin-top: 0; color: #1f2937;">Register for ${escapeHtml(tournament.name)}</h2>
            
            <form id="registration-form" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: bold;">Full Name *</label>
                    <input type="text" id="reg-name" placeholder="Your full name" required
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: bold;">Email *</label>
                    <input type="email" id="reg-email" placeholder="your@email.com" required
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: bold;">Phone *</label>
                    <input type="tel" id="reg-phone" placeholder="+91 XXXXX XXXXX" required
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>
                
                <div>
                    <label style="display: block; margin-bottom: 5px; color: #374151; font-weight: bold;">Academy Name</label>
                    <input type="text" id="reg-academy" placeholder="Your academy name"
                           style="width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px;">
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 10px;">
                    <button type="button" onclick="this.closest('[style*=position]').remove()" 
                            style="flex: 1; padding: 10px; background: #e5e7eb; color: #374151; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Cancel
                    </button>
                    <button type="button" onclick="submitRegistration('${tournament.id}'); this.closest('[style*=position]').remove();" 
                            style="flex: 1; padding: 10px; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                        Register
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function submitRegistration(tournamentId) {
    try {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();
        const academy = document.getElementById('reg-academy').value.trim();
        
        if (!name || !email || !phone) {
            showAlert('Please fill in all required fields', 'warning');
            return;
        }
        
        showLoading(true);
        
        const result = await api.joinTournament(tournamentId, {
            name,
            email,
            phone,
            academy_name: academy
        });
        
        showAlert('Registration successful! Check your email for confirmation.', 'success');
        await loadTournaments();
        
    } catch (error) {
        showAlert(`Registration failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}



async function showTournamentRegistrationWithEvents(tournament) {
    try {
        const events = await api.getTournamentEvents(tournament.id);
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            overflow-y: auto;
        `;

        let optionsHtml = '<option value="">-- Select Category (Optional) --</option>';
        events.forEach(ev => {
            const isFull = ev.current_participants >= ev.max_participants;
            const spotsLeft = ev.max_participants - ev.current_participants;
            const label = `${ev.name} (${ev.category || 'Category'}) - ₹${ev.entry_fee}` +
                          (isFull ? ' - FULL' : ` - ${spotsLeft} spots`);
            optionsHtml += `<option value="${ev.id}" ${isFull ? 'disabled' : ''}>${label}</option>`;
        });

        modal.innerHTML = `
          <div style="background:white;border-radius:8px;padding:24px;max-width:480px;width:90%;">
            <h2 style="margin-top:0;color:#1f2937;">Register for ${escapeHtml(tournament.name)}</h2>
            <form style="display:flex;flex-direction:column;gap:12px;margin-top:16px;">
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;">Full Name *</label>
                <input id="reg-name" type="text" placeholder="Your full name" required
                       style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;">
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;">Email *</label>
                <input id="reg-email" type="email" placeholder="your@email.com" required
                       style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;">
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;">Phone *</label>
                <input id="reg-phone" type="tel" placeholder="+91 XXXXX XXXXX" required
                       style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;">
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;">Academy (Optional)</label>
                <input id="reg-academy" type="text" placeholder="Your academy name"
                       style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;">
              </div>
              <div>
                <label style="display:block;margin-bottom:6px;font-weight:bold;">Category</label>
                <select id="reg-category" style="width:100%;padding:10px;border:1px solid #d1d5db;border-radius:4px;font-size:14px;">
                  ${optionsHtml}
                </select>
              </div>
            </form>
            <div style="display:flex;gap:8px;margin-top:16px;">
              <button type="button" onclick="this.closest('[style*=position]').remove()"
                      style="flex:1;padding:10px;background:#e5e7eb;color:#374151;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">
                Cancel
              </button>
              <button type="button" onclick="submitTournamentRegistrationWithCategory('${tournament.id}');this.closest('[style*=position]').remove();"
                      style="flex:1;padding:10px;background:#10b981;color:white;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">
                Register
              </button>
            </div>
          </div>`;
        document.body.appendChild(modal);
    } catch (err) {
        alert(`Failed to load categories: ${err.message}`);
    }
}

async function submitTournamentRegistrationWithCategory(tournamentId) {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const academy = document.getElementById('reg-academy').value.trim();
    const selectedEventId = document.getElementById('reg-category').value;

    if (!name || !email || !phone) {
        alert('Please fill in name, email, and phone');
        return;
    }

    try {
        await api.joinTournament(tournamentId, {
            name,
            email,
            phone,
            academy_name: academy,
            selected_event_id: selectedEventId || null
        });
        alert('Registered successfully!');
        await loadTournaments();
    } catch (err) {
        alert('Registration failed: ' + err.message);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
