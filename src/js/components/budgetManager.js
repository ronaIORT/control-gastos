import { getState, setBudget, deleteBudget } from '../state.js';
import { formatBs } from '../utils/format.js';
import { getCurrentMonthRange } from '../utils/dateHelpers.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';
import { showConfirm } from '../utils/confirmDialog.js';

export function render(container) {
    const { categories, budgets, transactions } = getState();

    const catOptions = categories.filter(c => c.tipo === 'gasto').map(c => `<option value="${c.name}">${c.emoji} ${c.name}</option>`).join('');

    const getCategoryDisplay = (catName) => {
        const found = categories.find(c => c.name === catName);
        return (found ? found.emoji : '📦') + ' ' + catName;
    };

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.budgets} Definir Presupuesto Mensual</h2>
            <form id="budgetForm" autocomplete="off">
                <div class="form-row">
                    <div class="form-group"><label>Categoría *</label><select id="budCat" required>
                        <option value="">Seleccionar</option>
                        ${catOptions}
                    </select></div>
                    <div class="form-group"><label>Límite mensual (Bs) *</label><input type="number" id="budLimit" placeholder="0.00" step="0.01" min="1" required></div>
                </div>
                <button type="submit" class="btn btn-primary">${ICONS.save} Guardar Presupuesto</button>
            </form>
        </div>
        <div class="form-card">
            <h2>${ICONS.reports} Estado Actual de Presupuestos</h2>
            <div id="budgetStatusList"></div>
        </div>
    `;

    function renderBudgetStatus() {
        const { budgets, transactions, categories } = getState();
        const range = getCurrentMonthRange();
        const txMes = transactions.filter(t => t.tipo === 'gasto' && t.fecha >= range.start && t.fecha <= range.end);
        const gastosPorCat = {};
        txMes.forEach(t => { gastosPorCat[t.categoria] = (gastosPorCat[t.categoria] || 0) + Number(t.monto); });

        const container2 = document.getElementById('budgetStatusList');
        if (Object.keys(budgets).length === 0) {
            container2.innerHTML = '<p style="color:var(--text-light)">No hay presupuestos. Define uno arriba.</p>';
            return;
        }

        const getCategoryDisplay2 = (catName) => {
            const found = categories.find(c => c.name === catName);
            return (found ? found.emoji : '📦') + ' ' + catName;
        };

        let html = '';
        for (const [cat, limit] of Object.entries(budgets)) {
            const gastado = gastosPorCat[cat] || 0;
            const pct = Math.min((gastado / Number(limit)) * 100, 100);
            let cls = 'safe';
            if (pct >= 100) cls = 'danger';
            else if (pct >= 80) cls = 'warning';
            const safeCat = cat.replace(/'/g, "\\'");
            html += `
                <div class="progress-wrap">
                    <div class="progress-info"><span>${getCategoryDisplay2(cat)}</span><span>${formatBs(gastado)} / ${formatBs(limit)} (${pct.toFixed(0)}%)</span></div>
                    <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
                    <button class="btn btn-danger btn-sm budget-delete-btn" data-cat="${safeCat}" style="margin-top:4px">${ICONS.trash} Eliminar presupuesto</button>
                </div><hr style="border-color:#d4c4e8;margin:0.5rem 0">`;
        }
        container2.innerHTML = html;

        container2.querySelectorAll('.budget-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const cat = btn.dataset.cat;
                if (await showConfirm(`¿Eliminar el presupuesto para ${cat}?`)) {
                    deleteBudget(cat);
                    renderBudgetStatus();
                }
            });
        });
    }

    renderBudgetStatus();

    document.getElementById('budgetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const cat = document.getElementById('budCat').value;
        const limit = parseFloat(document.getElementById('budLimit').value);
        if (!cat || isNaN(limit) || limit <= 0) {
            notify('Seleccione categoría y un límite válido.', 'error');
            return;
        }
        setBudget(cat, limit);
        document.getElementById('budgetForm').reset();
        renderBudgetStatus();
        notify('Presupuesto guardado.', 'success');
    });
}
