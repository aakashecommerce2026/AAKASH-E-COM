import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { PeriodType } from './admin-reports.service';
import { ReportType } from './dto/query-period-report.dto';

@Injectable()
export class ExcelExportService {
  private readonly logger = new Logger(ExcelExportService.name);

  /**
   * Generates Excel workbook buffer for any admin report data structure using ExcelJS
   */
  async generateReportExcel(
    reportType: ReportType,
    period: PeriodType,
    reportData: any,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'AAKASH E-COM Admin System';
    workbook.created = new Date();

    const sheetName = reportType.substring(0, 31);
    const worksheet = workbook.addWorksheet(sheetName);

    // Title Row
    worksheet.mergeCells('A1:F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `AAKASH E-COM — ${reportType.replace(/_/g, ' ')} (${period.toUpperCase()} REPORT)`;
    titleCell.font = {
      name: 'Calibri',
      size: 14,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F497D' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    // Metadata Row
    worksheet.mergeCells('A2:F2');
    const metaCell = worksheet.getCell('A2');
    const dateRangeStr = reportData.dateRange
      ? `Range: ${new Date(reportData.dateRange.startDate).toLocaleDateString()} to ${new Date(reportData.dateRange.endDate).toLocaleDateString()} | `
      : '';
    metaCell.value = `${dateRangeStr}Generated At: ${new Date().toLocaleString()}`;
    metaCell.font = { name: 'Calibri', size: 10, italic: true };
    metaCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(2).height = 20;

    let currentRow = 4;

    // Summary Cards Section
    if (reportData.summary) {
      worksheet.getCell(`A${currentRow}`).value = 'SUMMARY METRICS';
      worksheet.getCell(`A${currentRow}`).font = {
        bold: true,
        size: 11,
        color: { argb: 'FF1F497D' },
      };
      currentRow++;

      const summaryKeys = Object.keys(reportData.summary);
      for (const key of summaryKeys) {
        if (typeof reportData.summary[key] === 'object') continue;
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = formattedKey;
        row.getCell(1).font = { bold: true };
        row.getCell(2).value = reportData.summary[key];
        currentRow++;
      }

      currentRow++; // spacing
    }

    // Main Table Section (Trend or Detailed Data)
    const hasTrend =
      Array.isArray(reportData.trend) && reportData.trend.length > 0;
    const tableItems = hasTrend
      ? reportData.trend
      : Array.isArray(reportData.data)
        ? reportData.data
        : [];

    if (tableItems.length > 0) {
      worksheet.getCell(`A${currentRow}`).value = hasTrend
        ? 'TREND ANALYSIS'
        : 'DETAILED RECORDS';
      worksheet.getCell(`A${currentRow}`).font = {
        bold: true,
        size: 11,
        color: { argb: 'FF1F497D' },
      };
      currentRow++;

      const firstItem = tableItems[0];
      const keys = Object.keys(firstItem);

      // Header Row
      const headerRow = worksheet.getRow(currentRow);
      headerRow.height = 24;
      keys.forEach((key, idx) => {
        const colCell = headerRow.getCell(idx + 1);
        colCell.value = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        colCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        colCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF366092' },
        };
        colCell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
      currentRow++;

      // Data Rows
      tableItems.forEach((item: any, rIdx: number) => {
        const dataRow = worksheet.getRow(currentRow);
        dataRow.height = 20;

        keys.forEach((key, idx) => {
          const cell = dataRow.getCell(idx + 1);
          let val = item[key];
          if (typeof val === 'object' && val !== null) {
            val = val.name || val.memberCode || JSON.stringify(val);
          }
          cell.value = val;

          if (rIdx % 2 === 1) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF2F5F8' },
            };
          }
        });
        currentRow++;
      });

      // Auto-fit Column Widths
      worksheet.columns.forEach((column) => {
        let maxLen = 12;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const cellLen = cell.value ? String(cell.value).length : 0;
          if (cellLen > maxLen) maxLen = cellLen;
        });
        column.width = Math.min(maxLen + 4, 35);
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
