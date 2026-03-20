import { StageRole } from "./types.js";
import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml, formatDateTime } from '../shared/ui.js';

export function renderTable(tbody: HTMLTableSectionElement, items: StageRole[]) {
    tbody.innerHTML = "";

    if (items.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(6, 'No stage roles found.');
        return;
    }

    items.forEach((item) => {
        renderDisplayRow(tbody, item);
    });
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, item: StageRole) {
    const idStr = item.ID != null ? item.ID.toString() : '';
    let row = idStr ? tbody.querySelector(`tr[data-id="${idStr}"]`) as HTMLTableRowElement : null;
    
    if (!row) {
        row = document.createElement("tr");
        if (idStr) row.dataset.id = idStr;
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

export function renderEditRow(tbody: HTMLTableSectionElement, item: Partial<StageRole>, isNew: boolean) {
    let row: HTMLTableRowElement;

    if (isNew) {
        row = tbody.querySelector('tr:not([data-id])') as HTMLTableRowElement;
        if (!row) {
            row = document.createElement('tr');
            tbody.prepend(row);
        }
    } else {
        row = tbody.querySelector(`tr[data-id="${item.ID}"]`) as HTMLTableRowElement;
    }

    if (!row) return;

    row.innerHTML = `
        <td>${item.ID || 'New'}</td>
        <td>${item.Uuid || ''}</td>
        <td><input type="text" class="edit-pattern" value="${item.Pattern || ''}" placeholder="Pattern"></td>
        <td>${item.Created ? formatDateTime(item.Created) : ''}</td>
        <td>${item.Updated ? formatDateTime(item.Updated) : ''}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;

    const patternInput = row.querySelector('.edit-pattern') as HTMLInputElement;
    if (patternInput) patternInput.focus();
}

function escapeHtml(text: string): string {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}