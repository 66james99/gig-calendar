import { createStageRole, updateStageRole, deleteStageRole } from './api.js';
import { renderDisplayRow, renderEditRow, renderTable } from './ui.js';
import { 
    stageRolesCache, currentSort, setCurrentSort, setCurrentFilters, refreshStageRoles, applyFilters, sortStageRoles 
} from './app.js';
import { updateSortIndicators } from '../shared/ui.js';
import type { StageRole, StageRoleSortableColumn } from './types.js';

export function handleNewClick() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    const existingAddRow = tbody.querySelector('.add-btn');
    if (existingAddRow) {
        alert('Please save or cancel the current new stage role before adding another.');
        existingAddRow.closest('tr')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const newRow = tbody.insertRow(0);
    const newStageRoleData: Partial<StageRole> = {};
    renderEditRow(tbody, newStageRoleData, true);
}

export async function handleTableClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const btn = target.closest('button');
    if (!btn) return;

    const row = btn.closest('tr') as HTMLTableRowElement;
    if (!row) return;

    const idStr = row.dataset.id;
    const id = idStr ? parseInt(idStr, 10) : 0;

    if (btn.classList.contains('edit-btn')) {
        const item = stageRolesCache.find(i => i.ID === id);
        if (item) renderEditRow(row.parentElement as HTMLTableSectionElement, item, false);

    } else if (btn.classList.contains('delete-btn')) {
        if (confirm('Are you sure you want to delete this stage role?')) {
            try {
                await deleteStageRole(id);
                await refreshStageRoles();
            } catch (e) {
                alert((e as Error).message);
            }
        }

    } else if (btn.classList.contains('duplicate-btn')) {
        const item = stageRolesCache.find(i => i.ID === id);
        if (item) {
            const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
            renderEditRow(tbody, { ...item, ID: 0 }, true);
        }

    } else if (btn.classList.contains('cancel-btn')) {
        const item = stageRolesCache.find(i => i.ID === id);
        if (item) renderDisplayRow(row.parentElement as HTMLTableSectionElement, item);

    } else if (btn.classList.contains('cancel-add-btn')) {
        row.remove();
        
    } else if (btn.classList.contains('save-btn') || btn.classList.contains('add-btn')) {
        const pattern = (row.querySelector('.edit-pattern') as HTMLInputElement).value;

        if (!pattern) {
            alert('Pattern is required.');
            return;
        }

        try {
            if (btn.classList.contains('add-btn')) {
                await createStageRole(pattern);
            } else {
                await updateStageRole(id, pattern);
            }
            await refreshStageRoles();
        } catch (e) {
            alert((e as Error).message);
        }
    }
}

export function handleSort(event: MouseEvent) {
    const th = (event.target as HTMLElement).closest('th');
    if (!th || !th.dataset.col) return;

    const col = th.dataset.col as StageRoleSortableColumn;
    if (currentSort.column === col) {
        setCurrentSort({ column: col, direction: currentSort.direction === 'asc' ? 'desc' : 'asc' });
    } else {
        setCurrentSort({ column: col, direction: 'asc' });
    }

    updateSortIndicators('stage-roles-list', currentSort);
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    renderTable(tbody, sortStageRoles(applyFilters(stageRolesCache)));
}

export function handleFilterChange() {
    const tbody = document.getElementById('table-body') as HTMLTableSectionElement;
    const inputs = document.querySelectorAll('.filter-row input');
    const filters: any = {};
    inputs.forEach((input: any) => filters[input.id.replace('filter-', '')] = input.value);
    setCurrentFilters(filters);
    renderTable(tbody, sortStageRoles(applyFilters(stageRolesCache)));
}