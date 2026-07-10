import { getState, addTransaction } from '../state.js';
import { setDefaultDates } from '../utils/dateHelpers.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';

export function render(container) {
    const { categories } = getState();

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.income} Registrar Ingreso</h2>
            <form id="incomeForm" autocomplete="off">
                <div class="form-row">
                    <div class="form-group"><label>Fecha *</label><input type="date" id="incFecha" required></div>
                    <div class="form-group"><label>Monto (Bs) *</label><input type="number" id="incMonto" placeholder="0.00" step="0.01" min="0.01" required></div>
                    <div class="form-group"><label>Fuente *</label><select id="incFuente" required>
                        <option value="">Seleccionar</option>
                        <option value="Salario">Salario</option>
                        <option value="Negocio">Negocio</option>
                        <option value="Regalo">Regalo</option>
                        <option value="Otros">Otros</option>
                    </select></div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="flex:2"><label>Descripción</label><input type="text" id="incDesc" placeholder="Ej: Pago quincenal"></div>
                </div>
                <button type="submit" class="btn btn-primary">${ICONS.check} Registrar Ingreso</button>
            </form>
        </div>
    `;

    setDefaultDates();

    document.getElementById('incomeForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const fecha = document.getElementById('incFecha').value;
        const monto = parseFloat(document.getElementById('incMonto').value);
        const fuente = document.getElementById('incFuente').value;
        const desc = document.getElementById('incDesc').value.trim();

        if (!fecha || isNaN(monto) || monto <= 0 || !fuente) {
            notify('Complete todos los campos obligatorios.', 'error');
            return;
        }

        addTransaction({
            tipo: 'ingreso',
            monto: Math.round(monto * 100) / 100,
            fecha: fecha,
            descripcion: desc || 'Ingreso',
            fuente: fuente,
            categoria: null,
            metodo: null,
            fotoBase64: null
        });

        document.getElementById('incomeForm').reset();
        document.getElementById('incFecha').value = new Date().toISOString().split('T')[0];
        notify('Ingreso registrado correctamente.', 'success');
    });
}
