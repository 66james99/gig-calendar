"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterActiveSelect = exports.filterIgnoreDirsInput = exports.filterIncludeParentSelect = exports.filterDateFromExifSelect = exports.filterPatternInput = exports.filterRootInput = exports.filterIdInput = exports.refreshButton = exports.newButton = exports.tableHeader = exports.tableBody = exports.currentFilters = exports.currentSort = exports.locationsCache = void 0;
exports.setLocationsCache = setLocationsCache;
exports.setCurrentSort = setCurrentSort;
exports.setCurrentFilters = setCurrentFilters;
exports.applyFilters = applyFilters;
exports.applySort = applySort;
exports.refreshLocations = refreshLocations;
const api_js_1 = require("./api.js");
const event_js_1 = require("./event.js");
const ui_js_1 = require("./ui.js");
// --- State ---
exports.locationsCache = [];
exports.currentSort = {
    column: 'ID',
    direction: 'asc',
};
exports.currentFilters = {
    id: '',
    root: '',
    pattern: '',
    dateFromExif: '',
    includeParent: '',
    ignoreDirs: '',
    active: '',
};
function setLocationsCache(newCache) {
    exports.locationsCache = newCache;
}
function setCurrentSort(newSort) {
    exports.currentSort = newSort;
}
function setCurrentFilters(newFilters) {
    exports.currentFilters = newFilters;
}
// --- DOM Elements ---
exports.tableBody = document.querySelector('#locations-list tbody');
exports.tableHeader = document.querySelector('#locations-list thead');
exports.newButton = document.getElementById('new-button');
exports.refreshButton = document.getElementById('refresh-button');
exports.filterIdInput = document.getElementById('filter-id');
exports.filterRootInput = document.getElementById('filter-root');
exports.filterPatternInput = document.getElementById('filter-pattern');
exports.filterDateFromExifSelect = document.getElementById('filter-date_from_exif');
exports.filterIncludeParentSelect = document.getElementById('filter-include_parent');
exports.filterIgnoreDirsInput = document.getElementById('filter-ignore_dirs');
exports.filterActiveSelect = document.getElementById('filter-active');
// --- UI Functions ---
function applyFilters(locations) {
    return locations.filter(location => {
        const idMatch = location.ID.toString().includes(exports.currentFilters.id);
        const rootMatch = location.Root.toLowerCase().includes(exports.currentFilters.root.toLowerCase());
        const patternMatch = location.Pattern.toLowerCase().includes(exports.currentFilters.pattern.toLowerCase());
        const ignoreDirsMatch = (location.IgnoreDirs || []).join(', ').toLowerCase().includes(exports.currentFilters.ignoreDirs.toLowerCase());
        const dateFromExifMatch = exports.currentFilters.dateFromExif === '' || location.DateFromExif.toString() === exports.currentFilters.dateFromExif;
        const includeParentMatch = exports.currentFilters.includeParent === '' || location.IncludeParent.toString() === exports.currentFilters.includeParent;
        const activeMatch = exports.currentFilters.active === '' || location.Active.toString() === exports.currentFilters.active;
        return idMatch && rootMatch && patternMatch && ignoreDirsMatch && dateFromExifMatch && includeParentMatch && activeMatch;
    });
}
function applySort(locations) {
    const { column, direction } = exports.currentSort;
    const modifier = direction === 'asc' ? 1 : -1;
    return [...locations].sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        // ID is a number
        if (column === 'ID') {
            // The type assertion is safe because we control the column values.
            return (valA - valB) * modifier;
        }
        // Booleans
        if (typeof valA === 'boolean' && typeof valB === 'boolean') {
            return (Number(valA) - Number(valB)) * modifier;
        }
        // Strings (including dates)
        if (typeof valA === 'string' && typeof valB === 'string') {
            return valA.localeCompare(valB) * modifier;
        }
        // Fallback for nulls or mixed types
        if (valA < valB)
            return -1 * modifier;
        if (valA > valB)
            return 1 * modifier;
        return 0;
    });
}
// --- Initialization ---
async function refreshLocations() {
    try {
        setLocationsCache(await (0, api_js_1.fetchImageLocations)());
        // Apply any existing filters and sorting, then render the table
        (0, event_js_1.handleFilterChange)();
    }
    catch (error) {
        alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        exports.tableBody.innerHTML = '<tr><td colspan="10">Failed to load data. Is the backend server running?</td></tr>';
    }
}
function init() {
    exports.tableBody.addEventListener('click', event_js_1.handleTableClick);
    exports.tableHeader.addEventListener('click', event_js_1.handleSort);
    exports.newButton.addEventListener('click', event_js_1.handleNewClick);
    exports.refreshButton.addEventListener('click', refreshLocations);
    // Add event listeners for filters
    exports.filterIdInput.addEventListener('input', event_js_1.handleFilterChange);
    exports.filterRootInput.addEventListener('input', event_js_1.handleFilterChange);
    exports.filterPatternInput.addEventListener('input', event_js_1.handleFilterChange);
    exports.filterDateFromExifSelect.addEventListener('change', event_js_1.handleFilterChange);
    exports.filterIncludeParentSelect.addEventListener('change', event_js_1.handleFilterChange);
    exports.filterIgnoreDirsInput.addEventListener('input', event_js_1.handleFilterChange);
    exports.filterActiveSelect.addEventListener('change', event_js_1.handleFilterChange);
    // On initial load, fetch and render all data without filtering.
    // This ensures a clean slate regardless of browser autofill on filter inputs.
    (async () => {
        try {
            setLocationsCache(await (0, api_js_1.fetchImageLocations)());
            const sortedLocations = applySort(exports.locationsCache);
            (0, ui_js_1.renderTable)(exports.tableBody, sortedLocations);
            (0, ui_js_1.updateSortIndicators)(exports.currentSort);
        }
        catch (error) {
            alert(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
            exports.tableBody.innerHTML = '<tr><td colspan="10">Failed to load data. Is the backend server running?</td></tr>';
        }
    })();
}
// Start the app
init();
//# sourceMappingURL=app.js.map