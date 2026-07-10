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
    { name: 'Alimentación', emoji: '🍔', deletable: false },
    { name: 'Transporte', emoji: '🚗', deletable: false },
    { name: 'Vivienda', emoji: '🏠', deletable: false },
    { name: 'Salud', emoji: '💊', deletable: false },
    { name: 'Educación', emoji: '📚', deletable: false },
    { name: 'Entretenimiento', emoji: '🎮', deletable: false },
    { name: 'Tecnología', emoji: '💻', deletable: false },
    { name: 'Ropa', emoji: '👕', deletable: false },
    { name: 'Otros', emoji: '📦', deletable: false }
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
    return cats || [...DEFAULT_CATEGORIES];
}

export function saveCategories(data) {
    saveItem(STORAGE_KEYS.categories, data);
}
