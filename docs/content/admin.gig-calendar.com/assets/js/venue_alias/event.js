import { aliasesCache, venuesCache, currentSort, setCurrentSort, setCurrentFilters, tableBody, filterIdInput, filterVenueInput, filterAliasInput, filterCreatedInput, filterUpdatedInput, applyFilters, sortAliases, refreshAliases, } from './app.js';
import { createVenueAlias, deleteVenueAlias, updateVenueAlias } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { updateSortIndicators } from '../shared/ui.js';
export async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row)
        return;
    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null; // ID of the alias
    const alias = id ? aliasesCache.find(a => a.ID === id) : null;
    // --- Edit button ---
    if (target.classList.contains('edit-btn') && alias) {
        renderEditRow(tableBody, alias, false, venuesCache);
    }
    // --- Cancel Edit button ---
    else if (target.classList.contains('cancel-btn') && alias) {
        renderDisplayRow(tableBody, alias, venuesCache);
    }
    // --- Save button (for updating) ---
    else if (target.classList.contains('save-btn') && id) {
        const payload = {
            venue_id: parseInt(row.querySelector('.edit-venue_id').value, 10),
            alias: row.querySelector('.edit-alias').value,
        };
        try {
            await updateVenueAlias(id, payload);
            await refreshAliases(); // Refresh all to see changes
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (alias)
                renderDisplayRow(tableBody, alias, venuesCache); // Revert on failure
        }
    }
    // --- Duplicate button ---
    else if (target.classList.contains('duplicate-btn') && alias) {
        const newRow = document.createElement('tr');
        // Create a copy for the new row, reset ID, keep other fields
        const newAliasData = { ...alias, ID: 0 };
        renderEditRow(tableBody, newAliasData, true, venuesCache);
        row.after(newRow); // Inserts the new row right after the clicked row
    }
    // --- Cancel Add button ---
    else if (target.classList.contains('cancel-add-btn')) {
        row.remove(); // Remove the newly added row
    }
    // --- Add button (for creating) ---
    else if (target.classList.contains('add-btn')) {
        const payload = {
            venue_id: parseInt(row.querySelector('.edit-venue_id').value, 10),
            alias: row.querySelector('.edit-alias').value,
        };
        try {
            await createVenueAlias(payload);
            await refreshAliases();
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete venue alias ${id}?`)) {
            try {
                await deleteVenueAlias(id);
                await refreshAliases();
            }
            catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
}
export function handleNewClick() {
    // Check if a row is already in 'add' mode to prevent multiple new rows.
    const existingAddRow = tableBody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new alias before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = tableBody.insertRow(0); // Insert a new row at the top of the table.
    const newAliasData = {};
    renderEditRow(tableBody, newAliasData, true, venuesCache); // Render the row in edit mode.
}
export function handleSort(event) {
    const target = event.target;
    if (target.tagName !== 'TH' || !target.dataset.col)
        return;
    const sortColumn = target.dataset.col;
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
        id: filterIdInput.value, // Assuming filterIdInput exists for aliases
        venue: filterVenueInput.value,
        alias: filterAliasInput.value,
        created: filterCreatedInput.value,
        updated: filterUpdatedInput.value,
    });
    const filteredAliases = applyFilters(aliasesCache);
    const sortedAliases = sortAliases(filteredAliases);
    renderTable(tableBody, sortedAliases, venuesCache);
    updateSortIndicators('venue-aliases-list', currentSort);
}
