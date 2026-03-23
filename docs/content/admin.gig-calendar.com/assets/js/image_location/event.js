import { locationsCache, currentSort, debugCheckbox, setCurrentSort, setCurrentFilters, tableBody, filterIdInput, filterRootInput, filterPatternInput, filterDateFromExifSelect, filterIncludeParentSelect, filterIgnoreDirsInput, filterActiveSelect, applyFilters, refreshLocations, } from './app.js';
import { createImageLocation, deleteImageLocation, previewImageLocationScan, updateImageLocation } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable, } from './ui.js';
import { updateSortIndicators } from '../shared/ui.js';
import { applySort } from '../shared/table-utils.js';
let highlightedRow = null;
// --- Context Menu Helpers ---
function removeContextMenu() {
    const existing = document.getElementById('preview-context-menu');
    if (existing)
        existing.remove();
}
document.addEventListener('click', (e) => {
    // Close context menu if clicking outside of it
    if (!e.target.closest('#preview-context-menu')) {
        removeContextMenu();
    }
});
function getSpaUrl(type, name) {
    // Assumes SPA structure: ../{type}/index.html
    // Adds query params for "new" mode and pre-filled name.
    // The receiving SPA must handle these params (e.g. ?action=new&name=...)
    return `../${type}/?action=new&name=${encodeURIComponent(name)}`;
}
function clearPreview() {
    if (highlightedRow) {
        highlightedRow.classList.remove('highlighted');
        highlightedRow = null;
    }
    const previewContainer = document.getElementById('preview-container');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}
