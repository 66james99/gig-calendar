import type { EventType } from './types.js';
import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml } from '../shared/ui.js';

export function renderTable(tbody: HTMLTableSectionElement, eventTypes: EventType[]) {
    tbody.innerHTML = '';
    if (eventTypes.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(4, 'No event types found.');
        return;
    }

    eventTypes.forEach(et => {
        renderDisplayRow(tbody, et);
    });
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, et: EventType) {
    const idStr = et.ID != null ? et.ID.toString() : '';
    let row = idStr ? tbody.querySelector(`tr[data-id="${idStr}"]`) as HTMLTableRowElement : null;
    if (!row) {
        row = document.createElement('tr');
        if (idStr) row.dataset.id = idStr;
        tbody.appendChild(row);
    }

    row.innerHTML = `
        <td>${et.ID != null ? et.ID : ''}</td>
        <td>${et.Uuid || ''}</td>
        <td>${et.Name || ''}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, et: Partial<EventType>, isNew: boolean) {
    let row: HTMLTableRowElement;

    if (isNew) {
        row = tbody.querySelector('tr:not([data-id])') as HTMLTableRowElement;
        if (!row) {
            row = document.createElement('tr');
            tbody.prepend(row);
        }
    } else {
        row = tbody.querySelector(`tr[data-id="${et.ID}"]`) as HTMLTableRowElement;
    }

    if (!row) return;

    row.innerHTML = `
        <td>${et.ID || 'New'}</td>
        <td>${et.Uuid || ''}</td>
        <td><input type="text" class="edit-name" value="${et.Name || ''}" placeholder="Name"></td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;

    const nameInput = row.querySelector('.edit-name') as HTMLInputElement;
    if (nameInput) nameInput.focus();
}