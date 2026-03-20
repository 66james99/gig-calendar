import { fetchStageRoles } from './api.js';
import { handleTableClick, handleNewClick, handleSort, handleFilterChange } from './event.js';
// DOM Elements
export const tableBody = document.getElementById('table-body');
export const newBtn = document.getElementById('new-btn');
export const refreshBtn = document.getElementById('refresh-btn');
export const tableHeader = document.querySelector('thead');
// State
export let stageRolesCache = [];
export let currentSort = { column: 'Pattern', direction: 'asc' };
export let currentFilters = {
    id: '',
    uuid: '',
    pattern: ''
};
export function setCurrentSort(sort) {
    currentSort = sort;
}
export function setCurrentFilters(filters) {
    currentFilters.id = filters.id || '';
    currentFilters.uuid = filters.uuid || '';
    currentFilters.pattern = filters.pattern || '';
}
export async function init() {
    if (newBtn)
        newBtn.addEventListener('click', handleNewClick);
    if (refreshBtn)
        refreshBtn.addEventListener('click', refreshStageRoles);
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
        stageRolesCache = await fetchStageRoles();
        handleFilterChange();
    }
    catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load data.");
    }
}
export async function refreshStageRoles() {
    await loadData();
}
export function applyFilters(items) {
    return items.filter(item => {
        return ((item.ID != null ? item.ID.toString() : '').includes(currentFilters.id) &&
            (item.Uuid || '').toLowerCase().includes(currentFilters.uuid.toLowerCase()) &&
            (item.Pattern || '').toLowerCase().includes(currentFilters.pattern.toLowerCase()));
    });
}
export function sortStageRoles(items) {
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
