import type { Festival, Promoter } from './types.js';
import { getActionButtonsHtml, getEditButtonsHtml, getNoDataRowHtml } from '../shared/ui.js';

export function renderTable(tbody: HTMLTableSectionElement, festivals: Festival[], promoters: Promoter[]) {
    tbody.innerHTML = '';
    if (festivals.length === 0) {
        tbody.innerHTML = getNoDataRowHtml(8, 'No festivals found.');
        return;
    }

    festivals.forEach(festival => {
        renderDisplayRow(tbody, festival, promoters);
    });
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, festival: Festival, promoters: Promoter[]) {
    let row = tbody.querySelector(`tr[data-id="${festival.ID}"]`) as HTMLTableRowElement;
    if (!row) {
        row = document.createElement('tr');
        row.dataset.id = festival.ID.toString();
        tbody.appendChild(row);
    }

    const promoterName = promoters.find(p => p.ID === festival.Promoter)?.Name || `Unknown (${festival.Promoter})`;

    // Format dates to YYYY-MM-DD for display
    const start = festival.StartDate ? festival.StartDate.split('T')[0] : '';
    const end = festival.EndDate ? festival.EndDate.split('T')[0] : '';

    row.innerHTML = `
        <td>${festival.ID}</td>
        <td>${festival.Name || ''}</td>
        <td>${promoterName}</td>
        <td>${start}</td>
        <td>${end}</td>
        <td>${festival.Description || ''}</td>
        <td>${festival.Uuid}</td>
        <td class="actions">${getActionButtonsHtml()}</td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, festival: Partial<Festival>, isNew: boolean, promoters: Promoter[]) {
    let row: HTMLTableRowElement;

    if (isNew) {
        row = tbody.querySelector('tr:not([data-id])') as HTMLTableRowElement;
        if (!row) {
            row = document.createElement('tr');
            tbody.prepend(row);
        }
    } else {
        row = tbody.querySelector(`tr[data-id="${festival.ID}"]`) as HTMLTableRowElement;
    }

    if (!row) return;

    const promoterOptions = promoters.map(p => 
        `<option value="${p.ID}" ${p.ID === festival.Promoter ? 'selected' : ''}>${p.Name}</option>`
    ).join('');

    const start = festival.StartDate ? festival.StartDate.split('T')[0] : '';
    const end = festival.EndDate ? festival.EndDate.split('T')[0] : '';
    const description = festival.Description || '';

    row.innerHTML = `
        <td>${festival.ID || 'New'}</td>
        <td><input type="text" class="edit-name" value="${festival.Name || ''}" placeholder="Name"></td>
        <td>
            <select class="edit-promoter">
                <option value="" disabled ${!festival.Promoter ? 'selected' : ''}>Select Promoter</option>
                ${promoterOptions}
            </select>
        </td>
        <td><input type="date" class="edit-start" value="${start}"></td>
        <td><input type="date" class="edit-end" value="${end}"></td>
        <td><input type="text" class="edit-description" value="${description}" placeholder="Description"></td>
        <td>${festival.Uuid || '-'}</td>
        <td class="actions">${getEditButtonsHtml(isNew)}</td>
    `;
}