import { fetchEventTypes } from './api.js';
import { handleTableClick, handleNewClick, handleSort, handleFilterChange } from './event.js';
// DOM Elements
export const tableBody = document.getElementById('table-body');
export const newBtn = document.getElementById('new-btn');
export const refreshBtn = document.getElementById('refresh-btn');
export const tableHeader = document.querySelector('thead');
// State
export let eventTypesCache = [];
export let currentSort = { column: 'Name', direction: 'asc' };
export let currentFilters = {
    id: '',
    uuid: '',
    name: ''
};
export function setCurrentSort(sort) {
    currentSort = sort;
}
export function setCurrentFilters(filters) {
    currentFilters.id = filters.id || '';
    currentFilters.uuid = filters.uuid || '';
    currentFilters.name = filters.name || '';
}
export async function init() {
    if (newBtn)
        newBtn.addEventListener('click', handleNewClick);
    if (refreshBtn)
        refreshBtn.addEventListener('click', refreshEventTypes);
    if (tableBody)
        tableBody.addEventListener('click', handleTableClick);
    if (tableHeader)
        tableHeader.addEventListener('click', handleSort);
    const inputs = document.querySelectorAll('.filter-row input');
    inputs.forEach(input => input.addEventListener('input', handleFilterChange));
    await loadData();
}
async function loadData() {
    try {
        eventTypesCache = await fetchEventTypes();
        handleFilterChange();
    }
    catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load data.");
    }
}
export async function refreshEventTypes() {
    await loadData();
}
export function applyFilters(items) {
    return items.filter(item => {
        return ((item.ID != null ? item.ID.toString() : '').includes(currentFilters.id) &&
            (item.Uuid || '').toLowerCase().includes(currentFilters.uuid.toLowerCase()) &&
            (item.Name || '').toLowerCase().includes(currentFilters.name.toLowerCase()));
    });
}
export function sortEventTypes(items) {
    return [...items].sort((a, b) => {
        const valA = a[currentSort.column];
        const valB = b[currentSort.column];
        if (valA < valB)
            return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB)
            return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}
document.addEventListener('DOMContentLoaded', init);
