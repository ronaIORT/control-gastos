import { ICONS } from './icons.js';

export function showConfirm(message) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';

    overlay.innerHTML = `
      <div class="confirm-dialog">
        <div class="confirm-header">
          <span class="confirm-icon">${ICONS.alertTriangle}</span>
          <span class="confirm-title">Confirmar</span>
          <button class="confirm-close" type="button" aria-label="Cerrar">${ICONS.plus.replace('stroke-linecap="round" stroke-linejoin="round"', 'stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(45deg)"')}</button>
        </div>
        <div class="confirm-body">${message}</div>
        <div class="confirm-footer">
          <button class="btn btn-outline confirm-cancel" type="button">Cancelar</button>
          <button class="btn btn-danger confirm-ok" type="button">${ICONS.trash} Eliminar</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('open'));

    function close(result) {
      overlay.classList.remove('open');
      overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
      setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 300);
      resolve(result);
    }

    overlay.querySelector('.confirm-ok').addEventListener('click', () => close(true));
    overlay.querySelector('.confirm-cancel').addEventListener('click', () => close(false));
    overlay.querySelector('.confirm-close').addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(false);
    });

    document.addEventListener('keydown', function handler(e) {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', handler);
        close(false);
      }
    });
  });
}
