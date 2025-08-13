document.addEventListener('DOMContentLoaded', () => {
    // --- STATE ---
    let appData = {
        siteName: "本社プロジェクト",
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        workers: [],
        entries: {}
    };
    let activeCell = { workerId: null, day: null };
    let activeWorkerForReport = null;

    // --- DOM ELEMENTS ---
    const siteNameInput = document.getElementById('siteName');
    const currentMonthYearEl = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const addWorkerBtn = document.getElementById('addWorkerBtn');
    const printButton = document.getElementById('printButton');
    const createInvoiceBtn = document.getElementById('createInvoiceBtn');
    const gridBody = document.getElementById('grid-body');
    const gridHeader = document.getElementById('grid-header');
    const gridFooter = document.getElementById('grid-footer');
    
    // Print Elements
    const printSiteNameEl = document.getElementById('printSiteName');
    const printMonthYearEl = document.getElementById('printMonthYear');

    // Entry Modal Elements
    const entryModal = document.getElementById('entryModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.getElementById('modalSubtitle');
    const workTypeSelect = document.getElementById('workType');
    const overtimeHoursInputDiv = document.getElementById('overtime-hours-input');
    const overtimeHoursSelect = document.getElementById('overtimeHours');
    const entryListDiv = document.getElementById('entry-list');
    const saveEntryBtn = document.getElementById('saveEntryBtn');
    const cancelModalBtn = document.getElementById('cancelModal');
    const deleteEntryBtn = document.getElementById('deleteEntryBtn');
    
    // Report Modal Elements
    const reportModal = document.getElementById('reportModal');
    const reportModalWorkerName = document.getElementById('reportModalWorkerName');
    const cancelReportModal = document.getElementById('cancelReportModal');
    const generateReportBtn = document.getElementById('generateReportBtn');

    // Add Worker Modal Elements
    const addWorkerModal = document.getElementById('addWorkerModal');
    const newWorkerNameInput = document.getElementById('newWorkerName');
    const cancelAddWorkerModal = document.getElementById('cancelAddWorkerModal');
    const saveNewWorkerBtn = document.getElementById('saveNewWorkerBtn');
    
    // Invoice Modal Elements
    const invoiceModal = document.getElementById('invoiceModal');
    const cancelInvoiceModal = document.getElementById('cancelInvoiceModal');
    const generateInvoiceBtn = document.getElementById('generateInvoiceBtn');
    const invoiceFieldIds = [
        'clientName', 'paymentDueDate', 'myCompanyName', 'myCompanyTel',
        'myCompanyPostal', 'myCompanyManager', 'myCompanyAddress', 'bankName',
        'branchName', 'accountNumber', 'unitPrice', 'overtimeUnitPrice',
        'expenseGas', 'expenseTolls', 'expenseParking'
    ];


    // --- INITIALIZATION ---
    function initialize() {
        loadDataFromServer();
        attachEventListeners();
    }

    // --- RENDER FUNCTIONS ---
    function render() {
        renderHeader();
        renderBody();
        renderFooter();
    }

    function renderHeader() {
        const { year, month } = appData;
        const daysInMonth = new Date(year, month, 0).getDate();
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        let headerHTML = '<tr><th class="worker-name-cell p-2">作業員</th>';
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const weekday = weekdays[date.getDay()];
            let dayClass = '';
            if (weekday === '日') dayClass = 'text-red-500';
            if (weekday === '土') dayClass = 'text-blue-500';
            headerHTML += `<th class="p-2 day-header-cell"><div class="text-sm font-normal ${dayClass}">${weekday}</div><div class="text-lg">${day}</div></th>`;
        }
        headerHTML += '<th class="p-2 min-w-[120px] total-cell">合計</th></tr>';
        gridHeader.innerHTML = headerHTML;
        const monthYearText = `${year}年 ${month}月`;
        currentMonthYearEl.textContent = monthYearText;
        printMonthYearEl.textContent = monthYearText;
        printSiteNameEl.textContent = appData.siteName;
    }

    function renderBody() {
        let bodyHTML = '';
        appData.workers.forEach(worker => {
            bodyHTML += `<tr><td class="worker-name-cell worker-name-cell-interactive" data-worker-id="${worker.id}">
                <div class="flex items-center justify-between h-full">
                    <span>${worker.name}</span>
                    <button class="remove-worker-btn text-slate-300 hover:text-red-500 text-xl transition-colors" data-worker-id="${worker.id}">&times;</button>
                </div>
            </td>`;
            const daysInMonth = new Date(appData.year, appData.month, 0).getDate();
            let totalOvertimeHours = 0;
            let regularWorkDays = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const entryKey = `${worker.id}-${day}`;
                const entries = appData.entries[entryKey] || [];
                bodyHTML += `<td class="day-cell" data-worker-id="${worker.id}" data-day="${day}">`;
                entries.forEach(entry => {
                    let text = '';
                    if (entry.type === 'regular') {
                        text = '定時';
                        regularWorkDays++;
                    } else if (entry.type === 'overtime') {
                        text = `残業 ${entry.hours}h`;
                        totalOvertimeHours += parseFloat(entry.hours);
                    } else if (entry.type === 'day-off') {
                        text = '休日';
                    }
                    bodyHTML += `<div class="work-entry ${entry.type}">${text}</div>`;
                });
                bodyHTML += '</td>';
            }
            bodyHTML += `<td class="summary-cell p-2 total-cell">${regularWorkDays}日 / ${totalOvertimeHours.toFixed(1)}h</td></tr>`;
        });
        gridBody.innerHTML = bodyHTML;
    }

    function renderFooter() {
        const daysInMonth = new Date(appData.year, appData.month, 0).getDate();
        const summaries = { regular: Array(daysInMonth + 1).fill(0), overtime: {} };
        for (const key in appData.entries) {
            const [workerId, day] = key.split('-');
            const dayIndex = parseInt(day);
            appData.entries[key].forEach(entry => {
                if (entry.type === 'regular') {
                    summaries.regular[dayIndex]++;
                } else if (entry.type === 'overtime') {
                    const hours = entry.hours;
                    if (!summaries.overtime[hours]) summaries.overtime[hours] = Array(daysInMonth + 1).fill(0);
                    summaries.overtime[hours][dayIndex]++;
                }
            });
        }
        let footerHTML = `<tr><td class="summary-label-cell p-2">定時</td>`;
        let totalRegular = 0;
        for (let day = 1; day <= daysInMonth; day++) {
            footerHTML += `<td class="summary-cell">${summaries.regular[day] || 0}</td>`;
            totalRegular += summaries.regular[day] || 0;
        }
        footerHTML += `<td class="summary-cell font-bold total-cell">${totalRegular}</td></tr>`;
        const overtimeHours = Object.keys(summaries.overtime).sort((a, b) => parseFloat(a) - parseFloat(b));
        overtimeHours.forEach(hour => {
            footerHTML += `<tr><td class="summary-label-cell p-2">残業 ${hour}時間</td>`;
            let totalOvertime = 0;
            for (let day = 1; day <= daysInMonth; day++) {
                const count = summaries.overtime[hour]?.[day] || 0;
                footerHTML += `<td class="summary-cell">${count}</td>`;
                totalOvertime += count;
            }
            footerHTML += `<td class="summary-cell font-bold total-cell">${totalOvertime}</td></tr>`;
        });
        gridFooter.innerHTML = footerHTML;
    }

    function renderModalEntries() {
        const { workerId, day } = activeCell;
        const entryKey = `${workerId}-${day}`;
        const entries = appData.entries[entryKey] || [];
        entryListDiv.innerHTML = '';
        if (entries.length > 0) {
            entries.forEach(entry => {
                let text = '';
                if (entry.type === 'regular') text = '定時';
                else if (entry.type === 'overtime') text = `残業 ${entry.hours}h`;
                else if (entry.type === 'day-off') text = '休日';
                const entryDiv = document.createElement('div');
                entryDiv.className = `work-entry ${entry.type} text-white p-2 flex justify-between items-center`;
                entryDiv.innerHTML = `<span>${text}</span>`;
                entryListDiv.appendChild(entryDiv);
            });
        } else {
            entryListDiv.innerHTML = '<p class="text-slate-400 text-center text-sm">この日の勤務記録はありません</p>';
        }
    }

    // --- EVENT LISTENERS ---
    function attachEventListeners() {
        prevMonthBtn.addEventListener('click', () => changeMonth(-1));
        nextMonthBtn.addEventListener('click', () => changeMonth(1));
        siteNameInput.addEventListener('change', handleSiteNameChange);
        addWorkerBtn.addEventListener('click', () => openModal(addWorkerModal));
        printButton.addEventListener('click', () => window.print());
        createInvoiceBtn.addEventListener('click', () => openModal(invoiceModal));
        gridBody.addEventListener('click', handleGridClick);
        
        // Entry Modal Listeners
        entryModal.addEventListener('click', (e) => e.target === entryModal && closeModal(entryModal));
        cancelModalBtn.addEventListener('click', () => closeModal(entryModal));
        saveEntryBtn.addEventListener('click', handleSaveEntry);
        deleteEntryBtn.addEventListener('click', handleDeleteEntry);
        workTypeSelect.addEventListener('change', toggleModalInputs);
        
        // Report Modal Listeners
        reportModal.addEventListener('click', (e) => e.target === reportModal && closeModal(reportModal));
        cancelReportModal.addEventListener('click', () => closeModal(reportModal));
        generateReportBtn.addEventListener('click', handleGenerateReport);

        // Add Worker Modal Listeners
        addWorkerModal.addEventListener('click', (e) => e.target === addWorkerModal && closeModal(addWorkerModal));
        cancelAddWorkerModal.addEventListener('click', () => closeModal(addWorkerModal));
        saveNewWorkerBtn.addEventListener('click', handleSaveNewWorker);

        // Invoice Modal Listeners
        invoiceModal.addEventListener('click', (e) => e.target === invoiceModal && closeModal(invoiceModal));
        cancelInvoiceModal.addEventListener('click', () => closeModal(invoiceModal));
        generateInvoiceBtn.addEventListener('click', handleGenerateInvoice);
        invoiceFieldIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', saveInvoiceDraft);
            }
        });
    }

    // --- HANDLER FUNCTIONS ---
    function handleGridClick(e) {
        const workerNameCell = e.target.closest('.worker-name-cell-interactive');
        const dayCell = e.target.closest('.day-cell');
        const removeBtn = e.target.closest('.remove-worker-btn');

        if (removeBtn) {
            handleRemoveWorker(removeBtn);
        } else if (workerNameCell) {
            handleWorkerNameClick(workerNameCell);
        } else if (dayCell) {
            handleDayCellClick(dayCell);
        }
    }
    
    function handleWorkerNameClick(cell) {
        const workerId = parseInt(cell.dataset.workerId);
        const worker = appData.workers.find(w => w.id === workerId);
        if (worker) {
            activeWorkerForReport = worker;
            reportModalWorkerName.textContent = `「${worker.name}」`;
            openModal(reportModal);
        }
    }

    function handleDayCellClick(cell) {
        activeCell.workerId = parseInt(cell.dataset.workerId);
        activeCell.day = parseInt(cell.dataset.day);
        const worker = appData.workers.find(w => w.id === activeCell.workerId);
        modalTitle.textContent = worker.name;
        modalSubtitle.textContent = `${appData.year}年${appData.month}月${activeCell.day}日`;
        workTypeSelect.value = 'regular';
        toggleModalInputs();
        renderModalEntries();
        openModal(entryModal);
    }
    
    function changeMonth(direction) {
        const newDate = new Date(appData.year, appData.month - 1 + direction, 1);
        appData.year = newDate.getFullYear();
        appData.month = newDate.getMonth() + 1;
        loadDataFromServer();
    }

    function handleSiteNameChange() {
        const newName = siteNameInput.value.trim();
        if (newName && newName !== appData.siteName) {
            appData.siteName = newName;
            printSiteNameEl.textContent = newName;
            saveDataToServer();
        }
    }
    
    function handleSaveNewWorker() {
        const workerName = newWorkerNameInput.value.trim();
        if (workerName) {
            const newWorker = { id: Date.now(), name: workerName };
            appData.workers.push(newWorker);
            saveDataToServer();
            render();
            closeModal(addWorkerModal);
        }
    }

    function handleRemoveWorker(button) {
        const workerId = parseInt(button.dataset.workerId);
        if (confirm('この作業員を削除しますか？関連する勤務記録もすべて削除されます。')) {
            appData.workers = appData.workers.filter(w => w.id !== workerId);
            for(const key in appData.entries) {
                if(key.startsWith(`${workerId}-`)) delete appData.entries[key];
            }
            saveDataToServer();
            render();
        }
    }

    function handleSaveEntry() {
        const { workerId, day } = activeCell;
        const entryKey = `${workerId}-${day}`;
        const workType = workTypeSelect.value;
        if (!appData.entries[entryKey]) appData.entries[entryKey] = [];
        let newEntry = { type: workType };
        if (workType === 'overtime') newEntry.hours = overtimeHoursSelect.value;
        appData.entries[entryKey].push(newEntry);
        saveDataToServer();
        render();
        renderModalEntries();
    }

    function handleDeleteEntry() {
        const { workerId, day } = activeCell;
        const entryKey = `${workerId}-${day}`;
        if (appData.entries[entryKey]) {
            delete appData.entries[entryKey];
            saveDataToServer();
            render();
            closeModal(entryModal);
        }
    }
    
    function handleGenerateReport() {
        const workerEntries = {};
        for (const key in appData.entries) {
            if (key.startsWith(`${activeWorkerForReport.id}-`)) {
                workerEntries[key] = appData.entries[key];
            }
        }
        const reportData = {
            siteName: appData.siteName,
            year: appData.year,
            month: appData.month,
            worker: activeWorkerForReport,
            entries: workerEntries
        };
        localStorage.setItem('demenhyoReportData', JSON.stringify(reportData));
        window.open('report.html', '_blank');
        closeModal(reportModal);
    }

    function handleGenerateInvoice() {
        const invoiceData = {
            clientName: document.getElementById('clientName').value,
            paymentDueDate: document.getElementById('paymentDueDate').value,
            myCompanyName: document.getElementById('myCompanyName').value,
            myCompanyTel: document.getElementById('myCompanyTel').value,
            myCompanyPostal: document.getElementById('myCompanyPostal').value,
            myCompanyManager: document.getElementById('myCompanyManager').value,
            myCompanyAddress: document.getElementById('myCompanyAddress').value,
            bankName: document.getElementById('bankName').value,
            branchName: document.getElementById('branchName').value,
            accountNumber: document.getElementById('accountNumber').value,
            unitPrice: parseFloat(document.getElementById('unitPrice').value) || 0,
            overtimeUnitPrice: parseFloat(document.getElementById('overtimeUnitPrice').value) || 0,
            expenseGas: parseFloat(document.getElementById('expenseGas').value) || 0,
            expenseTolls: parseFloat(document.getElementById('expenseTolls').value) || 0,
            expenseParking: parseFloat(document.getElementById('expenseParking').value) || 0,
            demenhyoData: appData
        };
        localStorage.setItem('demenhyoInvoiceData', JSON.stringify(invoiceData));
        window.open('invoice.html', '_blank');
        closeModal(invoiceModal);
    }

    // --- INVOICE DRAFT LOGIC ---
    function saveInvoiceDraft() {
        const draftData = {};
        invoiceFieldIds.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                draftData[id] = input.value;
            }
        });
        localStorage.setItem('demenhyoInvoiceDraft', JSON.stringify(draftData));
    }

    function loadInvoiceDraft() {
        const draftDataString = localStorage.getItem('demenhyoInvoiceDraft');
        if (draftDataString) {
            const draftData = JSON.parse(draftDataString);
            invoiceFieldIds.forEach(id => {
                const input = document.getElementById(id);
                if (input && draftData[id]) {
                    input.value = draftData[id];
                }
            });
        }
    }

    // --- MODAL LOGIC ---
    function openModal(modalElement) {
        if (modalElement === addWorkerModal) {
            newWorkerNameInput.value = '';
            setTimeout(() => newWorkerNameInput.focus(), 50);
        } else if (modalElement === invoiceModal) {
            loadInvoiceDraft();
            const paymentDueDateInput = document.getElementById('paymentDueDate');
            if (!paymentDueDateInput.value) {
                const today = new Date();
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                paymentDueDateInput.value = nextMonth.toISOString().split('T')[0];
            }
        }
        modalElement.classList.add('visible');
    }

    function closeModal(modalElement) {
        modalElement.classList.remove('visible');
    }
    
    function toggleModalInputs() {
        overtimeHoursInputDiv.style.display = workTypeSelect.value === 'overtime' ? 'block' : 'none';
    }

    // --- SERVER COMMUNICATION ---
    async function loadDataFromServer() {
        const { siteName, year, month } = appData;
        const encodedSiteName = encodeURIComponent(siteName);
        try {
            const response = await fetch(`/api/data/${encodedSiteName}/${year}/${month}`);
            if (!response.ok) throw new Error('No data found, starting fresh.');
            const data = await response.json();
            appData.workers = data.workers || [];
            appData.entries = data.entries || {};
        } catch (error) {
            console.warn(error.message);
            appData.workers = [];
            appData.entries = {};
        }
        render();
    }

    async function saveDataToServer() {
        const { siteName, year, month } = appData;
        const dataToSave = { workers: appData.workers, entries: appData.entries };
        const encodedSiteName = encodeURIComponent(siteName);
        try {
            await fetch(`/api/data/${encodedSiteName}/${year}/${month}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSave),
            });
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    initialize();
});