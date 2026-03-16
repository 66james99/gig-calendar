import { fetchVenueAliases, fetchVenues } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
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
export const filterAliasInput = document.getElementById('filter-alias-alias');
export const filterCreatedInput = document.getElementById('filter-alias-created');
export const filterUpdatedInput = document.getElementById('filter-alias-updated');
// --- UI Functions ---
export function applyFilters(aliases) {
    return aliases.filter(alias => {
        const idMatch = alias.ID.toString().includes(currentFilters.id);
        const venueName = venuesCache.find(v => v.ID === alias.Venue)?.Name || '';
        const venueMatch = venueName.toLowerCase().includes(currentFilters.venue.toLowerCase());
        const aliasMatch = alias.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase());
        const createdMatch = alias.Created.includes(currentFilters.created);
        const updatedMatch = alias.Updated.includes(currentFilters.updated);
        return idMatch && venueMatch && aliasMatch && createdMatch && updatedMatch;
    });
}
export function applySort(aliases) {
    const { column, direction } = currentSort;
    const modifier = direction === 'asc' ? 1 : -1;
    return [...aliases].sort((a, b) => {
        let valA = '';
        let valB = '';
        if (column === 'ID' || column === 'Venue') {
            valA = a[column];
            valB = b[column];
        }
        else if (column === 'Alias') {
            valA = a.Alias.toLowerCase();
            valB = b.Alias.toLowerCase();
        }
        else if (column === 'Created' || column === 'Updated') {
            valA = a[column];
            valB = b[column];
        }
        if (valA < valB)
            return -1 * modifier;
        if (valA > valB)
            return 1 * modifier;
        return 0;
    });
}
// --- Initialization ---
export async function refreshAliases() {
    try {
        setVenuesCache(await fetchVenues()); // Fetch venues first for display
        setAliasesCache(await fetchVenueAliases());
        // Apply any existing filters and sorting, then render the table
        handleFilterChange();
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        tableBody.innerHTML = '<tr><td colspan="6">Failed to load data. Is the backend server running?</td></tr>';
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
    filterAliasInput.addEventListener('input', handleFilterChange);
    filterCreatedInput.addEventListener('input', handleFilterChange);
    filterUpdatedInput.addEventListener('input', handleFilterChange);
    // Initial load
    refreshAliases();
}
// Start the app
init();
