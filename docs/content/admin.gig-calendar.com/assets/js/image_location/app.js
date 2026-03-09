"use strict";
const API_BASE_URL = 'http://localhost:8080';
// --- State ---
let locationsCache = [];
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
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
            <button class="duplicate-btn">Duplicate</button>
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
        <td>
            ${isNew ? `
                <button class="add-btn">Add</button>
                <button class="cancel-add-btn">Cancel</button>
            ` : `
                <button class="save-btn">Save</button>
                <button class="cancel-btn">Cancel</button>
            `}
        </td>
    `;
}
function renderTable(locations) {
    tableBody.innerHTML = '';
    if (!locations || locations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No image locations found.</td></tr>';
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
    renderTable(filteredLocations);
}
// --- Initialization ---
async function refreshLocations() {
    try {
        locationsCache = await fetchImageLocations();
        // Apply any existing filters and render the table
        handleFilterChange();
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        tableBody.innerHTML = '<tr><td colspan="8">Failed to load data. Is the backend server running?</td></tr>';
    }
}
function init() {
    tableBody.addEventListener('click', handleTableClick);
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
            renderTable(locationsCache);
        }
        catch (error) {
            alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            tableBody.innerHTML = '<tr><td colspan="8">Failed to load data. Is the backend server running?</td></tr>';
        }
    })();
}
// Start the app
init();
//# sourceMappingURL=app.js.map