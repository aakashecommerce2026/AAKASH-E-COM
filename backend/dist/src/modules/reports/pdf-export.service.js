"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PdfExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfExportService = void 0;
const common_1 = require("@nestjs/common");
const pdf_lib_1 = require("pdf-lib");
let PdfExportService = PdfExportService_1 = class PdfExportService {
    logger = new common_1.Logger(PdfExportService_1.name);
    async generateReportPdf(reportType, period, reportData) {
        const pdfDoc = await pdf_lib_1.PDFDocument.create();
        const helveticaFont = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(pdf_lib_1.StandardFonts.HelveticaBold);
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        let y = height - 50;
        page.drawRectangle({
            x: 30,
            y: y - 10,
            width: width - 60,
            height: 45,
            color: (0, pdf_lib_1.rgb)(0.1, 0.2, 0.45),
        });
        page.drawText('AAKASH E-COM — ADMIN REPORT', {
            x: 45,
            y: y + 15,
            size: 16,
            font: helveticaBold,
            color: (0, pdf_lib_1.rgb)(1, 1, 1),
        });
        const titleText = `${reportType.replace(/_/g, ' ')} (${period.toUpperCase()})`;
        page.drawText(titleText, {
            x: 45,
            y: y,
            size: 10,
            font: helveticaFont,
            color: (0, pdf_lib_1.rgb)(0.9, 0.9, 0.95),
        });
        y -= 40;
        page.drawText(`Generated: ${new Date().toLocaleString()}`, {
            x: 35,
            y,
            size: 9,
            font: helveticaFont,
            color: (0, pdf_lib_1.rgb)(0.3, 0.3, 0.3),
        });
        if (reportData.dateRange) {
            const start = new Date(reportData.dateRange.startDate).toLocaleDateString();
            const end = new Date(reportData.dateRange.endDate).toLocaleDateString();
            page.drawText(`Range: ${start} — ${end}`, {
                x: width - 200,
                y,
                size: 9,
                font: helveticaFont,
                color: (0, pdf_lib_1.rgb)(0.3, 0.3, 0.3),
            });
        }
        y -= 25;
        page.drawLine({
            start: { x: 30, y },
            end: { x: width - 30, y },
            thickness: 1,
            color: (0, pdf_lib_1.rgb)(0.8, 0.8, 0.8),
        });
        y -= 25;
        page.drawText('SUMMARY METRICS', {
            x: 35,
            y,
            size: 12,
            font: helveticaBold,
            color: (0, pdf_lib_1.rgb)(0.1, 0.2, 0.45),
        });
        y -= 15;
        const summaryKeys = Object.keys(reportData.summary || {});
        for (const key of summaryKeys) {
            if (typeof reportData.summary[key] === 'object')
                continue;
            const formattedKey = key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (str) => str.toUpperCase());
            const val = String(reportData.summary[key]);
            page.drawText(`• ${formattedKey}:`, {
                x: 45,
                y,
                size: 9,
                font: helveticaBold,
                color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2),
            });
            page.drawText(val, {
                x: 230,
                y,
                size: 9,
                font: helveticaFont,
                color: (0, pdf_lib_1.rgb)(0.1, 0.4, 0.2),
            });
            y -= 14;
            if (y < 60)
                break;
        }
        y -= 15;
        const hasTrend = Array.isArray(reportData.trend) && reportData.trend.length > 0;
        const tableItems = hasTrend ? reportData.trend : Array.isArray(reportData.data) ? reportData.data : [];
        if (tableItems.length > 0 && y > 100) {
            page.drawText(hasTrend ? 'PERIODIC TREND DATA' : 'REPORT DATA RECORDS', {
                x: 35,
                y,
                size: 12,
                font: helveticaBold,
                color: (0, pdf_lib_1.rgb)(0.1, 0.2, 0.45),
            });
            y -= 20;
            page.drawRectangle({
                x: 30,
                y: y - 5,
                width: width - 60,
                height: 20,
                color: (0, pdf_lib_1.rgb)(0.9, 0.93, 0.98),
            });
            const firstItem = tableItems[0];
            const headers = Object.keys(firstItem).slice(0, 5);
            const colWidth = (width - 70) / headers.length;
            headers.forEach((h, i) => {
                const hLabel = h.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                page.drawText(hLabel.substring(0, 14), {
                    x: 40 + i * colWidth,
                    y,
                    size: 8,
                    font: helveticaBold,
                    color: (0, pdf_lib_1.rgb)(0.1, 0.2, 0.4),
                });
            });
            y -= 20;
            tableItems.slice(0, 25).forEach((row, rIdx) => {
                if (y < 50)
                    return;
                if (rIdx % 2 === 1) {
                    page.drawRectangle({
                        x: 30,
                        y: y - 4,
                        width: width - 60,
                        height: 16,
                        color: (0, pdf_lib_1.rgb)(0.97, 0.97, 0.98),
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
                        color: (0, pdf_lib_1.rgb)(0.2, 0.2, 0.2),
                    });
                });
                y -= 16;
            });
        }
        page.drawText('Page 1 of 1 — AAKASH MLM Application Reports System', {
            x: 35,
            y: 25,
            size: 8,
            font: helveticaFont,
            color: (0, pdf_lib_1.rgb)(0.5, 0.5, 0.5),
        });
        const pdfBytes = await pdfDoc.save();
        return Buffer.from(pdfBytes);
    }
};
exports.PdfExportService = PdfExportService;
exports.PdfExportService = PdfExportService = PdfExportService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfExportService);
//# sourceMappingURL=pdf-export.service.js.map