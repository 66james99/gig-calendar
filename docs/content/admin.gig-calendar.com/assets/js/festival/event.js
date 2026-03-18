import { createFestival, updateFestival, deleteFestival } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { aliasesCache, promotersCache, currentSort, setCurrentSort, setCurrentFilters, refreshFestivals, applyFilters, sortFestivals } from './app.js';
import { updateSortIndicators } from '../shared/ui.js';
export function handleNewClick() {
    const tbody = document.getElementById('table-body');
    // Check if a row is already in 'add' mode to prevent multiple new rows.
    const existingAddRow = tbody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new festival before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    // Insert an empty row at the top, which will be populated by renderEditRow.
    tbody.insertRow(0);
    const newFestivalData = {};
    renderEditRow(tbody, newFestivalData, true, promotersCache);
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
            renderEditRow(row.parentElement, item, false, promotersCache);
    }
    else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this festival?')) {
            try {
                await deleteFestival(id);
                await refreshFestivals();
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
            // Pre-fill new row with current item data
            renderEditRow(tbody, { ...item, ID: 0, Uuid: '' }, true, promotersCache);
        }
    }
    else if (btn.classList.contains('cancel-btn')) {
        const item = aliasesCache.find(i => i.ID === id);
        if (item)
            renderDisplayRow(row.parentElement, item, promotersCache);
    }
    else if (btn.classList.contains('cancel-add-btn')) {
        row.remove();
        const tbody = document.getElementById('table-body');
        if (tbody.children.length === 0 && aliasesCache.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No festivals found.</td></tr>';
        }
    }
    else if (btn.classList.contains('save-btn') || btn.classList.contains('add-btn')) {
        const name = row.querySelector('.edit-name').value;
        const promoterId = parseInt(row.querySelector('.edit-promoter').value, 10);
        const startDate = row.querySelector('.edit-start').value;
        const endDate = row.querySelector('.edit-end').value;
        const description = row.querySelector('.edit-description').value;
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
            }
            else {
                await updateFestival(id, payload);
            }
            await refreshFestivals();
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
    updateSortIndicators('festivals-list', currentSort);
    const tbody = document.getElementById('table-body');
    renderTable(tbody, sortFestivals(applyFilters(aliasesCache)), promotersCache);
}
export function handleFilterChange() {
    const tbody = document.getElementById('table-body');
    // Update filter state in app.ts is tricky if state is primitive, but we exported a setter or object.
    // In app.ts we use an object `currentFilters`.
    const idInput = document.getElementById('filter-id');
    const nameInput = document.getElementById('filter-name');
    const promoterInput = document.getElementById('filter-promoter');
    const startInput = document.getElementById('filter-start');
    const endInput = document.getElementById('filter-end');
    const descInput = document.getElementById('filter-desc');
    const uuidInput = document.getElementById('filter-uuid');
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
