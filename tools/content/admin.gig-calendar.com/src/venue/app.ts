import { fetchVenues } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
import { renderTable, updateSortIndicators } from './ui.js';
import type { Filters, Venue, SortState } from './types.js';

// --- State ---
export let venuesCache: Venue[] = [];
export let currentSort: SortState = {
    column: 'Name',
    direction: 'asc',
};
export let currentFilters: Filters = {
    id: '',
    name: '',
    uuid: '',
};

export function setVenuesCache(newCache: Venue[]) {
    venuesCache = newCache;
}
export function setCurrentSort(newSort: SortState) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters: Filters) {
    currentFilters = newFilters;
}

// --- DOM Elements ---
export const tableBody = document.querySelector('#venues-list tbody') as HTMLTableSectionElement;
export const tableHeader = document.querySelector('#venues-list thead') as HTMLTableSectionElement;
export const newButton = document.getElementById('new-button') as HTMLButtonElement;
export const refreshButton = document.getElementById('refresh-button') as HTMLButtonElement;

export const filterIdInput = document.getElementById('filter-id') as HTMLInputElement;
export const filterNameInput = document.getElementById('filter-name') as HTMLInputElement;
export const filterUuidInput = document.getElementById('filter-uuid') as HTMLInputElement;

// --- Core Logic ---

export function applyFilters(venues: Venue[]): Venue[] {
    return venues.filter(venue => {
        const idMatch = venue.ID.toString().includes(currentFilters.id);
        const nameMatch = venue.Name.toLowerCase().includes(currentFilters.name.toLowerCase());
        const uuidMatch = venue.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());

        return idMatch && nameMatch && uuidMatch;
    });
}

export function applySort(venues: Venue[]): Venue[] {
    const { column, direction } = currentSort;
    const modifier = direction === 'asc' ? 1 : -1;

    return [...venues].sort((a, b) => {
        const valA = a[column];
        const valB = b[column];

        if (column === 'ID') {
            return (valA as number - (valB as number)) * modifier;
        }

        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB) * modifier;
        }
        
        return 0;
    });
}

export async function refreshVenues() {
    try {
        setVenuesCache(await fetchVenues());
        handleFilterChange();
    } catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        tableBody.innerHTML = '<tr><td colspan="6">Failed to load data. Is the backend server running?</td></tr>';
    }
}

function init() {
    tableBody.addEventListener('click', handleTableClick);
    tableHeader.addEventListener('click', handleSort);
    newButton.addEventListener('click', handleNewClick);
    refreshButton.addEventListener('click', refreshVenues);

    filterIdInput.addEventListener('input', handleFilterChange);
    filterNameInput.addEventListener('input', handleFilterChange);
    filterUuidInput.addEventListener('input', handleFilterChange);

    (async () => {
        try {
            await refreshVenues();
        } catch (error) {
            console.error(error);
        }
    })();
}

init();