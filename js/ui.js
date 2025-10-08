import { formatCurrency, formatNumberInput, getDateRange, filterByDateRange } from './utils.js';
import * as state from './state.js';

const elements = {
    totalPemasukan: document.getElementById('total-pemasukan'),
    totalPengeluaran: document.getElementById('total-pengeluaran'),
    saldoAkhir: document.getElementById('saldo-akhir'),
    periodSummary: document.getElementById('period-summary'),
    mainView: document.getElementById('main-view'),
    historyView: document.getElementById('history-view'),
    navMainBtn: document.getElementById('nav-main-btn'),
    navHistoryBtn: document.getElementById('nav-history-btn'),
    form: document.getElementById('transaction-form'),
    formTitle: document.getElementById('form-title'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),
    submitBtn: document.getElementById('submit-btn'),
    tanggal: document.getElementById('tanggal'),
    kategori: document.getElementById('kategori'),
    jenis: document.getElementById('jenis'),
    nominal: document.getElementById('nominal'),
    catatan: document.getElementById('catatan'),
    errorTanggal: document.getElementById('error-tanggal'),
    errorKategori: document.getElementById('error-kategori'),
    errorJenis: document.getElementById('error-jenis'),
    errorNominal: document.getElementById('error-nominal'),
    transactionList: document.getElementById('transaction-list'),
    historyList: document.getElementById('history-list'),
    deleteModal: document.getElementById('delete-modal'),
    welcomeModal: document.getElementById('welcome-modal'),
    categoryModal: document.getElementById('category-modal'),
    newCategoryInput: document.getElementById('new-category'),
    errorNewCategory: document.getElementById('error-new-category'),
    exportBtn: document.getElementById('export-btn'),
    exportBtn2: document.getElementById('export-btn-2'),
    addCategoryBtn: document.getElementById('add-category-btn')
};

// ======================
// VALIDASI FORM
// ======================
export function validateField(field, value) {
    const errorElement = elements[`error${field.charAt(0).toUpperCase() + field.slice(1)}`];
    let error = null;

    if (field === 'tanggal') {
        if (!value) {
            error = "Tanggal wajib diisi";
        } else {
            const parts = value.split('-');
            const inputDate = new Date(parts[0], parts[1] - 1, parts[2]);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (inputDate > today) {
                error = "Tanggal tidak boleh di masa depan";
            }
        }
    } else if (field === 'kategori') {
        if (!value) error = "Pilih kategori";
    } else if (field === 'jenis') {
        if (!value) error = "Pilih jenis transaksi";
    } else if (field === 'nominal') {
        const num = formatNumberInput(value) ? parseInt(formatNumberInput(value).replace(/\D/g, '')) : 0;
        if (!value || num === 0) error = "Nominal harus lebih dari 0";
        else if (num > 1000000000) error = "Nominal terlalu besar";
    }

    if (errorElement) {
        errorElement.textContent = error || '';
        if (elements[field]) {
            elements[field].classList.toggle('invalid', !!error);
        }
    }
    return !error;
}

export function validateForm() {
    const isTanggalValid = validateField('tanggal', elements.tanggal?.value || '');
    const isKategoriValid = validateField('kategori', elements.kategori?.value || '');
    const isJenisValid = validateField('jenis', elements.jenis?.value || '');
    const isNominalValid = validateField('nominal', elements.nominal?.value || '');
    return isTanggalValid && isKategoriValid && isJenisValid && isNominalValid;
}

// ======================
// RENDER DASHBOARD
// ======================
export function renderCategories() {
    const select = elements.kategori;
    if (!select) return;
    const categories = state.loadCategories();
    select.innerHTML = '<option value="" disabled selected>-- Pilih atau Tambah --</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        select.appendChild(option);
    });
}

