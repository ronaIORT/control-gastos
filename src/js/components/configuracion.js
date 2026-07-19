import { ICONS } from '../utils/icons.js';
import { showConfirm } from '../utils/confirmDialog.js';
import { clearAllData, getState } from '../state.js';
import { navigateTo } from '../router.js';
import { notify } from '../utils/notification.js';
import { saveTransactions, saveBudgets, saveGoals, saveCategories, saveInitialized } from '../storage.js';

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

        <div class="form-card">
            <h3 style="margin-bottom:0.75rem;font-size:1rem;">${ICONS.download} Copia de seguridad</h3>
            <p style="color:var(--text-light);margin-bottom:1rem;line-height:1.6;">
                Descarga un archivo JSON con todas tus transacciones, presupuestos,
                metas y categorías. Puedes usarlo para respaldar tus datos o
                transferirlos a otro dispositivo.
            </p>
            <button class="btn btn-primary" id="btnDownloadBackup">
                ${ICONS.download} Descargar copia de seguridad
            </button>
        </div>

        <div class="form-card">
            <h3 style="margin-bottom:0.75rem;font-size:1rem;">${ICONS.upload} Restaurar copia</h3>
            <p style="color:var(--text-light);margin-bottom:1rem;line-height:1.6;">
                Importa un archivo JSON de copia de seguridad para restaurar todos tus datos.
                <strong>La aplicación debe estar vacía</strong>; si tienes datos, usa
                "Borrar todos los datos" primero.
            </p>
            <button class="btn btn-primary" id="btnImportBackup">
                ${ICONS.upload} Importar copia de seguridad
            </button>
            <input type="file" id="importFileInput" accept=".json" style="display:none">
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

    // --- Botón: Descargar copia de seguridad ---
    const btnDownload = container.querySelector('#btnDownloadBackup');
    btnDownload.addEventListener('click', async () => {
        const state = getState();
        const totalTx = state.transactions.length;
        const totalBudgets = Object.keys(state.budgets).length;
        const totalGoals = state.goals.length;

        if (totalTx === 0 && totalBudgets === 0 && totalGoals === 0) {
            notify('No hay datos para exportar.', 'info');
            return;
        }

        const confirmed = await showConfirm(
            `Se descargará un archivo JSON con todos tus datos (${totalTx} transacciones, ${totalBudgets} presupuestos, ${totalGoals} metas). ¿Deseas continuar?`,
            { confirmText: 'Descargar', confirmIcon: ICONS.download, confirmClass: 'btn-primary' }
        );
        if (!confirmed) return;

        const backup = {
            version: '3.1',
            exportado: new Date().toISOString(),
            transactions: state.transactions,
            budgets: state.budgets,
            goals: state.goals,
            categories: state.categories
        };

        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `control-gastos-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        notify('Copia de seguridad descargada con éxito.', 'success');
    });

    // --- Botón: Importar copia de seguridad ---
    const btnImport = container.querySelector('#btnImportBackup');
    const fileInput = container.querySelector('#importFileInput');

    btnImport.addEventListener('click', () => {
        fileInput.value = '';
        fileInput.click();
    });

    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch {
                notify('El archivo no contiene un JSON válido.', 'error');
                return;
            }

            if (!data.version || typeof data.version !== 'string') {
                notify('El archivo no tiene el formato de copia de seguridad esperado (falta versión).', 'error');
                return;
            }
            if (!data.transactions && !data.budgets && !data.goals && !data.categories) {
                notify('El archivo no contiene datos reconocibles.', 'error');
                return;
            }

            const parts = [];
            if (data.transactions) parts.push(`• ${data.transactions.length} transacciones`);
            if (data.budgets) parts.push(`• ${Object.keys(data.budgets).length} presupuestos`);
            if (data.goals) parts.push(`• ${data.goals.length} metas de ahorro`);
            if (data.categories) parts.push(`• ${data.categories.length} categorías`);

            const confirmed = await showConfirm(
                `Los datos actuales serán eliminados y reemplazados por los datos del archivo seleccionado.\n\nSe importarán:\n${parts.join('\n')}\n\n¿Deseas continuar?`,
                { confirmText: 'Importar', confirmIcon: ICONS.upload, confirmClass: 'btn-primary' }
            );
            if (!confirmed) return;

            clearAllData();

            if (data.transactions) saveTransactions(data.transactions);
            if (data.budgets) saveBudgets(data.budgets);
            if (data.goals) saveGoals(data.goals);
            if (data.categories) saveCategories(data.categories);
            saveInitialized(true);

            const state = getState();
            state.transactions = data.transactions || [];
            state.budgets = data.budgets || {};
            state.goals = data.goals || [];
            state.categories = data.categories || [];

            notify('Datos importados correctamente. Redirigiendo al inicio...', 'success');
            setTimeout(() => navigateTo('dashboard', document.getElementById('mainContent')), 800);
        } catch (err) {
            notify('Error al leer el archivo: ' + err.message, 'error');
        }
    });
}
