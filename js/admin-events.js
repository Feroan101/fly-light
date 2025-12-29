// ==================== ADMIN - TOURNAMENT CATEGORIES ON CREATE ====================

let pendingEvents = [];

function getPendingEvents() {
  return pendingEvents;
}

function resetPendingEvents() {
  pendingEvents = [];
  displayPendingEvents();
}

function displayPendingEvents() {
  const container = document.getElementById('events-table');
  if (!container) return;

  if (!pendingEvents.length) {
    container.innerHTML = 'No categories yet. Click ➕ to add one.';
    return;
  }

  let html = `
    <table style="width:100%; border-collapse:collapse;">
      <thead>
        <tr style="background:#f3f4f6; border-bottom:2px solid #e5e7eb;">
          <th style="padding:12px; text-align:left; font-weight:600;">Name</th>
          <th style="padding:12px; text-align:left; font-weight:600;">Type</th>
          <th style="padding:12px; text-align:left; font-weight:600;">Entry Fee</th>
          <th style="padding:12px; text-align:left; font-weight:600;">Max</th>
          <th style="padding:12px; text-align:left; font-weight:600;">Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  pendingEvents.forEach((ev, idx) => {
    html += `
      <tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:12px;">${escapeHtml(ev.name)}</td>
        <td style="padding:12px;">${escapeHtml(ev.category || 'N/A')}</td>
        <td style="padding:12px;">₹${ev.entry_fee}</td>
        <td style="padding:12px;">${ev.max_participants}</td>
        <td style="padding:12px;">
          <button type="button"
                  onclick="removePendingEvent(${idx})"
                  style="padding:6px 12px; background:#ef4444; color:white; border:none; border-radius:4px; font-size:12px; cursor:pointer;">
            Remove
          </button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  container.innerHTML = html;
}

function removePendingEvent(index) {
  pendingEvents.splice(index, 1);
  displayPendingEvents();
}

function showAddEventModal() {
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
      <h2 style="margin-top: 0; color: #1f2937;">Add Category</h2>

      <form style="display:flex; flex-direction:column; gap:15px; margin-top:20px;">
        <div>
          <label style="display:block; margin-bottom:5px; color:#374151; font-weight:bold;">Name *</label>
          <input type="text" id="event-name" placeholder="e.g., Men's Singles" required
                 style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:4px; font-size:14px;">
        </div>

        <div>
          <label style="display:block; margin-bottom:5px; color:#374151; font-weight:bold;">Type</label>
          <select id="event-category"
                  style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:4px; font-size:14px;">
            <option value="">Select Type</option>
            <option value="Singles">Singles</option>
            <option value="Doubles">Doubles</option>
            <option value="Mixed Doubles">Mixed Doubles</option>
            <option value="Group">Group</option>
            <option value="Team">Team</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label style="display:block; margin-bottom:5px; color:#374151; font-weight:bold;">Entry Fee (₹)</label>
          <input type="number" id="event-fee" placeholder="0" value="0" min="0" step="10"
                 style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:4px; font-size:14px;">
        </div>

        <div>
          <label style="display:block; margin-bottom:5px; color:#374151; font-weight:bold;">Max Participants</label>
          <input type="number" id="event-max-participants" placeholder="32" value="32" min="1"
                 style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:4px; font-size:14px;">
        </div>

        <div>
          <label style="display:block; margin-bottom:5px; color:#374151; font-weight:bold;">Description</label>
          <textarea id="event-description" placeholder="Category details..." rows="3"
                    style="width:100%; padding:10px; border:1px solid #d1d5db; border-radius:4px; font-size:14px;"></textarea>
        </div>

        <div style="display:flex; gap:10px; margin-top:10px;">
          <button type="button"
                  onclick="this.closest('[style*=position]').remove()"
                  style="flex:1; padding:10px; background:#e5e7eb; color:#374151; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
            Cancel
          </button>
          <button type="button"
                  onclick="submitEvent(); this.closest('[style*=position]').remove();"
                  style="flex:1; padding:10px; background:#10b981; color:white; border:none; border-radius:4px; cursor:pointer; font-weight:bold;">
            Add Category
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
}

function submitEvent() {
  const name = document.getElementById('event-name').value.trim();
  const category = document.getElementById('event-category').value;
  const fee = document.getElementById('event-fee').value;
  const maxParticipants = document.getElementById('event-max-participants').value;
  const description = document.getElementById('event-description').value;

  if (!name) {
    alert('Category name is required');
    return;
  }

  pendingEvents.push({
    name,
    category,
    entry_fee: parseFloat(fee || 0),
    max_participants: parseInt(maxParticipants || 32),
    description
  });

  displayPendingEvents();
  alert('Category added to this tournament');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