export function renderDashboard(transactions) {
    const pemasukan = transactions.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.nominal, 0);
    const pengeluaran = transactions.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.nominal, 0);
    const saldo = pemasukan - pengeluaran;

    if (elements.totalPemasukan) elements.totalPemasukan.textContent = formatCurrency(pemasukan);
    if (elements.totalPengeluaran) elements.totalPengeluaran.textContent = formatCurrency(pengeluaran);
    if (elements.saldoAkhir) elements.saldoAkhir.textContent = formatCurrency(saldo);
}

// ======================
// RINGKASAN PERIODE
// ======================
export function renderPeriodSummary(transactions) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayTx = transactions.filter(t => new Date(t.tanggal).toDateString() === today.toDateString());
    const weekTx = filterByDateRange(transactions, thisWeekStart, today);
    const monthTx = filterByDateRange(transactions, thisMonthStart, today);

    const todayIncome = todayTx.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.nominal, 0);
    const todayExpense = todayTx.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.nominal, 0);
    const weekIncome = weekTx.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.nominal, 0);
    const weekExpense = weekTx.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.nominal, 0);
    const monthIncome = monthTx.filter(t => t.jenis === 'pemasukan').reduce((sum, t) => sum + t.nominal, 0);
    const monthExpense = monthTx.filter(t => t.jenis === 'pengeluaran').reduce((sum, t) => sum + t.nominal, 0);

    if (elements.periodSummary) {
        elements.periodSummary.innerHTML = `
            <div class="period-card">
                <h3>Hari Ini</h3>
                <div class="amount income">+ ${formatCurrency(todayIncome)}</div>
                <div class="amount expense">- ${formatCurrency(todayExpense)}</div>
            </div>
            <div class="period-card">
                <h3>Minggu Ini</h3>
                <div class="amount income">+ ${formatCurrency(weekIncome)}</div>
                <div class="amount expense">- ${formatCurrency(weekExpense)}</div>
            </div>
            <div class="period-card">
                <h3>Bulan Ini</h3>
                <div class="amount income">+ ${formatCurrency(monthIncome)}</div>
                <div class="amount expense">- ${formatCurrency(monthExpense)}</div>
            </div>
        `;
    }
}

// ======================
// RENDER TRANSAKSI
// ======================
function createTransactionItemHTML(tx) {
    const id = Number(tx.id);
    const type = tx.jenis;
    const sign = type === 'pemasukan' ? '+' : '-';
    const date = new Date(tx.tanggal);
    const formattedDate = date.toLocaleDateString('id-ID', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });

    return `
        <div class="transaction-item ${type}" data-id="${id}">
            <div class="transaction-details">
                <p data-category="${tx.kategori}">${tx.kategori}</p>
                <small>${formattedDate}</small>
                <small class="catatan">${tx.catatan || 'Catatan Kosong'}</small>
            </div>
            <div class="transaction-actions">
                <p class="nominal ${type}">${sign} ${formatCurrency(tx.nominal)}</p>
                <div class="action-buttons">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Hapus</button>
                </div>
            </div>
        </div>
    `;
}

export function renderTransactions(transactions) {
    const hasTransactions = transactions.length > 0;
    if (elements.transactionList) {
        elements.transactionList.innerHTML = hasTransactions 
            ? transactions.map(createTransactionItemHTML).join('')
            : '<p style="text-align:center;color:var(--text-light);padding:1.5rem;">Belum ada transaksi.</p>';
    }
}

