/**
 * Export tabular data to Excel (CSV format readable directly by Excel)
 * @param {string} filename - Output file name without extension
 * @param {Array<{label: string, key: string, format?: Function}>} columns
 * @param {Array<Object>} data
 */
export const exportToExcel = (filename, columns, data) => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  // Create Header Row
  const headers = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(',');

  // Create Data Rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        let val = row[col.key];
        if (col.format && typeof col.format === 'function') {
          val = col.format(val, row);
        }
        if (val === null || val === undefined) val = '';
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(',');
  });

  const csvContent = '\uFEFF' + [headers, ...rows].join('\n'); // Add UTF-8 BOM
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export report to PDF via print document preview window
 * @param {string} title - Document title
 * @param {Array<{label: string, key: string, format?: Function}>} columns
 * @param {Array<Object>} data
 * @param {Array<{title: string, value: string}>} summaryMetrics
 */
export const exportToPDF = (title, columns, data, summaryMetrics = []) => {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const printWindow = window.open('', '_blank', 'width=950,height=750');
  if (!printWindow) {
    alert('Please allow popups to generate PDF reports.');
    return;
  }

  const metricsHtml = summaryMetrics.length
    ? `
      <div style="display: flex; gap: 16px; margin-bottom: 24px;">
        ${summaryMetrics
          .map(
            (m) => `
          <div style="flex: 1; padding: 12px 16px; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px;">
            <div style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">${m.title}</div>
            <div style="font-size: 18px; font-weight: 800; color: #064E3B; margin-top: 4px;">${m.value}</div>
          </div>
        `
          )
          .join('')}
      </div>
    `
    : '';

  const tableHeadersHtml = columns
    .map(
      (col) =>
        `<th style="padding: 10px 12px; background-color: #064E3B; color: #ffffff; font-size: 12px; text-align: left; font-weight: 600;">${col.label}</th>`
    )
    .join('');

  const tableRowsHtml = data
    .map((row, index) => {
      const bg = index % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
      const cells = columns
        .map((col) => {
          let val = row[col.key];
          if (col.format && typeof col.format === 'function') {
            val = col.format(val, row);
          }
          return `<td style="padding: 10px 12px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #1E293B;">${val !== undefined && val !== null ? val : '-'}</td>`;
        })
        .join('');
      return `<tr style="background-color: ${bg};">${cells}</tr>`;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - AAKASH E MART</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 30px;
            color: #0F172A;
            background: #FFFFFF;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #064E3B;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #064E3B;
            letter-spacing: -0.5px;
          }
          .brand span {
            color: #CA8A04;
          }
          .meta {
            text-align: right;
            font-size: 12px;
            color: #64748B;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #E2E8F0;
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #94A3B8;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">AAKASH <span>E MART</span></div>
            <h2 style="margin: 4px 0 0 0; font-size: 18px; color: #1E293B;">${title}</h2>
          </div>
          <div class="meta">
            <div><strong>Generated:</strong> ${new Date().toLocaleString('en-IN')}</div>
            <div><strong>System Report:</strong> Automated Ledger</div>
          </div>
        </div>

        ${metricsHtml}

        <table>
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <div>AAKASH MLM Management Portal &copy; ${new Date().getFullYear()}</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
};
