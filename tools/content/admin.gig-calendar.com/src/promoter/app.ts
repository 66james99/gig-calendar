import { fetchPromoters } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
import type { Filters, Promoter, SortState } from './types.js';

// --- State ---
export let promotersCache: Promoter[] = [];
export let currentSort: SortState = {
    column: 'Name',
    direction: 'asc',
};
export let currentFilters: Filters = {
    id: '',
    name: '',
    uuid: '',
};

export function setPromotersCache(newCache: Promoter[]) {
    promotersCache = newCache;
}
export function setCurrentSort(newSort: SortState) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters: Filters) {
    currentFilters = newFilters;
}

// --- DOM Elements ---

export const tableBody = document.querySelector('#promoters-list tbody') as HTMLTableSectionElement;
export const tableHeader = document.querySelector('#promoters-list thead') as HTMLTableSectionElement;
export const newButton = document.getElementById('new-promoter-button') as HTMLButtonElement;
export const refreshButton = document.getElementById('refresh-promoters-button') as HTMLButtonElement;

export const filterIdInput = document.getElementById('filter-promoter-id') as HTMLInputElement;
export const filterNameInput = document.getElementById('filter-promoter-name') as HTMLInputElement;
export const filterUuidInput = document.getElementById('filter-promoter-uuid') as HTMLInputElement;

// --- UI Functions ---

export function applyFilters(promoters: Promoter[]): Promoter[] {
    return promoters.filter(promoter => {
        const idMatch = promoter.ID.toString().includes(currentFilters.id);
        const nameMatch = promoter.Name.toLowerCase().includes(currentFilters.name.toLowerCase());
        const uuidMatch = promoter.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());

        return idMatch && nameMatch && uuidMatch;
    });
}

export function applySort(promoters: Promoter[]): Promoter[] {
    const { column, direction } = currentSort;
    const modifier = direction === 'asc' ? 1 : -1;

    return [...promoters].sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (column === 'ID') {
            valA = a.ID;
            valB = b.ID;
        } else if (column === 'Name' || column === 'Uuid') {
            valA = a[column].toLowerCase();
            valB = b[column].toLowerCase();
        } else if (column === 'Created' || column === 'Updated') {
            valA = a[column];
            valB = b[column];
        }

        if (valA < valB) return -1 * modifier;
        if (valA > valB) return 1 * modifier;
        return 0;
    });
}

// --- Initialization ---

export async function refreshPromoters() {
    try {
        setPromotersCache(await fetchPromoters());
        // Apply any existing filters and sorting, then render the table
        handleFilterChange();
    } catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6">Failed to load data. Is the backend server running?</td></tr>';
        }
    }
}

function init() {
    if (tableBody) tableBody.addEventListener('click', handleTableClick);
    if (tableHeader) tableHeader.addEventListener('click', handleSort);
    if (newButton) newButton.addEventListener('click', handleNewClick);
    if (refreshButton) refreshButton.addEventListener('click', refreshPromoters);

    // Add event listeners for filters
    if (filterIdInput) filterIdInput.addEventListener('input', handleFilterChange);
    if (filterNameInput) filterNameInput.addEventListener('input', handleFilterChange);
    if (filterUuidInput) filterUuidInput.addEventListener('input', handleFilterChange);

    refreshPromoters();
}

init();