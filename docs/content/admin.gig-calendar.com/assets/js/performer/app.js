import { fetchPerformers } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick, handleEditItem, handleNotFound } from './event.js';
import { handleUrlActions } from '../shared/url-params.js';
// --- State ---
export let performersCache = [];
export let currentSort = {
    column: 'Name',
    direction: 'asc',
};
export let currentFilters = {
    id: '',
    name: '',
    uuid: '',
};
export function setPerformersCache(newCache) {
    performersCache = newCache;
}
export function setCurrentSort(newSort) {
    currentSort = newSort;
}
export function setCurrentFilters(newFilters) {
    currentFilters = newFilters;
}
// --- DOM Elements ---
export const tableBody = document.querySelector('#performers-list tbody');
export const tableHeader = document.querySelector('#performers-list thead');
export const newButton = document.getElementById('new-performer-button');
export const refreshButton = document.getElementById('refresh-performers-button');
export const filterIdInput = document.getElementById('filter-performer-id');
export const filterNameInput = document.getElementById('filter-performer-name');
export const filterUuidInput = document.getElementById('filter-performer-uuid');
// --- UI Functions ---
export function applyFilters(performers) {
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
        newButton.addEventListener('click', () => handleNewClick());
    if (refreshButton)
        refreshButton.addEventListener('click', refreshPerformers);
    // Add event listeners for filters
    if (filterIdInput)
        filterIdInput.addEventListener('input', handleFilterChange);
    if (filterNameInput)
        filterNameInput.addEventListener('input', handleFilterChange);
    if (filterUuidInput)
        filterUuidInput.addEventListener('input', handleFilterChange);
    refreshPerformers();
}
init();
