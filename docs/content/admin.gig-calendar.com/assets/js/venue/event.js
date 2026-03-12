import { venuesCache, currentSort, setCurrentSort, setCurrentFilters, tableBody, filterIdInput, filterNameInput, filterUuidInput, applyFilters, applySort, refreshVenues, } from './app.js';
import { createVenue, deleteVenue, updateVenue } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable, updateSortIndicators } from './ui.js';
export async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row)
        return;
    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null;
    const venue = id ? venuesCache.find(v => v.ID === id) : null;
    // --- Edit button ---
    if (target.classList.contains('edit-btn') && venue) {
        renderEditRow(row, venue);
    }
    // --- Cancel Edit button ---
    else if (target.classList.contains('cancel-btn') && venue) {
        renderDisplayRow(row, venue);
    }
    // --- Save button (for updating) ---
    else if (target.classList.contains('save-btn') && id) {
        const payload = {
            name: row.querySelector('.edit-name').value,
        };
        try {
            await updateVenue(id, payload);
            await refreshVenues();
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (venue)
                renderDisplayRow(row, venue);
        }
    }
    // --- Duplicate button ---
    else if (target.classList.contains('duplicate-btn') && venue) {
        const newRow = document.createElement('tr');
        const newVenueData = { ...venue, ID: 0, Uuid: '', Created: '', Updated: '' };
        renderEditRow(newRow, newVenueData, true);
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
            await createVenue(payload);
            await refreshVenues();
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete venue ${id}?`)) {
            try {
                await deleteVenue(id);
                await refreshVenues();
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
        alert('Please save or cancel the current new row before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = tableBody.insertRow(0);
    const newVenueData = {};
    renderEditRow(newRow, newVenueData, true);
}
export function handleSort(event) {
    const target = event.target;
    if (target.tagName !== 'TH' || !target.dataset.sort)
        return;
    const sortColumn = target.dataset.sort;
    if (currentSort.column === sortColumn) {
        setCurrentSort({ ...currentSort, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    }
    else {
        setCurrentSort({ column: sortColumn, direction: 'asc' });
    }
    handleFilterChange();
}
export function handleFilterChange() {
    setCurrentFilters({
        id: filterIdInput.value,
        name: filterNameInput.value,
        uuid: filterUuidInput.value,
    });
    const filteredVenues = applyFilters(venuesCache);
    const sortedVenues = applySort(filteredVenues);
    renderTable(tableBody, sortedVenues);
    updateSortIndicators(currentSort);
}
//# sourceMappingURL=event.js.map