export function renderHistory(transactions) {
    const grouped = transactions.reduce((acc, tx) => {
        const date = tx.tanggal;
        if (!acc[date]) acc[date] = [];
        acc[date].push(tx);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

    const hasTransactions = sortedDates.length > 0;
    if (elements.historyList) {
        if (!hasTransactions) {
            elements.historyList.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:1.5rem;">Belum ada riwayat transaksi.</p>';
        } else {
            let html = '';
            for (const date of sortedDates) {
                const formattedDate = new Date(date).toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                html += `<div class="date-group">`;
                html += `<h3 class="date-header">${formattedDate}</h3>`;
                html += grouped[date].map(createTransactionItemHTML).join('');
                html += `</div>`;
            }
            elements.historyList.innerHTML = html;
        }
    }
}

// ======================
// FORM HANDLER
// ======================
export function populateForm(transaction) {
    const form = document.getElementById('transaction-form');
    const formTitle = document.getElementById('form-title');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const submitBtn = document.getElementById('submit-btn');
    
    if (!form) return;

    form.querySelector('#transaction-id').value = transaction.id;
    form.querySelector('#tanggal').value = transaction.tanggal;
    form.querySelector('#kategori').value = transaction.kategori;
    form.querySelector('#jenis').value = transaction.jenis;
    form.querySelector('#nominal').value = formatNumberInput(transaction.nominal.toString());
    form.querySelector('#catatan').value = transaction.catatan || '';
    
    if (formTitle) formTitle.textContent = 'Edit Transaksi';
    if (submitBtn) submitBtn.textContent = 'Update Transaksi';
    if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';

    switchView('main');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function resetForm() {
    const form = document.getElementById('transaction-form');
    if (!form) return;
    form.reset();

    const txIdInput = document.getElementById('transaction-id');
    if (txIdInput) txIdInput.value = '';

    const formTitle = document.getElementById('form-title');
    const submitBtn = document.getElementById('submit-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');

    if (formTitle) formTitle.textContent = 'Tambah Transaksi Baru';
    if (submitBtn) submitBtn.textContent = 'Simpan Transaksi';
    if (cancelEditBtn) cancelEditBtn.style.display = 'none';

    const tanggalEl = document.getElementById('tanggal');
    if (tanggalEl) tanggalEl.valueAsDate = new Date();

    ['tanggal','kategori','jenis','nominal'].forEach(name => {
        const errEl = document.getElementById(`error-${name}`);
        if (errEl) errEl.textContent = '';
        const inputEl = document.getElementById(name);
        if (inputEl && inputEl.classList) inputEl.classList.remove('invalid');
    });
}

// ======================
// MODAL KONFIRMASI HAPUS
// ======================
export function showDeleteModal(transactionId, confirmCallback) {
    const modal = document.getElementById('delete-modal');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');

    if (!modal || !confirmBtn || !cancelBtn) return;

    modal.style.display = 'flex';

    const onConfirm = () => {
        confirmCallback(transactionId);
        closeModal();
    };

    const closeModal = () => {
        modal.style.display = 'none';
        confirmBtn.removeEventListener('click', onConfirm);
        cancelBtn.removeEventListener('click', closeModal);
    };

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', closeModal);
}

// ======================
// LAINNYA
// ======================
export function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
}

export function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = show ? 'flex' : 'none';
}

export function switchView(viewName) {
    if (viewName === 'main') {
        if (elements.mainView) elements.mainView.style.display = 'block';
        if (elements.historyView) elements.historyView.style.display = 'none';
        if (elements.navMainBtn) elements.navMainBtn.classList.add('active');
        if (elements.navHistoryBtn) elements.navHistoryBtn.classList.remove('active');
    } else {
        if (elements.mainView) elements.mainView.style.display = 'none';
        if (elements.historyView) elements.historyView.style.display = 'block';
        if (elements.navMainBtn) elements.navMainBtn.classList.remove('active');
        if (elements.navHistoryBtn) elements.navHistoryBtn.classList.add('active');
    }
}

export function setupExport(transactions) {
    if (elements.exportBtn) {
        elements.exportBtn.onclick = () => import('./utils.js').then(utils => utils.exportToCSV(transactions));
    }
    if (elements.exportBtn2) {
        elements.exportBtn2.onclick = () => import('./utils.js').then(utils => utils.exportToCSV(transactions));
    }
}

export function renderUserGreeting() {
    const userJson = localStorage.getItem('money-notes-current-user');
    const greetingEl = document.getElementById('user-greeting');
    if (userJson && greetingEl) {
        try {
            const user = JSON.parse(userJson);
            greetingEl.textContent = `Halo, ${user.name}!`;
        } catch (e) {
            greetingEl.textContent = 'Halo, User!';
        }
    }
}
