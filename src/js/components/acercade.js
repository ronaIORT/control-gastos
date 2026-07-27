import { ICONS } from '../utils/icons.js';

export function render(container) {
    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.info} Acerca de la App</h2>
            <p><strong>Control de Gastos</strong></p>
            <p style="color:var(--text-light)">Versión 3.7.2</p>
            <p style="color:var(--text-light)">Aplicación personal para el control y seguimiento de finanzas.</p>
        </div>
    `;
}
