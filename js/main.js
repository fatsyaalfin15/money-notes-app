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
    const dmIcon = document.getElementById('dark-mode-icon');
    if (dmIcon) dmIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

function toggleDarkMode() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('money-notes-theme', newTheme);
    const dmIcon = document.getElementById('dark-mode-icon');
    if (dmIcon) dmIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
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
    
    // Update elemen global (dashboard & ringkasan)
    ui.renderDashboard(transactions);
    ui.renderPeriodSummary(transactions);
    ui.setupExport(transactions);

    // 🔹 Render selalu keduanya, biar sinkron tanpa reload
    const mainKeyword = document.getElementById('filter-keyword')?.value.toLowerCase() || '';
    const mainJenis = document.getElementById('filter-jenis')?.value || 'all';

    const mainFiltered = transactions.filter(t => {
        const noteMatch = t.catatan ? t.catatan.toLowerCase().includes(mainKeyword) : true;
        const categoryMatch = t.kategori.toLowerCase().includes(mainKeyword);
        const jenisMatch = mainJenis === 'all' || t.jenis === mainJenis;
        return (noteMatch || categoryMatch) && jenisMatch;
    });

    // 🔹 Render kedua tampilan
    ui.renderTransactions(mainFiltered);
    ui.renderHistory(transactions);
}


function handleFormSubmit(event) {
    event.preventDefault();

    // Validasi melalui UI module (ada di ui.js)
    if (!ui.validateForm()) return;

    const formEl = document.getElementById('transaction-form');
    if (!formEl) return;

    const formData = new FormData(formEl);
    const transactionData = Object.fromEntries(formData.entries());

    // Pastikan nominal menjadi number (utils.parseNominalInput harus mengembalikan number)
    transactionData.nominal = parseNominalInput(document.getElementById('nominal')?.value) || 0;

    // Trim fields yang bisa berisi whitespace
    transactionData.kategori = (transactionData.kategori || '').trim();
    transactionData.catatan = (transactionData.catatan || '').trim();

    if (transactionData.id) {
        // Penting: konversi id ke Number agar tidak tersimpan sebagai string
        transactionData.id = Number(transactionData.id);
        state.updateTransaction(transactionData);
        showNotification('Transaksi berhasil diperbarui!', 'success');
    } else {
        // Pastikan tidak ada field id saat menambah baru
        delete transactionData.id;
        state.addTransaction(transactionData);

        // Jika kategori baru, simpan kustom
        const categories = state.loadCategories();
        if (!categories.includes(transactionData.kategori) && transactionData.kategori) {
            state.saveCustomCategory(transactionData.kategori);
            ui.renderCategories();
        }

        showNotification('Transaksi berhasil ditambahkan!', 'success');
    }

    ui.resetForm();
    refreshUI();
}

/**
 * Menangani klik pada tombol Edit dan Hapus di dalam daftar transaksi.
 * Ini adalah fungsi event handler yang akan digunakan oleh kedua view.
 */
function handleListClick(event) {
    const target = event.target;
    const item = target.closest('.transaction-item');
    if (!item) return;

    const idRaw = item.dataset.id;
    if (!idRaw) return;

    const id = parseInt(idRaw);
    if (isNaN(id)) return;

    if (target.classList.contains('edit-btn')) {
        const transaction = state.getTransactionById(id);
        if (transaction) {
            ui.populateForm(transaction);
            // UX: scroll to form after populate
            scrollToForm();
        }
        return;
    }

    if (target.classList.contains('delete-btn')) {
        // simpan id untuk dikonfirmasi
        transactionIdToDelete = Number(id);
        ui.toggleModal('delete-modal', true);
    }
}

function init() {
    // load data awal
    state.loadTransactions?.(); // safe-call jika ada
    ui.renderCategories();
    refreshUI();
    ui.resetForm();
    ui.switchView('main');
    ui.renderUserGreeting();

    initDarkMode();

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

    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    if (cancelEditBtn) {
        // Pastikan tidak submit form kalau tombol ini ditekan
        cancelEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            ui.resetForm();
        });
    }

    const filterKeyword = document.getElementById('filter-keyword');
    const filterJenis = document.getElementById('filter-jenis');
    if (filterKeyword) filterKeyword.addEventListener('input', refreshUI);
    if (filterJenis) filterJenis.addEventListener('change', refreshUI);

    // Modal cancel/confirm untuk delete (sesuai id di HTML)
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', () => {
        transactionIdToDelete = null;
        ui.toggleModal('delete-modal', false);
    });
    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', () => {
        if (transactionIdToDelete !== null) {
            // pastikan tipe id konsisten (number)
            const idToDelete = Number(transactionIdToDelete);
            state.deleteTransaction(idToDelete);
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

    // Pasang event delegation untuk list transaksi (Main & History)
    const transactionList = document.getElementById('transaction-list');
    const historyList = document.getElementById('history-list');
    if (transactionList) transactionList.addEventListener('click', handleListClick);
    if (historyList) historyList.addEventListener('click', handleListClick);

    // Logout & Dark Mode
    document.getElementById('logout-btn')?.addEventListener('click', handleLogout);
    document.getElementById('dark-mode-toggle')?.addEventListener('click', toggleDarkMode);

    // Modal close on outside click
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
