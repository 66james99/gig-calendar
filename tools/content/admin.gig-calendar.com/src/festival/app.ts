import { fetchFestivals, fetchPromoters } from './api.js';
import { handleTableClick, handleNewClick, handleSort, handleFilterChange } from './event.js';
import { renderTable } from './ui.js';
import type { Festival, Promoter, FestivalSortableColumn, SortDirection } from './types.js';

// DOM Elements
export const tableBody = document.getElementById('table-body') as HTMLTableSectionElement;
export const newBtn = document.getElementById('new-btn') as HTMLButtonElement;
export const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
export const tableHeader = document.querySelector('thead') as HTMLTableSectionElement;

// State
export let aliasesCache: Festival[] = []; // Reuse name aliasesCache to match event.ts generic usage or rename
export let promotersCache: Promoter[] = [];
export let currentSort: { column: FestivalSortableColumn, direction: SortDirection } = { column: 'StartDate', direction: 'desc' };
export let currentFilters = {
    id: '',
    name: '',
    promoter: '',
    startDate: '',
    endDate: '',
    description: '',
    uuid: ''
};

export function setCurrentSort(sort: { column: FestivalSortableColumn, direction: SortDirection }) {
    currentSort = sort;
}

export function setCurrentFilters(filters: typeof currentFilters) {
    currentFilters = filters;
}

export async function init() {
    if (newBtn) newBtn.addEventListener('click', handleNewClick);
    if (refreshBtn) refreshBtn.addEventListener('click', refreshFestivals);
    if (tableBody) tableBody.addEventListener('click', handleTableClick);
    if (tableHeader) tableHeader.addEventListener('click', handleSort);

    const filterInputs = document.querySelectorAll('.filter-row input');
    filterInputs.forEach(input => {
        input.addEventListener('input', handleFilterChange);
    });

    await loadData();
}

async function loadData() {
    try {
        const [festivals, promoters] = await Promise.all([
            fetchFestivals(),
            fetchPromoters()
        ]);
        aliasesCache = festivals;
        promotersCache = promoters;
        handleFilterChange();
    } catch (error) {
        console.error("Failed to load data", error);
        alert("Failed to load data.");
    }
}

export async function refreshFestivals() {
    await loadData();
}

export function applyFilters(festivals: Festival[]): Festival[] {
    return festivals.filter(f => {
        const promoterName = promotersCache.find(p => p.ID === f.PromoterID)?.Name || '';
        const fName = f.Name || '';
        const fStart = f.StartDate || '';
        const fEnd = f.EndDate || '';
        const fDesc = f.Description || '';

        return (
            f.ID.toString().includes(currentFilters.id) &&
            fName.toLowerCase().includes(currentFilters.name.toLowerCase()) &&
            promoterName.toLowerCase().includes(currentFilters.promoter.toLowerCase()) &&
            fStart.includes(currentFilters.startDate) &&
            fEnd.includes(currentFilters.endDate) &&
            fDesc.toLowerCase().includes(currentFilters.description.toLowerCase()) &&
            f.Uuid.toLowerCase().includes(currentFilters.uuid.toLowerCase())
        );
    });
}

export function sortFestivals(festivals: Festival[]): Festival[] {
    return [...festivals].sort((a, b) => {
        let valA: any = a[currentSort.column];
        let valB: any = b[currentSort.column];

        // Handle special columns if needed (dates are strings, so string compare usually works for ISO)
        if (currentSort.column === 'PromoterID') {
             valA = promotersCache.find(p => p.ID === a.PromoterID)?.Name || '';
             valB = promotersCache.find(p => p.ID === b.PromoterID)?.Name || '';
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });
}

document.addEventListener('DOMContentLoaded', init);