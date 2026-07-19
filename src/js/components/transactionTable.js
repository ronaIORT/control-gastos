import { getState } from '../state.js';
import { formatBs, formatDate, downloadFile } from '../utils/format.js';
import { ICONS } from '../utils/icons.js';
import { notify } from '../utils/notification.js';
import { selectTransaction } from '../utils/selectionFab.js';

let filteredTransactions = [];

export function render(container) {
    const { categories } = getState();

    container.innerHTML = `
        <div class="form-card">
            <h2>${ICONS.history} Historial de Transacciones</h2>
            <div class="filters-row">
                <input type="month" class="filter-input" id="filtMes" title="Mes" style="width:180px">
                <select class="filter-input" id="filtTipo"><option value="">Todos</option><option value="ingreso">Ingresos</option><option value="gasto">Gastos</option></select>
                <select class="filter-input" id="filtCategoria"><option value="">Todas las categorías</option></select>
                <select class="filter-input" id="filtMetodo"><option value="">Todos los métodos</option><option>Efectivo</option><option>Tarjeta</option><option>QR</option><option>Transferencia</option></select>
                <button class="btn btn-outline btn-sm" id="applyFiltersBtn">Filtrar</button>
                <button class="btn btn-outline btn-sm" id="clearFiltersBtn">Limpiar</button>
                <button class="btn btn-success btn-sm" id="exportCsvBtn">${ICONS.download} Exportar CSV</button>
            </div>
            <div class="table-wrap">
                <table>
                    <thead><tr><th>Fecha</th><th>Tipo</th><th>Monto</th><th>Categoría</th><th>Descripción</th><th>Método/Fuente</th></tr></thead>
                    <tbody id="historyTableBody"></tbody>
                </table>
            </div>
        </div>
    `;

    function getCats() {
        return getState().categories;
    }
    const getCategoryDisplay = (catName) => {
        const found = getCats().find(c => c.name === catName);
        return (found ? found.emoji : '📦') + ' ' + catName;
    };

    function updateCategoriaOptions() {
        const { categories } = getState();
        const tipo = document.getElementById('filtTipo').value;
        const select = document.getElementById('filtCategoria');
        const selected = select.value;
        const filtered = tipo ? categories.filter(c => c.tipo === tipo) : categories;
        select.innerHTML = '<option value="">Todas las categorías</option>' +
            filtered.map(c => `<option value="${c.name}">${c.emoji} ${c.name}</option>`).join('');
        select.value = (tipo && filtered.some(c => c.name === selected)) ? selected : '';
    }

    function toggleMetodoFilter() {
        const tipo = document.getElementById('filtTipo').value;
        document.getElementById('filtMetodo').style.display = tipo === 'ingreso' ? 'none' : '';
    }

    function applyFilters() {
        updateCategoriaOptions();
        toggleMetodoFilter();
        const { transactions } = getState();
        const mes = document.getElementById('filtMes').value;
        const tipo = document.getElementById('filtTipo').value;
        const categoria = document.getElementById('filtCategoria').value;
        const metodo = document.getElementById('filtMetodo').value;

        filteredTransactions = transactions.filter(t => {
            if (mes && !t.fecha.startsWith(mes)) return false;
            if (tipo && t.tipo !== tipo) return false;
            if (categoria && t.categoria !== categoria && t.fuente !== categoria) return false;
            if (metodo && t.metodo !== metodo) return false;
            return true;
        });

        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        if (filteredTransactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-light)">No se encontraron transacciones.</td></tr>';
        } else {
            filteredTransactions.forEach(t => {
                const tipoBadge = t.tipo === 'ingreso'
                    ? '<span class="badge badge-income">Ingreso</span>'
                    : '<span class="badge badge-expense">Gasto</span>';
                const catDisplay = t.categoria ? getCategoryDisplay(t.categoria) : (t.fuente || '-');
                const metodoDisplay = t.metodo || t.fuente || '-';
                tbody.innerHTML += `
                    <tr data-tx-id="${t.id}">
                        <td>${formatDate(t.fecha)}</td>
                        <td>${tipoBadge}</td>
                        <td style="font-weight:600;color:${t.tipo==='ingreso'?'var(--green)':'var(--red)'}">${formatBs(t.monto)}</td>
                        <td>${catDisplay}</td>
                        <td>${t.descripcion || '-'}</td>
                        <td>${metodoDisplay}</td>
                    </tr>`;
            });
            if (tipo) {
                const total = filteredTransactions.reduce((sum, t) => sum + Number(t.monto), 0);
                tbody.innerHTML += `
                    <tr style="font-weight:700;border-top:2px solid var(--primary)">
                        <td colspan="2" style="text-align:right">Total ${tipo === 'ingreso' ? 'Ingresos' : 'Gastos'}:</td>
                        <td style="color:${tipo === 'ingreso' ? 'var(--green)' : 'var(--red)'}">${formatBs(total)}</td>
                        <td colspan="3"></td>
                    </tr>`;
            }
        }
    }

    function clearFilters() {
        document.querySelectorAll('.filter-input').forEach(el => el.value = '');
        applyFilters();
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

    document.getElementById('filtTipo').addEventListener('change', () => {
        updateCategoriaOptions();
        toggleMetodoFilter();
    });
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);

    document.getElementById('historyTableBody').addEventListener('click', (e) => {
        const tr = e.target.closest('tr[data-tx-id]');
        if (tr) selectTransaction(tr.dataset.txId);
    });

    applyFilters();
}
