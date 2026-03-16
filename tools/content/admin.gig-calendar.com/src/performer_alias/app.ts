import { fetchPerformerAliases, fetchPerformers } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
import { applySort, type SorterMap } from '../shared/table-utils.js';
import type { SortState } from '../shared/types.js';
import type { Filters, PerformerAlias, PerformerAliasSortableColumn, Performer } from './types.js';

// --- State ---
export let aliasesCache: PerformerAlias[] = [];
export let performersCache: Performer[] = []; // Cache for performer names
export let currentSort: SortState<PerformerAliasSortableColumn> = {
    column: 'ID',
    direction: 'asc',
};
export let currentFilters: Filters = {
    id: '',
    performer: '',
    alias: '',
    created: '',
    updated: '',
};

export function setAliasesCache(newCache: PerformerAlias[]) {
    aliasesCache = newCache;
}
export function setPerformersCache(newCache: Performer[]) {
    performersCache = newCache;
}
export function setCurrentSort(newSort: SortState<PerformerAliasSortableColumn>) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters: Filters) {
    currentFilters = newFilters;
}

// --- DOM Elements ---

export const tableBody = document.querySelector('#performer-aliases-list tbody') as HTMLTableSectionElement;
export const tableHeader = document.querySelector('#performer-aliases-list thead') as HTMLTableSectionElement;
export const newButton = document.getElementById('new-alias-button') as HTMLButtonElement;
export const refreshButton = document.getElementById('refresh-aliases-button') as HTMLButtonElement;

export const filterIdInput = document.getElementById('filter-alias-id') as HTMLInputElement;
export const filterPerformerInput = document.getElementById('filter-alias-performer') as HTMLInputElement;
export const filterAliasInput = document.getElementById('filter-alias-alias') as HTMLInputElement;
export const filterCreatedInput = document.getElementById('filter-alias-created') as HTMLInputElement;
export const filterUpdatedInput = document.getElementById('filter-alias-updated') as HTMLInputElement;

// --- UI Functions ---

export function applyFilters(aliases: PerformerAlias[]): PerformerAlias[] {
    return aliases.filter(alias => {
        const idMatch = alias.ID.toString().includes(currentFilters.id);
        const performerName = performersCache.find(p => p.ID === alias.Performer)?.Name || '';
        const performerMatch = performerName.toLowerCase().includes(currentFilters.performer.toLowerCase());
        const aliasMatch = alias.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase());
        const createdMatch = alias.Created.includes(currentFilters.created);
        const updatedMatch = alias.Updated.includes(currentFilters.updated);

        return idMatch && performerMatch && aliasMatch && createdMatch && updatedMatch;
    });
}

export function sortAliases(aliases: PerformerAlias[]): PerformerAlias[] {
    const sorters: SorterMap<PerformerAlias> = {
        Performer: (a) => performersCache.find(p => p.ID === a.Performer)?.Name || ''
    };
    return applySort(aliases, currentSort, sorters);
}

// --- Initialization ---

export async function refreshAliases() {
    try {
        setPerformersCache(await fetchPerformers()); // Fetch performers first for display
        setAliasesCache(await fetchPerformerAliases());
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
    if (refreshButton) refreshButton.addEventListener('click', refreshAliases);

    // Add event listeners for filters
    if (filterIdInput) filterIdInput.addEventListener('input', handleFilterChange);
    if (filterPerformerInput) filterPerformerInput.addEventListener('input', handleFilterChange);
    if (filterAliasInput) filterAliasInput.addEventListener('input', handleFilterChange);
    if (filterCreatedInput) filterCreatedInput.addEventListener('input', handleFilterChange);
    if (filterUpdatedInput) filterUpdatedInput.addEventListener('input', handleFilterChange);

    refreshAliases();
}

// Start the app
init();