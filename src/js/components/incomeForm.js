import { getState, addTransaction } from '../state.js';
import { setDefaultDates, getTodayLocal } from '../utils/dateHelpers.js';
import { processImageToBase64 } from '../utils/imageCompressor.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';
import { formatBs, formatDate } from '../utils/format.js';

export function render(container) {
    const { categories, transactions } = getState();
    const ingresoCats = categories.filter(c => c.tipo === 'ingreso');
    const ingresos = transactions.filter(t => t.tipo === 'ingreso');
    const totalIngresos = ingresos.reduce((sum, t) => sum + t.monto, 0);
    const ultimosIngresos = ingresos.slice(0, 10);
    let fuenteSeleccionada = ingresoCats.length > 0 ? ingresoCats[0].name : '';

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.income} Registrar Ingreso</h2>
            <form id="incomeForm" autocomplete="off">
                <div class="form-row">
                    <div class="form-group"><label>Monto (Bs) *</label><input type="number" id="incMonto" placeholder="0.00" step="0.01" min="0.01" required></div>
                    <div class="form-group"><label id="incFuenteLabel">FUENTE: ${fuenteSeleccionada}</label>
                        <div id="incFuenteTags" class="emoji-tags">
                            ${ingresoCats.map(c => `<button type="button" class="emoji-tag${c.name === fuenteSeleccionada ? ' active' : ''}" data-fuente="${c.name}">${c.name}</button>`).join('')}
                        </div>
                    </div>
                    <div class="form-group"><label>Fecha *</label><input type="date" id="incFecha" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex:2"><label>Descripción</label><input type="text" id="incDesc" placeholder="Ej: Pago quincenal"></div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Foto del recibo (opcional)</label>
                        <input type="file" id="incFoto" accept="image/*" style="padding:0.4rem">
                        <small style="color:var(--text-light)">Tamaño máx. recomendado: ~200KB. Se redimensionará automáticamente.</small>
                    </div>
                    <div class="form-group" style="align-items:flex-start">
                        <img id="incFotoPreview" style="max-width:100px;max-height:80px;border-radius:6px;display:none;border:1px solid var(--border)">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">${ICONS.check} Registrar Ingreso</button>
            </form>
        </div>
        <div class="form-card">
            <h2>${ICONS.history} Últimos Ingresos</h2>
            <div id="incomeHistoryList" class="history-list">
                ${renderHistoryItems(ultimosIngresos, categories)}
            </div>
            <div class="history-total">Total general: ${formatBs(totalIngresos)}</div>
        </div>
    `;

    setDefaultDates();

    document.querySelectorAll('#incFuenteTags .emoji-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#incFuenteTags .emoji-tag').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fuenteSeleccionada = btn.dataset.fuente;
            document.getElementById('incFuenteLabel').textContent = 'FUENTE: ' + fuenteSeleccionada;
        });
    });

    document.getElementById('incomeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = parseFloat(document.getElementById('incMonto').value);
        const fuente = fuenteSeleccionada;
        const fecha = document.getElementById('incFecha').value;
        const desc = document.getElementById('incDesc').value.trim();
        const fotoInput = document.getElementById('incFoto');

        if (isNaN(monto) || monto <= 0 || !fuente || !fecha) {
            notify('Complete todos los campos obligatorios.', 'error');
            return;
        }

        const tx = {
            tipo: 'ingreso',
            monto: Math.round(monto * 100) / 100,
            fecha: fecha,
            descripcion: desc || 'Ingreso por ' + fuente,
            fuente: fuente,
            categoria: null,
            metodo: null,
            fotoBase64: null
        };

        if (fotoInput.files && fotoInput.files[0]) {
            processImageToBase64(fotoInput.files[0], 200).then(base64 => {
                tx.fotoBase64 = base64;
                finalizeIncome(tx);
            }).catch(() => {
                finalizeIncome(tx);
            });
        } else {
            finalizeIncome(tx);
        }
    });

    document.getElementById('incFoto').addEventListener('change', function () {
        const file = this.files[0];
        const preview = document.getElementById('incFotoPreview');
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

function finalizeIncome(tx) {
    addTransaction(tx);
    document.getElementById('incomeForm').reset();
    document.getElementById('incFecha').value = getTodayLocal();
    document.getElementById('incFotoPreview').style.display = 'none';
    refreshHistory();
    notify('Ingreso registrado correctamente.', 'success');
}

function renderHistoryItems(ingresos, categories) {
    if (!ingresos.length) return '<div class="history-empty">No hay ingresos registrados.</div>';
    return ingresos.map(t => {
        const cat = categories.find(c => c.name === t.fuente);
        const emoji = cat ? cat.emoji : '📦';
        return `
            <div class="history-item">
                <span class="history-date">${formatDate(t.fecha)}</span>
                <span class="history-cat">${emoji} ${t.fuente || '-'}</span>
                <span class="history-desc">${t.descripcion || '-'}</span>
                <span class="history-amount">${formatBs(t.monto)}</span>
            </div>
        `;
    }).join('');
}

function refreshHistory() {
    const { transactions, categories } = getState();
    const ingresos = transactions.filter(t => t.tipo === 'ingreso');
    const total = ingresos.reduce((sum, t) => sum + t.monto, 0);
    const list = document.getElementById('incomeHistoryList');
    if (list) list.innerHTML = renderHistoryItems(ingresos.slice(0, 10), categories);
    const totalEl = document.querySelector('.history-total');
    if (totalEl) totalEl.textContent = 'Total general: ' + formatBs(total);
}
