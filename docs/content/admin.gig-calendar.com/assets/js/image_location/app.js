"use strict";
const API_BASE_URL = 'http://localhost:8080';
// --- State ---
let locationsCache = [];
let currentSort = {
    column: 'ID',
    direction: 'asc',
};
let currentFilters = {
    id: '',
    root: '',
    pattern: '',
    dateFromExif: '',
    includeParent: '',
    ignoreDirs: '',
    active: '',
};
// --- DOM Elements ---
const tableBody = document.querySelector('#locations-list tbody');
const tableHeader = document.querySelector('#locations-list thead');
const newButton = document.getElementById('new-button');
const refreshButton = document.getElementById('refresh-button');
const filterIdInput = document.getElementById('filter-id');
const filterRootInput = document.getElementById('filter-root');
const filterPatternInput = document.getElementById('filter-pattern');
const filterDateFromExifSelect = document.getElementById('filter-date_from_exif');
const filterIncludeParentSelect = document.getElementById('filter-include_parent');
const filterIgnoreDirsInput = document.getElementById('filter-ignore_dirs');
const filterActiveSelect = document.getElementById('filter-active');
// --- API Functions ---
async function fetchImageLocations() {
    const response = await fetch(`${API_BASE_URL}/image_locations`);
    if (!response.ok) {
        throw new Error('Failed to fetch image locations');
    }
    const data = await response.json();
    return data || [];
}
async function createImageLocation(payload) {
    const response = await fetch(`${API_BASE_URL}/image_locations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create image location');
    }
    return response.json();
}
async function updateImageLocation(id, payload) {
    const response = await fetch(`${API_BASE_URL}/image_locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update image location');
    }
    return response.json();
}
async function deleteImageLocation(id) {
    const response = await fetch(`${API_BASE_URL}/image_locations/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        try {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete image location');
        }
        catch (e) {
            throw new Error('Failed to delete image location');
        }
    }
}
async function previewImageLocationScan(id) {
    // Add ?debug=true to get detailed parse errors
    const response = await fetch(`${API_BASE_URL}/image_locations/${id}/preview_scan?debug=true`);
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to run preview scan');
    }
    return response.json();
}
// --- UI Functions ---
function renderDisplayRow(row, location) {
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
function renderEditRow(row, location, isNew = false) {
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
function renderTable(locations) {
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
function applyFilters(locations) {
    return locations.filter(location => {
        const idMatch = location.ID.toString().includes(currentFilters.id);
        const rootMatch = location.Root.toLowerCase().includes(currentFilters.root.toLowerCase());
        const patternMatch = location.Pattern.toLowerCase().includes(currentFilters.pattern.toLowerCase());
        const ignoreDirsMatch = (location.IgnoreDirs || []).join(', ').toLowerCase().includes(currentFilters.ignoreDirs.toLowerCase());
        const dateFromExifMatch = currentFilters.dateFromExif === '' || location.DateFromExif.toString() === currentFilters.dateFromExif;
        const includeParentMatch = currentFilters.includeParent === '' || location.IncludeParent.toString() === currentFilters.includeParent;
        const activeMatch = currentFilters.active === '' || location.Active.toString() === currentFilters.active;
        return idMatch && rootMatch && patternMatch && ignoreDirsMatch && dateFromExifMatch && includeParentMatch && activeMatch;
    });
}
function applySort(locations) {
    const { column, direction } = currentSort;
    const modifier = direction === 'asc' ? 1 : -1;
    return [...locations].sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        // ID is a number
        if (column === 'ID') {
            // The type assertion is safe because we control the column values.
            return (valA - valB) * modifier;
        }
        // Booleans
        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            return (Number(valA) - Number(valB)) * modifier;
        }
        // Strings (including dates)
        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB) * modifier;
        }
        // Fallback for nulls or mixed types
        if (valA < valB)
            return -1 * modifier;
        if (valA > valB)
            return 1 * modifier;
        return 0;
    });
}
function updateSortIndicators() {
    document.querySelectorAll('th.sortable').forEach(th => {
        const htmlTh = th;
        htmlTh.classList.remove('sorted-asc', 'sorted-desc');
        if (htmlTh.dataset.sort === currentSort.column) {
            htmlTh.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }
    });
}
function showModal(title, content) {
    // Remove existing modal first
    const existingModal = document.getElementById('scan-result-modal');
    if (existingModal) {
        existingModal.remove();
    }
    const modal = document.createElement('div');
    modal.id = 'scan-result-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        align-items: center; justify-content: center; z-index: 1000;
    `;
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white; padding: 20px; border-radius: 5px;
        max-width: 80%; max-height: 80%; overflow-y: auto;
        min-width: 500px;
    `;
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px;
    `;
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modalTitle.style.margin = '0';
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        background: none; border: none; font-size: 1.5rem; cursor: pointer;
    `;
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    const modalBody = document.createElement('div');
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    }
    else {
        modalBody.appendChild(content);
    }
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const closeModal = () => modal.remove();
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}
// --- Event Handlers ---
async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row)
        return;
    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null;
    const location = id ? locationsCache.find(loc => loc.ID === id) : null;
    // --- Edit button ---
    if (target.classList.contains('edit-btn') && location) {
        renderEditRow(row, location);
    }
    // --- Cancel Edit button ---
    else if (target.classList.contains('cancel-btn') && location) {
        renderDisplayRow(row, location);
    }
    // --- Save button (for updating) ---
    else if (target.classList.contains('save-btn') && id) {
        const payload = {
            root: row.querySelector('.edit-root').value,
            pattern: row.querySelector('.edit-pattern').value,
            date_from_exif: row.querySelector('.edit-date_from_exif').checked,
            include_parent: row.querySelector('.edit-include_parent').checked,
            ignore_dirs: row.querySelector('.edit-ignore_dirs').value.split(',').map(s => s.trim()).filter(s => s),
            active: row.querySelector('.edit-active').checked,
        };
        try {
            await updateImageLocation(id, payload);
            await refreshLocations(); // Refresh all to see changes
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (location)
                renderDisplayRow(row, location); // Revert on failure
        }
    }
    // --- Duplicate button ---
    else if (target.classList.contains('duplicate-btn') && location) {
        const newRow = document.createElement('tr');
        // Create a copy for the new row, reset ID, keep other fields
        const newLocationData = { ...location, ID: 0 };
        renderEditRow(newRow, newLocationData, true);
        row.after(newRow); // Inserts the new row right after the clicked row
    }
    // --- Cancel Add button ---
    else if (target.classList.contains('cancel-add-btn')) {
        row.remove();
    }
    // --- Add button (for creating) ---
    else if (target.classList.contains('add-btn')) {
        const payload = {
            root: row.querySelector('.edit-root').value,
            pattern: row.querySelector('.edit-pattern').value,
            date_from_exif: row.querySelector('.edit-date_from_exif').checked,
            include_parent: row.querySelector('.edit-include_parent').checked,
            ignore_dirs: row.querySelector('.edit-ignore_dirs').value.split(',').map(s => s.trim()).filter(s => s),
            active: row.querySelector('.edit-active').checked,
        };
        try {
            await createImageLocation(payload);
            await refreshLocations();
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete location ${id}?`)) {
            try {
                await deleteImageLocation(id);
                await refreshLocations();
            }
            catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    // --- Preview Scan button ---
    else if (target.classList.contains('preview-btn') && id && location) {
        showModal(`Preview Scan for ID: ${id}`, '<div>Loading...</div>');
        try {
            const result = await previewImageLocationScan(id);
            const resultHtml = `
                <h4>Summary</h4>
                <ul>
                    <li><strong>Successfully Parsed:</strong> ${result.success_count}</li>
                    <li><strong>Inconsistent Data:</strong> ${result.inconsistent_count}</li>
                    <li><strong>Failed to Parse:</strong> ${result.error_count}</li>
                    <li><strong>Directories Found:</strong> ${result.directories.length}</li>
                    <li><strong>Directories Ignored:</strong> ${result.ignored_count}</li>
                </ul>
                <h4>Directories Found (${result.directories.length})</h4>
                <pre style="max-height: 200px; overflow-y: auto; background: #f4f4f4; padding: 10px; border-radius: 4px;">${result.directories.join('\n') || 'None'}</pre>
                <h4>Parse Errors (${result.error_count > 0 ? result.error_count : (result.parse_errors || []).length})</h4>
                <pre style="max-height: 200px; overflow-y: auto; background: #f4f4f4; padding: 10px; border-radius: 4px;">${(result.parse_errors || []).join('\n') || 'None'}</pre>
            `;
            showModal(`Preview Scan for ID: ${id}`, resultHtml);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            showModal(`Error Scanning ID: ${id}`, `<div style="color: red;">${message}</div>`);
        }
    }
}
function handleNewClick() {
    // Check if a row is already in 'add' mode to prevent multiple new rows.
    const existingAddRow = tableBody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new row before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = tableBody.insertRow(0); // Insert a new row at the top of the table.
    // Create an empty object for the new row. `renderEditRow` will handle defaults for a new entry.
    const newLocationData = {};
    renderEditRow(newRow, newLocationData, true); // Render the row in edit mode.
}
function handleSort(event) {
    const target = event.target;
    if (target.tagName !== 'TH' || !target.dataset.sort) {
        return;
    }
    const sortColumn = target.dataset.sort;
    if (currentSort.column === sortColumn) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }
    else {
        currentSort.column = sortColumn;
        currentSort.direction = 'asc';
    }
    // Re-apply filters and sorting, then render
    handleFilterChange();
}
function handleFilterChange() {
    currentFilters = {
        id: filterIdInput.value,
        root: filterRootInput.value,
        pattern: filterPatternInput.value,
        dateFromExif: filterDateFromExifSelect.value,
        includeParent: filterIncludeParentSelect.value,
        ignoreDirs: filterIgnoreDirsInput.value,
        active: filterActiveSelect.value,
    };
    const filteredLocations = applyFilters(locationsCache);
    const sortedLocations = applySort(filteredLocations);
    renderTable(sortedLocations);
    updateSortIndicators();
}
// --- Initialization ---
async function refreshLocations() {
    try {
        locationsCache = await fetchImageLocations();
        // Apply any existing filters and sorting, then render the table
        handleFilterChange();
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        tableBody.innerHTML = '<tr><td colspan="10">Failed to load data. Is the backend server running?</td></tr>';
    }
}
function init() {
    tableBody.addEventListener('click', handleTableClick);
    tableHeader.addEventListener('click', handleSort);
    newButton.addEventListener('click', handleNewClick);
    refreshButton.addEventListener('click', refreshLocations);
    // Add event listeners for filters
    filterIdInput.addEventListener('input', handleFilterChange);
    filterRootInput.addEventListener('input', handleFilterChange);
    filterPatternInput.addEventListener('input', handleFilterChange);
    filterDateFromExifSelect.addEventListener('change', handleFilterChange);
    filterIncludeParentSelect.addEventListener('change', handleFilterChange);
    filterIgnoreDirsInput.addEventListener('input', handleFilterChange);
    filterActiveSelect.addEventListener('change', handleFilterChange);
    // On initial load, fetch and render all data without filtering.
    // This ensures a clean slate regardless of browser autofill on filter inputs.
    (async () => {
        try {
            locationsCache = await fetchImageLocations();
            const sortedLocations = applySort(locationsCache);
            renderTable(sortedLocations);
            updateSortIndicators();
        }
        catch (error) {
            alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            tableBody.innerHTML = '<tr><td colspan="10">Failed to load data. Is the backend server running?</td></tr>';
        }
    })();
}
// Start the app
init();
//# sourceMappingURL=app.js.map