document.addEventListener('DOMContentLoaded', () => {
    const invoiceDataString = localStorage.getItem('demenhyoInvoiceData');
    if (!invoiceDataString) {
        document.body.innerHTML = '<h1>請求書データを読み込めませんでした。メインページに戻って再度お試しください。</h1>';
        return;
    }

    const data = JSON.parse(invoiceDataString);
    const { demenhyoData, unitPrice, overtimeUnitPrice } = data;

    // --- Populate Header & Meta Info ---
    document.getElementById('client-name-header').textContent = data.clientName;
    document.getElementById('invoice-date').textContent = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    document.getElementById('my-company-name').textContent = data.myCompanyName;
    document.getElementById('my-company-postal').textContent = data.myCompanyPostal;
    document.getElementById('my-company-address').textContent = data.myCompanyAddress;
    document.getElementById('my-company-tel').textContent = data.myCompanyTel;
    document.getElementById('my-company-manager').textContent = data.myCompanyManager;
    document.getElementById('site-name').textContent = `${demenhyoData.year}年${demenhyoData.month}月分 ${demenhyoData.siteName}`;
    document.getElementById('payment-due-date').textContent = new Date(data.paymentDueDate).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    document.title = `請求書 - ${data.clientName}`;

    // --- Populate Bank Info ---
    document.getElementById('bank-name').textContent = data.bankName;
    document.getElementById('branch-name').textContent = data.branchName;
    document.getElementById('account-number').textContent = data.accountNumber;


    // --- Generate Line Items ---
    const invoiceBody = document.getElementById('invoice-body');
    let laborSubtotal = 0;
    
    // 1. Add line items for each worker's regular days
    demenhyoData.workers.forEach(worker => {
        let regularDays = 0;
        for (let day = 1; day <= 31; day++) {
            const entryKey = `${worker.id}-${day}`;
            const entries = demenhyoData.entries[entryKey] || [];
            if (entries.some(e => e.type === 'regular')) {
                regularDays++;
            }
        }

        if (regularDays > 0) {
            const amount = regularDays * unitPrice;
            laborSubtotal += amount;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${worker.name}</td>
                <td>${demenhyoData.siteName}</td>
                <td class="text-right">${regularDays}</td>
                <td>人工</td>
                <td class="text-right">${unitPrice.toLocaleString()}</td>
                <td class="text-right">${amount.toLocaleString()}</td>
            `;
            invoiceBody.appendChild(row);
        }
    });

    // 2. Calculate and add a single line item for total overtime
    let totalOvertimeHours = 0;
    for(const key in demenhyoData.entries) {
        demenhyoData.entries[key].forEach(entry => {
            if (entry.type === 'overtime') {
                totalOvertimeHours += parseFloat(entry.hours);
            }
        });
    }

    if (totalOvertimeHours > 0) {
        const amount = totalOvertimeHours * overtimeUnitPrice;
        laborSubtotal += amount;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>残業代合計</td>
            <td>${demenhyoData.siteName}</td>
            <td class="text-right">${totalOvertimeHours.toFixed(1)}</td>
            <td>時間</td>
            <td class="text-right">${overtimeUnitPrice.toLocaleString()}</td>
            <td class="text-right">${amount.toLocaleString()}</td>
        `;
        invoiceBody.appendChild(row);
    }

    // 3. Add line items for expenses
    const expenses = {
        "ガソリン代": data.expenseGas,
        "高速代": data.expenseTolls,
        "駐車場代": data.expenseParking
    };
    let expenseTotal = 0;
    for (const [name, value] of Object.entries(expenses)) {
        if (value > 0) {
            expenseTotal += value;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>経費 (${name})</td>
                <td>-</td>
                <td class="text-right">1</td>
                <td>式</td>
                <td class="text-right">${value.toLocaleString()}</td>
                <td class="text-right">${value.toLocaleString()}</td>
            `;
            invoiceBody.appendChild(row);
        }
    }


    // --- Calculate Totals ---
    const tax = laborSubtotal * 0.10;
    const totalBeforeExpenses = laborSubtotal + tax;
    const grandTotal = totalBeforeExpenses + expenseTotal;

    // --- Populate Footer ---
    const invoiceFooter = document.getElementById('invoice-footer');
    invoiceFooter.innerHTML = `
        <tr>
            <td colspan="4" rowspan="4" style="border:none;"></td>
            <td class="text-right">小計</td>
            <td class="text-right">${laborSubtotal.toLocaleString()}</td>
        </tr>
        <tr>
            <td class="text-right">消費税 (10%)</td>
            <td class="text-right">${tax.toLocaleString()}</td>
        </tr>
        <tr>
            <td class="text-right">経費合計 (税込)</td>
            <td class="text-right">${expenseTotal.toLocaleString()}</td>
        </tr>
        <tr>
            <td class="text-right font-bold bg-slate-100">合計</td>
            <td class="text-right font-bold bg-slate-100">${grandTotal.toLocaleString()}</td>
        </tr>
    `;

    // --- Populate Total Amount Display ---
    document.getElementById('total-amount-display').textContent = `¥ ${grandTotal.toLocaleString()} (税込)`;

    // --- Attach Print Listener ---
    document.getElementById('printInvoiceBtn').addEventListener('click', () => window.print());
});