import { createFestivalAlias, updateFestivalAlias, deleteFestivalAlias } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { 
    aliasesCache, festivalsCache, promotersCache, currentSort, currentFilters, 
    setCurrentSort, setCurrentFilters, refreshAliases, applyFilters, sortAliases 
} from './app.js';
import { updateSortIndicators } from '../shared/ui.js';
import type { FestivalAlias, FestivalAliasSortableColumn } from './types.js';

export function handleNewClick() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    if (tbody.querySelector('tr:not([data-id])')) return;
    renderEditRow(tbody, {}, true, festivalsCache, promotersCache);
}

export async function handleTableClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const btn = target.closest('button');
    if (!btn) return;

    const row = btn.closest('tr') as HTMLTableRowElement;
    if (!row) return;

    const idStr = row.dataset.id;
    const id = idStr ? parseInt(idStr, 10) : 0;

    if (btn.classList.contains('edit-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item) renderEditRow(row.parentElement as HTMLTableSectionElement, item, false, festivalsCache, promotersCache);

    } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this alias?')) {
            try {
                await deleteFestivalAlias(id);
                await refreshAliases();
            } catch (e) {
                alert((e as Error).message);
            }
        }

    } else if (btn.classList.contains('duplicate-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item) {
            const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
            renderEditRow(tbody, { ...item, ID: 0, Uuid: '' }, true, festivalsCache, promotersCache);
        }

    } else if (btn.classList.contains('cancel-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item) renderDisplayRow(row.parentElement as HTMLTableSectionElement, item, festivalsCache, promotersCache);

    } else if (btn.classList.contains('cancel-add-btn')) {
        row.remove();
        const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
        if (aliasesCache.length === 0 && tbody.children.length === 0) {
             document.getElementById('no-data-message')?.classList.remove('hidden');
        }

    } else if (btn.classList.contains('save-btn') || btn.classList.contains('add-btn')) {
        const festivalId = parseInt((row.querySelector('.edit-festival') as HTMLSelectElement).value, 10);
        const aliasName = (row.querySelector('.edit-alias') as HTMLInputElement).value;

        if (!festivalId || !aliasName) {
            alert('Festival and Alias are required.');
            return;
        }

        const payload = {
            festival_id: festivalId,
            alias: aliasName
        };

        try {
            if (btn.classList.contains('add-btn')) {
                await createFestivalAlias(payload);
            } else {
                await updateFestivalAlias(id, payload);
            }
            await refreshAliases();
        } catch (e) {
            alert((e as Error).message);
        }
    }
}

export function handleSort(event: MouseEvent) {
    const th = (event.target as HTMLElement).closest('th');
    if (!th || !th.dataset.col) return;

    const col = th.dataset.col as FestivalAliasSortableColumn;
    if (currentSort.column === col) {
        setCurrentSort({ column: col, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
        setCurrentSort({ column: col, direction: 'asc' });
    }

    updateSortIndicators('festival-aliases-list', currentSort);
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    renderTable(tbody, sortAliases(applyFilters(aliasesCache)), festivalsCache, promotersCache);
}

export function handleFilterChange() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    const inputs = document.querySelectorAll('.filter-row input');
    const filters: any = {};
    inputs.forEach((input: any) => filters[input.id.replace('filter-', '')] = input.value);
    setCurrentFilters(filters); // Map this in app.ts correctly
    renderTable(tbody, sortAliases(applyFilters(aliasesCache)), festivalsCache, promotersCache);
}