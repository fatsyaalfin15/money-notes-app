import * as state from './state.js';
import * as ui from './ui.js';
import { parseNominalInput } from './utils.js';

let transactionIdToDelete = null;

// Fungsi notifikasi
function showNotification(message, type = 'success') {
    const old = document.getElementById('notification');
    if (old) old.remove();

    const notif = document.createElement('div');
    notif.id = 'notification';
    notif.textContent = message;
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        transform: translateX(120%);
        transition: transform 0.3s ease-out;
    `;
    document.body.appendChild(notif);

    setTimeout(() => notif.style.transform = 'translateX(0)', 100);
    setTimeout(() => {
        notif.style.transform = 'translateX(120%)';
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

// Dark Mode
function initDarkMode() {
    const savedTheme = localStorage.getItem('money-notes-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('dark-mode-icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('money-notes-theme', newTheme);
    document.getElementById('dark-mode-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

// Logout
function handleLogout() {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
        localStorage.removeItem('money-notes-current-user');
        window.location.href = 'index.html';
    }
}

// Scroll ke form
function scrollToForm() {
    const form = document.getElementById('transaction-form');
    if (form) {
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function refreshUI() {
    const transactions = state.getTransactions();
    const keyword = document.getElementById('filter-keyword')?.value.toLowerCase() || '';
    const jenis = document.getElementById('filter-jenis')?.value || 'all';

    const filtered = transactions.filter(t => {
        const noteMatch = t.catatan ? t.catatan.toLowerCase().includes(keyword) : true;
        const categoryMatch = t.kategori.toLowerCase().includes(keyword);
        const jenisMatch = jenis === 'all' || t.jenis === jenis;
        return (noteMatch || categoryMatch) && jenisMatch;
    });

    ui.renderDashboard(transactions);
    ui.renderPeriodSummary(transactions);
    ui.renderTransactions(filtered);
    ui.renderHistory(transactions);
    ui.setupExport(transactions);
}

function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!ui.validateForm()) return;

    const formData = new FormData(document.getElementById('transaction-form'));
    const transactionData = Object.fromEntries(formData.entries());
    transactionData.nominal = parseNominalInput(document.getElementById('nominal').value);

    if (transactionData.id) {
        state.updateTransaction(transactionData);
        showNotification('Transaksi berhasil diperbarui!');
    } else {
        state.addTransaction(transactionData);
        if (!state.loadCategories().includes(transactionData.kategori)) {
            state.saveCustomCategory(transactionData.kategori);
            ui.renderCategories();
        }
        showNotification('Transaksi berhasil ditambahkan!');
    }
    
    ui.resetForm();
    refreshUI();
}

function handleListClick(event) {
    const target = event.target;
    const item = target.closest('.transaction-item');
    if (!item) return;

    const id = parseInt(item.dataset.id);
    if (isNaN(id)) return;

    if (target.classList.contains('edit-btn')) {
        const transaction = state.getTransactionById(id);
        if (transaction) {
            ui.populateForm(transaction);
            scrollToForm(); // 🔥 SCROLL KE FORM
        }
    }

    if (target.classList.contains('delete-btn')) {
        transactionIdToDelete = id;
        ui.toggleModal('delete-modal', true);
    }
}

function setupBulkDelete(listId, selectAllBtnId, deleteSelectedBtnId, countSpanId) {
    const list = document.getElementById(listId);
    const selectAllBtn = document.getElementById(selectAllBtnId);
    const deleteSelectedBtn = document.getElementById(deleteSelectedBtnId);
    const countSpan = document.getElementById(countSpanId);

    if (!list || !selectAllBtn || !deleteSelectedBtn || !countSpan) return;

    list.addEventListener('change', (e) => {
        if (e.target.classList.contains('delete-checkbox')) {
            updateSelectionState();
        }
    });

    selectAllBtn.addEventListener('click', () => {
        const checkboxes = list.querySelectorAll('.delete-checkbox');
        // Jika semua sudah tercentang, maka batalkan semua. Jika tidak, centang semua.
        const allChecked = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        updateSelectionState();
    });

    deleteSelectedBtn.addEventListener('click', () => {
        const checked = list.querySelectorAll('.delete-checkbox:checked');
        if (checked.length === 0) {
            showNotification('Pilih transaksi yang ingin dihapus.', 'warning');
            return;
        }

        if (confirm(`Anda yakin ingin menghapus ${checked.length} transaksi yang dipilih?`)) {
            const idsToDelete = Array.from(checked).map(cb => parseInt(cb.dataset.id));
            idsToDelete.forEach(id => state.deleteTransaction(id));
            refreshUI();
            showNotification(`${checked.length} transaksi berhasil dihapus.`, 'success');
        }
    });

    function updateSelectionState() {
        const checked = list.querySelectorAll('.delete-checkbox:checked');
        const allCheckboxes = list.querySelectorAll('.delete-checkbox');
        countSpan.textContent = `${checked.length} dipilih`;

        if (checked.length > 0 && checked.length === allCheckboxes.length) {
            selectAllBtn.textContent = 'Batal Pilih Semua';
        } else {
            selectAllBtn.textContent = 'Pilih Semua';
        }
    }
    // Panggil sekali untuk inisialisasi
    updateSelectionState();
}

function init() {
    state.loadTransactions();
    ui.renderCategories();
    refreshUI();
    ui.resetForm();
    ui.switchView('main');
    ui.renderUserGreeting(); // 🔥 RENDER NAMA USER

    initDarkMode(); // 🔥 INISIALISASI DARK MODE

    if (!sessionStorage.getItem('welcomeShown')) {
        setTimeout(() => {
            const modal = document.getElementById('welcome-modal');
            if (modal) {
                modal.style.display = 'flex';
                sessionStorage.setItem('welcomeShown', 'true');
            }
        }, 100);
    }

    // Event listeners
    const form = document.getElementById('transaction-form');
    if (form) form.addEventListener('submit', handleFormSubmit);

    const transactionList = document.getElementById('transaction-list');
    const historyList = document.getElementById('history-list');
    if (transactionList) transactionList.addEventListener('click', handleListClick);
    if (historyList) historyList.addEventListener('click', handleListClick);

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', ui.resetForm);

    const filterKeyword = document.getElementById('filter-keyword');
    const filterJenis = document.getElementById('filter-jenis');
    if (filterKeyword) filterKeyword.addEventListener('input', refreshUI);
    if (filterJenis) filterJenis.addEventListener('change', refreshUI);

    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => ui.toggleModal('delete-modal', false));
    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', () => {
        if (transactionIdToDelete !== null) {
            state.deleteTransaction(transactionIdToDelete);
            transactionIdToDelete = null;
            ui.toggleModal('delete-modal', false);
            refreshUI();
            showNotification('Transaksi berhasil dihapus!', 'success');
        }
    });

    const welcomeOkBtn = document.getElementById('welcome-ok-btn');
    if (welcomeOkBtn) welcomeOkBtn.addEventListener('click', () => ui.toggleModal('welcome-modal', false));

    const navMainBtn = document.getElementById('nav-main-btn');
    const navHistoryBtn = document.getElementById('nav-history-btn');
    if (navMainBtn) navMainBtn.addEventListener('click', () => ui.switchView('main'));
    if (navHistoryBtn) navHistoryBtn.addEventListener('click', () => ui.switchView('history'));

    const addCategoryBtn = document.getElementById('add-category-btn');
    const modalCancelCategory = document.getElementById('modal-cancel-category');
    const modalSaveCategory = document.getElementById('modal-save-category');
    if (addCategoryBtn) addCategoryBtn.addEventListener('click', () => ui.toggleModal('category-modal', true));
    if (modalCancelCategory) modalCancelCategory.addEventListener('click', () => {
        ui.toggleModal('category-modal', false);
        const input = document.getElementById('new-category');
        if (input) input.value = '';
        const err = document.getElementById('error-new-category');
        if (err) err.textContent = '';
    });
    if (modalSaveCategory) modalSaveCategory.addEventListener('click', () => {
        const input = document.getElementById('new-category');
        const cat = input?.value.trim() || '';
        const err = document.getElementById('error-new-category');
        if (cat && cat.length <= 30) {
            state.saveCustomCategory(cat);
            ui.renderCategories();
            ui.toggleModal('category-modal', false);
            if (input) input.value = '';
            if (err) err.textContent = '';
            const select = document.getElementById('kategori');
            if (select) select.value = cat;
        } else {
            if (err) err.textContent = 'Kategori harus 1-30 karakter';
        }
    });

    // 🔥 EVENT LISTENER BARU
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('dark-mode-toggle')?.addEventListener('click', toggleDarkMode);

    // Inisialisasi fitur hapus massal untuk kedua view
    setupBulkDelete('transaction-list', 'select-all-main-btn', 'delete-selected-main-btn', 'selected-count-main');
    setupBulkDelete('history-list', 'select-all-history-btn', 'delete-selected-history-btn', 'selected-count-history');

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                ui.toggleModal(modal.id, false);
                if (modal.id === 'welcome-modal') {
                    sessionStorage.setItem('welcomeShown', 'true');
                }
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', init);