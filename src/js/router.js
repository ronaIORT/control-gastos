// --- Enrutador de secciones de la aplicación ---
import { render as renderDashboard } from './components/dashboard.js';
import { render as renderIncomeForm } from './components/incomeForm.js';
import { render as renderExpenseForm } from './components/expenseForm.js';
import { render as renderBudgetManager } from './components/budgetManager.js';
import { render as renderGoalList } from './components/goalList.js';
import { render as renderTransactionTable } from './components/transactionTable.js';
import { render as renderReports } from './components/reports.js';
import { render as renderConfiguracion } from './components/configuracion.js';
import { render as renderCategorias } from './components/categorias.js';
import { render as renderAcercade } from './components/acercade.js';
import { getState } from './state.js';
import { setDefaultDates } from './utils/dateHelpers.js';
import { destroyAllCharts } from './components/charts.js';

// Mapa de rutas: cada sección tiene su propia función de renderizado
const routes = {
    dashboard: renderDashboard,
    income: renderIncomeForm,
    expense: renderExpenseForm,
    budgets: renderBudgetManager,
    goals: renderGoalList,
    history: renderTransactionTable,
    reports: renderReports,
    configuracion: renderConfiguracion,
    categorias: renderCategorias,
    acercade: renderAcercade
};

let currentSection = 'dashboard';

export function getCurrentSection() {
    return currentSection;
}

// Navega a una sección: actualiza botones activos, destruye charts previos y renderiza
export function navigateTo(section, mainContainer) {
    if (!mainContainer) return;

    currentSection = section;

    // Activar la sección actual
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const sectionContainer = document.getElementById('sectionContainer');
    if (sectionContainer) sectionContainer.classList.add('active');

    // Marcar botón activo en sidebar y bottom-nav
    document.querySelectorAll('.sidebar nav button, .bottom-nav button').forEach(b => {
        b.classList.toggle('active', b.dataset.section === section);
    });

    // Renderizar la sección correspondiente
    const renderFn = routes[section];
    if (renderFn) {
        const contentContainer = document.getElementById('sectionContent');
        if (contentContainer) {
            destroyAllCharts(); // Limpiar charts de la sección anterior
            renderFn(contentContainer);
            // Establecer fecha actual en formularios de ingreso/gasto
            if (section === 'income' || section === 'expense') {
                setDefaultDates();
            }
        }
    }
}