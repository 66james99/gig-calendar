import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';
export function renderTable(tbody, aliases, promoters) {
    tbody.innerHTML = '';
    if (aliases.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(7, 'No promoter aliases found.');
        return;
    }
    aliases.forEach(alias => {
        renderDisplayRow(tbody, alias, promoters);
    });
}
export function renderDisplayRow(tbody, alias, promoters) {
    let row = tbody.querySelector(`tr[data-id="${alias.ID}"]`);
    if (!row) {
        row = document.createElement('tr');
        row.dataset.id = alias.ID.toString();
        tbody.appendChild(row);
    }
    const promoterName = promoters.find(p => p.ID === alias.Promoter)?.Name || `Unknown (${alias.Promoter})`;
    row.innerHTML = `
        <td>${alias.ID}</td>
        <td>${promoterName}</td>
        <td>${alias.Alias}</td>
        <td>${alias.Uuid}</td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
    `;
}
export function renderEditRow(tbody, alias, isNew, promoters) {
    let row;
    if (isNew) {
        // For new rows, we assume the row is already inserted by the caller (handleNewClick) or we are transforming the first row
        // Note: The event handler logic usually inserts a blank row first.
        // If the passed alias has no ID, we look for a row without a dataset ID or create one.
        row = tbody.querySelector('tr:not([data-id])');
        if (!row) {
            row = document.createElement('tr');
            tbody.prepend(row);
        }
    }
    else {
        row = tbody.querySelector(`tr[data-id="${alias.ID}"]`);
    }
    if (!row)
        return;
    const promoterOptions = promoters.map(p => `<option value="${p.ID}" ${p.ID === alias.Promoter ? 'selected' : ''}>${p.Name}</option>`).join('');
    row.innerHTML = `
        <td>${alias.ID || 'New'}</td>
        <td>
            <select class="edit-promoter_id">
                <option value="" disabled ${!alias.Promoter ? 'selected' : ''}>Select Promoter</option>
                ${promoterOptions}
            </select>
        </td>
        <td><input type="text" class="edit-alias" value="${alias.Alias || ''}" placeholder="Alias"></td>
        <td>${alias.Uuid || '-'}</td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
    // Focus on the alias input for convenience
    const aliasInput = row.querySelector('.edit-alias');
    if (aliasInput) {
        aliasInput.focus();
    }
}
