import { getState, addTransaction } from '../state.js';
import { setDefaultDates } from '../utils/dateHelpers.js';
import { processImageToBase64 } from '../utils/imageCompressor.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';

export function render(container) {
    const { categories } = getState();
    const catOptions = categories.map(c => `<option value="${c.name}">${c.emoji} ${c.name}</option>`).join('');

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.expense} Registrar Gasto</h2>
            <form id="expenseForm" autocomplete="off">
                <div class="form-row">
                    <div class="form-group"><label>Monto (Bs) *</label><input type="number" id="expMonto" placeholder="0.00" step="0.01" min="0.01" required></div>
                    <div class="form-group"><label>Categoría *</label><select id="expCategoria" required>
                        <option value="">Seleccionar</option>
                        ${catOptions}
                    </select></div>
                    <div class="form-group"><label>Fecha *</label><input type="date" id="expFecha" required></div>
                </div>
                <div class="form-row">
                    <div class="form-group"><label>Método de pago</label><select id="expMetodo">
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
                        <option value="QR">QR</option>
                        <option value="Transferencia">Transferencia</option>
                    </select></div>
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
    `;

    setDefaultDates();

    document.getElementById('expenseForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const monto = parseFloat(document.getElementById('expMonto').value);
        const categoria = document.getElementById('expCategoria').value;
        const fecha = document.getElementById('expFecha').value;
        const metodo = document.getElementById('expMetodo').value;
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
    document.getElementById('expFecha').value = new Date().toISOString().split('T')[0];
    document.getElementById('expFotoPreview').style.display = 'none';
    notify('Gasto registrado correctamente.', 'success');
}
