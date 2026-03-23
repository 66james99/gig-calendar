import { fetchVenueAliases, fetchVenues } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick, handleEditItem, handleNotFound } from './event.js';
import { handleUrlActions } from '../shared/url-params.js';
import { applySort } from '../shared/table-utils.js';
// --- State ---
export let aliasesCache = [];
export let venuesCache = []; // Cache for venue names
export let currentSort = {
    column: 'ID',
    direction: 'asc',
};
export let currentFilters = {
    id: '',
    venue: '',
    uuid: '',
    alias: '',
    created: '',
    updated: '',
};
export function setAliasesCache(newCache) {
    aliasesCache = newCache;
}
export function setVenuesCache(newCache) {
    venuesCache = newCache;
}
export function setCurrentSort(newSort) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters) {
    currentFilters = newFilters;
}
// --- DOM Elements ---
export const tableBody = document.querySelector('#venue-aliases-list tbody');
export const tableHeader = document.querySelector('#venue-aliases-list thead');
export const newButton = document.getElementById('new-alias-button');
export const refreshButton = document.getElementById('refresh-aliases-button');
export const filterIdInput = document.getElementById('filter-alias-id');
export const filterVenueInput = document.getElementById('filter-alias-venue');
export const filterUuidInput = document.getElementById('filter-alias-uuid');
export const filterAliasInput = document.getElementById('filter-alias-alias');
export const filterCreatedInput = document.getElementById('filter-alias-created');
export const filterUpdatedInput = document.getElementById('filter-alias-updated');
// --- UI Functions ---
export function applyFilters(aliases) {
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
export function sortAliases(aliases) {
    const sorters = {
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
        handleUrlActions(aliasesCache, {
            nameField: 'Alias',
            onNew: (name) => handleNewClick({ Alias: name }),
            onEdit: (item) => handleEditItem(item),
            onNotFound: (name) => handleNotFound(name)
        });
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        tableBody.innerHTML = '<tr><td colspan="7">Failed to load data. Is the backend server running?</td></tr>';
    }
}
function init() {
    tableBody.addEventListener('click', handleTableClick);
    tableHeader.addEventListener('click', handleSort);
    newButton.addEventListener('click', () => handleNewClick());
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
