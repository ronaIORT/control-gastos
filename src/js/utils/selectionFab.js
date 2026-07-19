import { deleteTransaction } from '../state.js';
import { showConfirm } from './confirmDialog.js';
import { ICONS } from './icons.js';
import { notify } from './notification.js';

let selectedId = null;
let fabEl = null;

export const SELECTED_CLASS = 'tx-selected';

export function initFab() {
    if (fabEl) return;

    fabEl = document.createElement('button');
    fabEl.className = 'fab-delete';
    fabEl.setAttribute('aria-label', 'Eliminar transacción');
    fabEl.innerHTML = ICONS.trash;

    fabEl.addEventListener('click', async () => {
        if (!selectedId) return;
        if (await showConfirm('¿Eliminar esta transacción?')) {
            deleteTransaction(selectedId);
            notify('Transacción eliminada.', 'success');
            clearSelection();
        }
    });

    document.body.appendChild(fabEl);

    document.addEventListener('click', (e) => {
        if (!selectedId) return;
        if (e.target.closest('[data-tx-id]') || e.target.closest('.fab-delete')) return;
        clearSelection();
    });
}

export function selectTransaction(id) {
    clearSelectionUI();
    selectedId = id;
    const el = document.querySelector(`[data-tx-id="${CSS.escape(id)}"]`);
    if (el) el.classList.add(SELECTED_CLASS);
    if (fabEl) fabEl.classList.add('open');
}

export function clearSelection() {
    clearSelectionUI();
    selectedId = null;
    if (fabEl) fabEl.classList.remove('open');
}

function clearSelectionUI() {
    document.querySelectorAll(`.${SELECTED_CLASS}`).forEach(el => el.classList.remove(SELECTED_CLASS));
}

export function getSelectedId() {
    return selectedId;
}
