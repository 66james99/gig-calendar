import { fetchImageLocations } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
import { renderTable, updateSortIndicators } from './ui.js';
// --- State ---
export let locationsCache = [];
export let currentSort = {
    column: 'ID',
    direction: 'asc',
};
export let currentFilters = {
    id: '',
    root: '',
    pattern: '',
    dateFromExif: '',
    includeParent: '',
    ignoreDirs: '',
    active: '',
};
export function setLocationsCache(newCache) {
    locationsCache = newCache;
}
export function setCurrentSort(newSort) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters) {
    currentFilters = newFilters;
}
// --- DOM Elements ---
export const tableBody = document.querySelector('#locations-list tbody');
export const tableHeader = document.querySelector('#locations-list thead');
export const newButton = document.getElementById('new-button');
export const refreshButton = document.getElementById('refresh-button');
export const debugCheckbox = document.getElementById('debug-mode');
export const filterIdInput = document.getElementById('filter-id');
export const filterRootInput = document.getElementById('filter-root');
export const filterPatternInput = document.getElementById('filter-pattern');
export const filterDateFromExifSelect = document.getElementById('filter-date_from_exif');
export const filterIncludeParentSelect = document.getElementById('filter-include_parent');
export const filterIgnoreDirsInput = document.getElementById('filter-ignore_dirs');
export const filterActiveSelect = document.getElementById('filter-active');
// --- UI Functions ---
export function applyFilters(locations) {
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
export function applySort(locations) {
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
// --- Initialization ---
export async function refreshLocations() {
    try {
        setLocationsCache(await fetchImageLocations());
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
            setLocationsCache(await fetchImageLocations());
            const sortedLocations = applySort(locationsCache);
            renderTable(tableBody, sortedLocations);
            updateSortIndicators(currentSort);
        }
        catch (error) {
            alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            tableBody.innerHTML = '<tr><td colspan="10">Failed to load data. Is the backend server running?</td></tr>';
        }
    })();
}
// Start the app
init();
