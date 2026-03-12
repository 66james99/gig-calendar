export function renderDisplayRow(row, venue) {
    row.innerHTML = `
        <td>${venue.ID}</td>
        <td>${venue.Name}</td>
        <td>${venue.Uuid}</td>
        <td>${new Date(venue.Created).toLocaleString()}</td>
        <td>${new Date(venue.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn" title="Edit">✏️</button>
            <button class="delete-btn" title="Delete">🗑️</button>
            <button class="duplicate-btn" title="Duplicate">📋</button>
        </td>
    `;
}
export function renderEditRow(row, venue, isNew = false) {
    row.innerHTML = `
        <td>${isNew ? 'NEW' : venue.ID}</td>
        <td><input type="text" class="edit-name" value="${venue.Name || ''}"></td>
        <td>${venue.Uuid || '...'}</td>
        <td>${venue.Created ? new Date(venue.Created).toLocaleString() : '...'}</td>
        <td>${venue.Updated ? new Date(venue.Updated).toLocaleString() : '...'}</td>
        <td>
            ${isNew ? `
                <button class="add-btn" title="Add">✅</button>
                <button class="cancel-add-btn" title="Cancel">❌</button>
            ` : `
                <button class="save-btn" title="Save">💾</button>
                <button class="cancel-btn" title="Cancel">❌</button>
            `}
        </td>
    `;
}
export function renderTable(tableBody, venues) {
    tableBody.innerHTML = '';
    if (!venues || venues.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6">No venues found.</td></tr>';
        return;
    }
    venues.forEach(venue => {
        const row = tableBody.insertRow();
        row.dataset.id = venue.ID.toString();
        renderDisplayRow(row, venue);
    });
}
export function updateSortIndicators(currentSort) {
    document.querySelectorAll('th.sortable').forEach(th => {
        const htmlTh = th;
        htmlTh.classList.remove('sorted-asc', 'sorted-desc');
        if (htmlTh.dataset.sort === currentSort.column) {
            htmlTh.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }
    });
}
//# sourceMappingURL=ui.js.map