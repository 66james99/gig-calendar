export function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (!modal || !modalTitle || !modalBody || !closeModalBtn) {
        // Not all pages have a modal, so we can safely return.
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
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}
export function updateSortIndicators(tableId, currentSort) {
    document.querySelectorAll(`#${tableId} th[data-col]`).forEach(th => {
        const htmlTh = th;
        // Clear existing indicators
        const currentText = htmlTh.textContent?.replace(/ ↑| ↓/, '') || '';
        htmlTh.textContent = currentText;
        if (htmlTh.dataset.col === currentSort.column) {
            htmlTh.textContent += currentSort.direction === 'asc' ? ' ↑' : ' ↓';
        }
    });
}
export function getActionButtonsHtml() {
    return `
        <button class="btn-icon edit-btn" title="Edit">✏️</button>
        <button class="btn-icon delete-btn" title="Delete">🗑️</button>
        <button class="btn-icon duplicate-btn" title="Duplicate">📋</button>
    `;
}
export function getEditButtonsHtml(isNew) {
    return isNew
        ? `<button class="btn-icon add-btn" title="Add">✅</button>
           <button class="btn-icon cancel-add-btn" title="Cancel">❌</button>`
        : `<button class="btn-icon save-btn" title="Save">💾</button>
                   <button class="btn-icon cancel-btn" title="Cancel">❌</button>`;
}
export function getNoDataRowHtml(colSpan, message) {
    return `<tr><td colspan="${colSpan}" style="text-align: center;">${message}</td></tr>`;
}
export function formatDateTime(dateStr) {
    return dateStr ? new Date(dateStr).toLocaleString() : 'N/A';
}
