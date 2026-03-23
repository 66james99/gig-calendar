import { fetchPerformerAliases, fetchPerformers } from './api.js';
import { handleFilterChange, handleNewClick, handleSort, handleTableClick, handleEditItem, handleNotFound } from './event.js';
import { handleUrlActions } from '../shared/url-params.js';
import { applySort } from '../shared/table-utils.js';
// --- State ---
export let aliasesCache = [];
export let performersCache = []; // Cache for performer names
export let currentSort = {
    column: 'ID',
    direction: 'asc',
};
export let currentFilters = {
    id: '',
    performer: '',
    uuid: '',
    alias: '',
    created: '',
    updated: '',
};
export function setAliasesCache(newCache) {
    aliasesCache = newCache;
}
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
export const tableBody = document.querySelector('#performer-aliases-list tbody');
export const tableHeader = document.querySelector('#performer-aliases-list thead');
export const newButton = document.getElementById('new-alias-button');
export const refreshButton = document.getElementById('refresh-aliases-button');
export const filterIdInput = document.getElementById('filter-alias-id');
export const filterPerformerInput = document.getElementById('filter-alias-performer');
export const filterUuidInput = document.getElementById('filter-alias-uuid');
export const filterAliasInput = document.getElementById('filter-alias-alias');
export const filterCreatedInput = document.getElementById('filter-alias-created');
export const filterUpdatedInput = document.getElementById('filter-alias-updated');
// --- UI Functions ---
export function applyFilters(aliases) {
    return aliases.filter(alias => {
        const idMatch = alias.ID.toString().includes(currentFilters.id);
        const performerName = performersCache.find(p => p.ID === alias.Performer)?.Name || '';
        const performerMatch = performerName.toLowerCase().includes(currentFilters.performer.toLowerCase());
        const uuidMatch = alias.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase());
        const aliasMatch = alias.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase());
        const createdMatch = alias.Created.includes(currentFilters.created);
        const updatedMatch = alias.Updated.includes(currentFilters.updated);
        return idMatch && performerMatch && uuidMatch && aliasMatch && createdMatch && updatedMatch;
    });
}
export function sortAliases(aliases) {
    const sorters = {
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
        handleUrlActions(aliasesCache, {
            nameField: 'Alias',
            onNew: (name) => handleNewClick({ Alias: name }),
            onEdit: (item) => handleEditItem(item),
            onNotFound: (name) => handleNotFound(name)
        });
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="7">Failed to load data. Is the backend server running?</td></tr>';
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
        refreshButton.addEventListener('click', refreshAliases);
    // Add event listeners for filters
    if (filterIdInput)
        filterIdInput.addEventListener('input', handleFilterChange);
    if (filterPerformerInput)
        filterPerformerInput.addEventListener('input', handleFilterChange);
    if (filterUuidInput)
        filterUuidInput.addEventListener('input', handleFilterChange);
    if (filterAliasInput)
        filterAliasInput.addEventListener('input', handleFilterChange);
    if (filterCreatedInput)
        filterCreatedInput.addEventListener('input', handleFilterChange);
    if (filterUpdatedInput)
        filterUpdatedInput.addEventListener('input', handleFilterChange);
    refreshAliases();
}
// Start the app
init();
