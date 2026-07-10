// --- Funciones de formato y utilidades generales ---

// Formatea un número como moneda boliviana (Bs)
export function formatBs(amount) {
    return 'Bs ' + Number(amount).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Convierte formato ISO (YYYY-MM-DD) a dd/mm/aaaa para mostrar
export function formatDate(isoStr) {
    if (!isoStr) return '-';
    const parts = isoStr.split('-');
    return parts[2] + '/' + parts[1] + '/' + parts[0];
}

// Descarga un archivo en el navegador a partir de su contenido (incluye BOM UTF-8)
export function downloadFile(filename, content, mimeType) {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
