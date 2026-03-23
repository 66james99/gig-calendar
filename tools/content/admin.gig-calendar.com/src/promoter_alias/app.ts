import { fetchPromoterAliases, fetchPromoters } from './api.js';
import { handleTableClick, handleNewClick, handleSort, handleFilterChange, handleEditItem, handleNotFound } from './event.js';
import { handleUrlActions } from '../shared/url-params.js';
import { renderTable } from './ui.js';
import type { PromoterAlias, Promoter, PromoterAliasSortableColumn, SortDirection } from './types.js';
import { updateSortIndicators } from '../shared/ui.js';

// DOM Elements
export const tableBody = document.getElementById('table-body') as HTMLTableSectionElement;
export const newBtn = document.getElementById('new-btn') as HTMLButtonElement;
export const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
export const tableHeader = document.querySelector('thead') as HTMLTableSectionElement;

// Filter Inputs
export const filterIdInput = document.getElementById('filter-id') as HTMLInputElement;
export const filterPromoterInput = document.getElementById('filter-promoter') as HTMLInputElement;
export const filterAliasInput = document.getElementById('filter-alias') as HTMLInputElement;
export const filterUuidInput = document.getElementById('filter-uuid') as HTMLInputElement;
export const filterCreatedInput = document.getElementById('filter-created') as HTMLInputElement;
export const filterUpdatedInput = document.getElementById('filter-updated') as HTMLInputElement;

// State
export let aliasesCache: PromoterAlias[] = [];
export let promotersCache: Promoter[] = [];
export let currentSort: { column: PromoterAliasSortableColumn, direction: SortDirection } = { column: 'Created', direction: 'desc' };
export let currentFilters = {
    id: '',
    promoter: '',
    alias: '',
    uuid: '',
    created: '',
    updated: '',
};

// Setters for State (used by event handlers)
export function setCurrentSort(sort: { column: PromoterAliasSortableColumn, direction: SortDirection }) {
    currentSort = sort;
}

export function setCurrentFilters(filters: typeof currentFilters) {
    currentFilters = filters;
}

export async function init() {
    // Bind Events
    if (newBtn) newBtn.addEventListener('click', () => handleNewClick());
    if (refreshBtn) refreshBtn.addEventListener('click', refreshAliases);
    if (tableBody) tableBody.addEventListener('click', handleTableClick);
    if (tableHeader) tableHeader.addEventListener('click', handleSort);

    // Bind Filter Events
    [filterIdInput, filterPromoterInput, filterAliasInput, filterUuidInput, filterCreatedInput, filterUpdatedInput].forEach(input => {
        if (input) input.addEventListener('input', handleFilterChange);
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
    } catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load data. See console for details.");
    }
}

export async function refreshAliases() {
    await loadData();
}

export function applyFilters(aliases: PromoterAlias[]): PromoterAlias[] {
    return aliases.filter(a => {
        const promoterName = promotersCache.find(p => p.ID === a.Promoter)?.Name || '';
        return (
            a.ID.toString().includes(currentFilters.id) &&
            promoterName.toLowerCase().includes(currentFilters.promoter.toLowerCase()) &&
            a.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase()) &&
            a.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase()) &&
            (currentFilters.created === '' || a.Created.includes(currentFilters.created)) &&
            (currentFilters.updated === '' || a.Updated.includes(currentFilters.updated))
        );
    });
}

export function sortAliases(aliases: PromoterAlias[]): PromoterAlias[] {
    return [...aliases].sort((a, b) => {
        const valA = a[currentSort.column];
        const valB = b[currentSort.column];

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);