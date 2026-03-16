import { fetchVenues } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
// --- State ---
export let venuesCache = [];
export let currentSort = {
    column: 'Name',
    direction: 'asc',
};
export let currentFilters = {
    id: '',
    name: '',
    uuid: '',
};
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
export const tableBody = document.querySelector('#venues-list tbody');
export const tableHeader = document.querySelector('#venues-list thead');
export const newButton = document.getElementById('new-button');
export const refreshButton = document.getElementById('refresh-button');
export const filterIdInput = document.getElementById('filter-id');
export const filterNameInput = document.getElementById('filter-name');
export const filterUuidInput = document.getElementById('filter-uuid');
// --- Core Logic ---
export function applyFilters(venues) {
    return venues.filter(venue => {
        const idMatch = venue.ID.toString().includes(currentFilters.id);
        const nameMatch = venue.Name.toLowerCase().includes(currentFilters.name.toLowerCase());
        const uuidMatch = venue.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());
        return idMatch && nameMatch && uuidMatch;
    });
}
export function applySort(venues) {
    const { column, direction } = currentSort;
    const modifier = direction === 'asc' ? 1 : -1;
    return [...venues].sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (column === 'ID') {
            return (valA - valB) * modifier;
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
    refreshButton.addEventListener('click', refreshVenues);
    filterIdInput.addEventListener('input', handleFilterChange);
    filterNameInput.addEventListener('input', handleFilterChange);
    filterUuidInput.addEventListener('input', handleFilterChange);
    (async () => {
        try {
            await refreshVenues();
        }
        catch (error) {
            console.error(error);
        }
    })();
}
init();
