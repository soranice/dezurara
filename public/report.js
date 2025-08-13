document.addEventListener('DOMContentLoaded', () => {
    const reportDataString = localStorage.getItem('demenhyoReportData');
    if (!reportDataString) {
        document.body.innerHTML = '<h1>レポートデータを読み込めませんでした。メインページに戻って再度お試しください。</h1>';
        return;
    }

    const reportData = JSON.parse(reportDataString);
    const { siteName, year, month, worker, entries } = reportData;

    // --- Populate Header ---
    document.getElementById('report-siteName').textContent = siteName;
    document.getElementById('report-monthYear').textContent = `${year}年 ${month}月`;
    document.getElementById('report-workerName').textContent = worker.name;
    document.title = `月報 - ${worker.name} - ${year}年${month}月`;

    // --- Populate Table and Calculate Totals ---
    const reportBody = document.getElementById('report-body');
    const reportFooter = document.getElementById('report-footer');
    const daysInMonth = new Date(year, month, 0).getDate();
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    let totalRegularDays = 0;
    let totalOvertimeHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const entryKey = `${worker.id}-${day}`;
        const dayEntries = entries[entryKey];

        if (dayEntries && dayEntries.length > 0) {
            const date = new Date(year, month - 1, day);
            const weekday = weekdays[date.getDay()];

            dayEntries.forEach(entry => {
                const row = document.createElement('tr');
                let typeText = '';
                let detailsText = '-';

                if (entry.type === 'regular') {
                    typeText = '定時';
                    totalRegularDays++;
                } else if (entry.type === 'overtime') {
                    typeText = '残業';
                    detailsText = `${entry.hours} 時間`;
                    totalOvertimeHours += parseFloat(entry.hours);
                } else if (entry.type === 'day-off') {
                    typeText = '休日';
                }

                row.innerHTML = `
                    <td>${month}/${day}</td>
                    <td>${weekday}</td>
                    <td>${typeText}</td>
                    <td>${detailsText}</td>
                `;
                reportBody.appendChild(row);
            });
        }
    }

    // --- Populate Footer in TFOOT ---
    reportFooter.innerHTML = `
        <tr>
            <td colspan="4" style="border:none; padding-top: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-end;">
                    <div>
                        <p><strong>合計勤務日数:</strong> ${totalRegularDays} 日</p>
                        <p><strong>合計残業時間:</strong> ${totalOvertimeHours.toFixed(1)} 時間</p>
                    </div>
                    <div>
                        <p>署名: _________________________</p>
                    </div>
                </div>
            </td>
        </tr>
    `;
    
    // --- Attach Print Listener ---
    document.getElementById('printReportBtn').addEventListener('click', () => {
        window.print();
    });
});