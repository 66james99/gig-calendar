import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';
export function renderTable(tbody, performers) {
    tbody.innerHTML = ''; // Clear existing rows
    if (performers.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(6, 'No performers found.');
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
        <td>${formatDateTime(performer.Created)}</td>
        <td>${formatDateTime(performer.Updated)}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
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
        <td>${formatDateTime(performer.Created)}</td>
        <td>${formatDateTime(performer.Updated)}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
}
