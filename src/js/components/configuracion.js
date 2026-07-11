import { ICONS } from '../utils/icons.js';
import { showConfirm } from '../utils/confirmDialog.js';
import { clearAllData } from '../state.js';
import { navigateTo } from '../router.js';

export function render(container) {
    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.settings} Configuración</h2>
        </div>

        <div class="form-card">
            <h3 style="margin-bottom:0.75rem;font-size:1rem;">${ICONS.trash} Datos</h3>
            <p style="color:var(--text-light);margin-bottom:1rem;line-height:1.6;">
                Borra todas las transacciones, presupuestos y metas guardadas.
                Las categorías volverán a sus valores por defecto.
                Esta acción no se puede deshacer.
            </p>
            <button class="btn btn-danger" id="btnClearData">
                ${ICONS.trash} Borrar todos los datos
            </button>
        </div>
    `;

    const btnClear = container.querySelector('#btnClearData');
    btnClear.addEventListener('click', async () => {
        const confirmed = await showConfirm(
            '¿Estás seguro? Se eliminarán todas las transacciones, presupuestos y metas. Las categorías se restablecerán a los valores por defecto. Esta acción no se puede deshacer.'
        );
        if (confirmed) {
            clearAllData();
            navigateTo('dashboard', document.getElementById('mainContent'));
        }
    });
}
