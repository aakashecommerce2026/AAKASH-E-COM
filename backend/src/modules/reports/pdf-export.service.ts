import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PeriodType } from './admin-reports.service';
import { ReportType } from './dto/query-period-report.dto';

@Injectable()
export class PdfExportService {
  private readonly logger = new Logger(PdfExportService.name);

  /**
   * Renders PDF document for any admin report data structure
   */
  async generateReportPdf(
    reportType: ReportType,
    period: PeriodType,
    reportData: any,
  ): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const page = pdfDoc.addPage([595.28, 841.89]); // A4 dimensions in points
    const { width, height } = page.getSize();
    let y = height - 50;

    // Header Background Pill
    page.drawRectangle({
      x: 30,
      y: y - 10,
      width: width - 60,
      height: 45,
      color: rgb(0.1, 0.2, 0.45),
    });

    // Title text
    page.drawText('AAKASH E-COM — ADMIN REPORT', {
      x: 45,
      y: y + 15,
      size: 16,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    const titleText = `${reportType.replace(/_/g, ' ')} (${period.toUpperCase()})`;
    page.drawText(titleText, {
      x: 45,
      y: y,
      size: 10,
      font: helveticaFont,
      color: rgb(0.9, 0.9, 0.95),
    });

    y -= 40;

    // Report Metadata
    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: 35,
      y,
      size: 9,
      font: helveticaFont,
      color: rgb(0.3, 0.3, 0.3),
    });

    if (reportData.dateRange) {
      const start = new Date(
        reportData.dateRange.startDate,
      ).toLocaleDateString();
      const end = new Date(reportData.dateRange.endDate).toLocaleDateString();
      page.drawText(`Range: ${start} — ${end}`, {
        x: width - 200,
        y,
        size: 9,
        font: helveticaFont,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    y -= 25;

    // Divider
    page.drawLine({
      start: { x: 30, y },
      end: { x: width - 30, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    y -= 25;

    // Summary Box
    page.drawText('SUMMARY METRICS', {
      x: 35,
      y,
      size: 12,
      font: helveticaBold,
      color: rgb(0.1, 0.2, 0.45),
    });

    y -= 15;

    const summaryKeys = Object.keys(reportData.summary || {});
    for (const key of summaryKeys) {
      if (typeof reportData.summary[key] === 'object') continue;
      const formattedKey = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase());
      const val = String(reportData.summary[key]);

      page.drawText(`• ${formattedKey}:`, {
        x: 45,
        y,
        size: 9,
        font: helveticaBold,
        color: rgb(0.2, 0.2, 0.2),
      });

      page.drawText(val, {
        x: 230,
        y,
        size: 9,
        font: helveticaFont,
        color: rgb(0.1, 0.4, 0.2),
      });

      y -= 14;
      if (y < 60) break;
    }

    y -= 15;

    // Trend or Data Table Header
    const hasTrend =
      Array.isArray(reportData.trend) && reportData.trend.length > 0;
    const tableItems = hasTrend
      ? reportData.trend
      : Array.isArray(reportData.data)
        ? reportData.data
        : [];

    if (tableItems.length > 0 && y > 100) {
      page.drawText(hasTrend ? 'PERIODIC TREND DATA' : 'REPORT DATA RECORDS', {
        x: 35,
        y,
        size: 12,
        font: helveticaBold,
        color: rgb(0.1, 0.2, 0.45),
      });

      y -= 20;

      // Table Header Box
      page.drawRectangle({
        x: 30,
        y: y - 5,
        width: width - 60,
        height: 20,
        color: rgb(0.9, 0.93, 0.98),
      });

      const firstItem = tableItems[0];
      const headers = Object.keys(firstItem).slice(0, 5); // display up to 5 columns
      const colWidth = (width - 70) / headers.length;

      headers.forEach((h, i) => {
        const hLabel = h
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());
        page.drawText(hLabel.substring(0, 14), {
          x: 40 + i * colWidth,
          y,
          size: 8,
          font: helveticaBold,
          color: rgb(0.1, 0.2, 0.4),
        });
      });

      y -= 20;

      // Render Rows
      tableItems.slice(0, 25).forEach((row: any, rIdx: number) => {
        if (y < 50) return;

        if (rIdx % 2 === 1) {
          page.drawRectangle({
            x: 30,
            y: y - 4,
            width: width - 60,
            height: 16,
            color: rgb(0.97, 0.97, 0.98),
          });
        }

        headers.forEach((h, i) => {
          let rawVal = row[h];
          if (typeof rawVal === 'object' && rawVal !== null) {
            rawVal = rawVal.name || rawVal.memberCode || JSON.stringify(rawVal);
          }
          const valStr = String(rawVal ?? '').substring(0, 18);

          page.drawText(valStr, {
            x: 40 + i * colWidth,
            y,
            size: 8,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2),
          });
        });

        y -= 16;
      });
    }

    // Footer
    page.drawText('Page 1 of 1 — AAKASH MLM Application Reports System', {
      x: 35,
      y: 25,
      size: 8,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}
