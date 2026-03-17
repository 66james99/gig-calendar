import type { PromoterAlias, Promoter } from './types.js';

export function renderTable(tbody: HTMLTableSectionElement, aliases: PromoterAlias[], promoters: Promoter[]) {
    tbody.innerHTML = ''; // Clear existing rows
    if (aliases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No promoter aliases found.</td></tr>';
        return;
    }
    aliases.forEach(alias => renderDisplayRow(tbody, alias, promoters));
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, alias: PromoterAlias, promoters: Promoter[]) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${alias.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = alias.ID.toString();
    }
    row.innerHTML = `
        <td>${alias.ID}</td>
        <td>${alias.Alias}</td>
        <td>${getPromoterName(alias.Promoter, promoters)}</td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, alias: Partial<PromoterAlias>, isNew: boolean, promoters: Promoter[]) {
    // If the table currently displays the "No promoter aliases found" message, clear it before adding the new row.
    if (tbody.rows.length === 1 && tbody.rows[0].cells.length === 1 && tbody.rows[0].innerText.includes('No promoter aliases found')) {
        tbody.innerHTML = '';
    }

    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${alias.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = alias.ID ? alias.ID.toString() : 'new';
    } else if (!row) {
        return; // Should not happen for existing rows
    }

    // Sort promoters alphabetically for the dropdown
    const sortedPromoters = [...promoters].sort((a, b) => a.Name.localeCompare(b.Name));

    const promoterOptions = sortedPromoters.map(p => 
        `<option value="${p.ID}" ${alias.Promoter === p.ID ? 'selected' : ''}>${p.Name}</option>`
    ).join('');

    row.innerHTML = `
        <td>${alias.ID || 'New'}</td>
        <td>
            <input type="text" class="edit-alias" value="${alias.Alias || ''}" style="width: 100%;">
        </td>
        <td>
            <select class="edit-promoter_id" style="width: 100%;">
                ${promoterOptions}
            </select>
        </td>
        <td>
            <button class="${isNew ? 'add-btn' : 'save-btn'}">${isNew ? 'Add' : 'Save'}</button>
            <button class="${isNew ? 'cancel-add-btn' : 'cancel-btn'}">Cancel</button>
        </td>
    `;
}

function getPromoterName(promoterID: number, promoters: Promoter[]): string {
    const promoter = promoters.find(p => p.ID === promoterID);
    return promoter ? promoter.Name : `Unknown Promoter (${promoterID})`;
}