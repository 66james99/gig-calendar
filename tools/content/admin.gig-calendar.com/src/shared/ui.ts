import type { SortState } from './types.js';

export function showModal(title: string, content: string | HTMLElement) {
    const modal = document.getElementById('modal') as HTMLElement;
    const modalTitle = document.getElementById('modal-title') as HTMLElement;
    const modalBody = document.getElementById('modal-body') as HTMLElement;
    const closeModalBtn = document.getElementById('close-modal-btn') as HTMLButtonElement;

    if (!modal || !modalTitle || !modalBody || !closeModalBtn) {
        // Not all pages have a modal, so we can safely return.
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

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

export function updateSortIndicators<T extends string>(tableId: string, currentSort: SortState<T>) {
    document.querySelectorAll(`#${tableId} th[data-col]`).forEach(th => {
        const htmlTh = th as HTMLElement;
        // Clear existing indicators
        const currentText = htmlTh.textContent?.replace(/ ↑| ↓/, '') || '';
        htmlTh.textContent = currentText;

        if (htmlTh.dataset.col === currentSort.column) {
            htmlTh.textContent += currentSort.direction === 'asc' ? ' ↑' : ' ↓';
        }
    });
}