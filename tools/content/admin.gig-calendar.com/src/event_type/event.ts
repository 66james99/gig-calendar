import { createEventType, updateEventType, deleteEventType } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { 
    eventTypesCache, currentSort, setCurrentSort, setCurrentFilters, refreshEventTypes, applyFilters, sortEventTypes 
} from './app.js';
import { updateSortIndicators } from '../shared/ui.js';
import type { EventType, EventTypeSortableColumn } from './types.js';

export function handleNewClick() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    const existingAddRow = tbody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new event type before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const newRow = tbody.insertRow(0);
    const newEventTypeData: Partial<EventType> = {};
    renderEditRow(tbody, newEventTypeData, true);
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
        const item = eventTypesCache.find(i => i.ID === id);
        if (item) renderEditRow(row.parentElement as HTMLTableSectionElement, item, false);

    } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this event type?')) {
            try {
                await deleteEventType(id);
                await refreshEventTypes();
            } catch (e) {
                alert((e as Error).message);
            }
        }

    } else if (btn.classList.contains('duplicate-btn')) {
        const item = eventTypesCache.find(i => i.ID === id);
        if (item) {
            const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
            renderEditRow(tbody, { ...item, ID: 0 }, true);
        }

    } else if (btn.classList.contains('cancel-btn')) {
        const item = eventTypesCache.find(i => i.ID === id);
        if (item) renderDisplayRow(row.parentElement as HTMLTableSectionElement, item);

    } else if (btn.classList.contains('cancel-add-btn')) {
        row.remove();
        
    } else if (btn.classList.contains('save-btn') || btn.classList.contains('add-btn')) {
        const name = (row.querySelector('.edit-name') as HTMLInputElement).value;

        if (!name) {
            alert('Name is required.');
            return;
        }

        const payload = { name };

        try {
            if (btn.classList.contains('add-btn')) {
                await createEventType(payload);
            } else {
                await updateEventType(id, payload);
            }
            await refreshEventTypes();
        } catch (e) {
            alert((e as Error).message);
        }
    }
}

export function handleSort(event: MouseEvent) {
    const th = (event.target as HTMLElement).closest('th');
    if (!th || !th.dataset.col) return;

    const col = th.dataset.col as EventTypeSortableColumn;
    if (currentSort.column === col) {
        setCurrentSort({ column: col, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
        setCurrentSort({ column: col, direction: 'asc' });
    }

    updateSortIndicators('event-types-list', currentSort);
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    renderTable(tbody, sortEventTypes(applyFilters(eventTypesCache)));
}

export function handleFilterChange() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    const inputs = document.querySelectorAll('.filter-row input');
    const filters: any = {};
    inputs.forEach((input: any) => filters[input.id.replace('filter-', '')] = input.value);
    setCurrentFilters(filters);
    renderTable(tbody, sortEventTypes(applyFilters(eventTypesCache)));
}