export function renderTable(tbody, promoters) {
    tbody.innerHTML = ''; // Clear existing rows
    if (promoters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No promoters found.</td></tr>';
        return;
    }
    promoters.forEach(promoter => renderDisplayRow(tbody, promoter));
}
export function renderDisplayRow(tbody, promoter) {
    let row = tbody.querySelector(`tr[data-id="${promoter.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = promoter.ID.toString();
    }
    row.innerHTML = `
        <td>${promoter.ID}</td>
        <td>${promoter.Name}</td>
        <td>${promoter.Uuid}</td>
        <td>${new Date(promoter.Created).toLocaleString()}</td>
        <td>${new Date(promoter.Updated).toLocaleString()}</td>
        <td class="actions">
            <button class="btn-icon edit-btn" title="Edit">✏️</button>
            <button class="btn-icon delete-btn" title="Delete">🗑️</button>
            <button class="btn-icon duplicate-btn" title="Duplicate">📋</button>
        </td>
    `;
}
export function renderEditRow(tbody, promoter, isNew) {
    let row = tbody.querySelector(`tr[data-id="${promoter.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = promoter.ID ? promoter.ID.toString() : 'new';
    }
    else if (!row) {
        return; // Should not happen for existing rows
    }
    row.innerHTML = `
        <td>${promoter.ID || 'New'}</td>
        <td><input type="text" class="edit-name" value="${promoter.Name || ''}" style="width: 100%;"></td>
        <td>${promoter.Uuid || 'N/A'}</td>
        <td>${promoter.Created ? new Date(promoter.Created).toLocaleString() : 'N/A'}</td>
        <td>${promoter.Updated ? new Date(promoter.Updated).toLocaleString() : 'N/A'}</td>
        <td class="actions">
            ${isNew
        ? `<button class="btn-icon add-btn" title="Add">✅</button>
                   <button class="btn-icon cancel-add-btn" title="Cancel">❌</button>`
        : `<button class="btn-icon save-btn" title="Save">💾</button>
                   <button class="btn-icon cancel-btn" title="Cancel">❌</button>`}
        </td>
    `;
}