export async function handleTableClick(event) {
    const target = event.target;
    const row = target.closest('tr');
    if (!row)
        return;
    // Clear preview for any action other than the preview button itself.
    if (!target.classList.contains('preview-btn')) {
        clearPreview();
    }
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
        clearPreview();
        row.classList.add('highlighted');
        highlightedRow = row;
        const previewContainer = document.getElementById('preview-container');
        if (!previewContainer)
            return;
        previewContainer.innerHTML = '<div>Loading...</div>';
        try {
            const isDebug = debugCheckbox.checked;
            const result = await previewImageLocationScan(id, isDebug);
            const content = createPreviewContent(result, isDebug);
            const previewTitle = document.createElement('h2');
            previewTitle.textContent = `Preview Scan for ID: ${id}`;
            previewTitle.style.marginTop = '2em';
            previewContainer.innerHTML = '';
            previewContainer.appendChild(previewTitle);
            previewContainer.appendChild(content);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            previewContainer.innerHTML = `<div style="color: red;">Error Scanning ID: ${id}: ${message}</div>`;
        }
    }
}
export function handleNewClick(prefill) {
    // Check if a row is already in 'add' mode to prevent multiple new rows.
    const existingAddRow = tableBody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new row before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    const newRow = tableBody.insertRow(0); // Insert a new row at the top of the table.
    const newLocationData = prefill || {};
    renderEditRow(newRow, newLocationData, true); // Render the row in edit mode.
}
export function handleEditItem(item) {
    const row = tableBody.querySelector(`tr[data-id="${item.ID}"]`);
    if (row) {
        renderEditRow(row, item);
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
export function handleNotFound(name) {
    const row = tableBody.insertRow(0);
    row.innerHTML = `<td colspan="10" style="color: red; font-weight: bold; text-align: center; padding: 10px; background-color: #fff0f0;">Not Found : ${name}</td>`;
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
    clearPreview();
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
    const sortedLocations = applySort(filteredLocations, currentSort);
    renderTable(tableBody, sortedLocations);
    updateSortIndicators('locations-list', currentSort);
}
function createPreviewContent(result, isDebug) {
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
        ${isDebug && result.error_count > 0 ? `
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
    let previewSort = {
        column: 'date',
        direction: 'asc'
    };
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
    table.id = 'preview-table';
    table.style.cssText = "width: 100%; border-collapse: collapse; font-size: 0.9rem;";
    table.innerHTML = `
        <thead style="position: sticky; top: 0; background: white; border-bottom: 2px solid #ccc; z-index: 1;">
            <tr>
                <th data-col="date" class="sortable" style="width: 120px; padding: 8px; text-align: left;">Date <span class="sort-indicator asc"></span></th>
                <th data-col="performers" class="sortable" style="padding: 8px; text-align: left;">Performers <span class="sort-indicator"></span></th>
                <th data-col="venue" class="sortable" style="padding: 8px; text-align: left;">Venue <span class="sort-indicator"></span></th>
                <th data-col="promoters" class="sortable" style="padding: 8px; text-align: left;">Promoters <span class="sort-indicator"></span></th>
                <th data-col="consistent" class="sortable" style="width: 60px; padding: 8px; text-align: center;">OK <span class="sort-indicator"></span></th>
            </tr>
            <tr style="background: #f9f9f9;">
                <th style="width: 120px; padding: 4px;"><input type="text" data-filter="date" placeholder="Filter Date" style="width: 100%; box-sizing: border-box;"></th>
                <th style="padding: 4px;"><input type="text" data-filter="performers" placeholder="Filter Perf" style="width: 100%; box-sizing: border-box;"></th>
                <th style="padding: 4px;"><input type="text" data-filter="venue" placeholder="Filter Venue" style="width: 100%; box-sizing: border-box;"></th>
                <th style="padding: 4px;"><input type="text" data-filter="promoters" placeholder="Filter Prom" style="width: 100%; box-sizing: border-box;"></th>
                <th style="width: 60px; padding: 4px;"><select data-filter="consistent" style="width: 100%; box-sizing: border-box;"><option value="">All</option><option value="true">✓</option><option value="false">✗</option></select></th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');
    const thead = table.querySelector('thead');
    // Event Delegation for Context Menu
    table.addEventListener('click', (e) => {
        const target = e.target;
        const entityItem = target.closest('.entity-item');
        if (entityItem) {
            e.stopPropagation(); // Prevent document click from closing immediately
            removeContextMenu();
            const type = entityItem.dataset.type || '';
            const name = decodeURIComponent(entityItem.dataset.name || '');
            const conf = parseInt(entityItem.dataset.confidence || '0', 10);
            if (!type || !name)
                return;
            const menu = document.createElement('div');
            menu.id = 'preview-context-menu';
            menu.style.cssText = `
                position: absolute;
                background: white;
                border: 1px solid #ccc;
                box-shadow: 2px 2px 5px rgba(0,0,0,0.2);
                padding: 5px 0;
                z-index: 1000;
                font-size: 0.9rem;
                min-width: 150px;
            `;
            const mainUrl = getSpaUrl(type, name);
            const aliasUrl = getSpaUrl(`${type}_alias`, name);
            const linkStyle = "display: block; padding: 5px 15px; text-decoration: none; color: #333; white-space: nowrap; cursor: pointer;";
            let aliasOption = '';
            if (conf < 25) {
                aliasOption = `<a href="${aliasUrl}" target="_blank" style="${linkStyle}">Create Alias</a>`;
            }
            else {
                aliasOption = `<a href="${aliasUrl}" target="_blank" style="${linkStyle}">Edit Alias</a>`;
            }
            menu.innerHTML = `
                <a href="${mainUrl}" target="_blank" style="${linkStyle}">Create/Edit ${type}</a>
                ${aliasOption}
                <div id="preview-menu-cancel" style="${linkStyle} border-top: 1px solid #eee;">Cancel</div>
            `;
            document.body.appendChild(menu);
            menu.style.top = `${e.pageY}px`;
            menu.style.left = `${e.pageX}px`;
            const cancelBtn = menu.querySelector('#preview-menu-cancel');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    removeContextMenu();
                });
            }
        }
    });
    // Render function
    const render = () => {
        // Filter
        let filtered = data.filter(item => {
            const dateStr = (item.year && item.month && item.day)
                ? `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`
                : '';
            const perfStr = (item.performers || []).map(group => group.map(p => (p.pattern ? ` ${p.pattern} ` : '') + (p.confidence > 0 ? p.match : p.name)).join('')).join(', ');
            const venueName = (item.venue?.confidence && item.venue?.confidence > 0) ? (item.venue?.match || '') : (item.venue?.name || '');
            const promStr = (item.promoters || []).map(p => (p.confidence > 0 ? p.match : p.name)).join(', ');
            const consistentMatch = filters.consistent === '' || item.consistent.toString() === filters.consistent;
            return dateStr.includes(filters.date) &&
                perfStr.toLowerCase().includes(filters.performers.toLowerCase()) &&
                item.venue?.name.toLowerCase().includes(filters.venue.toLowerCase()) &&
                promStr.toLowerCase().includes(filters.promoters.toLowerCase()) &&
                consistentMatch;
        });
        // Update headers to show filtered count
        const headerTitles = {
            date: 'Date',
            performers: 'Performers',
            venue: 'Venue',
            promoters: 'Promoters',
            consistent: 'OK'
        };
        Object.keys(headerTitles).forEach(key => {
            const th = thead.querySelector(`th[data-col="${key}"]`);
            if (th) {
                const isActive = filters[key] !== '';
                th.innerHTML = `${headerTitles[key]}${isActive ? ` (${filtered.length})` : ''} <span class="sort-indicator"></span>`;
            }
        });
        // Sort
        filtered.sort((a, b) => {
            let valA = '';
            let valB = '';
            if (previewSort.column === 'date') {
                valA = (a.year || 0) * 10000 + (a.month || 0) * 100 + (a.day || 0);
                valB = (b.year || 0) * 10000 + (b.month || 0) * 100 + (b.day || 0);
            }
            else if (previewSort.column === 'performers') {
                const getPerfStr = (arr) => (arr || []).map(group => group.map(p => (p.pattern ? ` ${p.pattern} ` : '') + (p.confidence > 0 ? p.match : p.name)).join('')).join(', ').toLowerCase();
                valA = getPerfStr(a.performers);
                valB = getPerfStr(b.performers);
            }
            else if (previewSort.column === 'venue') {
                valA = ((a.venue?.confidence && a.venue?.confidence > 0) ? (a.venue?.match || '') : (a.venue?.name || '')).toLowerCase();
                valB = ((b.venue?.confidence && b.venue?.confidence > 0) ? (b.venue?.match || '') : (b.venue?.name || '')).toLowerCase();
            }
            else if (previewSort.column === 'promoters') {
                valA = (a.promoters || []).map(p => (p.confidence > 0 ? p.match : p.name)).join(', ').toLowerCase();
                valB = (b.promoters || []).map(p => (p.confidence > 0 ? p.match : p.name)).join(', ').toLowerCase();
            }
            else if (previewSort.column === 'consistent') {
                valA = a.consistent ? 1 : 0;
                valB = b.consistent ? 1 : 0;
            }
            if (valA < valB)
                return previewSort.direction === 'asc' ? -1 : 1;
            if (valA > valB)
                return previewSort.direction === 'asc' ? 1 : -1;
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
            const perfStr = (item.performers || []).map(group => {
                return group.map(p => {
                    const conf = p.confidence || 0;
                    const display = (conf > 0 ? p.match : p.name) || '';
                    let color = 'red';
                    if (conf === 100)
                        color = 'green';
                    else if (conf === 75)
                        color = 'blue';
                    else if (conf === 50)
                        color = 'orange';
                    else if (conf === 25)
                        color = 'gray';
                    const tooltip = (conf !== 100) ? `title="Original: ${p.name}"` : '';
                    const patternHtml = p.pattern ? `<span> ${p.pattern} </span>` : '';
                    // Wrap name in clickable span
                    return `${patternHtml}<span class="entity-item" data-type="performer" data-name="${encodeURIComponent(p.name)}" data-confidence="${conf}" style="cursor: pointer; text-decoration: underline dotted; color: ${color}; font-weight: ${conf > 0 ? 'bold' : 'normal'};" ${tooltip}>${display}</span>`;
                }).join('');
            }).join(', ');
            const promStr = (item.promoters || []).map(p => {
                const conf = p.confidence || 0;
                const display = (conf > 0 ? p.match : p.name) || '';
                let color = 'red';
                if (conf === 100)
                    color = 'green';
                else if (conf === 75)
                    color = 'blue';
                else if (conf === 50)
                    color = 'orange';
                else if (conf === 25)
                    color = 'gray';
                const tooltip = (conf !== 100) ? `title="Original: ${p.name}"` : '';
                const style = `color: ${color}; font-weight: ${conf > 0 ? 'bold' : 'normal'};${p.festival ? ' text-decoration: underline;' : ''}`;
                return `<span class="entity-item" data-type="promoter" data-name="${encodeURIComponent(p.name)}" data-confidence="${conf}" style="cursor: pointer; text-decoration: underline dotted; ${style}" ${tooltip}>${display}</span>`;
            }).join(', ');
            const conf = item.venue?.confidence || 0;
            const displayVenue = (conf > 0 ? item.venue?.match : item.venue?.name) || '';
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
            const venueTooltip = (conf !== 100 && item.venue?.name) ? `title="Original: ${item.venue?.name}"` : '';
            return `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 6px;">${dateStr}</td>
                    <td style="padding: 6px;">${perfStr}</td>
                    <td style="padding: 6px; color: ${color}; font-weight: ${conf > 0 ? 'bold' : 'normal'};" ${venueTooltip}>
                        <span class="entity-item" data-type="venue" data-name="${encodeURIComponent(item.venue?.name || '')}" data-confidence="${conf}" style="cursor: pointer; text-decoration: underline dotted;">${displayVenue}</span>
                    </td>
                    <td style="padding: 6px;">${promStr}</td>
                    <td style="padding: 6px; text-align: center; color: ${consistentColor}; font-weight: bold;">${consistentIcon}</td>
                </tr>
            `;
        }).join('');
        if (document.getElementById('preview-table')) {
            updateSortIndicators('preview-table', previewSort);
        }
    };
    // Event Listeners for Sort
    thead.addEventListener('click', (e) => {
        const th = e.target.closest('th');
        if (th && th.dataset.col) {
            const col = th.dataset.col;
            if (previewSort.column === col) {
                previewSort.direction = previewSort.direction === 'asc' ? 'desc' : 'asc';
            }
            else {
                previewSort.column = col;
                previewSort.direction = 'asc';
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
