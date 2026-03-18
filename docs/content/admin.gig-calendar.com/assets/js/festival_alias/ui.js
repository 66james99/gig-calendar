export function renderTable(tbody, aliases, festivals, promoters) {
    tbody.innerHTML = '';
    if (aliases.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No festival aliases found.</td></tr>';
        return;
    }
    aliases.forEach(alias => {
        renderDisplayRow(tbody, alias, festivals, promoters);
    });
}
function getFestivalName(id, festivals, promoters) {
    const fest = festivals.find(f => f.ID === id);
    if (!fest)
        return `Unknown (${id})`;
    const promoter = promoters.find(p => p.ID === fest.Promoter)?.Name || 'Unknown Promoter';
    const date = fest.StartDate ? fest.StartDate.split('T')[0] : '';
    // Display format: Promoter Name (Date) or Description if available
    return fest.Description ? `${fest.Description} (${date})` : `${promoter} Festival (${date})`;
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
        <td>${new Date(alias.Created).toLocaleString()}</td>
        <td>${new Date(alias.Updated).toLocaleString()}</td>
        <td class="actions">
            <button class="btn-icon edit-btn" title="Edit">✏️</button>
            <button class="btn-icon duplicate-btn" title="Duplicate">📋</button>
            <button class="btn-icon delete-btn" title="Delete">🗑️</button>
        </td>
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
        <td>${alias.Created ? new Date(alias.Created).toLocaleString() : '-'}</td>
        <td>${alias.Updated ? new Date(alias.Updated).toLocaleString() : '-'}</td>
        <td class="actions">
            ${isNew
        ? `<button class="btn-icon add-btn" title="Add">✅</button>
                   <button class="btn-icon cancel-add-btn" title="Cancel">❌</button>`
        : `<button class="btn-icon save-btn" title="Save">💾</button>
                   <button class="btn-icon cancel-btn" title="Cancel">❌</button>`}
        </td>
    `;
    const aliasInput = row.querySelector('.edit-alias');
    if (aliasInput)
        aliasInput.focus();
}
