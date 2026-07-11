// --- Capa de persistencia en localStorage ---

// Claves usadas en localStorage para cada tipo de dato
const STORAGE_KEYS = {
    transactions: 'fp_transactions',
    budgets: 'fp_budgets',
    goals: 'fp_goals',
    categories: 'fp_categories'
};

// Categorías precargadas por defecto (no eliminables)
export const DEFAULT_CATEGORIES = [
    { name: 'Alimentación', emoji: '🍔', tipo: 'gasto', deletable: false, editable: false },
    { name: 'Transporte', emoji: '🚗', tipo: 'gasto', deletable: false, editable: false },
    { name: 'Vivienda', emoji: '🏠', tipo: 'gasto', deletable: false, editable: false },
    { name: 'Salud', emoji: '💊', tipo: 'gasto', deletable: false, editable: false },
    { name: 'Educación', emoji: '📚', tipo: 'gasto', deletable: false, editable: true },
    { name: 'Entretenimiento', emoji: '🎮', tipo: 'gasto', deletable: false, editable: true },
    { name: 'Tecnología', emoji: '💻', tipo: 'gasto', deletable: false, editable: true },
    { name: 'Ropa', emoji: '👕', tipo: 'gasto', deletable: false, editable: true },
    { name: 'Otros', emoji: '📦', tipo: 'gasto', deletable: false, editable: true },
    { name: 'Salario', emoji: '💰', tipo: 'ingreso', deletable: false, editable: true },
    { name: 'Negocio', emoji: '📊', tipo: 'ingreso', deletable: false, editable: true },
    { name: 'Regalo', emoji: '🎁', tipo: 'ingreso', deletable: false, editable: true }
];

// Carga un item de localStorage con manejo de errores
function loadItem(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch {
        return fallback;
    }
}

// Guarda un item en localStorage con manejo de errores
function saveItem(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// --- Funciones específicas por tipo de dato ---
export function loadTransactions() {
    return loadItem(STORAGE_KEYS.transactions, []);
}

export function saveTransactions(data) {
    saveItem(STORAGE_KEYS.transactions, data);
}

export function loadBudgets() {
    return loadItem(STORAGE_KEYS.budgets, {});
}

export function saveBudgets(data) {
    saveItem(STORAGE_KEYS.budgets, data);
}

export function loadGoals() {
    return loadItem(STORAGE_KEYS.goals, []);
}

export function saveGoals(data) {
    saveItem(STORAGE_KEYS.goals, data);
}

export function loadCategories() {
    const cats = loadItem(STORAGE_KEYS.categories, null);
    if (!cats) return DEFAULT_CATEGORIES.map(c => ({ ...c }));
    // Migración silenciosa: añadir campos faltantes a categorías existentes
    return cats.map(c => ({
        ...c,
        tipo: c.tipo || 'gasto',
        editable: c.editable !== undefined ? c.editable : true,
        deletable: c.deletable !== undefined ? c.deletable : true
    }));
}

export function saveCategories(data) {
    saveItem(STORAGE_KEYS.categories, data);
}
