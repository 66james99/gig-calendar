import {
    locationsCache,
    currentSort,
    setCurrentSort,
    setCurrentFilters,
    tableBody,
    filterIdInput,
    filterRootInput,
    filterPatternInput,
    filterDateFromExifSelect,
    filterIncludeParentSelect,
    filterIgnoreDirsInput,
    filterActiveSelect,
    applyFilters,
    applySort,
    refreshLocations,
} from './app.js';
import { createImageLocation, deleteImageLocation, previewImageLocationScan, updateImageLocation } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable, showModal, updateSortIndicators } from './ui.js';
import type { ImageLocation, ImageLocationPayload, SortableColumn } from './types.js';

export async function handleTableClick(event: Event) {
    const target = event.target as HTMLElement;
    const row = target.closest('tr');
    if (!row) return;

    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null;
    const location = id ? locationsCache.find(loc => loc.ID === id) : null;

    // --- Edit button ---
    if (target.classList.contains('edit-btn') && location) {
        renderEditRow(row, location);
    }

    // --- Cancel Edit button ---
    else if (target.classList.contains('cancel-btn') && location) {
        renderDisplayRow(row, location);
    }

    // --- Save button (for updating) ---
    else if (target.classList.contains('save-btn') && id) {
        const payload: ImageLocationPayload = {
            root: (row.querySelector('.edit-root') as HTMLInputElement).value,
            pattern: (row.querySelector('.edit-pattern') as HTMLInputElement).value,
            date_from_exif: (row.querySelector('.edit-date_from_exif') as HTMLInputElement).checked,
            include_parent: (row.querySelector('.edit-include_parent') as HTMLInputElement).checked,
            ignore_dirs: (row.querySelector('.edit-ignore_dirs') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(s => s),
            active: (row.querySelector('.edit-active') as HTMLInputElement).checked,
        };
        try {
            await updateImageLocation(id, payload);
            await refreshLocations(); // Refresh all to see changes
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (location) renderDisplayRow(row, location); // Revert on failure
        }
    }

    // --- Duplicate button ---
    else if (target.classList.contains('duplicate-btn') && location) {
        const newRow = document.createElement('tr');
        // Create a copy for the new row, reset ID, keep other fields
        const newLocationData = { ...location, ID: 0 };
        renderEditRow(newRow, newLocationData, true);
        row.after(newRow); // Inserts the new row right after the clicked row
    }

    // --- Cancel Add button ---
    else if (target.classList.contains('cancel-add-btn')) {
        row.remove();
    }

    // --- Add button (for creating) ---
    else if (target.classList.contains('add-btn')) {
        const payload: ImageLocationPayload = {
            root: (row.querySelector('.edit-root') as HTMLInputElement).value,
            pattern: (row.querySelector('.edit-pattern') as HTMLInputElement).value,
            date_from_exif: (row.querySelector('.edit-date_from_exif') as HTMLInputElement).checked,
            include_parent: (row.querySelector('.edit-include_parent') as HTMLInputElement).checked,
            ignore_dirs: (row.querySelector('.edit-ignore_dirs') as HTMLInputElement).value.split(',').map(s => s.trim()).filter(s => s),
            active: (row.querySelector('.edit-active') as HTMLInputElement).checked,
        };
        try {
            await createImageLocation(payload);
            await refreshLocations();
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete location ${id}?`)) {
            try {
                await deleteImageLocation(id);
                await refreshLocations();
            } catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }

    // --- Preview Scan button ---
    else if (target.classList.contains('preview-btn') && id && location) {
        showModal(`Preview Scan for ID: ${id}`, '<div>Loading...</div>');
        try {
            const result = await previewImageLocationScan(id);
            const resultHtml = `
                <h4>Summary</h4>
                <ul>
                    <li><strong>Successfully Parsed:</strong> ${result.success_count}</li>
                    <li><strong>Inconsistent Data:</strong> ${result.inconsistent_count}</li>
                    <li><strong>Failed to Parse:</strong> ${result.error_count}</li>
                    <li><strong>Directories Found:</strong> ${result.directories.length}</li>
                    <li><strong>Directories Ignored:</strong> ${result.ignored_count}</li>
                </ul>
                <h4>Directories Found (${result.directories.length})</h4>
                <pre style="max-height: 200px; overflow-y: auto; background: #f4f4f4; padding: 10px; border-radius: 4px;">${result.directories.join('\n') || 'None'}</pre>
                <h4>Parse Errors (${result.error_count > 0 ? result.error_count : (result.parse_errors || []).length})</h4>
                <pre style="max-height: 200px; overflow-y: auto; background: #f4f4f4; padding: 10px; border-radius: 4px;">${(result.parse_errors || []).join('\n') || 'None'}</pre>
            `;
            showModal(`Preview Scan for ID: ${id}`, resultHtml);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            showModal(`Error Scanning ID: ${id}`, `<div style="color: red;">${message}</div>`);
        }
    }
}

export function handleNewClick() {
    // Check if a row is already in 'add' mode to prevent multiple new rows.
    const existingAddRow = tableBody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new row before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const newRow = tableBody.insertRow(0); // Insert a new row at the top of the table.
    const newLocationData: Partial<ImageLocation> = {};
    renderEditRow(newRow, newLocationData, true); // Render the row in edit mode.
}

export function handleSort(event: Event) {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'TH' || !target.dataset.sort) return;

    const sortColumn = target.dataset.sort as SortableColumn;

    if (currentSort.column === sortColumn) {
        setCurrentSort({ ...currentSort, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
        setCurrentSort({ column: sortColumn, direction: 'asc' });
    }

    handleFilterChange();
}

export function handleFilterChange() {
    setCurrentFilters({
        id: filterIdInput.value,
        root: filterRootInput.value,
        pattern: filterPatternInput.value,
        dateFromExif: filterDateFromExifSelect.value,
        includeParent: filterIncludeParentSelect.value,
        ignoreDirs: filterIgnoreDirsInput.value,
        active: filterActiveSelect.value,
    });
    const filteredLocations = applyFilters(locationsCache);
    const sortedLocations = applySort(filteredLocations);
    renderTable(tableBody, sortedLocations);
    updateSortIndicators(currentSort);
}