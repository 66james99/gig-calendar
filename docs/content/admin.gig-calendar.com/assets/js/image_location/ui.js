"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderDisplayRow = renderDisplayRow;
exports.renderEditRow = renderEditRow;
exports.renderTable = renderTable;
exports.updateSortIndicators = updateSortIndicators;
exports.showModal = showModal;
function renderDisplayRow(row, location) {
    row.innerHTML = `
        <td>${location.ID}</td>
        <td>${location.Root}</td>
        <td>${location.Pattern}</td>
        <td>${location.DateFromExif}</td>
        <td>${location.IncludeParent}</td>
        <td>${(location.IgnoreDirs || []).join(', ')}</td>
        <td>${location.Active}</td>
        <td>${new Date(location.Created).toLocaleString()}</td>
        <td>${new Date(location.Updated).toLocaleString()}</td>
        <td>
            <button class="edit-btn" title="Edit">✏️</button>
            <button class="delete-btn" title="Delete">🗑️</button>
            <button class="duplicate-btn" title="Duplicate">📋</button>
            <button class="preview-btn" title="Preview Scan">🔬</button>
        </td>
    `;
}
function renderEditRow(row, location, isNew = false) {
    const ignoreDirs = (location.IgnoreDirs || []).join(',');
    row.innerHTML = `
        <td>${isNew ? 'NEW' : location.ID}</td>
        <td><input type="text" class="edit-root" value="${location.Root || ''}"></td>
        <td><input type="text" class="edit-pattern" value="${location.Pattern || ''}"></td>
        <td><input type="checkbox" class="edit-date_from_exif" ${location.DateFromExif ? 'checked' : ''}></td>
        <td><input type="checkbox" class="edit-include_parent" ${location.IncludeParent ? 'checked' : ''}></td>
        <td><input type="text" class="edit-ignore_dirs" value="${ignoreDirs}"></td>
        <td><input type="checkbox" class="edit-active" ${location.Active || isNew ? 'checked' : ''}></td>
        <td>${location.Created ? new Date(location.Created).toLocaleString() : '...'}</td>
        <td>${location.Updated ? new Date(location.Updated).toLocaleString() : '...'}</td>
        <td>
            ${isNew ? `
                <button class="add-btn" title="Add">✅</button>
                <button class="cancel-add-btn" title="Cancel">❌</button>
            ` : `
                <button class="save-btn" title="Save">💾</button>
                <button class="cancel-btn" title="Cancel">❌</button>
            `}
        </td>
    `;
}
function renderTable(tableBody, locations) {
    tableBody.innerHTML = '';
    if (!locations || locations.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10">No image locations found.</td></tr>';
        return;
    }
    locations.forEach(location => {
        const row = tableBody.insertRow();
        row.dataset.id = location.ID.toString();
        renderDisplayRow(row, location);
    });
}
function updateSortIndicators(currentSort) {
    document.querySelectorAll('th.sortable').forEach(th => {
        const htmlTh = th;
        htmlTh.classList.remove('sorted-asc', 'sorted-desc');
        if (htmlTh.dataset.sort === currentSort.column) {
            htmlTh.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
        }
    });
}
function showModal(title, content) {
    // Remove existing modal first
    const existingModal = document.getElementById('scan-result-modal');
    if (existingModal) {
        existingModal.remove();
    }
    const modal = document.createElement('div');
    modal.id = 'scan-result-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        align-items: center; justify-content: center; z-index: 1000;
    `;
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background-color: white; padding: 20px; border-radius: 5px;
        max-width: 80%; max-height: 80%; overflow-y: auto;
        min-width: 500px;
    `;
    const modalHeader = document.createElement('div');
    modalHeader.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 15px; border-bottom: 1px solid #ccc; padding-bottom: 10px;
    `;
    const modalTitle = document.createElement('h2');
    modalTitle.textContent = title;
    modalTitle.style.margin = '0';
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
        background: none; border: none; font-size: 1.5rem; cursor: pointer;
    `;
    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);
    const modalBody = document.createElement('div');
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    }
    else {
        modalBody.appendChild(content);
    }
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    const closeModal = () => modal.remove();
    closeButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}
//# sourceMappingURL=ui.js.map