import { fetchPerformers } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick, handleEditItem, handleNotFound } from './event.js';
import { handleUrlActions } from '../shared/url-params.js';
import { applySort } from '../shared/table-utils.js';
import type { SortState } from '../shared/types.js';
import type { Filters, Performer, PerformerSortableColumn } from './types.js';

// --- State ---
export let performersCache: Performer[] = [];
export let currentSort: SortState<PerformerSortableColumn> = {
    column: 'Name',
    direction: 'asc',
};
export let currentFilters: Filters = {
    id: '',
    name: '',
    uuid: '',
};

export function setPerformersCache(newCache: Performer[]) {
    performersCache = newCache;
}
export function setCurrentSort(newSort: SortState<PerformerSortableColumn>) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters: Filters) {
    currentFilters = newFilters;
}

// --- DOM Elements ---

export const tableBody = document.querySelector('#performers-list tbody') as HTMLTableSectionElement;
export const tableHeader = document.querySelector('#performers-list thead') as HTMLTableSectionElement;
export const newButton = document.getElementById('new-performer-button') as HTMLButtonElement;
export const refreshButton = document.getElementById('refresh-performers-button') as HTMLButtonElement;

export const filterIdInput = document.getElementById('filter-performer-id') as HTMLInputElement;
export const filterNameInput = document.getElementById('filter-performer-name') as HTMLInputElement;
export const filterUuidInput = document.getElementById('filter-performer-uuid') as HTMLInputElement;

// --- UI Functions ---

export function applyFilters(performers: Performer[]): Performer[] {
    return performers.filter(performer => {
        const idMatch = performer.ID.toString().includes(currentFilters.id);
        const nameMatch = performer.Name.toLowerCase().includes(currentFilters.name.toLowerCase());
        const uuidMatch = performer.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());

        return idMatch && nameMatch && uuidMatch;
    });
}

// --- Initialization ---

export async function refreshPerformers() {
    try {
        setPerformersCache(await fetchPerformers());
        // Apply any existing filters and sorting, then render the table
        handleFilterChange();

        handleUrlActions(performersCache, {
            nameField: 'Name',
            onNew: (name) => handleNewClick({ Name: name }),
            onEdit: (item) => handleEditItem(item),
            onNotFound: (name) => handleNotFound(name)
        });
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
    if (newButton) newButton.addEventListener('click', () => handleNewClick());
    if (refreshButton) refreshButton.addEventListener('click', refreshPerformers);

    // Add event listeners for filters
    if (filterIdInput) filterIdInput.addEventListener('input', handleFilterChange);
    if (filterNameInput) filterNameInput.addEventListener('input', handleFilterChange);
    if (filterUuidInput) filterUuidInput.addEventListener('input', handleFilterChange);

    refreshPerformers();
}

init();