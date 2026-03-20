import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';
export function renderTable(tbody, items) {
    tbody.innerHTML = "";
    if (items.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(6, 'No stage roles found.');
        return;
    }
    items.forEach((item) => {
        renderDisplayRow(tbody, item);
    });
}
export function renderDisplayRow(tbody, item) {
    const idStr = item.ID != null ? item.ID.toString() : '';
    let row = idStr ? tbody.querySelector(`tr[data-id="${idStr}"]`) : null;
    if (!row) {
        row = document.createElement("tr");
        if (idStr)
            row.dataset.id = idStr;
        tbody.appendChild(row);
    }
    row.innerHTML = `
        <td>${item.ID}</td>
        <td>${item.Uuid || ''}</td>
        <td>${escapeHtml(item.Pattern)}</td>
        <td>${formatDateTime(item.Created)}</td>
        <td>${formatDateTime(item.Updated)}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
    `;
}
export function renderEditRow(tbody, item, isNew) {
    let row;
    if (isNew) {
        row = tbody.querySelector('tr:not([data-id])');
        if (!row) {
            row = document.createElement('tr');
            tbody.prepend(row);
        }
    }
    else {
        row = tbody.querySelector(`tr[data-id="${item.ID}"]`);
    }
    if (!row)
        return;
    row.innerHTML = `
        <td>${item.ID || 'New'}</td>
        <td>${item.Uuid || ''}</td>
        <td><input type="text" class="edit-pattern" value="${item.Pattern || ''}" placeholder="Pattern"></td>
        <td>${item.Created ? formatDateTime(item.Created) : ''}</td>
        <td>${item.Updated ? formatDateTime(item.Updated) : ''}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
    const patternInput = row.querySelector('.edit-pattern');
    if (patternInput)
        patternInput.focus();
}
function escapeHtml(text) {
    if (!text)
        return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
