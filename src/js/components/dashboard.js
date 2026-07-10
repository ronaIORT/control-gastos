import { getState } from '../state.js';
import { formatBs } from '../utils/format.js';
import { getCurrentMonthRange } from '../utils/dateHelpers.js';
import { renderDoughnutChart } from './charts.js';
import { ICONS } from '../utils/icons.js';

export function render(container) {
    const { transactions, budgets, categories } = getState();
    const range = getCurrentMonthRange();
    const allTx = transactions;

    const totalIngresosAll = allTx.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0);
    const totalGastosAll = allTx.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0);
    const saldoActual = totalIngresosAll - totalGastosAll;

    const txMes = allTx.filter(t => t.fecha >= range.start && t.fecha <= range.end);
    const ingresosMes = txMes.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0);
    const gastosMes = txMes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0);
    const disponibleMes = ingresosMes - gastosMes;

    const getCategoryDisplay = (catName) => {
        const found = categories.find(c => c.name === catName);
        return (found ? found.emoji : '📦') + ' ' + catName;
    };

    container.innerHTML = `
        <div class="cards-grid" id="dashboardCards">
            <div class="card accent"><div class="card-label">Saldo Actual</div><div class="card-value">${formatBs(saldoActual)}</div></div>
            <div class="card green"><div class="card-label">Disponible del Mes</div><div class="card-value">${formatBs(disponibleMes)}</div></div>
            <div class="card"><div class="card-label">Ingresos del Mes</div><div class="card-value text-green">${formatBs(ingresosMes)}</div></div>
            <div class="card"><div class="card-label">Gastos del Mes</div><div class="card-value text-red">${formatBs(gastosMes)}</div></div>
        </div>
        <div id="dashboardAlerts"></div>
        <div class="charts-grid">
            <div class="chart-card">
                <h3>${ICONS.pieChart} Gastos por Categoría (mes actual)</h3>
                <canvas id="doughnutChart"></canvas>
            </div>
            <div class="chart-card" id="budgetOverviewCard">
                <h3>${ICONS.reports} Estado de Presupuestos</h3>
                <div id="budgetOverviewList"></div>
            </div>
        </div>
    `;

    const alertsDiv = document.getElementById('dashboardAlerts');
    const gastosPorCat = {};
    txMes.filter(t => t.tipo === 'gasto').forEach(t => {
        gastosPorCat[t.categoria] = (gastosPorCat[t.categoria] || 0) + Number(t.monto);
    });

    for (const [cat, limit] of Object.entries(budgets)) {
        const gastado = gastosPorCat[cat] || 0;
        const pct = (gastado / Number(limit)) * 100;
        if (pct >= 100) {
            alertsDiv.innerHTML += `<div class="alert-banner alert-danger">${ICONS.alertTriangle} ¡Presupuesto agotado! ${getCategoryDisplay(cat)}: ${formatBs(gastado)} de ${formatBs(limit)} (${pct.toFixed(0)}%)</div>`;
        } else if (pct >= 80) {
            alertsDiv.innerHTML += `<div class="alert-banner alert-warning">${ICONS.alertTriangle} Alerta: ${getCategoryDisplay(cat)} al ${pct.toFixed(0)}% (${formatBs(gastado)} de ${formatBs(limit)})</div>`;
        }
    }

    renderDoughnutChart('doughnutChart', gastosPorCat);

    const overviewContainer = document.getElementById('budgetOverviewList');
    if (Object.keys(budgets).length === 0) {
        overviewContainer.innerHTML = '<p style="color:var(--text-light)">No hay presupuestos definidos. Ve a la sección de Presupuestos para crear uno.</p>';
    } else {
        let html = '';
        for (const [cat, limit] of Object.entries(budgets)) {
            const gastado = gastosPorCat[cat] || 0;
            const pct = Math.min((gastado / Number(limit)) * 100, 100);
            let cls = 'safe';
            if (pct >= 100) cls = 'danger';
            else if (pct >= 80) cls = 'warning';
            html += `
                <div class="progress-wrap">
                    <div class="progress-info"><span>${getCategoryDisplay(cat)}</span><span>${formatBs(gastado)} / ${formatBs(limit)}</span></div>
                    <div class="progress-bar"><div class="progress-fill ${cls}" style="width:${pct}%"></div></div>
                </div>`;
        }
        overviewContainer.innerHTML = html;
    }
}
