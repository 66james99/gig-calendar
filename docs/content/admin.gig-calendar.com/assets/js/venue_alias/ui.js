export function renderTable(tbody, aliases, venues) {
    tbody.innerHTML = ''; // Clear existing rows
    if (aliases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No venue aliases found.</td></tr>';
        return;
    }
    aliases.forEach(alias => renderDisplayRow(tbody, alias, venues));
}
export function renderDisplayRow(tbody, alias, venues) {
    let row = tbody.querySelector(`tr[data-id="${alias.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = alias.ID.toString();
    }
    row.innerHTML = `
        <td>${alias.ID}</td>
        <td>${getVenueName(alias.Venue, venues)}</td>
        <td>${alias.Alias}</td>
        <td>${new Date(alias.Created).toLocaleString()}</td>
        <td>${new Date(alias.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
}
export function renderEditRow(tbody, alias, isNew, venues) {
    let row = tbody.querySelector(`tr[data-id="${alias.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = alias.ID ? alias.ID.toString() : 'new';
    }
    else if (!row) {
        return; // Should not happen for existing rows
    }
    const venueOptions = venues.map(v => `<option value="${v.ID}" ${alias.Venue === v.ID ? 'selected' : ''}>${v.Name}</option>`).join('');
    row.innerHTML = `
        <td>${alias.ID || 'New'}</td>
        <td>
            <select class="edit-venue_id" style="width: 100%;">
                ${venueOptions}
            </select>
        </td>
        <td><input type="text" class="edit-alias" value="${alias.Alias || ''}" style="width: 100%;"></td>
        <td>${alias.Created ? new Date(alias.Created).toLocaleString() : 'N/A'}</td>
        <td>${alias.Updated ? new Date(alias.Updated).toLocaleString() : 'N/A'}</td>
        <td>
            <button class="${isNew ? 'add-btn' : 'save-btn'}">${isNew ? 'Add' : 'Save'}</button>
            <button class="${isNew ? 'cancel-add-btn' : 'cancel-btn'}">Cancel</button>
        </td>
    `;
}
export function updateSortIndicators(currentSort) {
    document.querySelectorAll('#venue-aliases-list th[data-col]').forEach(th => {
        const htmlTh = th;
        htmlTh.innerHTML = htmlTh.textContent?.replace(/ ↑| ↓/, '') || ''; // Clear existing indicators
        if (htmlTh.dataset.col === currentSort.column) {
            htmlTh.innerHTML += currentSort.direction === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
export function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    modalTitle.textContent = title;
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    }
    else {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
    }
    modal.style.display = 'block';
    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
    };
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}
function getVenueName(venueID, venues) {
    const venue = venues.find(v => v.ID === venueID);
    return venue ? venue.Name : `Unknown Venue (${venueID})`;
}
