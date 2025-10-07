export function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

export function formatNumberInput(value) {
    if (!value) return '';
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) return '';
    const num = parseInt(cleaned, 10);
    return num.toLocaleString('id-ID');
}

export function parseNominalInput(formattedValue) {
    if (!formattedValue) return 0;
    const cleaned = formattedValue.replace(/\D/g, '');
    return cleaned ? parseInt(cleaned, 10) : 0;
}

export function exportToCSV(transactions, filename = 'money-notes.csv') {
    if (transactions.length === 0) {
        alert('Tidak ada data untuk diekspor.');
        return;
    }
    const headers = ['Tanggal','Kategori','Jenis','Nominal','Catatan'];
    const rows = transactions.map(t => {
        const catatan = t.catatan ? t.catatan.replace(/"/g, '""') : '';
        return `"${t.tanggal}","${t.kategori}","${t.jenis}","${t.nominal}","${catatan}"`;
    });
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function getDateRange(days) {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - days);
    return { start, end: now };
}

export function filterByDateRange(transactions, startDate, endDate) {
    return transactions.filter(t => {
        const txDate = new Date(t.tanggal);
        return txDate >= startDate && txDate <= endDate;
    });
}