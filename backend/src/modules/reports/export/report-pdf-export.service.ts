import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { ExportPeriodType } from '../dto/query-export-report.dto';

@Injectable()
export class ReportPdfExportService {
  /**
   * Generates a formatted PDF document buffer for a given report dataset
   */
  async generatePdf(reportData: any, period: ExportPeriodType, reportType: string): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const primaryColor = rgb(0.1, 0.2, 0.45);
    const darkGray = rgb(0.2, 0.2, 0.2);
    const lightBg = rgb(0.95, 0.96, 0.98);
    const accentColor = rgb(0.0, 0.45, 0.75);

    let yPos = height - 40;

    // Header banner
    page.drawRectangle({
      x: 30,
      y: yPos - 35,
      width: width - 60,
      height: 45,
      color: primaryColor,
    });

    page.drawText('AAKASH MLM — OFFICIAL REPORT EXPORT', {
      x: 45,
      y: yPos - 15,
      size: 16,
      font: fontBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`Type: ${reportType.toUpperCase()} | Period: ${period.toUpperCase()}`, {
      x: 45,
      y: yPos - 30,
      size: 10,
      font: fontRegular,
      color: rgb(0.9, 0.9, 0.9),
    });

    yPos -= 60;

    // Generation timestamp & Date Range
    const dateRangeStr = reportData.dateRange
      ? `${reportData.dateRange.startDate.split('T')[0]} to ${reportData.dateRange.endDate.split('T')[0]}`
      : 'All Time';

    page.drawText(`Date Range: ${dateRangeStr}`, {
      x: 30,
      y: yPos,
      size: 10,
      font: fontRegular,
      color: darkGray,
    });

    page.drawText(`Generated At: ${new Date().toLocaleString()}`, {
      x: width - 230,
      y: yPos,
      size: 10,
      font: fontRegular,
      color: darkGray,
    });

    yPos -= 25;

    // Summary KPI Section
    page.drawText('SUMMARY METRICS', {
      x: 30,
      y: yPos,
      size: 12,
      font: fontBold,
      color: primaryColor,
    });

    yPos -= 15;

    const summaryObj = reportData.summary || {};
    const summaryEntries = Object.entries(summaryObj).filter(
      ([, val]) => typeof val === 'number' || typeof val === 'string',
    );

    page.drawRectangle({
      x: 30,
      y: yPos - Math.min(summaryEntries.length * 16, 120),
      width: width - 60,
      height: Math.min(summaryEntries.length * 16, 120) + 10,
      color: lightBg,
    });

    let kpiY = yPos - 5;
    summaryEntries.slice(0, 7).forEach(([key, val]) => {
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
      const valStr =
        typeof val === 'number' &&
        (key.toLowerCase().includes('amount') ||
          key.toLowerCase().includes('volume') ||
          key.toLowerCase().includes('earnings'))
          ? `INR ${val.toLocaleString('en-IN')}`
          : String(val);

      page.drawText(`${formattedKey}:`, {
        x: 45,
        y: kpiY,
        size: 9,
        font: fontBold,
        color: darkGray,
      });

      page.drawText(valStr, {
        x: 240,
        y: kpiY,
        size: 9,
        font: fontRegular,
        color: accentColor,
      });

      kpiY -= 16;
    });

    yPos -= Math.min(summaryEntries.length * 16, 120) + 30;

    // Trend / Breakdown Section Header
    if (reportData.trend && Array.isArray(reportData.trend) && reportData.trend.length > 0) {
      page.drawText('PERIOD TREND BREAKDOWN', {
        x: 30,
        y: yPos,
        size: 12,
        font: fontBold,
        color: primaryColor,
      });

      yPos -= 20;

      // Draw Trend Table Headers
      const sampleItem = reportData.trend[0];
      const headers = Object.keys(sampleItem).slice(0, 5);

      page.drawRectangle({
        x: 30,
        y: yPos - 15,
        width: width - 60,
        height: 20,
        color: primaryColor,
      });

      headers.forEach((h, colIdx) => {
        page.drawText(h.toUpperCase(), {
          x: 40 + colIdx * 100,
          y: yPos - 10,
          size: 8,
          font: fontBold,
          color: rgb(1, 1, 1),
        });
      });

      yPos -= 25;

      // Draw Trend Table Rows
      reportData.trend.slice(0, 15).forEach((rowItem: any, rowIdx: number) => {
        if (yPos < 50) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPos = height - 40;
        }

        if (rowIdx % 2 === 0) {
          page.drawRectangle({
            x: 30,
            y: yPos - 12,
            width: width - 60,
            height: 16,
            color: lightBg,
          });
        }

        headers.forEach((h, colIdx) => {
          const rawVal = rowItem[h];
          const displayVal =
            typeof rawVal === 'number' ? rawVal.toFixed(2) : String(rawVal ?? '');

          page.drawText(displayVal.substring(0, 18), {
            x: 40 + colIdx * 100,
            y: yPos - 8,
            size: 8,
            font: fontRegular,
            color: darkGray,
          });
        });

        yPos -= 18;
      });
    }

    // Page Numbers
    const pages = pdfDoc.getPages();
    pages.forEach((p, idx) => {
      p.drawText(`Page ${idx + 1} of ${pages.length}`, {
        x: width / 2 - 25,
        y: 20,
        size: 9,
        font: fontRegular,
        color: darkGray,
      });
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
