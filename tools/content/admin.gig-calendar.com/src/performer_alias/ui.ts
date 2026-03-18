import type { PerformerAlias, Performer } from './types.js';

export function renderTable(tbody: HTMLTableSectionElement, aliases: PerformerAlias[], performers: Performer[]) {
    tbody.innerHTML = ''; // Clear existing rows
    if (aliases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No performer aliases found.</td></tr>';
        return;
    }
    aliases.forEach(alias => renderDisplayRow(tbody, alias, performers));
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, alias: PerformerAlias, performers: Performer[]) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${alias.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = alias.ID.toString();
    }
    row.innerHTML = `
        <td>${alias.ID}</td>
        <td>${getPerformerName(alias.Performer, performers)}</td>
        <td>${alias.Uuid}</td>
        <td>${alias.Alias}</td>
        <td>${new Date(alias.Created).toLocaleString()}</td>
        <td>${new Date(alias.Updated).toLocaleString()}</td>
        <td class="actions">
            <button class="btn-icon edit-btn" title="Edit">✏️</button>
            <button class="btn-icon delete-btn" title="Delete">🗑️</button>
            <button class="btn-icon duplicate-btn" title="Duplicate">📋</button>
        </td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, alias: Partial<PerformerAlias>, isNew: boolean, performers: Performer[]) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${alias.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = alias.ID ? alias.ID.toString() : 'new';
    } else if (!row) {
        return; // Should not happen for existing rows
    }

    // Sort performers alphabetically for the dropdown
    const sortedPerformers = [...performers].sort((a, b) => a.Name.localeCompare(b.Name));

    const performerOptions = sortedPerformers.map(p => 
        `<option value="${p.ID}" ${alias.Performer === p.ID ? 'selected' : ''}>${p.Name}</option>`
    ).join('');

    row.innerHTML = `
        <td>${alias.ID || 'New'}</td>
        <td>
            <select class="edit-performer_id" style="width: 100%;">
                ${performerOptions}
            </select>
        </td>
        <td>${alias.Uuid || 'N/A'}</td>
        <td><input type="text" class="edit-alias" value="${alias.Alias || ''}" style="width: 100%;"></td>
        <td>${alias.Created ? new Date(alias.Created).toLocaleString() : 'N/A'}</td>
        <td>${alias.Updated ? new Date(alias.Updated).toLocaleString() : 'N/A'}</td>
        <td class="actions">
            ${isNew 
                ? `<button class="btn-icon add-btn" title="Add">✅</button>
                   <button class="btn-icon cancel-add-btn" title="Cancel">❌</button>`
                : `<button class="btn-icon save-btn" title="Save">💾</button>
                   <button class="btn-icon cancel-btn" title="Cancel">❌</button>`
            }
        </td>
    `;

    const aliasInput = row.querySelector('.edit-alias') as HTMLInputElement;
    if (aliasInput) {
        aliasInput.focus();
    }
}

function getPerformerName(performerID: number, performers: Performer[]): string {
    const performer = performers.find(p => p.ID === performerID);
    return performer ? performer.Name : `Unknown Performer (${performerID})`;
}