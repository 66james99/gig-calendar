import { fetchFestivalAliases, fetchFestivals, fetchPromoters } from './api.js';
import { handleTableClick, handleNewClick, handleSort, handleFilterChange } from './event.js';
import { renderTable } from './ui.js';
import type { FestivalAlias, Festival, Promoter, FestivalAliasSortableColumn, SortDirection } from './types.js';

// DOM Elements
export const tableBody = document.getElementById('table-body') as HTMLTableSectionElement;
export const newBtn = document.getElementById('new-btn') as HTMLButtonElement;
export const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
export const tableHeader = document.querySelector('thead') as HTMLTableSectionElement;

// State
export let aliasesCache: FestivalAlias[] = [];
export let festivalsCache: Festival[] = [];
export let promotersCache: Promoter[] = [];
export let currentSort: { column: FestivalAliasSortableColumn, direction: SortDirection } = { column: 'Created', direction: 'desc' };
export let currentFilters = {
    id: '',
    festival: '',
    alias: '',
    uuid: '',
    created: '',
    updated: ''
};

export function setCurrentSort(sort: { column: FestivalAliasSortableColumn, direction: SortDirection }) {
    currentSort = sort;
}

export function setCurrentFilters(filters: any) {
    // Simple mapping from generic object to typed filter
    currentFilters.id = filters.id || '';
    currentFilters.festival = filters.festival || '';
    currentFilters.alias = filters.alias || '';
    currentFilters.uuid = filters.uuid || '';
    currentFilters.created = filters.created || '';
    currentFilters.updated = filters.updated || '';
}

export async function init() {
    if (newBtn) newBtn.addEventListener('click', handleNewClick);
    if (refreshBtn) refreshBtn.addEventListener('click', refreshAliases);
    if (tableBody) tableBody.addEventListener('click', handleTableClick);
    if (tableHeader) tableHeader.addEventListener('click', handleSort);

    const inputs = document.querySelectorAll('.filter-row input');
    inputs.forEach(input => input.addEventListener('input', handleFilterChange));

    await loadData();
}

async function loadData() {
    try {
        const [aliases, festivals, promoters] = await Promise.all([
            fetchFestivalAliases(),
            fetchFestivals(),
            fetchPromoters()
        ]);
        aliasesCache = aliases;
        festivalsCache = festivals;
        promotersCache = promoters;
        handleFilterChange();
    } catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load data.");
    }
}

export async function refreshAliases() {
    await loadData();
}

function getFestivalDisplayName(id: number): string {
    const f = festivalsCache.find(i => i.ID === id);
    if (!f) return '';
    const pName = promotersCache.find(p => p.ID === f.Promoter)?.Name || '';
    const d = f.StartDate ? f.StartDate.split('T')[0] : '';
    return f.Description ? `${f.Description} (${d})` : `${pName} (${d})`;
}

export function applyFilters(aliases: FestivalAlias[]): FestivalAlias[] {
    return aliases.filter(a => {
        const festivalName = getFestivalDisplayName(a.Festival);
        return (
            a.ID.toString().includes(currentFilters.id) &&
            festivalName.toLowerCase().includes(currentFilters.festival.toLowerCase()) &&
            a.Alias.toLowerCase().includes(currentFilters.alias.toLowerCase()) &&
            a.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase()) &&
            (currentFilters.created === '' || a.Created.includes(currentFilters.created)) &&
            (currentFilters.updated === '' || a.Updated.includes(currentFilters.updated))
        );
    });
}

export function sortAliases(aliases: FestivalAlias[]): FestivalAlias[] {
    return [...aliases].sort((a, b) => {
        let valA: any = a[currentSort.column];
        let valB: any = b[currentSort.column];

        if (currentSort.column === 'Festival') {
             valA = getFestivalDisplayName(a.Festival);
             valB = getFestivalDisplayName(b.Festival);
        }

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

document.addEventListener('DOMContentLoaded', init);