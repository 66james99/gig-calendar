import { fetchPromoterAliases, fetchPromoters } from './api.js';
import { handleTableClick, handleNewClick, handleSort, handleFilterChange, handleEditItem, handleNotFound } from './event.js';
import { handleUrlActions } from '../shared/url-params.js';
// DOM Elements
export const tableBody = document.getElementById('table-body');
export const newBtn = document.getElementById('new-btn');
export const refreshBtn = document.getElementById('refresh-btn');
export const tableHeader = document.querySelector('thead');
// Filter Inputs
export const filterIdInput = document.getElementById('filter-id');
export const filterPromoterInput = document.getElementById('filter-promoter');
export const filterAliasInput = document.getElementById('filter-alias');
export const filterUuidInput = document.getElementById('filter-uuid');
export const filterCreatedInput = document.getElementById('filter-created');
export const filterUpdatedInput = document.getElementById('filter-updated');
// State
export let aliasesCache = [];
export let promotersCache = [];
export let currentSort = { column: 'Created', direction: 'desc' };
export let currentFilters = {
    id: '',
    promoter: '',
    alias: '',
    uuid: '',
    created: '',
    updated: '',
};
// Setters for State (used by event handlers)
export function setCurrentSort(sort) {
    currentSort = sort;
}
export function setCurrentFilters(filters) {
    currentFilters = filters;
}
export async function init() {
    // Bind Events
    if (newBtn)
        newBtn.addEventListener('click', () => handleNewClick());
    if (refreshBtn)
        refreshBtn.addEventListener('click', refreshAliases);
    if (tableBody)
        tableBody.addEventListener('click', handleTableClick);
    if (tableHeader)
        tableHeader.addEventListener('click', handleSort);
    // Bind Filter Events
    [filterIdInput, filterPromoterInput, filterAliasInput, filterUuidInput, filterCreatedInput, filterUpdatedInput].forEach(input => {
        if (input)
            input.addEventListener('input', handleFilterChange);
    });
    await loadData();
}
async function loadData() {
    try {
        const [aliases, promoters] = await Promise.all([
            fetchPromoterAliases(),
            fetchPromoters()
        ]);
        aliasesCache = aliases;
        promotersCache = promoters;
        handleFilterChange(); // Triggers render
        handleUrlActions(aliasesCache, {
            nameField: 'Alias',
            onNew: (name) => handleNewClick({ Alias: name }),
            onEdit: (item) => handleEditItem(item),
            onNotFound: (name) => handleNotFound(name)
        });
    }
    catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load data. See console for details.");
    }
}
export async function refreshAliases() {
    await loadData();
}
export function applyFilters(aliases) {
    return aliases.filter(a => {
        const promoterName = promotersCache.find(p => p.ID === a.Promoter)?.Name || '';
        return (a.ID.toString().includes(currentFilters.id) &&
            promoterName.toLowerCase().includes(currentFilters.promoter.toLowerCase()) &&
            a.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase()) &&
            a.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase()) &&
            (currentFilters.created === '' || a.Created.includes(currentFilters.created)) &&
            (currentFilters.updated === '' || a.Updated.includes(currentFilters.updated)));
    });
}
export function sortAliases(aliases) {
    return [...aliases].sort((a, b) => {
        const valA = a[currentSort.column];
        const valB = b[currentSort.column];
        if (valA < valB)
            return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB)
            return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}
// Start
document.addEventListener('DOMContentLoaded', init);
