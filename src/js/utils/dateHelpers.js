// --- Funciones auxiliares para manejo de fechas ---

// Obtiene el rango [inicio, fin] de un mes específico en formato ISO (YYYY-MM-DD)
export function getMonthRange(year, month) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);
    return {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
    };
}

// Obtiene el rango del mes actual
export function getCurrentMonthRange() {
    const now = new Date();
    return getMonthRange(now.getFullYear(), now.getMonth() + 1);
}

// Establece la fecha actual como valor por defecto en los campos date de formularios
export function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const incFecha = document.getElementById('incFecha');
    const expFecha = document.getElementById('expFecha');
    if (incFecha) incFecha.value = today;
    if (expFecha) expFecha.value = today;

    // También actualiza los selectores de mes/año en reportes
    const repMonth = document.getElementById('repMonth');
    const repYear = document.getElementById('repYear');
    if (repMonth) repMonth.value = new Date().getMonth() + 1;

    if (repYear) {
        const cy = new Date().getFullYear();
        repYear.innerHTML = '';
        for (let y = cy - 3; y <= cy + 1; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            if (y === cy) opt.selected = true;
            repYear.appendChild(opt);
        }
    }
}
