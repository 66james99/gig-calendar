import { locationsCache, currentSort, debugCheckbox, setCurrentSort, setCurrentFilters, tableBody, filterIdInput, filterRootInput, filterPatternInput, filterDateFromExifSelect, filterIncludeParentSelect, filterIgnoreDirsInput, filterActiveSelect, applyFilters, applySort, refreshLocations, } from './app.js';
import { createImageLocation, deleteImageLocation, previewImageLocationScan, updateImageLocation } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable, showModal, updateSortIndicators } from './ui.js';
export async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row)
        return;
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
        const payload = {
            root: row.querySelector('.edit-root').value,
            pattern: row.querySelector('.edit-pattern').value,
            date_from_exif: row.querySelector('.edit-date_from_exif').checked,
            include_parent: row.querySelector('.edit-include_parent').checked,
            ignore_dirs: row.querySelector('.edit-ignore_dirs').value.split(',').map(s => s.trim()).filter(s => s),
            active: row.querySelector('.edit-active').checked,
        };
        try {
            await updateImageLocation(id, payload);
            await refreshLocations(); // Refresh all to see changes
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (location)
                renderDisplayRow(row, location); // Revert on failure
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
        const payload = {
            root: row.querySelector('.edit-root').value,
            pattern: row.querySelector('.edit-pattern').value,
            date_from_exif: row.querySelector('.edit-date_from_exif').checked,
            include_parent: row.querySelector('.edit-include_parent').checked,
            ignore_dirs: row.querySelector('.edit-ignore_dirs').value.split(',').map(s => s.trim()).filter(s => s),
            active: row.querySelector('.edit-active').checked,
        };
        try {
            await createImageLocation(payload);
            await refreshLocations();
        }
        catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete location ${id}?`)) {
            try {
                await deleteImageLocation(id);
                await refreshLocations();
            }
            catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
    // --- Preview Scan button ---
    else if (target.classList.contains('preview-btn') && id && location) {
        showModal(`Preview Scan for ID: ${id}`, '<div>Loading...</div>');
        try {
            const result = await previewImageLocationScan(id, debugCheckbox.checked);
            const content = createPreviewContent(result);
            showModal(`Preview Scan for ID: ${id}`, content);
        }
        catch (error) {
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
    const newLocationData = {};
    renderEditRow(newRow, newLocationData, true); // Render the row in edit mode.
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
function createPreviewContent(result) {
    const container = document.createElement('div');
    // Summary
    const summaryHtml = `
        <h4>Summary</h4>
        <ul style="list-style: none; padding: 0; display: flex; gap: 15px; flex-wrap: wrap;">
            <li><strong>Parsed:</strong> ${result.success_count}</li>
            <li><strong>Inconsistent:</strong> ${result.inconsistent_count}</li>
            <li><strong>Failed:</strong> ${result.error_count}</li>
            <li><strong>Ignored:</strong> ${result.ignored_count}</li>
        </ul>
        ${result.error_count > 0 || (result.parse_errors && result.parse_errors.length > 0) ? `
            <details>
                <summary style="cursor: pointer; color: red;">Show Parse Errors (${result.error_count})</summary>
                <pre style="max-height: 100px; overflow-y: auto; background: #fff0f0; padding: 10px; font-size: 0.8em;">${(result.parse_errors || []).join('\n')}</pre>
            </details>
        ` : ''}
    `;
    const summaryDiv = document.createElement('div');
    summaryDiv.innerHTML = summaryHtml;
    container.appendChild(summaryDiv);
    // Data for table
    let data = result.successes || [];
    // State
    let sortCol = 'date';
    let sortDir = 'asc';
    let filters = {
        date: '',
        performers: '',
        venue: '',
        promoters: '',
        consistent: ''
    };
    // Table elements
    const tableContainer = document.createElement('div');
    tableContainer.style.cssText = "max-height: 400px; overflow-y: auto; margin-top: 10px; border: 1px solid #ddd;";
    const table = document.createElement('table');
    table.style.cssText = "width: 100%; border-collapse: collapse; font-size: 0.9rem;";
    table.innerHTML = `
        <thead style="position: sticky; top: 0; background: white; border-bottom: 2px solid #ccc; z-index: 1;">
            <tr>
                <th data-col="date" style="cursor: pointer; padding: 8px; text-align: left;">Date ↕</th>
                <th data-col="performers" style="cursor: pointer; padding: 8px; text-align: left;">Performers ↕</th>
                <th data-col="venue" style="cursor: pointer; padding: 8px; text-align: left;">Venue ↕</th>
                <th data-col="promoters" style="cursor: pointer; padding: 8px; text-align: left;">Promoters ↕</th>
                <th data-col="consistent" style="cursor: pointer; padding: 8px; text-align: center;">OK ↕</th>
            </tr>
            <tr style="background: #f9f9f9;">
                <th style="padding: 4px;"><input type="text" data-filter="date" placeholder="Filter Date" style="width: 100%; box-sizing: border-box;"></th>
                <th style="padding: 4px;"><input type="text" data-filter="performers" placeholder="Filter Perf" style="width: 100%; box-sizing: border-box;"></th>
                <th style="padding: 4px;"><input type="text" data-filter="venue" placeholder="Filter Venue" style="width: 100%; box-sizing: border-box;"></th>
                <th style="padding: 4px;"><input type="text" data-filter="promoters" placeholder="Filter Prom" style="width: 100%; box-sizing: border-box;"></th>
                <th style="padding: 4px;"><select data-filter="consistent" style="width: 100%; box-sizing: border-box;"><option value="">All</option><option value="true">✓</option><option value="false">✗</option></select></th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    const thead = table.querySelector('thead');
    // Render function
    const render = () => {
        // Filter
        let filtered = data.filter(item => {
            const dateStr = (item.year && item.month && item.day)
                ? `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
                : '';
            const perfStr = (item.performers || []).join(', ');
            const venueName = (item.venue_confidence && item.venue_confidence > 0) ? (item.venue_match || '') : (item.venue || '');
            const promStr = (item.promoters || []).join(', ');
            const consistentMatch = filters.consistent === '' || item.consistent.toString() === filters.consistent;
            return dateStr.includes(filters.date) &&
                perfStr.toLowerCase().includes(filters.performers.toLowerCase()) &&
                venueName.toLowerCase().includes(filters.venue.toLowerCase()) &&
                promStr.toLowerCase().includes(filters.promoters.toLowerCase()) &&
                consistentMatch;
        });
        // Sort
        filtered.sort((a, b) => {
            let valA = '';
            let valB = '';
            if (sortCol === 'date') {
                valA = (a.year || 0) * 10000 + (a.month || 0) * 100 + (a.day || 0);
                valB = (b.year || 0) * 10000 + (b.month || 0) * 100 + (b.day || 0);
            }
            else if (sortCol === 'performers') {
                valA = (a.performers || []).join(', ').toLowerCase();
                valB = (b.performers || []).join(', ').toLowerCase();
            }
            else if (sortCol === 'venue') {
                valA = ((a.venue_confidence && a.venue_confidence > 0) ? (a.venue_match || '') : (a.venue || '')).toLowerCase();
                valB = ((b.venue_confidence && b.venue_confidence > 0) ? (b.venue_match || '') : (b.venue || '')).toLowerCase();
            }
            else if (sortCol === 'promoters') {
                valA = (a.promoters || []).join(', ').toLowerCase();
                valB = (b.promoters || []).join(', ').toLowerCase();
            }
            else if (sortCol === 'consistent') {
                valA = a.consistent ? 1 : 0;
                valB = b.consistent ? 1 : 0;
            }
            if (valA < valB)
                return sortDir === 'asc' ? -1 : 1;
            if (valA > valB)
                return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
        // Build HTML
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding: 10px; text-align: center;">No results found</td></tr>';
            return;
        }
        tbody.innerHTML = filtered.map(item => {
            const dateStr = (item.year && item.month && item.day)
                ? `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
                : 'N/A';
            const perfStr = (item.performers || []).join(', ');
            const promStr = (item.promoters || []).join(', ');
            const conf = item.venue_confidence || 0;
            const displayVenue = (conf > 0 ? item.venue_match : item.venue) || '';
            let color = 'red';
            if (conf === 100)
                color = 'green';
            else if (conf === 75)
                color = 'blue';
            else if (conf === 50)
                color = 'orange';
            else if (conf === 25)
                color = 'gray';
            const consistentIcon = item.consistent ? '✓' : '✗';
            const consistentColor = item.consistent ? 'green' : 'red';
            const venueTooltip = (conf === 50 || conf === 25) ? `title="Original: ${item.venue}"` : '';
            return `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 6px;">${dateStr}</td>
                    <td style="padding: 6px;">${perfStr}</td>
                    <td style="padding: 6px; color: ${color}; font-weight: ${conf > 0 ? 'bold' : 'normal'};" ${venueTooltip}>
                        ${displayVenue}
                    </td>
                    <td style="padding: 6px;">${promStr}</td>
                    <td style="padding: 6px; text-align: center; color: ${consistentColor}; font-weight: bold;">${consistentIcon}</td>
                </tr>
            `;
        }).join('');
    };
    // Event Listeners for Sort
    thead.addEventListener('click', (e) => {
        const th = e.target.closest('th');
        if (th && th.dataset.col) {
            const col = th.dataset.col;
            if (sortCol === col) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            }
            else {
                sortCol = col;
                sortDir = 'asc';
            }
            render();
        }
    });
    // Event Listeners for Filter
    thead.addEventListener('input', (e) => {
        const input = e.target;
        if (input && input.dataset.filter) {
            const filterKey = input.dataset.filter;
            filters[filterKey] = input.value;
            render();
        }
    });
    thead.addEventListener('change', (e) => {
        const select = e.target;
        if (select && select.dataset.filter && select.tagName === 'SELECT') {
            const filterKey = select.dataset.filter;
            filters[filterKey] = select.value;
            render();
        }
    });
    // Initial render
    render();
    tableContainer.appendChild(table);
    container.appendChild(tableContainer);
    return container;
}
