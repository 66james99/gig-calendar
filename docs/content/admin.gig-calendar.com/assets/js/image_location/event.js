"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleTableClick = handleTableClick;
exports.handleNewClick = handleNewClick;
exports.handleSort = handleSort;
exports.handleFilterChange = handleFilterChange;
const app_js_1 = require("./app.js");
const api_js_1 = require("./api.js");
const ui_js_1 = require("./ui.js");
async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row)
        return;
    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null;
    const location = id ? app_js_1.locationsCache.find(loc => loc.ID === id) : null;
    // --- Edit button ---
    if (target.classList.contains('edit-btn') && location) {
        (0, ui_js_1.renderEditRow)(row, location);
    }
    // --- Cancel Edit button ---
    else if (target.classList.contains('cancel-btn') && location) {
        (0, ui_js_1.renderDisplayRow)(row, location);
    }
    // --- Save button (for updating) ---
    else if (target.classList.contains('save-btn') && id) {
        const payload = {
            root: row.querySelector('.edit-root').value,
            pattern: row.querySelector('.edit-pattern').value,
            date_from_exif: row.querySelector('.edit-date_from_exif').checked,
            include_parent: row.querySelector('.edit-include_parent').checked,
            ignore_dirs: row.querySelector('.edit-ignore_dirs').value.split(',').map(s => s.trim()).filter(s => s),
            active: row.querySelector('.edit-active').checked,
        };
        try {
            await (0, api_js_1.updateImageLocation)(id, payload);
            await (0, app_js_1.refreshLocations)(); // Refresh all to see changes
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (location)
                (0, ui_js_1.renderDisplayRow)(row, location); // Revert on failure
        }
    }
    // --- Duplicate button ---
    else if (target.classList.contains('duplicate-btn') && location) {
        const newRow = document.createElement('tr');
        // Create a copy for the new row, reset ID, keep other fields
        const newLocationData = { ...location, ID: 0 };
        (0, ui_js_1.renderEditRow)(newRow, newLocationData, true);
        row.after(newRow); // Inserts the new row right after the clicked row
    }
    // --- Cancel Add button ---
    else if (target.classList.contains('cancel-add-btn')) {
        row.remove();
    }
    // --- Add button (for creating) ---
    else if (target.classList.contains('add-btn')) {
        const payload = {
            root: row.querySelector('.edit-root').value,
            pattern: row.querySelector('.edit-pattern').value,
            date_from_exif: row.querySelector('.edit-date_from_exif').checked,
            include_parent: row.querySelector('.edit-include_parent').checked,
            ignore_dirs: row.querySelector('.edit-ignore_dirs').value.split(',').map(s => s.trim()).filter(s => s),
            active: row.querySelector('.edit-active').checked,
        };
        try {
            await (0, api_js_1.createImageLocation)(payload);
            await (0, app_js_1.refreshLocations)();
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete location ${id}?`)) {
            try {
                await (0, api_js_1.deleteImageLocation)(id);
                await (0, app_js_1.refreshLocations)();
            }
            catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    // --- Preview Scan button ---
    else if (target.classList.contains('preview-btn') && id && location) {
        (0, ui_js_1.showModal)(`Preview Scan for ID: ${id}`, '<div>Loading...</div>');
        try {
            const result = await (0, api_js_1.previewImageLocationScan)(id);
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
            (0, ui_js_1.showModal)(`Preview Scan for ID: ${id}`, resultHtml);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            (0, ui_js_1.showModal)(`Error Scanning ID: ${id}`, `<div style="color: red;">${message}</div>`);
        }
    }
}
function handleNewClick() {
    // Check if a row is already in 'add' mode to prevent multiple new rows.
    const existingAddRow = app_js_1.tableBody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new row before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = app_js_1.tableBody.insertRow(0); // Insert a new row at the top of the table.
    const newLocationData = {};
    (0, ui_js_1.renderEditRow)(newRow, newLocationData, true); // Render the row in edit mode.
}
function handleSort(event) {
    const target = event.target;
    if (target.tagName !== 'TH' || !target.dataset.sort)
        return;
    const sortColumn = target.dataset.sort;
    if (app_js_1.currentSort.column === sortColumn) {
        (0, app_js_1.setCurrentSort)({ ...app_js_1.currentSort, direction: app_js_1.currentSort.direction === 'asc' ? 'desc' : 'asc' });
    }
    else {
        (0, app_js_1.setCurrentSort)({ column: sortColumn, direction: 'asc' });
    }
    handleFilterChange();
}
function handleFilterChange() {
    (0, app_js_1.setCurrentFilters)({
        id: app_js_1.filterIdInput.value,
        root: app_js_1.filterRootInput.value,
        pattern: app_js_1.filterPatternInput.value,
        dateFromExif: app_js_1.filterDateFromExifSelect.value,
        includeParent: app_js_1.filterIncludeParentSelect.value,
        ignoreDirs: app_js_1.filterIgnoreDirsInput.value,
        active: app_js_1.filterActiveSelect.value,
    });
    const filteredLocations = (0, app_js_1.applyFilters)(app_js_1.locationsCache);
    const sortedLocations = (0, app_js_1.applySort)(filteredLocations);
    (0, ui_js_1.renderTable)(app_js_1.tableBody, sortedLocations);
    (0, ui_js_1.updateSortIndicators)(app_js_1.currentSort);
}
//# sourceMappingURL=event.js.map