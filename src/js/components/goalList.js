import { getState, addGoal, deleteGoal, addFundsToGoal, calcularSugerencia, getAvailableBalanceForGoal } from '../state.js';
import { formatBs, formatDate } from '../utils/format.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';
import { showConfirm } from '../utils/confirmDialog.js';

export function render(container) {
    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.goals} Nueva Meta de Ahorro</h2>
            <form id="goalForm" autocomplete="off">
                <div class="form-row">
                    <div class="form-group"><label>Nombre *</label><input type="text" id="goalName" placeholder="Ej: Comprar laptop" required></div>
                    <div class="form-group"><label>Monto objetivo (Bs) *</label><input type="number" id="goalTarget" placeholder="0.00" step="0.01" min="1" required></div>
                    <div class="form-group"><label>Fecha límite (opcional)</label><input type="date" id="goalDeadline"></div>
                </div>
                <button type="submit" class="btn btn-primary">${ICONS.budgets} Crear Meta</button>
            </form>
        </div>
        <div id="goalsList"></div>
    `;

    function renderGoalsList() {
        const { goals } = getState();
        const container2 = document.getElementById('goalsList');
        if (goals.length === 0) {
            container2.innerHTML = '<div class="form-card"><p style="color:var(--text-light)">No hay metas de ahorro. ¡Crea una!</p></div>';
            return;
        }

        let html = '';
        goals.forEach(goal => {
            const pct = Math.min((goal.ahorrado / goal.objetivo) * 100, 100);
            const cls = pct >= 100 ? 'safe' : 'warning';
            const sugerencia = goal.fechaLimite ? calcularSugerencia(goal) : null;

            html += `
                <div class="form-card">
                    <h3>${ICONS.goals} ${goal.nombre}</h3>
                    <div class="progress-wrap">
                        <div class="progress-info"><span>Progreso</span><span>${formatBs(goal.ahorrado)} / ${formatBs(goal.objetivo)} (${pct.toFixed(0)}%)</span></div>
                        <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
                    </div>
                    ${goal.fechaLimite ? `<p style="font-size:0.85rem;color:var(--text-light)">${ICONS.calendar} Fecha límite: ${formatDate(goal.fechaLimite)}</p>` : ''}
                    ${sugerencia ? `<p style="font-size:0.85rem;color:var(--accent)">${ICONS.lightbulb} Sugerencia: ahorra ${formatBs(sugerencia)}/mes para llegar a tiempo.</p>` : ''}
                    <div class="flex-wrap gap-1" style="margin-top:0.5rem">
                        <input type="number" class="goal-add-input" data-goal-id="${goal.id}" placeholder="Monto a añadir (Bs)" step="0.01" min="0.01" style="padding:0.4rem;border-radius:6px;border:1px solid var(--border)">
                        <button class="btn btn-primary btn-sm goal-add-btn" data-goal-id="${goal.id}">${ICONS.income} Añadir Fondos</button>
                        <button class="btn btn-danger btn-sm goal-delete-btn" data-goal-id="${goal.id}">${ICONS.trash} Eliminar</button>
                    </div>
                </div>`;
        });
        container2.innerHTML = html;

        container2.querySelectorAll('.goal-add-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.dataset.goalId;
                const input = container2.querySelector(`.goal-add-input[data-goal-id="${goalId}"]`);
                const amount = parseFloat(input.value);
                if (isNaN(amount) || amount <= 0) {
                    notify('Ingrese un monto válido.', 'error');
                    return;
                }
                const available = getAvailableBalanceForGoal(goalId);
                if (amount > available) {
                    notify(`No tienes suficiente saldo disponible. Saldo disponible: ${formatBs(available)}`, 'warning');
                    return;
                }
                if (addFundsToGoal(goalId, amount)) {
                    input.value = '';
                    renderGoalsList();
                    notify('Fondos añadidos a la meta.', 'success');
                } else {
                    notify('Error al añadir fondos.', 'error');
                }
            });
        });

        container2.querySelectorAll('.goal-delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await showConfirm('¿Eliminar esta meta?')) {
                    deleteGoal(btn.dataset.goalId);
                    renderGoalsList();
                }
            });
        });
    }

    renderGoalsList();

    document.getElementById('goalForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const nombre = document.getElementById('goalName').value.trim();
        const objetivo = parseFloat(document.getElementById('goalTarget').value);
        const fechaLimite = document.getElementById('goalDeadline').value || null;

        if (!nombre || isNaN(objetivo) || objetivo <= 0) {
            notify('Complete nombre y monto objetivo.', 'error');
            return;
        }

        addGoal({
            nombre: nombre,
            objetivo: Math.round(objetivo * 100) / 100,
            ahorrado: 0,
            fechaLimite: fechaLimite
        });

        document.getElementById('goalForm').reset();
        renderGoalsList();
        notify('Meta creada.', 'success');
    });
}
