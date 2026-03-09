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
const form = document.querySelector('#location-form');
const locationIdInput = document.getElementById('location-id');
const rootInput = document.getElementById('root');
const patternInput = document.getElementById('pattern');
const ignoreDirsInput = document.getElementById('ignore_dirs');
const dateFromExifCheckbox = document.getElementById('date_from_exif');
const includeParentCheckbox = document.getElementById('include_parent');
const activeCheckbox = document.getElementById('active');
const cancelEditButton = document.getElementById('cancel-edit');
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
function renderTable(locations) {
    tableBody.innerHTML = '';
    if (!locations || locations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8">No image locations found.</td></tr>';
        return;
    }
    locations.forEach(location => {
        const row = tableBody.insertRow();
        row.dataset.id = location.ID.toString();
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
            </td>
        `;
    });
}
function populateForm(location) {
    locationIdInput.value = location.ID.toString();
    rootInput.value = location.Root;
    patternInput.value = location.Pattern;
    ignoreDirsInput.value = (location.IgnoreDirs || []).join(',');
    dateFromExifCheckbox.checked = location.DateFromExif;
    includeParentCheckbox.checked = location.IncludeParent;
    activeCheckbox.checked = location.Active;
    cancelEditButton.style.display = 'inline-block';
}
function resetForm() {
    form.reset();
    locationIdInput.value = '';
    activeCheckbox.checked = true; // Default for new entries
    cancelEditButton.style.display = 'none';
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
async function handleFormSubmit(event) {
    event.preventDefault();
    const id = locationIdInput.value ? parseInt(locationIdInput.value, 10) : null;
    const payload = {
        root: rootInput.value,
        pattern: patternInput.value,
        date_from_exif: dateFromExifCheckbox.checked,
        include_parent: includeParentCheckbox.checked,
        ignore_dirs: ignoreDirsInput.value.split(',').map(s => s.trim()).filter(s => s),
        active: activeCheckbox.checked,
    };
    try {
        if (id) {
            await updateImageLocation(id, payload);
        }
        else {
            await createImageLocation(payload);
        }
        resetForm();
        await refreshLocations();
    }
    catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row || !row.dataset.id)
        return;
    const id = parseInt(row.dataset.id, 10);
    if (target.classList.contains('delete-btn')) {
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
    else if (target.classList.contains('edit-btn')) {
        const location = locationsCache.find(loc => loc.ID === id);
        if (location) {
            populateForm(location);
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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
    form.addEventListener('submit', handleFormSubmit);
    tableBody.addEventListener('click', handleTableClick);
    cancelEditButton.addEventListener('click', resetForm);
    // Add event listeners for filters
    filterIdInput.addEventListener('input', handleFilterChange);
    filterRootInput.addEventListener('input', handleFilterChange);
    filterPatternInput.addEventListener('input', handleFilterChange);
    filterDateFromExifSelect.addEventListener('change', handleFilterChange);
    filterIncludeParentSelect.addEventListener('change', handleFilterChange);
    filterIgnoreDirsInput.addEventListener('input', handleFilterChange);
    filterActiveSelect.addEventListener('change', handleFilterChange);
    refreshLocations();
}
// Start the app
init();
//# sourceMappingURL=app.js.map