import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calculator,
  Receipt,
  Layers,
  TrendingUp,
  Search,
  ChevronRight,
  Plus,
  Printer,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { Quotation } from '../types';
import { QuotationTotalPriceReport } from '../utils/quotationSqlApi';

interface QuotationTotalPriceReportCardProps {
  quotations: Quotation[];
  report: QuotationTotalPriceReport;
  onSelectQuotation: (quotation: Quotation) => void;
  onNavigateToQuotations: () => void;
}

export const QuotationTotalPriceReportCard: React.FC<QuotationTotalPriceReportCardProps> = ({
  quotations,
  report,
  onSelectQuotation,
  onNavigateToQuotations
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return report.byQuotation;
    return report.byQuotation.filter(
      (item) =>
        item.refNo.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.handledBy.toLowerCase().includes(q)
    );
  }, [report.byQuotation, searchQuery]);

  const filteredSubtotal = useMemo(
    () => filteredEntries.reduce((sum, item) => sum + item.subtotal, 0),
    [filteredEntries]
  );

  const filteredVat = useMemo(
    () => filteredEntries.reduce((sum, item) => sum + item.vat, 0),
    [filteredEntries]
  );

  const filteredGrandTotal = useMemo(
    () => filteredEntries.reduce((sum, item) => sum + item.totalPrice, 0),
    [filteredEntries]
  );

  const maxQuotationPrice = useMemo(
    () => Math.max(...report.byQuotation.map((item) => item.totalPrice), 1),
    [report.byQuotation]
  );

  const handleOpenQuotation = (id: string) => {
    const found = quotations.find((q) => q.id === id);
    if (found) {
      onSelectQuotation(found);
    } else {
      onNavigateToQuotations();
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E3A8A] to-[#1E293B] p-5 sm:p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0 shadow-xs">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  QUOTATION TOTAL PRICE REPORT
                </span>
                <span className="text-[11px] text-blue-200 font-mono">
                  {report.quotationCount} ໃບສະເໜີລາຄາ • {report.totalItemsCount} ລາຍການອຸປະກອນ/ບໍລິການ
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white mt-1">
                ລາຍງານຍອດລວມລາຄາໃບສະເໜີລາຄາທັງໝົດ (Quotation Total Price Summary)
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                ສະຫຼຸບມູນຄ່າລວມໃບສະເໜີລາຄາ (Total Price), ຍອດກ່ອນອາກອນ (Subtotal) ແລະ ລາຍລະອຽດແຍກຕາມລູກຄ້າ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              type="button"
              onClick={onNavigateToQuotations}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ສ້າງ / ແກ້ໄຂໃບສະເໜີລາຄາ</span>
            </button>
          </div>
        </div>

        {/* 4 Financial KPI Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
          {/* Primary Grand Total Price */}
          <div className="bg-white/10 backdrop-blur-xs border border-amber-400/40 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-amber-300 text-xs font-bold">
              <span>ຍອດລວມລາຄາທັງໝົດ (Total Price)</span>
              <Receipt className="w-4 h-4 shrink-0" />
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-white tracking-tight">
                {report.grandTotalPrice.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="text-[11px] text-amber-200 font-semibold mt-0.5 flex items-center justify-between">
                <span>ສະກຸນເງິນ: {report.currency}</span>
                <span>100% ຂອງຍອດລວມ</span>
              </div>
            </div>
          </div>

          {/* Subtotal */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-blue-200 text-xs font-bold">
              <span>ຍອດລວມກ່ອນອາກອນ (Subtotal)</span>
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {report.totalSubtotal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                ອາກອນມູນຄ່າເພີ່ມ (VAT): {report.totalVat.toLocaleString('en-US')} {report.currency}
              </div>
            </div>
          </div>

          {/* Average Quotation Price */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-emerald-300 text-xs font-bold">
              <span>ມູນຄ່າສະເລ່ຍຕໍ່ສະບັບ (Average)</span>
              <TrendingUp className="w-4 h-4 shrink-0" />
            </div>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold font-mono text-white">
                {report.averageQuotationValue.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                ສູງສຸດ: {report.highestQuotationValue.toLocaleString('en-US')} {report.currency}
              </div>
            </div>
          </div>

          {/* Total Quotations & Line Items */}
          <div className="bg-white/5 border border-white/15 rounded-2xl p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-sky-300 text-xs font-bold">
              <span>ຈຳນວນໃບສະເໜີລາຄາ & ລາຍການ</span>
              <Layers className="w-4 h-4 shrink-0" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-extrabold font-mono text-white">
                {report.quotationCount}
              </span>
              <span className="text-xs text-slate-300">ສະບັບ</span>
              <span className="text-slate-400">•</span>
              <span className="text-lg font-bold font-mono text-amber-300">
                {report.totalItemsCount}
              </span>
              <span className="text-xs text-slate-300">ຊຸດ/ລາຍການ</span>
            </div>
            <div className="text-[11px] text-emerald-300 font-medium mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ພ້ອມສົ່ງອອກ PDF ທຸກສະບັບ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar & Quotation Breakdown Table */}
      <div className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>ຕາຕະລາງສະຫຼຸບລາຄາແຍກຕາມໃບສະເໜີລາຄາ (Quotation Price Breakdown)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ຄລິກໃສ່ແถวໃບສະເໜີລາຄາເພື່ອເປີດເບິ່ງເອກະສານຕົ້ນສະບັບ, ປັບປຸງລາຄາ (Revise) ຫຼື ສົ່ງອອກເປັນ PDF
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ຄົ້ນຫາເລກທີ QT, ຊື່ລູກຄ້າ..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:border-blue-500 outline-hidden"
            />
          </div>
        </div>

        {/* Responsive Breakdown Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5 font-bold">ເລກທີໃບສະເໜີລາຄາ (Quote No.)</th>
                <th className="py-3 px-3.5 font-bold">ລູກຄ້າ / ບໍລິສັດ (Customer)</th>
                <th className="py-3 px-3.5 font-bold">ວັນທີ (Date)</th>
                <th className="py-3 px-3.5 font-bold text-center">ຈຳນວນລາຍການ</th>
                <th className="py-3 px-3.5 font-bold text-right">ຍອດກ່ອນອາກອນ (Subtotal)</th>
                <th className="py-3 px-3.5 font-bold text-right">ອາກອນ (VAT)</th>
                <th className="py-3 px-3.5 font-bold text-right">ຍອດລວມສຸດທິ (Total Price)</th>
                <th className="py-3 px-3.5 font-bold text-right">ຈັດການ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-700/70">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    ບໍ່ພົບຂໍ້ມູນໃບສະເໜີລາຄາທີ່ຄົ້ນຫາ
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => {
                  const sharePercent = Math.round(
                    (entry.totalPrice / Math.max(report.grandTotalPrice, 1)) * 100
                  );
                  const barWidthPercent = Math.max(
                    8,
                    Math.round((entry.totalPrice / maxQuotationPrice) * 100)
                  );

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => handleOpenQuotation(entry.id)}
                      className="hover:bg-blue-50/60 dark:hover:bg-slate-700/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-3.5 font-mono font-bold text-[#1E3A8A] dark:text-blue-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span>{entry.id.startsWith('QT-') ? entry.id : `QT-${entry.refNo}`}</span>
                          <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                            Rev.{entry.revision}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {entry.customerName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>ຜູ້ຮັບຜິດຊອບ: {entry.handledBy}</span>
                        </div>
                        {/* Proportional visual bar */}
                        <div className="mt-1.5 w-full max-w-[180px] h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-amber-500 rounded-full"
                            style={{ width: `${barWidthPercent}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {entry.date}
                      </td>
                      <td className="py-3.5 px-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-200">
                        {entry.itemCount}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {entry.subtotal.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </td>
                      <td className="py-3.5 px-3.5 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {entry.vat > 0
                          ? entry.vat.toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })
                          : 'ລວມອາກອນແລ້ວ'}
                      </td>
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                          {entry.totalPrice.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{' '}
                          <span className="text-[10px] font-normal text-slate-500">
                            {entry.currency}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ສັດສ່ວນ {sharePercent}% ຂອງຍອດລວມ
                        </div>
                      </td>
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenQuotation(entry.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/40 group-hover:bg-[#1E3A8A] text-blue-700 dark:text-blue-300 group-hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>ເບິ່ງ / PDF</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold">
                <td colSpan={3} className="py-3.5 px-3.5 text-xs">
                  ຍອດລວມທັງໝົດ ({filteredEntries.length} ໃບສະເໜີລາຄາ • GRAND TOTAL PRICE)
                </td>
                <td className="py-3.5 px-3.5 text-center font-mono">
                  {filteredEntries.reduce((sum, i) => sum + i.itemCount, 0)}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-slate-200 whitespace-nowrap">
                  {filteredSubtotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-slate-300 whitespace-nowrap">
                  {filteredVat.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
                <td className="py-3.5 px-3.5 text-right font-mono text-base text-amber-400 whitespace-nowrap">
                  {filteredGrandTotal.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}{' '}
                  <span className="text-xs font-normal text-amber-200">{report.currency}</span>
                </td>
                <td className="py-3.5 px-3.5" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </section>
  );
};
