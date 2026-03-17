import { fetchPromoterAliases, fetchPromoters } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
import { applySort, type SorterMap } from '../shared/table-utils.js';
import type { SortState } from '../shared/types.js';
import type { Filters, PromoterAlias, PromoterAliasSortableColumn, Promoter } from './types.js';

// --- State ---
export let aliasesCache: PromoterAlias[] = [];
export let promotersCache: Promoter[] = []; // Cache for promoter names
export let currentSort: SortState<PromoterAliasSortableColumn> = {
    column: 'ID',
    direction: 'asc',
};
export let currentFilters: Filters = {
    id: '',
    promoter: '',
    uuid: '',
    alias: '',
    created: '',
    updated: '',
};

export function setAliasesCache(newCache: PromoterAlias[]) {
    aliasesCache = newCache || [];
}
export function setPromotersCache(newCache: Promoter[]) {
    promotersCache = newCache || [];
}
export function setCurrentSort(newSort: SortState<PromoterAliasSortableColumn>) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters: Filters) {
    currentFilters = newFilters;
}

// --- DOM Elements ---

export const tableBody = document.querySelector('#promoter-aliases-list tbody') as HTMLTableSectionElement;
export const tableHeader = document.querySelector('#promoter-aliases-list thead') as HTMLTableSectionElement;
export const newButton = document.getElementById('new-btn') as HTMLButtonElement;
export const refreshButton = document.getElementById('refresh-btn') as HTMLButtonElement;

export const filterIdInput = document.getElementById('filter-id') as HTMLInputElement;
export const filterPromoterInput = document.getElementById('filter-promoter') as HTMLInputElement;
export const filterAliasInput = document.getElementById('filter-alias') as HTMLInputElement;

// --- UI Functions ---

export function applyFilters(aliases: PromoterAlias[]): PromoterAlias[] {
    return aliases.filter(alias => {
        const idMatch = alias.ID.toString().includes(currentFilters.id);
        const promoterName = promotersCache.find(p => p.ID === alias.Promoter)?.Name || '';
        const promoterMatch = promoterName.toLowerCase().includes(currentFilters.promoter.toLowerCase());
        const uuidMatch = alias.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());
        const aliasMatch = alias.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase());
        const createdMatch = alias.Created.includes(currentFilters.created);
        const updatedMatch = alias.Updated.includes(currentFilters.updated);

        return idMatch && promoterMatch && uuidMatch && aliasMatch && createdMatch && updatedMatch;
    });
}

export function sortAliases(aliases: PromoterAlias[]): PromoterAlias[] {
    const sorters: SorterMap<PromoterAlias> = {
        Promoter: (a) => promotersCache.find(p => p.ID === a.Promoter)?.Name || ''
    };
    return applySort(aliases, currentSort, sorters);
}

// --- Initialization ---

export async function refreshAliases() {
    try {
        setPromotersCache(await fetchPromoters()); // Fetch promoters first for display
        setAliasesCache(await fetchPromoterAliases());
        handleFilterChange(); // Apply any existing filters and sorting, then render the table
    } catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (tableBody) {
             tableBody.innerHTML = '<tr><td colspan="4">Failed to load data. Is the backend server running?</td></tr>';
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
    if (filterPromoterInput) filterPromoterInput.addEventListener('input', handleFilterChange);
    if (filterAliasInput) filterAliasInput.addEventListener('input', handleFilterChange);

    refreshAliases();
}

// Start the app
init();