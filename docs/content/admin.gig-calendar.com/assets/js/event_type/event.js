import { createEventType, updateEventType, deleteEventType } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { eventTypesCache, currentSort, setCurrentSort, setCurrentFilters, refreshEventTypes, applyFilters, sortEventTypes } from './app.js';
import { updateSortIndicators } from '../shared/ui.js';
export function handleNewClick() {
    const tbody = document.getElementById('table-body');
    const existingAddRow = tbody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new event type before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = tbody.insertRow(0);
    const newEventTypeData = {};
    renderEditRow(tbody, newEventTypeData, true);
}
export async function handleTableClick(event) {
    const target = event.target;
    const btn = target.closest('button');
    if (!btn)
        return;
    const row = btn.closest('tr');
    if (!row)
        return;
    const idStr = row.dataset.id;
    const id = idStr ? parseInt(idStr, 10) : 0;
    if (btn.classList.contains('edit-btn')) {
        const item = eventTypesCache.find(i => i.ID === id);
        if (item)
            renderEditRow(row.parentElement, item, false);
    }
    else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this event type?')) {
            try {
                await deleteEventType(id);
                await refreshEventTypes();
            }
            catch (e) {
                alert(e.message);
            }
        }
    }
    else if (btn.classList.contains('duplicate-btn')) {
        const item = eventTypesCache.find(i => i.ID === id);
        if (item) {
            const tbody = document.getElementById('table-body');
            renderEditRow(tbody, { ...item, ID: 0 }, true);
        }
    }
    else if (btn.classList.contains('cancel-btn')) {
        const item = eventTypesCache.find(i => i.ID === id);
        if (item)
            renderDisplayRow(row.parentElement, item);
    }
    else if (btn.classList.contains('cancel-add-btn')) {
        row.remove();
    }
    else if (btn.classList.contains('save-btn') || btn.classList.contains('add-btn')) {
        const name = row.querySelector('.edit-name').value;
        if (!name) {
            alert('Name is required.');
            return;
        }
        const payload = { name };
        try {
            if (btn.classList.contains('add-btn')) {
                await createEventType(payload);
            }
            else {
                await updateEventType(id, payload);
            }
            await refreshEventTypes();
        }
        catch (e) {
            alert(e.message);
        }
    }
}
export function handleSort(event) {
    const th = event.target.closest('th');
    if (!th || !th.dataset.col)
        return;
    const col = th.dataset.col;
    if (currentSort.column === col) {
        setCurrentSort({ column: col, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    }
    else {
        setCurrentSort({ column: col, direction: 'asc' });
    }
    updateSortIndicators('event-types-list', currentSort);
    const tbody = document.getElementById('table-body');
    renderTable(tbody, sortEventTypes(applyFilters(eventTypesCache)));
}
export function handleFilterChange() {
    const tbody = document.getElementById('table-body');
    const inputs = document.querySelectorAll('.filter-row input');
    const filters = {};
    inputs.forEach((input) => filters[input.id.replace('filter-', '')] = input.value);
    setCurrentFilters(filters);
    renderTable(tbody, sortEventTypes(applyFilters(eventTypesCache)));
}
