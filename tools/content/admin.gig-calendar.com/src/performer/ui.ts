import type { Performer, SortState } from './types.js';

export function renderTable(tbody: HTMLTableSectionElement, performers: Performer[]) {
    tbody.innerHTML = ''; // Clear existing rows
    if (performers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No performers found.</td></tr>';
        return;
    }
    performers.forEach(performer => renderDisplayRow(tbody, performer));
}

export function renderDisplayRow(tbody: HTMLTableSectionElement, performer: Performer) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${performer.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = performer.ID.toString();
    }
    row.innerHTML = `
        <td>${performer.ID}</td>
        <td>${performer.Name}</td>
        <td>${performer.Uuid}</td>
        <td>${new Date(performer.Created).toLocaleString()}</td>
        <td>${new Date(performer.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
}

export function renderEditRow(tbody: HTMLTableSectionElement, performer: Partial<Performer>, isNew: boolean) {
    let row = tbody.querySelector<HTMLTableRowElement>(`tr[data-id="${performer.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = performer.ID ? performer.ID.toString() : 'new';
    } else if (!row) {
        return; // Should not happen for existing rows
    }

    row.innerHTML = `
        <td>${performer.ID || 'New'}</td>
        <td><input type="text" class="edit-name" value="${performer.Name || ''}" style="width: 100%;"></td>
        <td>${performer.Uuid || 'N/A'}</td>
        <td>${performer.Created ? new Date(performer.Created).toLocaleString() : 'N/A'}</td>
        <td>${performer.Updated ? new Date(performer.Updated).toLocaleString() : 'N/A'}</td>
        <td>
            <button class="${isNew ? 'add-btn' : 'save-btn'}">${isNew ? 'Add' : 'Save'}</button>
            <button class="${isNew ? 'cancel-add-btn' : 'cancel-btn'}">Cancel</button>
        </td>
    `;
}

export function updateSortIndicators(currentSort: SortState) {
    document.querySelectorAll('#performers-list th[data-col]').forEach(th => {
        const htmlTh = th as HTMLElement;
        htmlTh.innerHTML = htmlTh.textContent?.replace(/ ↑| ↓/, '') || ''; // Clear existing indicators
        if (htmlTh.dataset.col === currentSort.column) {
            htmlTh.innerHTML += currentSort.direction === 'asc' ? ' ↑' : ' ↓';
        }
    });
}

export function showModal(title: string, content: string | HTMLElement) {
    const modal = document.getElementById('modal') as HTMLElement;
    const modalTitle = document.getElementById('modal-title') as HTMLElement;
    const modalBody = document.getElementById('modal-body') as HTMLElement;
    const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;

    if (!modal || !modalTitle || !modalBody || !closeModalBtn) {
        console.error("Modal elements not found");
        return;
    }

    modalTitle.textContent = title;
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else {
        modalBody.innerHTML = '';
        modalBody.appendChild(content);
    }
    modal.style.display = 'block';

    closeModalBtn.onclick = () => {
        modal.style.display = 'none';
    };

    // Close when clicking outside
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}