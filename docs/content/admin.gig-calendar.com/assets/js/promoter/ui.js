import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';
export function renderTable(tbody, promoters) {
    tbody.innerHTML = ''; // Clear existing rows
    if (promoters.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(6, 'No promoters found.');
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
        <td>${formatDateTime(promoter.Created)}</td>
        <td>${formatDateTime(promoter.Updated)}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
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
        <td>${formatDateTime(promoter.Created)}</td>
        <td>${formatDateTime(promoter.Updated)}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
}
