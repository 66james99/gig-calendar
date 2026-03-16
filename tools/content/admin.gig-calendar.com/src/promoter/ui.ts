import type { Promoter } from './types.js';

export function renderTable(tbody: HTMLTableSectionElement, promoters: Promoter[]) {
    tbody.innerHTML = ''; // Clear existing rows
    if (promoters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No promoters found.</td></tr>';
        return;
    }
    promoters.forEach(promoter => renderDisplayRow(tbody, promoter));
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, promoter: Promoter) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${promoter.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = promoter.ID.toString();
    }
    row.innerHTML = `
        <td>${promoter.ID}</td>
        <td>${promoter.Name}</td>
        <td>${promoter.Uuid}</td>
        <td>${new Date(promoter.Created).toLocaleString()}</td>
        <td>${new Date(promoter.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, promoter: Partial<Promoter>, isNew: boolean) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${promoter.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = promoter.ID ? promoter.ID.toString() : 'new';
    } else if (!row) {
        return; // Should not happen for existing rows
    }

    row.innerHTML = `
        <td>${promoter.ID || 'New'}</td>
        <td><input type="text" class="edit-name" value="${promoter.Name || ''}" style="width: 100%;"></td>
        <td>${promoter.Uuid || 'N/A'}</td>
        <td>${promoter.Created ? new Date(promoter.Created).toLocaleString() : 'N/A'}</td>
        <td>${promoter.Updated ? new Date(promoter.Updated).toLocaleString() : 'N/A'}</td>
        <td>
            <button class="${isNew ? 'add-btn' : 'save-btn'}">${isNew ? 'Add' : 'Save'}</button>
            <button class="${isNew ? 'cancel-add-btn' : 'cancel-btn'}">Cancel</button>
        </td>
    `;
}