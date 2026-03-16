import type { Performer } from './types.js';

export function renderTable(tbody: HTMLTableSectionElement, performers: Performer[]) {
    tbody.innerHTML = ''; // Clear existing rows
    if (performers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No performers found.</td></tr>';
        return;
    }
    performers.forEach(performer => renderDisplayRow(tbody, performer));
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, performer: Performer) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${performer.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = performer.ID.toString();
    }
    row.innerHTML = `
        <td>${performer.ID}</td>
        <td>${performer.Name}</td>
        <td>${performer.Uuid}</td>
        <td>${new Date(performer.Created).toLocaleString()}</td>
        <td>${new Date(performer.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, performer: Partial<Performer>, isNew: boolean) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${performer.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = performer.ID ? performer.ID.toString() : 'new';
    } else if (!row) {
        return; // Should not happen for existing rows
    }

    row.innerHTML = `
        <td>${performer.ID || 'New'}</td>
        <td><input type="text" class="edit-name" value="${performer.Name || ''}" style="width: 100%;"></td>
        <td>${performer.Uuid || 'N/A'}</td>
        <td>${performer.Created ? new Date(performer.Created).toLocaleString() : 'N/A'}</td>
        <td>${performer.Updated ? new Date(performer.Updated).toLocaleString() : 'N/A'}</td>
        <td>
            <button class="${isNew ? 'add-btn' : 'save-btn'}">${isNew ? 'Add' : 'Save'}</button>
            <button class="${isNew ? 'cancel-add-btn' : 'cancel-btn'}">Cancel</button>
        </td>
    `;
}