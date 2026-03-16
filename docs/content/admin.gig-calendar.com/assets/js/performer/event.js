import { performersCache, currentSort, setCurrentSort, setCurrentFilters, tableBody, filterIdInput, filterNameInput, filterUuidInput, applyFilters, applySort, refreshPerformers, } from './app.js';
import { createPerformer, deletePerformer, updatePerformer } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable, updateSortIndicators } from './ui.js';
export async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row)
        return;
    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null;
    const performer = id ? performersCache.find(p => p.ID === id) : null;
    // --- Edit button ---
    if (target.classList.contains('edit-btn') && performer) {
        renderEditRow(tableBody, performer, false);
    }
    // --- Cancel Edit button ---
    else if (target.classList.contains('cancel-btn') && performer) {
        renderDisplayRow(tableBody, performer);
    }
    // --- Save button (for updating) ---
    else if (target.classList.contains('save-btn') && id) {
        const payload = {
            name: row.querySelector('.edit-name').value,
        };
        try {
            await updatePerformer(id, payload);
            await refreshPerformers(); // Refresh all to see changes
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (performer)
                renderDisplayRow(tableBody, performer); // Revert on failure
        }
    }
    // --- Duplicate button ---
    else if (target.classList.contains('duplicate-btn') && performer) {
        const newRow = document.createElement('tr');
        const newPerformerData = { ...performer, ID: 0 };
        renderEditRow(tableBody, newPerformerData, true);
        row.after(newRow);
    }
    // --- Cancel Add button ---
    else if (target.classList.contains('cancel-add-btn')) {
        row.remove();
    }
    // --- Add button (for creating) ---
    else if (target.classList.contains('add-btn')) {
        const payload = {
            name: row.querySelector('.edit-name').value,
        };
        try {
            await createPerformer(payload);
            await refreshPerformers();
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete performer ${id}?`)) {
            try {
                await deletePerformer(id);
                await refreshPerformers();
            }
            catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
}
export function handleNewClick() {
    const existingAddRow = tableBody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new performer before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = tableBody.insertRow(0);
    const newPerformerData = {};
    renderEditRow(tableBody, newPerformerData, true);
}
export function handleSort(event) {
    const target = event.target;
    if (target.tagName !== 'TH' || !target.dataset.col)
        return;
    const sortColumn = target.dataset.col;
    const direction = (currentSort.column === sortColumn && currentSort.direction === 'asc') ? 'desc' : 'asc';
    setCurrentSort({ column: sortColumn, direction });
    handleFilterChange();
}
export function handleFilterChange() {
    setCurrentFilters({ id: filterIdInput.value, name: filterNameInput.value, uuid: filterUuidInput.value });
    const filteredPerformers = applyFilters(performersCache);
    const sortedPerformers = applySort(filteredPerformers);
    renderTable(tableBody, sortedPerformers);
    updateSortIndicators(currentSort);
}
