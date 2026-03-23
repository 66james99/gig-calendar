import { fetchImageLocations } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick, handleEditItem, handleNotFound } from './event.js';
import { handleUrlActions } from '../shared/url-params.js';
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
// --- Initialization ---
export async function refreshLocations() {
    try {
        setLocationsCache(await fetchImageLocations());
        // Apply any existing filters and sorting, then render the table
        handleFilterChange();
        handleUrlActions(locationsCache, {
            nameField: 'Root',
            onNew: (name) => handleNewClick({ Root: name }),
            onEdit: (item) => handleEditItem(item),
            onNotFound: (name) => handleNotFound(name)
        });
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        tableBody.innerHTML = '<tr><td colspan="10">Failed to load data. Is the backend server running?</td></tr>';
    }
}
function init() {
    tableBody.addEventListener('click', handleTableClick);
    tableHeader.addEventListener('click', handleSort);
    newButton.addEventListener('click', () => handleNewClick());
    refreshButton.addEventListener('click', refreshLocations);
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
