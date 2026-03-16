import { fetchPromoters } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick } from './event.js';
// --- State ---
export let promotersCache = [];
export let currentSort = {
    column: 'Name',
    direction: 'asc',
};
export let currentFilters = {
    id: '',
    name: '',
    uuid: '',
};
export function setPromotersCache(newCache) {
    promotersCache = newCache;
}
export function setCurrentSort(newSort) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters) {
    currentFilters = newFilters;
}
// --- DOM Elements ---
export const tableBody = document.querySelector('#promoters-list tbody');
export const tableHeader = document.querySelector('#promoters-list thead');
export const newButton = document.getElementById('new-promoter-button');
export const refreshButton = document.getElementById('refresh-promoters-button');
export const filterIdInput = document.getElementById('filter-promoter-id');
export const filterNameInput = document.getElementById('filter-promoter-name');
export const filterUuidInput = document.getElementById('filter-promoter-uuid');
// --- UI Functions ---
export function applyFilters(promoters) {
    return promoters.filter(promoter => {
        const idMatch = promoter.ID.toString().includes(currentFilters.id);
        const nameMatch = promoter.Name.toLowerCase().includes(currentFilters.name.toLowerCase());
        const uuidMatch = promoter.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());
        return idMatch && nameMatch && uuidMatch;
    });
}
// --- Initialization ---
export async function refreshPromoters() {
    try {
        setPromotersCache(await fetchPromoters());
        // Apply any existing filters and sorting, then render the table
        handleFilterChange();
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6">Failed to load data. Is the backend server running?</td></tr>';
        }
    }
}
function init() {
    if (tableBody)
        tableBody.addEventListener('click', handleTableClick);
    if (tableHeader)
        tableHeader.addEventListener('click', handleSort);
    if (newButton)
        newButton.addEventListener('click', handleNewClick);
    if (refreshButton)
        refreshButton.addEventListener('click', refreshPromoters);
    // Add event listeners for filters
    if (filterIdInput)
        filterIdInput.addEventListener('input', handleFilterChange);
    if (filterNameInput)
        filterNameInput.addEventListener('input', handleFilterChange);
    if (filterUuidInput)
        filterUuidInput.addEventListener('input', handleFilterChange);
    refreshPromoters();
}
init();
