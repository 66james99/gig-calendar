export function renderTable(tbody, aliases, performers) {
    tbody.innerHTML = ''; // Clear existing rows
    if (aliases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No performer aliases found.</td></tr>';
        return;
    }
    aliases.forEach(alias => renderDisplayRow(tbody, alias, performers));
}
export function renderDisplayRow(tbody, alias, performers) {
    let row = tbody.querySelector(`tr[data-id="${alias.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = alias.ID.toString();
    }
    row.innerHTML = `
        <td>${alias.ID}</td>
        <td>${getPerformerName(alias.Performer, performers)}</td>
        <td>${alias.Alias}</td>
        <td>${new Date(alias.Created).toLocaleString()}</td>
        <td>${new Date(alias.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
}
export function renderEditRow(tbody, alias, isNew, performers) {
    let row = tbody.querySelector(`tr[data-id="${alias.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = alias.ID ? alias.ID.toString() : 'new';
    }
    else if (!row) {
        return; // Should not happen for existing rows
    }
    // Sort performers alphabetically for the dropdown
    const sortedPerformers = [...performers].sort((a, b) => a.Name.localeCompare(b.Name));
    const performerOptions = sortedPerformers.map(p => `<option value="${p.ID}" ${alias.Performer === p.ID ? 'selected' : ''}>${p.Name}</option>`).join('');
    row.innerHTML = `
        <td>${alias.ID || 'New'}</td>
        <td>
            <select class="edit-performer_id" style="width: 100%;">
                ${performerOptions}
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
function getPerformerName(performerID, performers) {
    const performer = performers.find(p => p.ID === performerID);
    return performer ? performer.Name : `Unknown Performer (${performerID})`;
}
