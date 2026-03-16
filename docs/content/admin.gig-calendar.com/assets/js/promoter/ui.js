export function renderTable(tbody, promoters) {
    tbody.innerHTML = ''; // Clear existing rows
    if (promoters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No promoters found.</td></tr>';
        return;
    }
    promoters.forEach(promoter => renderDisplayRow(tbody, promoter));
}
export function renderDisplayRow(tbody, promoter) {
    let row = tbody.querySelector(`tr[data-id="${promoter.ID}"]`);
    if (!row) {
        row = tbody.insertRow();
        row.dataset.id = promoter.ID.toString();
    }
    row.innerHTML = `
        <td>${promoter.ID}</td>
        <td>${promoter.Name}</td>
        <td>${promoter.Uuid}</td>
        <td>${new Date(promoter.Created).toLocaleString()}</td>
        <td>${new Date(promoter.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn">Edit</button>
            <button class="delete-btn">Delete</button>
        </td>
    `;
}
export function renderEditRow(tbody, promoter, isNew) {
    let row = tbody.querySelector(`tr[data-id="${promoter.ID}"]`);
    if (!row && isNew) {
        row = tbody.insertRow(0); // Insert at top for new entries
        row.dataset.id = promoter.ID ? promoter.ID.toString() : 'new';
    }
    else if (!row) {
        return; // Should not happen for existing rows
    }
    row.innerHTML = `
        <td>${promoter.ID || 'New'}</td>
        <td><input type="text" class="edit-name" value="${promoter.Name || ''}" style="width: 100%;"></td>
        <td>${promoter.Uuid || 'N/A'}</td>
        <td>${promoter.Created ? new Date(promoter.Created).toLocaleString() : 'N/A'}</td>
        <td>${promoter.Updated ? new Date(promoter.Updated).toLocaleString() : 'N/A'}</td>
        <td>
            <button class="${isNew ? 'add-btn' : 'save-btn'}">${isNew ? 'Add' : 'Save'}</button>
            <button class="${isNew ? 'cancel-add-btn' : 'cancel-btn'}">Cancel</button>
        </td>
    `;
}
export function updateSortIndicators(currentSort) {
    document.querySelectorAll('#promoters-list th[data-col]').forEach(th => {
        const htmlTh = th;
        htmlTh.innerHTML = htmlTh.textContent?.replace(/ ↑| ↓/, '') || ''; // Clear existing indicators
        if (htmlTh.dataset.col === currentSort.column) {
            htmlTh.innerHTML += currentSort.direction === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
export function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (!modal || !modalTitle || !modalBody || !closeModalBtn) {
        console.error("Modal elements not found");
        return;
    }
    modalTitle.textContent = title;
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    }
    else {
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
