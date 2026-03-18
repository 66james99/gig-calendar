import { createFestival, updateFestival, deleteFestival } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { 
    aliasesCache, promotersCache, currentSort, currentFilters, 
    setCurrentSort, setCurrentFilters, refreshFestivals, applyFilters, sortFestivals 
} from './app.js';
import { updateSortIndicators } from '../shared/ui.js';
import type { Festival, FestivalSortableColumn } from './types.js';

export function handleNewClick() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    // Check if new row already exists
    if (tbody.querySelector('tr:not([data-id])')) return;
    renderEditRow(tbody, {}, true, promotersCache);
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
        if (item) renderEditRow(row.parentElement as HTMLTableSectionElement, item, false, promotersCache);

    } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this festival?')) {
            try {
                await deleteFestival(id);
                await refreshFestivals();
            } catch (e) {
                alert((e as Error).message);
            }
        }

    } else if (btn.classList.contains('duplicate-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item) {
            const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
            // Pre-fill new row with current item data
            renderEditRow(tbody, { ...item, ID: 0, Uuid: '' }, true, promotersCache);
        }

    } else if (btn.classList.contains('cancel-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item) renderDisplayRow(row.parentElement as HTMLTableSectionElement, item, promotersCache);

    } else if (btn.classList.contains('cancel-add-btn')) {
        row.remove();
        const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
        if (aliasesCache.length === 0 && tbody.children.length === 0) {
             document.getElementById('no-data-message')?.classList.remove('hidden');
        }

    } else if (btn.classList.contains('save-btn') || btn.classList.contains('add-btn')) {
        const name = (row.querySelector('.edit-name') as HTMLInputElement).value;
        const promoterId = parseInt((row.querySelector('.edit-promoter') as HTMLSelectElement).value, 10);
        const startDate = (row.querySelector('.edit-start') as HTMLInputElement).value;
        const endDate = (row.querySelector('.edit-end') as HTMLInputElement).value;
        const description = (row.querySelector('.edit-description') as HTMLInputElement).value;

        if (!promoterId || !startDate || !endDate) {
            alert('Promoter and Dates are required.');
            return;
        }

        // Append time to date string to satisfy backend expectation if necessary, 
        // or rely on date string parsing. The backend expects time.Time.
        // HTML date input gives YYYY-MM-DD. 
        const payload = {
            name: name,
            promoter_id: promoterId,
            start_date: new Date(startDate).toISOString(),
            end_date: new Date(endDate).toISOString(),
            description: description
        };

        try {
            if (btn.classList.contains('add-btn')) {
                await createFestival(payload);
            } else {
                await updateFestival(id, payload);
            }
            await refreshFestivals();
        } catch (e) {
            alert((e as Error).message);
        }
    }
}

export function handleSort(event: MouseEvent) {
    const th = (event.target as HTMLElement).closest('th');
    if (!th || !th.dataset.col) return;

    const col = th.dataset.col as FestivalSortableColumn;
    if (currentSort.column === col) {
        setCurrentSort({ column: col, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
        setCurrentSort({ column: col, direction: 'asc' });
    }

    updateSortIndicators('festivals-list', currentSort);
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    renderTable(tbody, sortFestivals(applyFilters(aliasesCache)), promotersCache);
}

export function handleFilterChange() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    // Update filter state in app.ts is tricky if state is primitive, but we exported a setter or object.
    // In app.ts we use an object `currentFilters`.
    const idInput = document.getElementById('filter-id') as HTMLInputElement;
    const nameInput = document.getElementById('filter-name') as HTMLInputElement;
    const promoterInput = document.getElementById('filter-promoter') as HTMLInputElement;
    const startInput = document.getElementById('filter-start') as HTMLInputElement;
    const endInput = document.getElementById('filter-end') as HTMLInputElement;
    const descInput = document.getElementById('filter-desc') as HTMLInputElement;
    const uuidInput = document.getElementById('filter-uuid') as HTMLInputElement;

    setCurrentFilters({
        id: idInput.value,
        name: nameInput.value,
        promoter: promoterInput.value,
        startDate: startInput.value,
        endDate: endInput.value,
        description: descInput.value,
        uuid: uuidInput.value
    });

    renderTable(tbody, sortFestivals(applyFilters(aliasesCache)), promotersCache);
}