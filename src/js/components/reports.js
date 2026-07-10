import { getState } from '../state.js';
import { getMonthRange } from '../utils/dateHelpers.js';
import { renderChart } from './charts.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';

export function render(container) {
    const now = new Date();
    const cy = now.getFullYear();
    let yearOptions = '';
    for (let y = cy - 3; y <= cy + 1; y++) {
        yearOptions += `<option value="${y}" ${y === cy ? 'selected' : ''}>${y}</option>`;
    }

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.reports} Reportes</h2>
            <div class="filters-row">
                <select id="repMonth">
                    <option value="1">Enero</option><option value="2">Febrero</option><option value="3">Marzo</option>
                    <option value="4">Abril</option><option value="5">Mayo</option><option value="6">Junio</option>
                    <option value="7">Julio</option><option value="8">Agosto</option><option value="9">Septiembre</option>
                    <option value="10">Octubre</option><option value="11">Noviembre</option><option value="12">Diciembre</option>
                </select>
                <select id="repYear">${yearOptions}</select>
                <button class="btn btn-outline btn-sm" id="updateReportsBtn">Actualizar</button>
                <button class="btn btn-success btn-sm" id="exportReportCsvBtn">${ICONS.download} Exportar CSV</button>
            </div>
        </div>
        <div class="charts-grid">
            <div class="chart-card"><h3>${ICONS.calendar} Gastos por Día (mes)</h3><canvas id="chartBarrasDia"></canvas></div>
            <div class="chart-card"><h3>${ICONS.calendar} Gastos por Semana (mes)</h3><canvas id="chartLineaSemana"></canvas></div>
            <div class="chart-card"><h3>${ICONS.reports} Gastos por Mes (año)</h3><canvas id="chartBarrasMes"></canvas></div>
            <div class="chart-card"><h3>${ICONS.expense} Ingresos vs Gastos (mensual)</h3><canvas id="chartIngresoGasto"></canvas></div>
            <div class="chart-card chart-full"><h3>${ICONS.tag} Top 5 Categorías (mes)</h3><canvas id="chartTopCat"></canvas></div>
        </div>
    `;

    document.getElementById('repMonth').value = now.getMonth() + 1;

    function updateReports() {
        const { transactions, categories } = getState();
        const month = parseInt(document.getElementById('repMonth').value);
        const year = parseInt(document.getElementById('repYear').value);
        const range = getMonthRange(year, month);
        const txMes = transactions.filter(t => t.fecha >= range.start && t.fecha <= range.end && t.tipo === 'gasto');
        const txAnio = transactions.filter(t => {
            const y = parseInt(t.fecha.split('-')[0]);
            return y === year && t.tipo === 'gasto';
        });

        const getCategoryDisplay = (catName) => {
            const found = categories.find(c => c.name === catName);
            return (found ? found.emoji : '📦') + ' ' + catName;
        };

        const daysInMonth = new Date(year, month, 0).getDate();
        const gastosPorDia = new Array(daysInMonth).fill(0);
        txMes.forEach(t => {
            const d = parseInt(t.fecha.split('-')[2]) - 1;
            gastosPorDia[d] += Number(t.monto);
        });
        renderChart('chartBarrasDia', 'bar', {
            labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
            datasets: [{ label: 'Gastos (Bs)', data: gastosPorDia.map(v => Math.round(v * 100) / 100), backgroundColor: '#7c3aed', borderRadius: 4 }]
        }, { scales: { y: { beginAtZero: true } } });

        const semanas = [0, 0, 0, 0, 0];
        txMes.forEach(t => {
            const d = parseInt(t.fecha.split('-')[2]);
            const semanaIdx = Math.min(Math.floor((d - 1) / 7), 4);
            semanas[semanaIdx] += Number(t.monto);
        });
        renderChart('chartLineaSemana', 'line', {
            labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
            datasets: [{ label: 'Gastos (Bs)', data: semanas.map(v => Math.round(v * 100) / 100), borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)', fill: true, tension: 0.3, pointRadius: 5 }]
        }, { scales: { y: { beginAtZero: true } } });

        const gastosPorMes = new Array(12).fill(0);
        txAnio.forEach(t => {
            const m = parseInt(t.fecha.split('-')[1]) - 1;
            gastosPorMes[m] += Number(t.monto);
        });
        renderChart('chartBarrasMes', 'bar', {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [{ label: 'Gastos (Bs)', data: gastosPorMes.map(v => Math.round(v * 100) / 100), backgroundColor: '#ef4444', borderRadius: 4 }]
        }, { scales: { y: { beginAtZero: true } } });

        const ingresosPorMes = new Array(12).fill(0);
        const gastosPorMesAll = new Array(12).fill(0);
        transactions.forEach(t => {
            const yT = parseInt(t.fecha.split('-')[0]);
            if (yT === year) {
                const m = parseInt(t.fecha.split('-')[1]) - 1;
                if (t.tipo === 'ingreso') ingresosPorMes[m] += Number(t.monto);
                else gastosPorMesAll[m] += Number(t.monto);
            }
        });
        renderChart('chartIngresoGasto', 'line', {
            labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
            datasets: [
                { label: 'Ingresos', data: ingresosPorMes.map(v => Math.round(v * 100) / 100), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: false, tension: 0.3, pointRadius: 4 },
                { label: 'Gastos', data: gastosPorMesAll.map(v => Math.round(v * 100) / 100), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)', fill: false, tension: 0.3, pointRadius: 4 }
            ]
        }, { scales: { y: { beginAtZero: true } } });

        const catGastos = {};
        txMes.forEach(t => { catGastos[t.categoria] = (catGastos[t.categoria] || 0) + Number(t.monto); });
        const sorted = Object.entries(catGastos).sort((a, b) => b[1] - a[1]).slice(0, 5);
        renderChart('chartTopCat', 'bar', {
            labels: sorted.map(([c]) => getCategoryDisplay(c)),
            datasets: [{ label: 'Gastos (Bs)', data: sorted.map(([, v]) => Math.round(v * 100) / 100), backgroundColor: ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#a78bfa'], borderRadius: 4 }]
        }, { indexAxis: 'y', scales: { x: { beginAtZero: true } }, plugins: { legend: { display: false } } });
    }

    function exportReportCSV() {
        const { transactions } = getState();
        const month = parseInt(document.getElementById('repMonth').value);
        const year = parseInt(document.getElementById('repYear').value);
        const range = getMonthRange(year, month);
        const txMes = transactions.filter(t => t.fecha >= range.start && t.fecha <= range.end && t.tipo === 'gasto');
        if (txMes.length === 0) { notify('No hay gastos en este período.', 'info'); return; }

        let csv = 'Fecha,Categoría,Monto,Descripción,Método\n';
        txMes.forEach(t => {
            csv += `"${t.fecha}","${t.categoria||'-'}","${t.monto}","${(t.descripcion||'').replace(/"/g,'""')}","${t.metodo||'-'}"\n`;
        });
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${year}_${String(month).padStart(2,'0')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    document.getElementById('updateReportsBtn').addEventListener('click', updateReports);
    document.getElementById('exportReportCsvBtn').addEventListener('click', exportReportCSV);

    updateReports();
}
