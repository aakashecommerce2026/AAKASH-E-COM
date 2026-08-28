import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { ExportPeriodType } from '../dto/query-export-report.dto';

@Injectable()
export class ReportExcelExportService {
  /**
   * Generates a formatted Excel spreadsheet (.xlsx) buffer for a report dataset
   */
  async generateExcel(reportData: any, period: ExportPeriodType, reportType: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AAKASH MLM System';
    workbook.created = new Date();

    // 1. Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary & KPIs');

    // Title Row
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `AAKASH MLM — ${reportType.toUpperCase().replace(/-/g, ' ')} REPORT (${period.toUpperCase()})`;
    titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    summarySheet.getRow(1).height = 30;

    // Metadata
    summarySheet.addRow([]);
    summarySheet.addRow(['Period Type:', period.toUpperCase()]);
    summarySheet.addRow(['Date Range:', reportData.dateRange ? `${reportData.dateRange.startDate} to ${reportData.dateRange.endDate}` : 'All Time']);
    summarySheet.addRow(['Generated At:', new Date().toLocaleString()]);
    summarySheet.addRow([]);

    // KPI Section
    const kpiHeaderRow = summarySheet.addRow(['Metric', 'Value']);
    kpiHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    kpiHeaderRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2563EB' } };
    });

    const summaryObj = reportData.summary || {};
    Object.entries(summaryObj).forEach(([key, val]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
      summarySheet.addRow([formattedKey, val]);
    });

    summarySheet.columns = [
      { width: 35 },
      { width: 25 },
    ];

    // 2. Trend Breakdown Sheet
    if (reportData.trend && Array.isArray(reportData.trend) && reportData.trend.length > 0) {
      const trendSheet = workbook.addWorksheet('Period Trend');

      const headers = Object.keys(reportData.trend[0]);
      const headerRow = trendSheet.addRow(headers.map((h) => h.toUpperCase()));
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
      });

      reportData.trend.forEach((item: any) => {
        const rowValues = headers.map((h) => item[h]);
        trendSheet.addRow(rowValues);
      });

      trendSheet.columns = headers.map(() => ({ width: 22 }));
    }

    // 3. Detailed Data Sheet (if data array present)
    if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
      const dataSheet = workbook.addWorksheet('Detailed Records');

      const firstRow = reportData.data[0];
      const dataHeaders = Object.keys(firstRow).filter((k) => typeof firstRow[k] !== 'object');
      const dataHeaderRow = dataSheet.addRow(dataHeaders.map((h) => h.toUpperCase()));

      dataHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      dataHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
      });

      reportData.data.forEach((item: any) => {
        const rowValues = dataHeaders.map((h) => item[h]);
        dataSheet.addRow(rowValues);
      });

      dataSheet.columns = dataHeaders.map(() => ({ width: 25 }));
    }

    const uint8Array = await workbook.xlsx.writeBuffer();
    return Buffer.from(uint8Array);
  }
}
