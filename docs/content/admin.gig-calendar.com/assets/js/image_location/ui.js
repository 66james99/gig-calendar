export function renderDisplayRow(row, location) {
    row.innerHTML = `
        <td>${location.ID}</td>
        <td>${location.Root}</td>
        <td>${location.Pattern}</td>
        <td>${location.DateFromExif}</td>
        <td>${location.IncludeParent}</td>
        <td>${(location.IgnoreDirs || []).join(', ')}</td>
        <td>${location.Active}</td>
        <td>${new Date(location.Created).toLocaleString()}</td>
        <td>${new Date(location.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn" title="Edit">✏️</button>
            <button class="delete-btn" title="Delete">🗑️</button>
            <button class="duplicate-btn" title="Duplicate">📋</button>
            <button class="preview-btn" title="Preview Scan">🔬</button>
        </td>
    `;
}
export function renderEditRow(row, location, isNew = false) {
    const ignoreDirs = (location.IgnoreDirs || []).join(',');
    row.innerHTML = `
        <td>${isNew ? 'NEW' : location.ID}</td>
        <td><input type="text" class="edit-root" value="${location.Root || ''}"></td>
        <td><input type="text" class="edit-pattern" value="${location.Pattern || ''}"></td>
        <td><input type="checkbox" class="edit-date_from_exif" ${location.DateFromExif ? 'checked' : ''}></td>
        <td><input type="checkbox" class="edit-include_parent" ${location.IncludeParent ? 'checked' : ''}></td>
        <td><input type="text" class="edit-ignore_dirs" value="${ignoreDirs}"></td>
        <td><input type="checkbox" class="edit-active" ${location.Active || isNew ? 'checked' : ''}></td>
        <td>${location.Created ? new Date(location.Created).toLocaleString() : '...'}</td>
        <td>${location.Updated ? new Date(location.Updated).toLocaleString() : '...'}</td>
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
export function renderTable(tableBody, locations) {
    tableBody.innerHTML = '';
    if (!locations || locations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10">No image locations found.</td></tr>';
        return;
    }
    locations.forEach(location => {
        const row = tableBody.insertRow();
        row.dataset.id = location.ID.toString();
        renderDisplayRow(row, location);
    });
}
