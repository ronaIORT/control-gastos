import { ICONS } from './icons.js';

const iconsMap = {
  success: ICONS.check,
  error: ICONS.alertTriangle,
  warning: ICONS.alertTriangle,
  info: ICONS.info
};

const colorsMap = {
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#7c3aed'
};

export function notify(message, type = 'success', duration = 3000) {
  removeExisting();

  const toast = document.createElement('div');
  toast.className = 'app-toast';

  const color = colorsMap[type] || colorsMap.success;
  toast.innerHTML = `
    <span class="app-toast-icon" style="color:${color}">${iconsMap[type] || iconsMap.info}</span>
    <span class="app-toast-text">${message}</span>
  `;

  toast.style.cssText = `
    position: fixed; top: 1rem; right: 1rem; z-index: 9999;
    display: flex; align-items: center; gap: 0.75rem;
    background: #fff; color: #2d1b4e;
    padding: 0.85rem 1.25rem; border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.06);
    font-family: 'Segoe UI', Arial, sans-serif; font-size: 0.9rem;
    border-left: 4px solid ${color};
    animation: toastIn 0.25s ease;
    max-width: 360px;
  `;
  toast.querySelector('.app-toast-icon svg').style.display = 'block';

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

function removeExisting() {
  document.querySelectorAll('.app-toast').forEach(el => el.remove());
}

const style = document.createElement('style');
style.textContent = `
  @keyframes toastIn {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
`;
document.head.appendChild(style);
