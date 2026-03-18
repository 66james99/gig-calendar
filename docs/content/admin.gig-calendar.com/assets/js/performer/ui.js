export function renderTable(tbody, performers) {
    tbody.innerHTML = ''; // Clear existing rows
    if (performers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No performers found.</td></tr>';
        return;
    }
    performers.forEach(performer => renderDisplayRow(tbody, performer));
}
export function renderDisplayRow(tbody, performer) {
    let row = tbody.querySelector(`tr[data-id="${performer.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = performer.ID.toString();
    }
    row.innerHTML = `
        <td>${performer.ID}</td>
        <td>${performer.Name}</td>
        <td>${performer.Uuid}</td>
        <td>${new Date(performer.Created).toLocaleString()}</td>
        <td>${new Date(performer.Updated).toLocaleString()}</td>
        <td class="actions">
            <button class="btn-icon edit-btn" title="Edit">✏️</button>
            <button class="btn-icon delete-btn" title="Delete">🗑️</button>
            <button class="btn-icon duplicate-btn" title="Duplicate">📋</button>
        </td>
    `;
}
export function renderEditRow(tbody, performer, isNew) {
    let row = tbody.querySelector(`tr[data-id="${performer.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = performer.ID ? performer.ID.toString() : 'new';
    }
    else if (!row) {
        return; // Should not happen for existing rows
    }
    row.innerHTML = `
        <td>${performer.ID || 'New'}</td>
        <td><input type="text" class="edit-name" value="${performer.Name || ''}" style="width: 100%;"></td>
        <td>${performer.Uuid || 'N/A'}</td>
        <td>${performer.Created ? new Date(performer.Created).toLocaleString() : 'N/A'}</td>
        <td>${performer.Updated ? new Date(performer.Updated).toLocaleString() : 'N/A'}</td>
        <td class="actions">
            ${isNew
        ? `<button class="btn-icon add-btn" title="Add">✅</button>
                   <button class="btn-icon cancel-add-btn" title="Cancel">❌</button>`
        : `<button class="btn-icon save-btn" title="Save">💾</button>
                   <button class="btn-icon cancel-btn" title="Cancel">❌</button>`}
        </td>
    `;
}
