import { createFestivalAlias, updateFestivalAlias, deleteFestivalAlias } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { aliasesCache, festivalsCache, promotersCache, currentSort, setCurrentSort, setCurrentFilters, refreshAliases, applyFilters, sortAliases } from './app.js';
import { updateSortIndicators } from '../shared/ui.js';
export function handleNewClick() {
    const tbody = document.getElementById('table-body');
    // Check if a row is already in 'add' mode to prevent multiple new rows.
    const existingAddRow = tbody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new alias before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = tbody.insertRow(0); // Insert a new row at the top of the table.
    const newAliasData = {};
    renderEditRow(tbody, newAliasData, true, festivalsCache, promotersCache);
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
        const item = aliasesCache.find(i => i.ID === id);
        if (item)
            renderEditRow(row.parentElement, item, false, festivalsCache, promotersCache);
    }
    else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this alias?')) {
            try {
                await deleteFestivalAlias(id);
                await refreshAliases();
            }
            catch (e) {
                alert(e.message);
            }
        }
    }
    else if (btn.classList.contains('duplicate-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item) {
            const tbody = document.getElementById('table-body');
            renderEditRow(tbody, { ...item, ID: 0, Uuid: '' }, true, festivalsCache, promotersCache);
        }
    }
    else if (btn.classList.contains('cancel-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item)
            renderDisplayRow(row.parentElement, item, festivalsCache, promotersCache);
    }
    else if (btn.classList.contains('cancel-add-btn')) {
        row.remove();
        const tbody = document.getElementById('table-body');
        if (aliasesCache.length === 0 && tbody.children.length === 0) {
            document.getElementById('no-data-message')?.classList.remove('hidden');
        }
    }
    else if (btn.classList.contains('save-btn') || btn.classList.contains('add-btn')) {
        const festivalId = parseInt(row.querySelector('.edit-festival').value, 10);
        const aliasName = row.querySelector('.edit-alias').value;
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
            }
            else {
                await updateFestivalAlias(id, payload);
            }
            await refreshAliases();
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
    updateSortIndicators('festival-aliases-list', currentSort);
    const tbody = document.getElementById('table-body');
    renderTable(tbody, sortAliases(applyFilters(aliasesCache)), festivalsCache, promotersCache);
}
export function handleFilterChange() {
    const tbody = document.getElementById('table-body');
    const inputs = document.querySelectorAll('.filter-row input');
    const filters = {};
    inputs.forEach((input) => filters[input.id.replace('filter-', '')] = input.value);
    setCurrentFilters(filters); // Map this in app.ts correctly
    renderTable(tbody, sortAliases(applyFilters(aliasesCache)), festivalsCache, promotersCache);
}
