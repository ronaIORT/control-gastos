import { getState, addCategory, updateCategory, deleteCategory } from '../state.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';
import { showConfirm } from '../utils/confirmDialog.js';

export function render(container) {
    const { categories } = getState();

    const gastoCategories = categories.filter(c => c.tipo === 'gasto');
    const ingresoCategories = categories.filter(c => c.tipo === 'ingreso');

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.categories} Categorías</h2>
            <form id="catForm" autocomplete="off" class="cat-form">
                <div class="form-row">
                    <div class="form-group cat-emoji-group">
                        <label>Emoji</label>
                        <input type="text" id="catEmoji" value="😀" maxlength="2" style="text-align:center;font-size:1.3rem">
                    </div>
                    <div class="form-group">
                        <label>Nombre</label>
                        <input type="text" id="catName" placeholder="Ej: Comida rápida" required>
                    </div>
                    <div class="form-group cat-tipo-group">
                        <label>Tipo</label>
                        <select id="catTipo" required>
                            <option value="gasto">Gasto</option>
                            <option value="ingreso">Ingreso</option>
                        </select>
                    </div>
                    <div class="form-group cat-btn-group">
                        <button type="submit" class="btn btn-primary">${ICONS.save} Agregar</button>
                    </div>
                </div>
            </form>
        </div>
        <div id="catListContainer"></div>
    `;

    function renderList() {
        const { categories } = getState();
        const gastoCats = categories.filter(c => c.tipo === 'gasto');
        const ingresoCats = categories.filter(c => c.tipo === 'ingreso');

        const listContainer = document.getElementById('catListContainer');
        if (!listContainer) return;

        listContainer.innerHTML = `
            <div class="form-card">
                <h3 style="margin-bottom:0.75rem;font-size:1rem;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">${ICONS.expense} Gastos</h3>
                ${gastoCats.length === 0 ? '<p style="color:var(--text-light)">No hay categorías de gasto.</p>' : ''}
                ${gastoCats.map(c => renderCatItem(c)).join('')}
            </div>
            <div class="form-card">
                <h3 style="margin-bottom:0.75rem;font-size:1rem;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px">${ICONS.income} Ingresos</h3>
                ${ingresoCats.length === 0 ? '<p style="color:var(--text-light)">No hay categorías de ingreso.</p>' : ''}
                ${ingresoCats.map(c => renderCatItem(c)).join('')}
            </div>
        `;

        listContainer.querySelectorAll('.cat-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const name = btn.dataset.name;
                const cat = categories.find(c => c.name === name);
                if (cat) showEditModal(cat);
            });
        });

        listContainer.querySelectorAll('.cat-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const name = btn.dataset.name;
                if (await showConfirm(`¿Eliminar la categoría "${name}"?`)) {
                    if (deleteCategory(name)) {
                        notify('Categoría eliminada.', 'success');
                        renderList();
                    } else {
                        notify('No se puede eliminar esta categoría.', 'error');
                    }
                }
            });
        });
    }

    function renderCatItem(c) {
        const hasLock = !c.editable && !c.deletable;
        const canEdit = c.editable;
        const canDelete = c.deletable;

        return `
            <div class="cat-item">
                <span class="cat-item-emoji">${c.emoji}</span>
                <span class="cat-item-name">${c.name}</span>
                <div class="cat-item-actions">
                    ${hasLock ? `<span class="cat-lock" title="Categoría protegida">${ICONS.lock}</span>` : ''}
                    ${canEdit ? `<button class="btn btn-sm btn-outline cat-edit-btn" data-name="${c.name}" title="Editar">${ICONS.edit}</button>` : ''}
                    ${canDelete ? `<button class="btn btn-sm btn-danger cat-delete-btn" data-name="${c.name}" title="Eliminar">${ICONS.trash}</button>` : ''}
                    ${!canEdit && !hasLock ? `<span class="cat-lock" title="Categoría protegida">${ICONS.lock}</span>` : ''}
                </div>
            </div>
        `;
    }

    function showEditModal(cat) {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <div class="confirm-header">
                    <span class="confirm-icon">${ICONS.edit}</span>
                    <span class="confirm-title">Editar Categoría</span>
                    <button class="confirm-close" type="button" aria-label="Cerrar">${ICONS.plus.replace('stroke-linecap="round" stroke-linejoin="round"', 'stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"')}</button>
                </div>
                <div class="confirm-body">
                    <form id="editCatForm" autocomplete="off">
                        <div class="form-row">
                            <div class="form-group" style="max-width:80px">
                                <label>Emoji</label>
                                <input type="text" id="editCatEmoji" value="${cat.emoji}" maxlength="2" style="text-align:center;font-size:1.3rem" required>
                            </div>
                            <div class="form-group">
                                <label>Nombre</label>
                                <input type="text" id="editCatName" value="${cat.name}" required>
                            </div>
                        </div>
                        <input type="hidden" id="editCatOldName" value="${cat.name}">
                    </form>
                </div>
                <div class="confirm-footer">
                    <button class="btn btn-outline confirm-cancel" type="button">Cancelar</button>
                    <button class="btn btn-primary confirm-ok" type="button">${ICONS.save} Guardar</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('open'));

        function close() {
            overlay.classList.remove('open');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
        }

        overlay.querySelector('.confirm-cancel').addEventListener('click', close);
        overlay.querySelector('.confirm-close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handler);
                close();
            }
        });

        overlay.querySelector('.confirm-ok').addEventListener('click', () => {
            const newName = document.getElementById('editCatName').value.trim();
            const newEmoji = document.getElementById('editCatEmoji').value.trim();
            const oldName = document.getElementById('editCatOldName').value;

            if (!newName || !newEmoji) {
                notify('El nombre y emoji son obligatorios.', 'error');
                return;
            }

            if (updateCategory(oldName, { name: newName, emoji: newEmoji })) {
                notify('Categoría actualizada.', 'success');
                close();
                renderList();
            } else {
                notify('No se puede editar esta categoría.', 'error');
            }
        });

        document.getElementById('editCatForm').addEventListener('submit', (e) => {
            e.preventDefault();
            overlay.querySelector('.confirm-ok').click();
        });

        setTimeout(() => document.getElementById('editCatName').focus(), 100);
    }

    renderList();

    document.getElementById('catForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const emoji = document.getElementById('catEmoji').value.trim() || '📦';
        const name = document.getElementById('catName').value.trim();
        const tipo = document.getElementById('catTipo').value;

        if (!name) {
            notify('El nombre es obligatorio.', 'error');
            return;
        }

        const { categories } = getState();
        if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            notify('Ya existe una categoría con ese nombre.', 'error');
            return;
        }

        addCategory({ name, emoji, tipo });
        document.getElementById('catForm').reset();
        document.getElementById('catEmoji').value = '😀';
        renderList();
        notify('Categoría agregada.', 'success');
    });
}