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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExcelExportService = void 0;
const common_1 = require("@nestjs/common");
const ExcelJS = __importStar(require("exceljs"));
let ReportExcelExportService = class ReportExcelExportService {
    async generateExcel(reportData, period, reportType) {
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'AAKASH MLM System';
        workbook.created = new Date();
        const summarySheet = workbook.addWorksheet('Summary & KPIs');
        summarySheet.mergeCells('A1:D1');
        const titleCell = summarySheet.getCell('A1');
        titleCell.value = `AAKASH MLM — ${reportType.toUpperCase().replace(/-/g, ' ')} REPORT (${period.toUpperCase()})`;
        titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        summarySheet.getRow(1).height = 30;
        summarySheet.addRow([]);
        summarySheet.addRow(['Period Type:', period.toUpperCase()]);
        summarySheet.addRow(['Date Range:', reportData.dateRange ? `${reportData.dateRange.startDate} to ${reportData.dateRange.endDate}` : 'All Time']);
        summarySheet.addRow(['Generated At:', new Date().toLocaleString()]);
        summarySheet.addRow([]);
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
        if (reportData.trend && Array.isArray(reportData.trend) && reportData.trend.length > 0) {
            const trendSheet = workbook.addWorksheet('Period Trend');
            const headers = Object.keys(reportData.trend[0]);
            const headerRow = trendSheet.addRow(headers.map((h) => h.toUpperCase()));
            headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1E3A8A' } };
            });
            reportData.trend.forEach((item) => {
                const rowValues = headers.map((h) => item[h]);
                trendSheet.addRow(rowValues);
            });
            trendSheet.columns = headers.map(() => ({ width: 22 }));
        }
        if (reportData.data && Array.isArray(reportData.data) && reportData.data.length > 0) {
            const dataSheet = workbook.addWorksheet('Detailed Records');
            const firstRow = reportData.data[0];
            const dataHeaders = Object.keys(firstRow).filter((k) => typeof firstRow[k] !== 'object');
            const dataHeaderRow = dataSheet.addRow(dataHeaders.map((h) => h.toUpperCase()));
            dataHeaderRow.font = { bold: true, color: { argb: 'FFFFFF' } };
            dataHeaderRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '059669' } };
            });
            reportData.data.forEach((item) => {
                const rowValues = dataHeaders.map((h) => item[h]);
                dataSheet.addRow(rowValues);
            });
            dataSheet.columns = dataHeaders.map(() => ({ width: 25 }));
        }
        const uint8Array = await workbook.xlsx.writeBuffer();
        return Buffer.from(uint8Array);
    }
};
exports.ReportExcelExportService = ReportExcelExportService;
exports.ReportExcelExportService = ReportExcelExportService = __decorate([
    (0, common_1.Injectable)()
], ReportExcelExportService);
//# sourceMappingURL=report-excel-export.service.js.map