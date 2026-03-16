import { fetchVenueAliases, fetchVenues } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
import { applySort, type SorterMap } from '../shared/table-utils.js';
import type { SortState } from '../shared/types.js';
import type { Filters, VenueAlias, VenueAliasSortableColumn, Venue } from './types.js';

// --- State ---
export let aliasesCache: VenueAlias[] = [];
export let venuesCache: Venue[] = []; // Cache for venue names
export let currentSort: SortState<VenueAliasSortableColumn> = {
    column: 'ID',
    direction: 'asc',
};
export let currentFilters: Filters = {
    id: '',
    venue: '',
    uuid: '',
    alias: '',
    created: '',
    updated: '',
};

export function setAliasesCache(newCache: VenueAlias[]) {
    aliasesCache = newCache;
}
export function setVenuesCache(newCache: Venue[]) {
    venuesCache = newCache;
}
export function setCurrentSort(newSort: SortState<VenueAliasSortableColumn>) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters: Filters) {
    currentFilters = newFilters;
}

// --- DOM Elements ---

export const tableBody = document.querySelector('#venue-aliases-list tbody') as HTMLTableSectionElement;
export const tableHeader = document.querySelector('#venue-aliases-list thead') as HTMLTableSectionElement;
export const newButton = document.getElementById('new-alias-button') as HTMLButtonElement;
export const refreshButton = document.getElementById('refresh-aliases-button') as HTMLButtonElement;

export const filterIdInput = document.getElementById('filter-alias-id') as HTMLInputElement;
export const filterVenueInput = document.getElementById('filter-alias-venue') as HTMLInputElement;
export const filterUuidInput = document.getElementById('filter-alias-uuid') as HTMLInputElement;
export const filterAliasInput = document.getElementById('filter-alias-alias') as HTMLInputElement;
export const filterCreatedInput = document.getElementById('filter-alias-created') as HTMLInputElement;
export const filterUpdatedInput = document.getElementById('filter-alias-updated') as HTMLInputElement;

// --- UI Functions ---

export function applyFilters(aliases: VenueAlias[]): VenueAlias[] {
    return aliases.filter(alias => {
        const idMatch = alias.ID.toString().includes(currentFilters.id);
        const venueName = venuesCache.find(v => v.ID === alias.Venue)?.Name || '';
        const venueMatch = venueName.toLowerCase().includes(currentFilters.venue.toLowerCase());
        const uuidMatch = alias.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());
        const aliasMatch = alias.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase());
        const createdMatch = alias.Created.includes(currentFilters.created);
        const updatedMatch = alias.Updated.includes(currentFilters.updated);

        return idMatch && venueMatch && uuidMatch && aliasMatch && createdMatch && updatedMatch;
    });
}

export function sortAliases(aliases: VenueAlias[]): VenueAlias[] {
    const sorters: SorterMap<VenueAlias> = {
        Venue: (a) => venuesCache.find(v => v.ID === a.Venue)?.Name || ''
    };
    return applySort(aliases, currentSort, sorters);
}

// --- Initialization ---

export async function refreshAliases() {
    try {
        setVenuesCache(await fetchVenues()); // Fetch venues first for display
        setAliasesCache(await fetchVenueAliases());
        // Apply any existing filters and sorting, then render the table
        handleFilterChange();
    } catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        tableBody.innerHTML = '<tr><td colspan="7">Failed to load data. Is the backend server running?</td></tr>';
    }
}

function init() {
    tableBody.addEventListener('click', handleTableClick);
    tableHeader.addEventListener('click', handleSort);
    newButton.addEventListener('click', handleNewClick);
    refreshButton.addEventListener('click', refreshAliases);

    // Add event listeners for filters
    filterIdInput.addEventListener('input', handleFilterChange);
    filterVenueInput.addEventListener('input', handleFilterChange);
    filterUuidInput.addEventListener('input', handleFilterChange);
    filterAliasInput.addEventListener('input', handleFilterChange);
    filterCreatedInput.addEventListener('input', handleFilterChange);
    filterUpdatedInput.addEventListener('input', handleFilterChange);

    // Initial load
    refreshAliases();
}

// Start the app
init();