import { getState, deleteTransaction } from '../state.js';
import { formatBs, formatDate, downloadFile } from '../utils/format.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';
import { showConfirm } from '../utils/confirmDialog.js';

const pageSize = 15;
let currentPage = 1;
let filteredTransactions = [];

export function render(container) {
    const { categories } = getState();

    const catFilterOptions = categories.map(c => `<option value="${c.name}">${c.emoji} ${c.name}</option>`).join('');

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.history} Historial de Transacciones</h2>
            <div class="filters-row">
                <input type="date" class="filter-input" id="filtFechaDesde" title="Desde" style="width:135px">
                <input type="date" class="filter-input" id="filtFechaHasta" title="Hasta" style="width:135px">
                <select class="filter-input" id="filtTipo"><option value="">Todos</option><option value="ingreso">Ingresos</option><option value="gasto">Gastos</option></select>
                <select class="filter-input" id="filtCategoria"><option value="">Todas las categorías</option>${catFilterOptions}</select>
                <select class="filter-input" id="filtMetodo"><option value="">Todos los métodos</option><option>Efectivo</option><option>Tarjeta</option><option>QR</option><option>Transferencia</option></select>
                <input type="number" class="filter-input" id="filtMontoMin" placeholder="Monto mín" step="0.01" style="width:100px">
                <input type="number" class="filter-input" id="filtMontoMax" placeholder="Monto máx" step="0.01" style="width:100px">
                <input type="text" class="filter-input" id="filtBusqueda" placeholder="${ICONS.search} Buscar descripción..." style="min-width:160px">
                <button class="btn btn-outline btn-sm" id="applyFiltersBtn">Filtrar</button>
                <button class="btn btn-outline btn-sm" id="clearFiltersBtn">Limpiar</button>
                <button class="btn btn-success btn-sm" id="exportCsvBtn">${ICONS.download} Exportar CSV</button>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Categoría</th><th>Descripción</th><th>Método/Fuente</th><th>Recibo</th><th>Acciones</th></tr></thead>
                    <tbody id="historyTableBody"></tbody>
                </table>
            </div>
            <div id="historyPagination" class="flex-wrap mt-1" style="justify-content:center;align-items:center;"></div>
        </div>
    `;

    function getCats() {
        return getState().categories;
    }
    const getCategoryDisplay = (catName) => {
        const found = getCats().find(c => c.name === catName);
        return (found ? found.emoji : '📦') + ' ' + catName;
    };

    function applyFilters() {
        const { transactions } = getState();
        const desde = document.getElementById('filtFechaDesde').value;
        const hasta = document.getElementById('filtFechaHasta').value;
        const tipo = document.getElementById('filtTipo').value;
        const categoria = document.getElementById('filtCategoria').value;
        const metodo = document.getElementById('filtMetodo').value;
        const montoMin = parseFloat(document.getElementById('filtMontoMin').value) || null;
        const montoMax = parseFloat(document.getElementById('filtMontoMax').value) || null;
        const busqueda = document.getElementById('filtBusqueda').value.toLowerCase().trim();

        filteredTransactions = transactions.filter(t => {
            if (desde && t.fecha < desde) return false;
            if (hasta && t.fecha > hasta) return false;
            if (tipo && t.tipo !== tipo) return false;
            if (categoria && t.categoria !== categoria) return false;
            if (metodo && t.metodo !== metodo) return false;
            if (montoMin !== null && Number(t.monto) < montoMin) return false;
            if (montoMax !== null && Number(t.monto) > montoMax) return false;
            if (busqueda && !(t.descripcion || '').toLowerCase().includes(busqueda)) return false;
            return true;
        });
        currentPage = 1;
        renderHistoryPage();
    }

    function clearFilters() {
        document.querySelectorAll('.filter-input').forEach(el => el.value = '');
        applyFilters();
    }

    function renderHistoryPage() {
        const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        const start = (currentPage - 1) * pageSize;
        const pageTx = filteredTransactions.slice(start, start + pageSize);
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        if (pageTx.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-light)">No se encontraron transacciones.</td></tr>';
        } else {
            pageTx.forEach(t => {
                const tipoBadge = t.tipo === 'ingreso'
                    ? '<span class="badge badge-income">Ingreso</span>'
                    : '<span class="badge badge-expense">Gasto</span>';
                const catDisplay = t.categoria ? getCategoryDisplay(t.categoria) : (t.fuente || '-');
                const metodoDisplay = t.metodo || t.fuente || '-';
                const fotoCell = t.fotoBase64
                    ? `<img src="${t.fotoBase64}" class="receipt-thumb" onclick="window.open('${t.fotoBase64}')" title="Ver recibo">`
                    : '-';
                tbody.innerHTML += `
                    <tr>
                        <td>${formatDate(t.fecha)}</td>
                        <td>${tipoBadge}</td>
                        <td style="font-weight:600;color:${t.tipo==='ingreso'?'var(--green)':'var(--red)'}">${formatBs(t.monto)}</td>
                        <td>${catDisplay}</td>
                        <td>${t.descripcion || '-'}</td>
                        <td>${metodoDisplay}</td>
                        <td>${fotoCell}</td>
                        <td>
                            <button class="btn btn-outline btn-sm edit-tx-btn" data-tx-id="${t.id}" data-tx-tipo="${t.tipo}">${ICONS.edit}</button>
                            <button class="btn btn-danger btn-sm delete-tx-btn" data-tx-id="${t.id}">${ICONS.trash}</button>
                        </td>
                    </tr>`;
            });
        }

        const pagDiv = document.getElementById('historyPagination');
        pagDiv.innerHTML = '';
        if (totalPages > 1) {
            pagDiv.innerHTML += `<button class="btn btn-outline btn-sm page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>${ICONS.chevronLeft} Anterior</button>`;
            pagDiv.innerHTML += `<span style="margin:0 0.75rem;font-weight:600">Pág ${currentPage} de ${totalPages}</span>`;
            pagDiv.innerHTML += `<button class="btn btn-outline btn-sm page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente ${ICONS.chevronRight}</button>`;
        }

        pagDiv.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const p = parseInt(btn.dataset.page);
                const total = Math.ceil(filteredTransactions.length / pageSize) || 1;
                if (p < 1 || p > total) return;
                currentPage = p;
                renderHistoryPage();
            });
        });

        tbody.querySelectorAll('.edit-tx-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.txId;
                const tipo = btn.dataset.txTipo;
                editTransaction(id, tipo);
            });
        });

        tbody.querySelectorAll('.delete-tx-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (await showConfirm('¿Eliminar esta transacción?')) {
                    deleteTransaction(btn.dataset.txId);
                    applyFilters();
                }
            });
        });
    }

    async function editTransaction(id, tipo) {
        const { transactions } = getState();
        const tx = transactions.find(t => t.id === id);
        if (!tx) return;
        if (!(await showConfirm('¿Editar esta transacción? Se eliminará el registro original y deberás volver a guardarlo.'))) return;

        deleteTransaction(id);
        const section = tipo === 'ingreso' ? 'income' : 'expense';
        const navBtn = document.querySelector(`[data-section="${section}"]`);
        if (navBtn) navBtn.click();
    }

    function exportCSV() {
        const data = filteredTransactions.length > 0 ? filteredTransactions : getState().transactions;
        if (data.length === 0) { notify('No hay datos para exportar.', 'info'); return; }
        let csv = 'Tipo,Monto,Categoría/Fuente,Fecha,Descripción,Método/Fuente\n';
        data.forEach(t => {
            const tipo = t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto';
            const cat = t.categoria || t.fuente || '-';
            const metodo = t.metodo || t.fuente || '-';
            csv += `"${tipo}","${t.monto}","${cat}","${t.fecha}","${(t.descripcion||'').replace(/"/g,'""')}","${metodo}"\n`;
        });
        downloadFile('transacciones.csv', csv, 'text/csv;charset=utf-8');
    }

    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);

    applyFilters();
}
