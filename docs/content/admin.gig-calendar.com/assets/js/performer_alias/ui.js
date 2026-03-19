import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';
export function renderTable(tbody, aliases, performers) {
    tbody.innerHTML = ''; // Clear existing rows
    if (aliases.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(7, 'No performer aliases found.');
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
        <td>${alias.Uuid}</td>
        <td>${alias.Alias}</td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
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
        <td>${alias.Uuid || 'N/A'}</td>
        <td><input type="text" class="edit-alias" value="${alias.Alias || ''}" style="width: 100%;"></td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
    const aliasInput = row.querySelector('.edit-alias');
    if (aliasInput) {
        aliasInput.focus();
    }
}
function getPerformerName(performerID, performers) {
    const performer = performers.find(p => p.ID === performerID);
    return performer ? performer.Name : `Unknown Performer (${performerID})`;
}
