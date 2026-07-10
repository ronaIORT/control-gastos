import { ICONS } from '../utils/icons.js';

export function render(container) {
    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.settings} Configuración</h2>
            <p style="color:var(--text-light)">Aquí podrás personalizar la aplicación próximamente.</p>
        </div>
    `;
}
