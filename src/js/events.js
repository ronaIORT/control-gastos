// --- Eventos globales de la aplicación (delegación) ---
import { navigateTo, getCurrentSection } from './router.js';

// Vincula eventos de navegación, sidebar y overlay al contenedor principal
export function setupGlobalEvents(appContainer) {
    appContainer.addEventListener('click', (e) => {
        // Navegación por secciones (sidebar y bottom-nav)
        const navBtn = e.target.closest('[data-section]');
        if (navBtn) {
            const section = navBtn.dataset.section;
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                navigateTo(section, mainContent);
            }
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
            return;
        }

        // Botón Más para abrir/cerrar sidebar en móvil
        const moreBtn = e.target.closest('#moreBtn');
        if (moreBtn) {
            toggleSidebar();
            return;
        }

        // Cerrar sidebar al tocar el overlay
        const overlay = e.target.closest('#overlay');
        if (overlay) {
            closeSidebar();
            return;
        }
    });

    // Cerrar sidebar automáticamente al redimensionar a escritorio
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeSidebar();
    });
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
}
