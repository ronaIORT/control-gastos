import { getState, addTransaction } from '../state.js';
import { setDefaultDates, getTodayLocal } from '../utils/dateHelpers.js';
import { processImageToBase64 } from '../utils/imageCompressor.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';
import { formatBs, formatDate } from '../utils/format.js';

export function render(container) {
    const { categories, transactions } = getState();
    const gastoCats = categories.filter(c => c.tipo === 'gasto');
    const gastos = transactions.filter(t => t.tipo === 'gasto');
    const totalGastos = gastos.reduce((sum, t) => sum + t.monto, 0);
    const ultimosGastos = gastos.slice(0, 10);
    let categoriaSeleccionada = gastoCats.length > 0 ? gastoCats[0].name : '';
    let metodoSeleccionado = 'Efectivo';

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.expense} Registrar Gasto</h2>
            <form id="expenseForm" autocomplete="off">
                <div class="form-row">
                    <div class="form-group"><label>Monto (Bs) *</label><input type="number" id="expMonto" placeholder="0.00" step="0.01" min="0.01" required></div>
                    <div class="form-group"><label id="expCategoriaLabel">CATEGORÍA: ${categoriaSeleccionada}</label>
                        <div id="expCategoriaTags" class="emoji-tags">
                            ${gastoCats.map(c => `<button type="button" class="emoji-tag${c.name === categoriaSeleccionada ? ' active' : ''}" data-categoria="${c.name}">${c.emoji}</button>`).join('')}
                        </div>
                    </div>
                    <div class="form-group"><label>Fecha *</label><input type="date" id="expFecha" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label id="expMetodoLabel">MÉTODO: ${metodoSeleccionado}</label>
                        <div id="expMetodoTags" class="emoji-tags">
                            <button type="button" class="emoji-tag${metodoSeleccionado === 'Efectivo' ? ' active' : ''}" data-metodo="Efectivo">Efectivo</button>
                            <button type="button" class="emoji-tag${metodoSeleccionado === 'Tarjeta' ? ' active' : ''}" data-metodo="Tarjeta">Tarjeta</button>
                            <button type="button" class="emoji-tag${metodoSeleccionado === 'QR' ? ' active' : ''}" data-metodo="QR">QR</button>
                        </div>
                    </div>
                    <div class="form-group" style="flex:2"><label>Descripción</label><input type="text" id="expDesc" placeholder="Ej: Compra supermercado"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Foto del recibo (opcional)</label>
                        <input type="file" id="expFoto" accept="image/*" style="padding:0.4rem">
                        <small style="color:var(--text-light)">Tamaño máx. recomendado: ~200KB. Se redimensionará automáticamente.</small>
                    </div>
                    <div class="form-group" style="align-items:flex-start">
                        <img id="expFotoPreview" style="max-width:100px;max-height:80px;border-radius:6px;display:none;border:1px solid var(--border)">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">${ICONS.check} Registrar Gasto</button>
            </form>
        </div>
        <div class="form-card">
            <h2>${ICONS.history} Últimos Gastos</h2>
            <div id="expenseHistoryList" class="history-list">
                ${renderHistoryItems(ultimosGastos, categories)}
            </div>
            <div class="history-total">Total general: ${formatBs(totalGastos)}</div>
        </div>
    `;

    setDefaultDates();

    document.querySelectorAll('#expCategoriaTags .emoji-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#expCategoriaTags .emoji-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            categoriaSeleccionada = btn.dataset.categoria;
            document.getElementById('expCategoriaLabel').textContent = 'CATEGORÍA: ' + categoriaSeleccionada;
        });
    });

    document.querySelectorAll('#expMetodoTags .emoji-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#expMetodoTags .emoji-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            metodoSeleccionado = btn.dataset.metodo;
            document.getElementById('expMetodoLabel').textContent = 'MÉTODO: ' + metodoSeleccionado;
        });
    });

    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = parseFloat(document.getElementById('expMonto').value);
        const categoria = categoriaSeleccionada;
        const fecha = document.getElementById('expFecha').value;
        const metodo = metodoSeleccionado;
        const desc = document.getElementById('expDesc').value.trim();
        const fotoInput = document.getElementById('expFoto');

        if (isNaN(monto) || monto <= 0 || !categoria || !fecha) {
            notify('Complete todos los campos obligatorios.', 'error');
            return;
        }

        const tx = {
            tipo: 'gasto',
            monto: Math.round(monto * 100) / 100,
            fecha: fecha,
            descripcion: desc || 'Gasto en ' + categoria,
            categoria: categoria,
            metodo: metodo,
            fuente: null,
            fotoBase64: null
        };

        if (fotoInput.files && fotoInput.files[0]) {
            processImageToBase64(fotoInput.files[0], 200).then(base64 => {
                tx.fotoBase64 = base64;
                finalizeExpense(tx);
            }).catch(() => {
                finalizeExpense(tx);
            });
        } else {
            finalizeExpense(tx);
        }
    });

    document.getElementById('expFoto').addEventListener('change', function () {
        const file = this.files[0];
        const preview = document.getElementById('expFotoPreview');
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            preview.style.display = 'none';
        }
    });
}

function finalizeExpense(tx) {
    addTransaction(tx);
    document.getElementById('expenseForm').reset();
    document.getElementById('expFecha').value = getTodayLocal();
    document.getElementById('expFotoPreview').style.display = 'none';
    refreshHistory();
    notify('Gasto registrado correctamente.', 'success');
}

function renderHistoryItems(gastos, categories) {
    if (!gastos.length) return '<div class="history-empty">No hay gastos registrados.</div>';
    return gastos.map(t => {
        const cat = categories.find(c => c.name === t.categoria);
        const emoji = cat ? cat.emoji : '📦';
        return `
            <div class="history-item">
                <span class="history-date">${formatDate(t.fecha)}</span>
                <span class="history-cat">${emoji} ${t.categoria || '-'}</span>
                <span class="history-desc">${t.descripcion || '-'}</span>
                <span class="history-amount">${formatBs(t.monto)}</span>
                <span class="history-method">${t.metodo || '-'}</span>
            </div>
        `;
    }).join('');
}

function refreshHistory() {
    const { transactions, categories } = getState();
    const gastos = transactions.filter(t => t.tipo === 'gasto');
    const total = gastos.reduce((sum, t) => sum + t.monto, 0);
    const list = document.getElementById('expenseHistoryList');
    if (list) list.innerHTML = renderHistoryItems(gastos.slice(0, 10), categories);
    const totalEl = document.querySelector('.history-total');
    if (totalEl) totalEl.textContent = 'Total general: ' + formatBs(total);
}
