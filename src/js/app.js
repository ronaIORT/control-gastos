// --- Punto de entrada de la aplicación ---
import '../css/main.css';
import { initState, getState, subscribe } from './state.js';
import { navigateTo, getCurrentSection } from './router.js';
import { setupGlobalEvents } from './events.js';
import { ICONS } from './utils/icons.js';
import { initFab } from './utils/selectionFab.js';

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');

    // ---- Plantilla principal del layout ----
    app.innerHTML = `
        <!-- Overlay para móviles (cierre del sidebar al tocar fuera) -->
        <div class="overlay" id="overlay"></div>
        <!-- Sidebar de navegación principal (escritorio) -->
        <aside class="sidebar" id="sidebar">
            <div class="logo"><span>${ICONS.wallet}</span> Finanzas</div>
            <nav>
                <button class="active" data-section="dashboard"><span class="ico">${ICONS.dashboard}</span> Dashboard</button>
                <button data-section="income"><span class="ico">${ICONS.income}</span> Ingresos</button>
                <button data-section="expense"><span class="ico">${ICONS.expense}</span> Gastos</button>
                <button data-section="budgets"><span class="ico">${ICONS.budgets}</span> Presupuestos</button>
                <button data-section="goals"><span class="ico">${ICONS.goals}</span> Metas</button>
                <button data-section="history"><span class="ico">${ICONS.history}</span> Historial</button>
                <button data-section="reports"><span class="ico">${ICONS.reports}</span> Reportes</button>
                <button data-section="categorias"><span class="ico">${ICONS.categories}</span> Categorías</button>
                <button data-section="configuracion"><span class="ico">${ICONS.settings}</span> Configuración</button>
                <button data-section="acercade"><span class="ico">${ICONS.info}</span> Acerca de</button>
            </nav>
        </aside>
        <!-- Navegación inferior para móviles -->
        <nav class="bottom-nav" id="bottomNav">
            <button class="active" data-section="dashboard"><span class="ico">${ICONS.dashboard}</span> Inicio</button>
            <button data-section="income"><span class="ico">${ICONS.income}</span> Ingreso</button>
            <button data-section="expense"><span class="ico">${ICONS.expense}</span> Gasto</button>
            <button data-section="budgets"><span class="ico">${ICONS.budgets}</span> Presup.</button>
            <button id="moreBtn"><span class="ico">${ICONS.plus}</span> Más</button>
        </nav>
        <!-- Contenedor principal donde se renderiza cada sección -->
        <main class="main" id="mainContent">
            <div class="section active" id="sectionContainer">
                <div id="sectionContent"></div>
            </div>
        </main>
    `;

    // Cargar datos desde localStorage o generar datos de muestra
    initState();

    // Inicializar FAB de eliminación de transacciones
    initFab();

    // Registrar service worker y detectar actualizaciones
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'VERSION') {
                console.log('[App] SW versión:', event.data.version);
            }
        });

        navigator.serviceWorker.register('service-worker.js').then(reg => {
            reg.addEventListener('updatefound', () => {
                const nuevoSW = reg.installing;
                nuevoSW.addEventListener('statechange', () => {
                    if (nuevoSW.state === 'installed' && navigator.serviceWorker.controller) {
                        mostrarActualizacionDisponible(reg);
                    }
                });
            });
        });
    }

    const mainContent = document.getElementById('mainContent');

    // Vincular eventos globales (navegación, sidebar, etc.)
    setupGlobalEvents(app);

    // Navegar al dashboard por defecto
    navigateTo('dashboard', mainContent);

    // Re-renderizar cuando cambie el estado global
    subscribe(() => {
        const section = getCurrentSection();
        if (section) {
            navigateTo(section, mainContent);
        }
    });
});

function mostrarActualizacionDisponible(reg) {
    const existing = document.querySelector('.update-banner');
    if (existing) return;

    const banner = document.createElement('div');
    banner.className = 'update-banner';
    banner.innerHTML = `
        <span>Nueva versi&oacute;n disponible</span>
        <div>
            <button class="reload-btn">Actualizar ahora</button>
            <button class="close-btn">&times;</button>
        </div>
    `;

    banner.querySelector('.reload-btn').addEventListener('click', () => {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
        if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
    });

    banner.querySelector('.close-btn').addEventListener('click', () => {
        banner.remove();
    });

    document.body.prepend(banner);
}
