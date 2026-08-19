"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ExcelExportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelExportService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
let ExcelExportService = ExcelExportService_1 = class ExcelExportService {
    logger = new common_1.Logger(ExcelExportService_1.name);
    async generateReportExcel(reportType, period, reportData) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AAKASH E-COM Admin System';
        workbook.created = new Date();
        const sheetName = reportType.substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);
        worksheet.mergeCells('A1:F1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `AAKASH E-COM — ${reportType.replace(/_/g, ' ')} (${period.toUpperCase()} REPORT)`;
        titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1F497D' },
        };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 30;
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
        if (reportData.summary) {
            worksheet.getCell(`A${currentRow}`).value = 'SUMMARY METRICS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11, color: { argb: 'FF1F497D' } };
            currentRow++;
            const summaryKeys = Object.keys(reportData.summary);
            for (const key of summaryKeys) {
                if (typeof reportData.summary[key] === 'object')
                    continue;
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                const row = worksheet.getRow(currentRow);
                row.getCell(1).value = formattedKey;
                row.getCell(1).font = { bold: true };
                row.getCell(2).value = reportData.summary[key];
                currentRow++;
            }
            currentRow++;
        }
        const hasTrend = Array.isArray(reportData.trend) && reportData.trend.length > 0;
        const tableItems = hasTrend ? reportData.trend : Array.isArray(reportData.data) ? reportData.data : [];
        if (tableItems.length > 0) {
            worksheet.getCell(`A${currentRow}`).value = hasTrend ? 'TREND ANALYSIS' : 'DETAILED RECORDS';
            worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11, color: { argb: 'FF1F497D' } };
            currentRow++;
            const firstItem = tableItems[0];
            const keys = Object.keys(firstItem);
            const headerRow = worksheet.getRow(currentRow);
            headerRow.height = 24;
            keys.forEach((key, idx) => {
                const colCell = headerRow.getCell(idx + 1);
                colCell.value = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
                colCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                colCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF366092' },
                };
                colCell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            currentRow++;
            tableItems.forEach((item, rIdx) => {
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
            worksheet.columns.forEach((column) => {
                let maxLen = 12;
                column.eachCell?.({ includeEmpty: true }, (cell) => {
                    const cellLen = cell.value ? String(cell.value).length : 0;
                    if (cellLen > maxLen)
                        maxLen = cellLen;
                });
                column.width = Math.min(maxLen + 4, 35);
            });
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.ExcelExportService = ExcelExportService;
exports.ExcelExportService = ExcelExportService = ExcelExportService_1 = __decorate([
    (0, common_1.Injectable)()
], ExcelExportService);
//# sourceMappingURL=excel-export.service.js.map