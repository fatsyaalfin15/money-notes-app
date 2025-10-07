let transactions = [];
let customCategories = [];

const DEFAULT_CATEGORIES = [
    'Gaji', 'Makanan', 'Transportasi', 'Hiburan', 'Kuliah', 'Lainnya'
];

/**
 * Mengambil ID pengguna yang sedang login dari localStorage.
 * @returns {string|null} ID pengguna atau null jika tidak ada.
 */
function getCurrentUserId() {
    const userJson = localStorage.getItem('money-notes-current-user');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            return user.id;
        } catch (e) {
            console.error("Gagal mem-parsing data pengguna:", e);
            // Jika gagal, arahkan ke halaman login untuk keamanan
            window.location.href = 'login.html';
            return null;
        }
    }
    // Jika tidak ada user, arahkan ke login
    window.location.href = 'login.html';
    return null;
}

/**
 * Membuat kunci (key) unik untuk localStorage berdasarkan ID pengguna.
 * @param {string} baseKey - Kunci dasar (misal: 'transactions').
 * @returns {string} Kunci yang sudah digabung dengan ID pengguna.
 */
function getUserSpecificKey(baseKey) {
    const userId = getCurrentUserId();
    if (!userId) {
        // Ini seharusnya tidak terjadi karena ada pengecekan di index.html,
        // tapi sebagai pengaman tambahan.
        throw new Error("Tidak ada pengguna yang login. Tidak dapat mengakses data.");
    }
    return `money-notes-${baseKey}-${userId}`;
}

/**
 * Menyimpan daftar transaksi ke localStorage untuk pengguna saat ini.
 */
function saveTransactions() {
    localStorage.setItem(getUserSpecificKey('transactions'), JSON.stringify(transactions));
}

/**
 * Memuat daftar transaksi dari localStorage untuk pengguna saat ini.
 */
export function loadTransactions() {
    const saved = localStorage.getItem(getUserSpecificKey('transactions'));
    transactions = saved ? JSON.parse(saved) : [];
}

/**
 * Menyimpan daftar kategori kustom ke localStorage untuk pengguna saat ini.
 */
function saveCategories() {
    localStorage.setItem(getUserSpecificKey('categories'), JSON.stringify(customCategories));
}

/**
 * Memuat kategori (default + kustom) untuk pengguna saat ini.
 * @returns {string[]} Daftar semua kategori.
 */
export function loadCategories() {
    const savedCustom = localStorage.getItem(getUserSpecificKey('categories'));
    customCategories = savedCustom ? JSON.parse(savedCustom) : [];
    return [...new Set([...DEFAULT_CATEGORIES, ...customCategories])].sort();
}

/**
 * Menyimpan kategori baru jika belum ada.
 * @param {string} category - Nama kategori baru.
 */
export function saveCustomCategory(category) {
    if (category && !customCategories.includes(category) && !DEFAULT_CATEGORIES.includes(category)) {
        customCategories.push(category);
        saveCategories();
    }
}

export function getTransactions() {
    return transactions;
}

export function getTransactionById(id) {
    return transactions.find(t => t.id === id);
}

export function addTransaction(transactionData) {
    const newTransaction = {
        id: Date.now(),
        ...transactionData
    };
    transactions.unshift(newTransaction);
    saveTransactions();
}

export function updateTransaction(updatedData) {
    const index = transactions.findIndex(t => t.id == updatedData.id);
    if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updatedData };
        saveTransactions();
    }
}

export function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
}