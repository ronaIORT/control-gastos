// --- Utilidades de Chart.js: creación, actualización y limpieza de gráficos ---
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import { getState } from '../state.js';
import { formatBs } from '../utils/format.js';

const doughnutCenterText = {
    id: 'doughnutCenterText',
    afterDraw(chart) {
        if (chart.config.type !== 'doughnut') return;
        const dataset = chart.data.datasets[0];
        if (!dataset || !dataset.data) return;
        const meta = chart.getDatasetMeta(0);
        const total = dataset.data.reduce((a, b, i) => {
            const el = meta.data[i];
            return (el && !el.hidden) ? a + Number(b) : a;
        }, 0);
        if (total === 0) return;

        const { ctx, chartArea } = chart;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillStyle = '#2d1b4e';
        ctx.fillText(total.toLocaleString('es-BO'), centerX, centerY);
        ctx.restore();
    }
};
Chart.register(doughnutCenterText);
import { ICONS } from '../utils/icons.js';

// Registro de instancias activas para poder destruirlas al cambiar de sección
const chartInstances = {};

// Renderiza un gráfico de donut con los gastos agrupados por categoría
export function renderDoughnutChart(canvasId, gastosPorCat) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    const ctx = canvas.getContext('2d');

    const { categories } = getState();
    const getCategoryDisplay = (catName) => {
        const found = categories.find(c => c.name === catName);
        return (found ? found.emoji : '📦') + ' ' + catName;
    };

    const entries = Object.entries(gastosPorCat).filter(([, v]) => v > 0);
    if (entries.length === 0) {
        // Mostrar gráfico vacío si no hay gastos
        chartInstances[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: ['Sin gastos'], datasets: [{ data: [1], backgroundColor: ['#d4c4e8'] }] },
            options: { plugins: { legend: { display: false } } }
        });
        return;
    }

    entries.sort((a, b) => b[1] - a[1]);
    const colors = ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c', '#7c6a9a'];

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: entries.map(([c]) => getCategoryDisplay(c)),
            datasets: [{
                data: entries.map(([, v]) => v),
                backgroundColor: entries.map((_, i) => colors[i % colors.length]),
                borderWidth: 2,
                borderColor: '#f5f0fa'
            }]
        },
        options: {
            responsive: true,
            cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true, pointStyleWidth: 10 } } }
        }
    });
}

// Renderiza un gráfico genérico de Chart.js (bar, line, etc.)
export function renderChart(canvasId, type, data, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const existing = Chart.getChart(canvas);
    if (existing) existing.destroy();
    const ctx = canvas.getContext('2d');
    chartInstances[canvasId] = new Chart(ctx, {
        type,
        data,
        options: { responsive: true, maintainAspectRatio: true, ...options }
    });
}

// Destruye una instancia de chart específica
export function destroyChart(canvasId) {
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
        delete chartInstances[canvasId];
    }
}

// Destruye todos los charts activos (se llama al cambiar de sección)
export function destroyAllCharts() {
    Object.keys(chartInstances).forEach(key => destroyChart(key));
}
