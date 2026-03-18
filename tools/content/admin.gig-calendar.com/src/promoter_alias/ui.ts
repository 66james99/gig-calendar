import type { PromoterAlias, Promoter } from './types.js';

export function renderTable(tbody: HTMLTableSectionElement, aliases: PromoterAlias[], promoters: Promoter[]) {
    tbody.innerHTML = '';
    const noDataMsg = document.getElementById('no-data-message');

    if (aliases.length === 0) {
        if (noDataMsg) noDataMsg.classList.remove('hidden');
        return;
    }

    if (noDataMsg) noDataMsg.classList.add('hidden');

    aliases.forEach(alias => {
        renderDisplayRow(tbody, alias, promoters);
    });
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, alias: PromoterAlias, promoters: Promoter[]) {
    let row = tbody.querySelector(`tr[data-id="${alias.ID}"]`) as HTMLTableRowElement;
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
        <td>${new Date(alias.Created).toLocaleString()}</td>
        <td>${new Date(alias.Updated).toLocaleString()}</td>
        <td class="actions">
            <button class="btn-icon edit-btn" title="Edit">✏️</button>
            <button class="btn-icon duplicate-btn" title="Duplicate">📋</button>
            <button class="btn-icon delete-btn" title="Delete">🗑️</button>
        </td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, alias: Partial<PromoterAlias>, isNew: boolean, promoters: Promoter[]) {
    let row: HTMLTableRowElement;

    if (isNew) {
        // For new rows, we assume the row is already inserted by the caller (handleNewClick) or we are transforming the first row
        // Note: The event handler logic usually inserts a blank row first.
        // If the passed alias has no ID, we look for a row without a dataset ID or create one.
        row = tbody.querySelector('tr:not([data-id])') as HTMLTableRowElement;
        if (!row) {
            row = document.createElement('tr');
            tbody.prepend(row);
        }
    } else {
        row = tbody.querySelector(`tr[data-id="${alias.ID}"]`) as HTMLTableRowElement;
    }

    if (!row) return;

    const promoterOptions = promoters.map(p => 
        `<option value="${p.ID}" ${p.ID === alias.Promoter ? 'selected' : ''}>${p.Name}</option>`
    ).join('');

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
        <td>${alias.Created ? new Date(alias.Created).toLocaleString() : '-'}</td>
        <td>${alias.Updated ? new Date(alias.Updated).toLocaleString() : '-'}</td>
        <td class="actions">
            ${isNew 
                ? `<button class="btn-icon add-btn" title="Add">✅</button>
                   <button class="btn-icon cancel-add-btn" title="Cancel">❌</button>`
                : `<button class="btn-icon save-btn" title="Save">💾</button>
                   <button class="btn-icon cancel-btn" title="Cancel">❌</button>`
            }
        </td>
    `;
    
    // Focus on the alias input for convenience
    const aliasInput = row.querySelector('.edit-alias') as HTMLInputElement;
    if (aliasInput) {
        aliasInput.focus();
    }
}