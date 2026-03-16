import { fetchImageLocations } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
import { renderTable } from './ui.js';
import { applySort } from '../shared/table-utils.js';
import type { SortState } from '../shared/types.js';
import type { Filters, ImageLocation, ImageLocationSortableColumn } from './types.js';


// --- State ---
export let locationsCache: ImageLocation[] = [];
export let currentSort: SortState<ImageLocationSortableColumn> = {
    column: 'ID',
    direction: 'asc',
};
export let currentFilters: Filters = {
    id: '',
    root: '',
    pattern: '',
    dateFromExif: '',
    includeParent: '',
    ignoreDirs: '',
    active: '',
};

export function setLocationsCache(newCache: ImageLocation[]) {
    locationsCache = newCache;
}
export function setCurrentSort(newSort: SortState<ImageLocationSortableColumn>) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters: Filters) {
    currentFilters = newFilters;
}

// --- DOM Elements ---

export const tableBody = document.querySelector('#locations-list tbody') as HTMLTableSectionElement;
export const tableHeader = document.querySelector('#locations-list thead') as HTMLTableSectionElement;
export const newButton = document.getElementById('new-button') as HTMLButtonElement;
export const refreshButton = document.getElementById('refresh-button') as HTMLButtonElement;
export const debugCheckbox = document.getElementById('debug-mode') as HTMLInputElement;

export const filterIdInput = document.getElementById('filter-id') as HTMLInputElement;
export const filterRootInput = document.getElementById('filter-root') as HTMLInputElement;
export const filterPatternInput = document.getElementById('filter-pattern') as HTMLInputElement;
export const filterDateFromExifSelect = document.getElementById('filter-date_from_exif') as HTMLSelectElement;
export const filterIncludeParentSelect = document.getElementById('filter-include_parent') as HTMLSelectElement;
export const filterIgnoreDirsInput = document.getElementById('filter-ignore_dirs') as HTMLInputElement;
export const filterActiveSelect = document.getElementById('filter-active') as HTMLSelectElement;


// --- UI Functions ---

export function applyFilters(locations: ImageLocation[]): ImageLocation[] {
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
    } catch (error) {
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

	refreshLocations();
}

// Start the app
init();