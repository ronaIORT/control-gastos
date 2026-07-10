// --- Manejo del estado global de la aplicación ---
import {
    loadTransactions, saveTransactions,
    loadBudgets, saveBudgets,
    loadGoals, saveGoals,
    loadCategories, saveCategories,
    DEFAULT_CATEGORIES
} from './storage.js';

// Estado global de la aplicación
const state = {
    transactions: [],
    budgets: {},
    goals: [],
    categories: [...DEFAULT_CATEGORIES]
};

// --- Sistema de suscripción para re-renderizar vistas al cambiar el estado ---
const listeners = [];

export function subscribe(fn) {
    listeners.push(fn);
    return () => {
        const idx = listeners.indexOf(fn);
        if (idx > -1) listeners.splice(idx, 1);
    };
}

function notify() {
    listeners.forEach(fn => fn());
}

export function getState() {
    return state;
}

// Genera un ID único para cada transacción
function generateId() {
    return 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// --- Inicialización: carga datos de localStorage o genera datos de muestra ---
export function initState() {
    state.transactions = loadTransactions();
    state.budgets = loadBudgets();
    state.goals = loadGoals();
    state.categories = loadCategories();

    // Si no hay datos, generamos datos de ejemplo para demostración
    if (state.transactions.length === 0 && state.goals.length === 0 && Object.keys(state.budgets).length === 0) {
        generateSampleData();
        state.transactions = loadTransactions();
        state.budgets = loadBudgets();
        state.goals = loadGoals();
        state.categories = loadCategories();
    }
    notify();
}

// Genera 4 meses de datos de ejemplo (ingresos + gastos aleatorios)
function generateSampleData() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const sampleTransactions = [];

    for (let monthOffset = 3; monthOffset >= 0; monthOffset--) {
        const d = new Date(y, m - monthOffset, 1);
        const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
        const salarioDay = Math.min(15, daysInMonth);
        // Ingreso mensual (salario)
        sampleTransactions.push({
            id: generateId(),
            tipo: 'ingreso',
            monto: 4500 + Math.floor(Math.random() * 500),
            fecha: new Date(d.getFullYear(), d.getMonth(), salarioDay).toISOString().split('T')[0],
            descripcion: 'Salario mensual',
            fuente: 'Salario',
            categoria: null,
            metodo: null,
            fotoBase64: null
        });

        // Gastos aleatorios del mes
        const categoriasGasto = ['Alimentación', 'Transporte', 'Vivienda', 'Entretenimiento', 'Tecnología', 'Salud', 'Ropa'];
        for (let i = 0; i < 18; i++) {
            const day = Math.floor(Math.random() * daysInMonth) + 1;
            const cat = categoriasGasto[Math.floor(Math.random() * categoriasGasto.length)];
            const monto = Math.round((Math.random() * 400 + 20) * 100) / 100;
            sampleTransactions.push({
                id: generateId(),
                tipo: 'gasto',
                monto: monto,
                fecha: new Date(d.getFullYear(), d.getMonth(), day).toISOString().split('T')[0],
                descripcion: `Gasto en ${cat.toLowerCase()}`,
                categoria: cat,
                metodo: ['Efectivo', 'Tarjeta', 'QR', 'Transferencia'][Math.floor(Math.random() * 4)],
                fuente: null,
                fotoBase64: null
            });
        }
    }

    // Ordenar del más reciente al más antiguo
    sampleTransactions.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    saveTransactions(sampleTransactions);
    saveBudgets({
        'Alimentación': 800,
        'Transporte': 300,
        'Entretenimiento': 400,
        'Vivienda': 1200
    });
    saveGoals([
        { id: generateId(), nombre: 'Comprar laptop', objetivo: 5000, ahorrado: 1200, fechaLimite: new Date(y + 1, 5, 30).toISOString().split('T')[0] },
        { id: generateId(), nombre: 'Fondo emergencia', objetivo: 10000, ahorrado: 3500, fechaLimite: null }
    ]);
}

// --- CRUD de transacciones ---
export function addTransaction(tx) {
    tx.id = generateId();
    state.transactions.unshift(tx);
    saveTransactions(state.transactions);
    notify();
}

export function deleteTransaction(id) {
    state.transactions = state.transactions.filter(t => t.id !== id);
    saveTransactions(state.transactions);
    notify();
}

export function updateTransaction(id, newData) {
    const idx = state.transactions.findIndex(t => t.id === id);
    if (idx > -1) {
        state.transactions[idx] = { ...state.transactions[idx], ...newData };
        saveTransactions(state.transactions);
        notify();
    }
}

// --- CRUD de presupuestos ---
export function setBudget(cat, limit) {
    state.budgets[cat] = Math.round(limit * 100) / 100;
    saveBudgets(state.budgets);
    notify();
}

export function deleteBudget(cat) {
    delete state.budgets[cat];
    saveBudgets(state.budgets);
    notify();
}

// --- CRUD de metas de ahorro ---
export function addGoal(goal) {
    goal.id = generateId();
    state.goals.push(goal);
    saveGoals(state.goals);
    notify();
}

export function updateGoal(id, data) {
    const idx = state.goals.findIndex(g => g.id === id);
    if (idx > -1) {
        state.goals[idx] = { ...state.goals[idx], ...data };
        saveGoals(state.goals);
        notify();
    }
}

export function deleteGoal(id) {
    state.goals = state.goals.filter(g => g.id !== id);
    saveGoals(state.goals);
    notify();
}

// Calcula cuánto ahorrar por mes para alcanzar una meta antes de la fecha límite
export function calcularSugerencia(goal) {
    const hoy = new Date();
    const limite = new Date(goal.fechaLimite + 'T00:00:00');
    const diffMs = limite - hoy;
    const diffMonths = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30)));
    const faltante = goal.objetivo - goal.ahorrado;
    if (faltante <= 0) return 0;
    return Math.round(faltante / diffMonths * 100) / 100;
}

// Añade fondos a una meta, validando que haya saldo disponible
export function addFundsToGoal(goalId, amount) {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return false;

    const totalIngresos = state.transactions.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0);
    const totalGastos = state.transactions.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0);
    const saldo = totalIngresos - totalGastos;
    const yaComprometido = state.goals.reduce((s, g) => s + Number(g.ahorrado), 0);
    const disponibleReal = saldo - yaComprometido + Number(goal.ahorrado);

    if (amount > disponibleReal) return false;

    goal.ahorrado = Math.round((Number(goal.ahorrado) + amount) * 100) / 100;
    saveGoals(state.goals);
    notify();
    return true;
}

// Calcula el saldo disponible para una meta específica
export function getAvailableBalanceForGoal(goalId) {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return 0;
    const totalIngresos = state.transactions.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + Number(t.monto), 0);
    const totalGastos = state.transactions.filter(t => t.tipo === 'gasto').reduce((s, t) => s + Number(t.monto), 0);
    const saldo = totalIngresos - totalGastos;
    const yaComprometido = state.goals.reduce((s, g) => s + Number(g.ahorrado), 0);
    return saldo - yaComprometido + Number(goal.ahorrado);
}
