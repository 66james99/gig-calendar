import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';
export function renderTable(tbody, aliases, festivals, promoters) {
    tbody.innerHTML = '';
    if (aliases.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(7, 'No festival aliases found.');
        return;
    }
    aliases.forEach(alias => {
        renderDisplayRow(tbody, alias, festivals, promoters);
    });
}
function getFestivalName(id, festivals, promoters) {
    const fest = festivals.find(f => f.ID === id);
    return fest ? fest.Name : `Unknown (${id})`;
}
export function renderDisplayRow(tbody, alias, festivals, promoters) {
    let row = tbody.querySelector(`tr[data-id="${alias.ID}"]`);
    if (!row) {
        row = document.createElement('tr');
        row.dataset.id = alias.ID.toString();
        tbody.appendChild(row);
    }
    const displayName = getFestivalName(alias.Festival, festivals, promoters);
    row.innerHTML = `
        <td>${alias.ID}</td>
        <td>${displayName}</td>
        <td>${alias.Alias}</td>
        <td>${alias.Uuid}</td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
    `;
}
export function renderEditRow(tbody, alias, isNew, festivals, promoters) {
    let row;
    if (isNew) {
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
    const festivalOptions = festivals.map(f => {
        const name = getFestivalName(f.ID, festivals, promoters);
        return `<option value="${f.ID}" ${f.ID === alias.Festival ? 'selected' : ''}>${name}</option>`;
    }).join('');
    row.innerHTML = `
        <td>${alias.ID || 'New'}</td>
        <td>
            <select class="edit-festival">
                <option value="" disabled ${!alias.Festival ? 'selected' : ''}>Select Festival</option>
                ${festivalOptions}
            </select>
        </td>
        <td><input type="text" class="edit-alias" value="${alias.Alias || ''}" placeholder="Alias"></td>
        <td>${alias.Uuid || '-'}</td>
        <td>${formatDateTime(alias.Created)}</td>
        <td>${formatDateTime(alias.Updated)}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
    const aliasInput = row.querySelector('.edit-alias');
    if (aliasInput)
        aliasInput.focus();
}
