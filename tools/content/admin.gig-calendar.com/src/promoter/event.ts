import {
    promotersCache,
    currentSort,
    setCurrentSort,
    setCurrentFilters,
    tableBody,
    filterIdInput,
    filterNameInput,
    filterUuidInput,
    applyFilters,
    applySort,
    refreshPromoters,
} from './app.js';
import { createPromoter, deletePromoter, updatePromoter } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable, updateSortIndicators } from './ui.js';
import type { Promoter, PromoterPayload, SortableColumn } from './types.js';

export async function handleTableClick(event: Event) {
    const target = event.target as HTMLElement;
    const row = target.closest('tr');
    if (!row) return;

    const id = row.dataset.id ? parseInt(row.dataset.id, 10) : null;
    const promoter = id ? promotersCache.find(p => p.ID === id) : null;

    // --- Edit button ---
    if (target.classList.contains('edit-btn') && promoter) {
        renderEditRow(tableBody, promoter, false);
    }

    // --- Cancel Edit button ---
    else if (target.classList.contains('cancel-btn') && promoter) {
        renderDisplayRow(tableBody, promoter);
    }

    // --- Save button (for updating) ---
    else if (target.classList.contains('save-btn') && id) {
        const payload: PromoterPayload = {
            name: (row.querySelector('.edit-name') as HTMLInputElement).value,
        };
        try {
            await updatePromoter(id, payload);
            await refreshPromoters(); // Refresh all to see changes
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (promoter) renderDisplayRow(tableBody, promoter); // Revert on failure
        }
    }

    // --- Duplicate button ---
    else if (target.classList.contains('duplicate-btn') && promoter) {
        const newRow = document.createElement('tr');
        const newPromoterData = { ...promoter, ID: 0 };
        renderEditRow(tableBody, newPromoterData, true);
        row.after(newRow);
    }

    // --- Cancel Add button ---
    else if (target.classList.contains('cancel-add-btn')) {
        row.remove();
    }

    // --- Add button (for creating) ---
    else if (target.classList.contains('add-btn')) {
        const payload: PromoterPayload = {
            name: (row.querySelector('.edit-name') as HTMLInputElement).value,
        };
        try {
            await createPromoter(payload);
            await refreshPromoters();
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    // --- Delete button ---
    else if (target.classList.contains('delete-btn') && id) {
        if (confirm(`Are you sure you want to delete promoter ${id}?`)) {
            try {
                await deletePromoter(id);
                await refreshPromoters();
            } catch (error) {
                alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    }
}

export function handleNewClick() {
    const existingAddRow = tableBody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new promoter before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const newRow = tableBody.insertRow(0);
    const newPromoterData: Partial<Promoter> = {};
    renderEditRow(tableBody, newPromoterData, true);
}

export function handleSort(event: Event) {
    const target = event.target as HTMLElement;
    if (target.tagName !== 'TH' || !target.dataset.col) return;
    const sortColumn = target.dataset.col as SortableColumn;
    const direction = (currentSort.column === sortColumn && currentSort.direction === 'asc') ? 'desc' : 'asc';
    setCurrentSort({ column: sortColumn, direction });
    handleFilterChange();
}

export function handleFilterChange() {
    setCurrentFilters({ id: filterIdInput.value, name: filterNameInput.value, uuid: filterUuidInput.value });
    const filteredPromoters = applyFilters(promotersCache);
    const sortedPromoters = applySort(filteredPromoters);
    renderTable(tableBody, sortedPromoters);
    updateSortIndicators(currentSort);
}