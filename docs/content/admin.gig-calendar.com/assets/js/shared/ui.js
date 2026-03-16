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
