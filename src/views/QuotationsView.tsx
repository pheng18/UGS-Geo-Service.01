import React, { useState, useRef } from 'react';
import {
  Search,
  Plus,
  ArrowLeft,
  Trash2,
  FileText,
  Printer,
  Calendar,
  Download,
  Edit3,
  CheckCircle2,
  Eye,
  Sparkles,
  RefreshCw,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Quotation, QuotationItem } from '../types';
import {
  QuotationReferenceSheet,
  exportQuotationElementToPdf
} from '../components/QuotationReferenceSheet';

const DEFAULT_UNIQTEK_TERMS = `- ການຮັບປະກັນແມ່ນກວມເອົາສະເພາະຊິ້ນສ່ວນອາໄຫຼ່ທີ່ມີການສ້ອມແປງ ຫຼື ປ່ຽນທົດແທນເທົ່ານັ້ນ.
- ໄລຍະເວລາຮັບປະກັນແມ່ນ 6 ເດືອນ (ການຮັບປະກັນບໍ່ກວມເອົາຄວາມເສຍຫາຍຈາກອຸບັດຕິເຫດ ຫຼື ການໃຊ້ງານຜິດວິທີ).
- ກໍລະນີອຸປະກອນເກີດບັນຫາຂັດຂ້ອງໃນໄລຍະຮັບປະກັນ, ບໍລິສັດ ຢູນິກເທັກ ຈຳກັດ ຈະດຳເນີນການກວດເຊັກ ແລະ ສ້ອມແປງໃຫ້ໂດຍບໍ່ເສຍຄ່າບໍລິການ (Free).
- ຊຳລະຄ່າບໍລິການ 100% ຫຼັງຈາກສົ່ງມອບອຸປະກອນພາຍໃນກຳນົດ 1 ເດືອນ.`;

const REFERENCE_PDF_ASSET_URL = '/assets/aistudio/QT-20261005-12_602cd8b0.pdf';

export const QuotationsView: React.FC = () => {
  const {
    quotations,
    selectedQuotation,
    selectQuotation,
    addQuotation,
    updateQuotation
  } = useApp();

  const sheetRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [validityFilter, setValidityFilter] = useState('ທັງໝົດ');
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'revise'>('create');
  const [editingQuotationId, setEditingQuotationId] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);
  const [showOriginalPdfModal, setShowOriginalPdfModal] = useState(false);

  // Form states matching QT-20261005-12.pdf fields
  const [quoteId, setQuoteId] = useState('QT-20261005-12');
  const [refNo, setRefNo] = useState('20261005-13');
  const [revision, setRevision] = useState<number>(1);
  const [handledBy, setHandledBy] = useState('Mr Pheng BOUNMUECHANYA');
  const [quoteDate, setQuoteDate] = useState('10/05/2026');
  const [customerName, setCustomerName] = useState('ບໍລິສັດ EPL ຈຳກັດ');
  const [customerPhone, setCustomerPhone] = useState('020 96 666 082');
  const [deliveryTo, setDeliveryTo] = useState('ບໍລິສັດ EPL ຈຳກັດ');
  const [deliveryLeadTime, setDeliveryLeadTime] = useState('30 Days');
  const [deliveryTerms, setDeliveryTerms] = useState('Repair Service');
  const [currency, setCurrency] = useState('LAK');
  const [validity, setValidity] = useState('30 Days');
  const [remark, setRemark] = useState(
    'ລະບົບສຳຜັດໜ້າຈໍບໍ່ເຮັດວຽກ (Touchscreen ບໍ່ຕອບສະໜອງທັງສ່ວນເທິງ ແລະ ສ່ວນລຸ່ມ) ແລະ ປຸ່ມກົດປິດເຄື່ອງຂັດຂ້ອງ'
  );
  const [includeFreeInspection, setIncludeFreeInspection] = useState(true);
  const [vatRate, setVatRate] = useState<number>(10);
  const [vatIncluded, setVatIncluded] = useState<boolean>(true);
  const [showOfficialStamp, setShowOfficialStamp] = useState<boolean>(true);
  const [terms, setTerms] = useState(DEFAULT_UNIQTEK_TERMS);

  // Dynamic line items builder
  const [itemsList, setItemsList] = useState<QuotationItem[]>([]);
  const [tempDesc, setTempDesc] = useState('');
  const [tempDetails, setTempDetails] = useState('');
  const [tempUnit, setTempUnit] = useState('Pc');
  const [tempQty, setTempQty] = useState('1');
  const [tempPrice, setTempPrice] = useState('');

  // Open Editor for Creating New Quotation (with option to load Reference Template)
  const openCreateModal = (useReferenceTemplate = false) => {
    setEditorMode('create');
    setEditingQuotationId(null);
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();

    if (useReferenceTemplate) {
      setQuoteId('QT-20261005-12');
      setRefNo('20261005-13');
      setRevision(2);
      setHandledBy('Mr Pheng BOUNMUECHANYA');
      setQuoteDate('10/05/2026');
      setCustomerName('ບໍລິສັດ EPL ຈຳກັດ');
      setCustomerPhone('020 96 666 082');
      setDeliveryTo('ບໍລິສັດ EPL ຈຳກັດ');
      setDeliveryLeadTime('30 Days');
      setDeliveryTerms('Repair Service');
      setCurrency('LAK');
      setValidity('30 Days');
      setRemark('ລະບົບສຳຜັດໜ້າຈໍບໍ່ເຮັດວຽກ (Touchscreen ບໍ່ຕອບສະໜອງທັງສ່ວນເທິງ ແລະ ສ່ວນລຸ່ມ) ແລະ ປຸ່ມກົດປິດເຄື່ອງຂັດຂ້ອງ');
      setIncludeFreeInspection(true);
      setVatRate(10);
      setVatIncluded(true);
      setShowOfficialStamp(true);
      setTerms(DEFAULT_UNIQTEK_TERMS);
      setItemsList([
        {
          id: `item-${Date.now()}-1`,
          description: 'Controller HCE600 S/N: 6307300655',
          details: 'ຂອງ ບໍລິສັດ EPL ຈຳກັດ (ສະເໜີປ່ຽນຊຸດໜ້າຈໍສະແດງຜົນໃໝ່)',
          unit: 'Pc',
          qty: 1,
          unitPrice: 9775000
        },
        {
          id: `item-${Date.now()}-2`,
          description: 'Controller HCE600 S/N: 6310300795',
          details: 'ຂອງ ບໍລິສັດ EPL ຈຳກັດ (ສະເໜີປ່ຽນຊຸດໜ້າຈໍສະແດງຜົນໃໝ່)',
          unit: 'Pc',
          qty: 1,
          unitPrice: 9775000
        }
      ]);
    } else {
      setQuoteId(`QT-${yyyy}${mm}${dd}-${Math.floor(10 + Math.random() * 89)}`);
      setRefNo(`${yyyy}${mm}${dd}-${Math.floor(10 + Math.random() * 89)}`);
      setRevision(1);
      setHandledBy('Mr Pheng BOUNMUECHANYA');
      setQuoteDate(`${dd}/${mm}/${yyyy}`);
      setCustomerName('');
      setCustomerPhone('020 96 666 082');
      setDeliveryTo('');
      setDeliveryLeadTime('30 Days');
      setDeliveryTerms('Repair Service');
      setCurrency('LAK');
      setValidity('30 Days');
      setRemark('');
      setIncludeFreeInspection(true);
      setVatRate(10);
      setVatIncluded(true);
      setShowOfficialStamp(true);
      setTerms(DEFAULT_UNIQTEK_TERMS);
      setItemsList([]);
    }
    setShowEditorModal(true);
  };

  // Open Editor to Revise an Existing Quotation (increments Revision by +1)
  const openReviseModal = (qt: Quotation, incrementRev = true) => {
    setEditorMode('revise');
    setEditingQuotationId(qt.id);
    setQuoteId(qt.id);
    setRefNo(qt.refNo);
    setRevision((qt.revision ?? 1) + (incrementRev ? 1 : 0));
    setHandledBy(qt.handledBy || 'Mr Pheng BOUNMUECHANYA');
    setQuoteDate(qt.date || '10/05/2026');
    setCustomerName(qt.customerName);
    setCustomerPhone(qt.customerPhone || '020 96 666 082');
    setDeliveryTo(qt.deliveryTo || qt.customerName);
    setDeliveryLeadTime(qt.deliveryLeadTime || '30 Days');
    setDeliveryTerms(qt.deliveryTerms || 'Repair Service');
    setCurrency(qt.currency || 'LAK');
    setValidity(qt.validity || '30 Days');
    setRemark(
      qt.remark ??
        'ລະບົບສຳຜັດໜ້າຈໍບໍ່ເຮັດວຽກ (Touchscreen ບໍ່ຕອບສະໜອງທັງສ່ວນເທິງ ແລະ ສ່ວນລຸ່ມ) ແລະ ປຸ່ມກົດປິດເຄື່ອງຂັດຂ້ອງ'
    );
    setIncludeFreeInspection(qt.includeFreeInspection ?? true);
    setVatRate(qt.vatRate ?? 10);
    setVatIncluded(qt.vatIncluded ?? true);
    setShowOfficialStamp(qt.showOfficialStamp ?? true);
    setTerms(qt.terms || DEFAULT_UNIQTEK_TERMS);
    setItemsList(qt.items.map((it) => ({ ...it })));
    setShowEditorModal(true);
  };

  const handleAddItem = () => {
    if (!tempDesc.trim() || !tempPrice.trim()) return;
    const qty = parseInt(tempQty, 10) || 1;
    const price = parseFloat(tempPrice) || 0;
    const newItem: QuotationItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      description: tempDesc.trim(),
      details: tempDetails.trim(),
      unit: tempUnit.trim() || 'Pc',
      qty,
      unitPrice: price
    };
    setItemsList((prev) => [...prev, newItem]);
    setTempDesc('');
    setTempDetails('');
    setTempUnit('Pc');
    setTempQty('1');
    setTempPrice('');
  };

  const handleUpdateExistingItem = (
    index: number,
    field: keyof QuotationItem,
    value: string | number
  ) => {
    setItemsList((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (index: number) => {
    setItemsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || itemsList.length === 0) return;

    const subtotal = itemsList.reduce(
      (sum, item) => sum + (item.isFree ? 0 : item.qty * item.unitPrice),
      0
    );
    const vat = vatIncluded ? 0 : Math.round(subtotal * (vatRate / 100));
    const total = subtotal + vat;

    if (editorMode === 'revise' && editingQuotationId) {
      const updated: Quotation = {
        id: editingQuotationId,
        refNo: refNo.trim() || '20261005-13',
        revision: Number(revision) || 1,
        handledBy: handledBy.trim() || 'Mr Pheng BOUNMUECHANYA',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || '020 96 666 082',
        deliveryTo: deliveryTo.trim() || customerName.trim(),
        deliveryLeadTime: deliveryLeadTime.trim() || '30 Days',
        deliveryTerms: deliveryTerms.trim() || 'Repair Service',
        currency: currency.trim() || 'LAK',
        date: quoteDate.trim() || '10/05/2026',
        validity: validity.trim() || '30 Days',
        remark: remark.trim(),
        items: itemsList,
        includeFreeInspection,
        terms: terms.trim(),
        subtotal,
        vat,
        vatRate,
        vatIncluded,
        total,
        showOfficialStamp
      };
      updateQuotation(updated);
      selectQuotation(updated);
      setExportSuccessMsg(
        `ບັນທຶກສະບັບປັບປຸງ (Revision ${updated.revision}) ສຳລັບເລກທີ ${updated.refNo} ສຳເລັດແລ້ວ!`
      );
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } else {
      const created = addQuotation(
        customerName.trim(),
        validity.trim() || '30 Days',
        itemsList,
        terms.trim(),
        {
          id: quoteId.trim() || undefined,
          refNo: refNo.trim() || undefined,
          revision: Number(revision) || 1,
          handledBy: handledBy.trim() || 'Mr Pheng BOUNMUECHANYA',
          customerPhone: customerPhone.trim() || '020 96 666 082',
          deliveryTo: deliveryTo.trim() || customerName.trim(),
          deliveryLeadTime: deliveryLeadTime.trim() || '30 Days',
          deliveryTerms: deliveryTerms.trim() || 'Repair Service',
          currency: currency.trim() || 'LAK',
          date: quoteDate.trim() || '10/05/2026',
          remark: remark.trim(),
          includeFreeInspection,
          vatRate,
          vatIncluded,
          showOfficialStamp
        }
      );
      selectQuotation(created);
    }

    setShowEditorModal(false);
  };

  const handleExportPdf = async (qt: Quotation) => {
    if (!sheetRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setExportSuccessMsg(null);
    const ok = await exportQuotationElementToPdf(sheetRef.current, qt);
    setIsExportingPdf(false);
    if (ok) {
      const revSuffix = qt.revision ? `_Rev${qt.revision}` : '';
      setExportSuccessMsg(
        `ດາວໂຫຼດໄຟລ໌ PDF (${qt.id || qt.refNo}${revSuffix}.pdf) ສຳເລັດແລ້ວ!`
      );
      setTimeout(() => setExportSuccessMsg(null), 4500);
    }
  };

  const referenceQuotation =
    quotations.find((q) => q.id === 'QT-20261005-12' || q.refNo === '20261005-13') ||
    quotations[0];

  // ============================================================================
  // DETAIL SCREEN (A4 Reference Format + Revise + Export PDF)
  // ============================================================================
  if (selectedQuotation) {
    return (
      <div className="space-y-4 pb-12">
        {/* Top Action Bar (Hidden when printing) */}
        <div className="print:hidden bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => selectQuotation(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>ກັບຄືນລາຍການ</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                  {selectedQuotation.id} ({selectedQuotation.refNo})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                  Revision {selectedQuotation.revision ?? 1}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ຮູບແບບມາດຕະຖານ UniqTek Co., Ltd (ອ້າງອີງຕາມ QT-20261005-12.pdf)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Revise Quotation Button */}
            <button
              type="button"
              data-testid="revise_quotation_btn"
              onClick={() => openReviseModal(selectedQuotation, true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ດັດແກ້ໃບສະເໜີລາຄາ (Revise ຄັ້ງທີ {(selectedQuotation.revision ?? 1) + 1})</span>
            </button>

            {/* Export PDF Button */}
            <button
              type="button"
              data-testid="export_pdf_btn"
              disabled={isExportingPdf}
              onClick={() => handleExportPdf(selectedQuotation)}
              className="px-4 py-2 rounded-xl bg-[#E31E24] hover:bg-red-700 disabled:opacity-60 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              {isExportingPdf ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>
                {isExportingPdf ? 'ກຳລັງສ້າງ PDF...' : 'Export PDF (ດາວໂຫຼດ PDF)'}
              </span>
            </button>

            {/* Print A4 Button */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>ພິມ A4</span>
            </button>

            {/* View Original Reference PDF */}
            <button
              type="button"
              onClick={() => setShowOriginalPdfModal(true)}
              className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>ໄຟລ໌ຕົ້ນສະບັບ PDF</span>
            </button>
          </div>
        </div>

        {/* Status Toast Banner */}
        {exportSuccessMsg && (
          <div className="print:hidden bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Official UniqTek A4 Quotation Sheet (Matches QT-20261005-12.pdf) */}
        <div className="overflow-x-auto pb-4">
          <QuotationReferenceSheet quotation={selectedQuotation} sheetRef={sheetRef} />
        </div>

        {/* Original Reference PDF Preview Modal */}
        {showOriginalPdfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs print:hidden">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[85vh]">
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-red-600" />
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    ໄຟລ໌ຕົ້ນສະບັບອ້າງອີງ: QT-20261005-12.pdf
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={REFERENCE_PDF_ASSET_URL}
                    download="QT-20261005-12.pdf"
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ດາວໂຫຼດຕົ້ນສະບັບ</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowOriginalPdfModal(false)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <iframe
                src={REFERENCE_PDF_ASSET_URL}
                title="QT-20261005-12 Reference PDF"
                className="w-full flex-1 bg-slate-100"
              />
            </div>
          </div>
        )}

        {/* Editor Modal (Also reachable from Detail View) */}
        {showEditorModal && renderEditorModal()}
      </div>
    );
  }

  // ============================================================================
  // QUOTATIONS LIST VIEW
  // ============================================================================
  const filteredQuotations = quotations.filter((qt) => {
    const matchesQuery =
      qt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qt.refNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      qt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (qt.remark || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesValidity =
      validityFilter === 'ທັງໝົດ' ||
      qt.validity.toLowerCase().includes(validityFilter.toLowerCase());
    return matchesQuery && matchesValidity;
  });

  const filterChips = ['ທັງໝົດ', '30 Days', '30 ວັນ', '60 ວັນ'];

  function renderEditorModal() {
    const previewSubtotal = itemsList.reduce(
      (sum, it) => sum + (it.isFree ? 0 : it.qty * it.unitPrice),
      0
    );
    const previewVat = vatIncluded ? 0 : Math.round(previewSubtotal * (vatRate / 100));
    const previewTotal = previewSubtotal + previewVat;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs print:hidden">
        <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-2xl p-4 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-600" />
                <span>
                  {editorMode === 'revise'
                    ? `ປັບປຸງໃບສະເໜີລາຄາ (Revised Quotation - Rev.${revision})`
                    : 'ສ້າງໃບສະເໜີລາຄາຕາມຮູບແບບ QT-20261005-12.pdf'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ແບບຟອມມາດຕະຖານ UniqTek Co., Ltd ພ້ອມສົ່ງອອກໄຟລ໌ PDF (A4)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowEditorModal(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveQuotation} className="space-y-4 text-xs">
            {/* Row 1: Quote ID, Quote No., Revision, Date */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ລະຫັດໄຟລ໌ (File ID)
                </label>
                <input
                  type="text"
                  value={quoteId}
                  onChange={(e) => setQuoteId(e.target.value)}
                  placeholder="QT-20261005-12"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quote No. *
                </label>
                <input
                  type="text"
                  required
                  value={refNo}
                  onChange={(e) => setRefNo(e.target.value)}
                  placeholder="20261005-13"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Revision (ຄັ້ງທີປັບປຸງ)
                </label>
                <input
                  type="number"
                  min="1"
                  value={revision}
                  onChange={(e) => setRevision(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Date (ວັນທີ)
                </label>
                <input
                  type="text"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  placeholder="10/05/2026"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Row 2: Handled By, Purchaser, Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Handled by (ຜູ້ຮັບຜິດຊອບ)
                </label>
                <input
                  type="text"
                  value={handledBy}
                  onChange={(e) => setHandledBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Purchaser / ລູກຄ້າ *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (!deliveryTo || deliveryTo === customerName) {
                      setDeliveryTo(e.target.value);
                    }
                  }}
                  placeholder="ບໍລິສັດ EPL ຈຳກັດ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  ເບີໂທລູກຄ້າ (Delivery Phone)
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="020 96 666 082"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Row 3: Delivery To, Lead Time, Delivery Terms, Validity */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery to (ຈັດສົ່ງເຖິງ)
                </label>
                <input
                  type="text"
                  value={deliveryTo}
                  onChange={(e) => setDeliveryTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery lead time
                </label>
                <input
                  type="text"
                  value={deliveryLeadTime}
                  onChange={(e) => setDeliveryLeadTime(e.target.value)}
                  placeholder="30 Days"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Delivery Terms
                </label>
                <input
                  type="text"
                  value={deliveryTerms}
                  onChange={(e) => setDeliveryTerms(e.target.value)}
                  placeholder="Repair Service"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Quotation Validity
                </label>
                <input
                  type="text"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                  placeholder="30 Days"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Remark Input */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Remark (ໝາຍເຫດອາການເຄື່ອງ)
              </label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="ສຳຜັດໜ້າຈໍບໍ່ໄດ້, ປິດເຄື່ອງບໍ່ໄດ້ ແລະ ສຳຜັດໜ້າຈໍບໍ່ໄດ້ ທາງເທິງ ແລະ ທາງລຸ່ມ"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {/* Line Items Table Editor */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-red-600 dark:text-red-400">
                  ລາຍການສິນຄ້າ ແລະ ບໍລິການ (List detail):
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  ລວມສຸດທິ: {currency} {previewTotal.toLocaleString()}
                </span>
              </div>

              {itemsList.length > 0 && (
                <div className="space-y-2">
                  {itemsList.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-12 sm:col-span-5 space-y-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleUpdateExistingItem(idx, 'description', e.target.value)
                          }
                          placeholder="Controller HCE600 S/N: ..."
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={item.details}
                          onChange={(e) =>
                            handleUpdateExistingItem(idx, 'details', e.target.value)
                          }
                          placeholder="ຂອງ ບໍລິສັດ EPL ຈຳກັດ (ສະເໜີປ່ຽນໜ້າຈໍໃໝ່)"
                          className="w-full px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block">Unit</label>
                        <input
                          type="text"
                          value={item.unit || 'Pc'}
                          onChange={(e) =>
                            handleUpdateExistingItem(idx, 'unit', e.target.value)
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center"
                        />
                      </div>
                      <div className="col-span-3 sm:col-span-1">
                        <label className="text-[10px] text-slate-400 block">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.qty}
                          onChange={(e) =>
                            handleUpdateExistingItem(
                              idx,
                              'qty',
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-center"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <label className="text-[10px] text-slate-400 block">
                          Unit Price ({currency})
                        </label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateExistingItem(
                              idx,
                              'unitPrice',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-right font-mono"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 flex justify-end pt-3">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add New Line Item Box */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  + ເພີ່ມລາຍການໃໝ່ເຂົ້າໃນຕາຕະລາງ
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={tempDesc}
                    onChange={(e) => setTempDesc(e.target.value)}
                    placeholder="ຊື່ລາຍການ (ເຊັ່ນ: Controller HCE600 S/N: ...)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="text"
                    value={tempDetails}
                    onChange={(e) => setTempDetails(e.target.value)}
                    placeholder="ລາຍລະອຽດ (ເຊັ່ນ: ຂອງ ບໍລິສັດ EPL ຈຳກັດ ສະເໜີປ່ຽນໜ້າຈໍໃໝ່)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={tempUnit}
                    onChange={(e) => setTempUnit(e.target.value)}
                    placeholder="Unit (Pc)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="number"
                    min="1"
                    value={tempQty}
                    onChange={(e) => setTempQty(e.target.value)}
                    placeholder="Qty"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <input
                    type="number"
                    value={tempPrice}
                    onChange={(e) => setTempPrice(e.target.value)}
                    placeholder="Unit Price (LAK)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="py-1.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ເພີ່ມ</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Options Row: Free Inspection, VAT 10%, Official Stamp */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFreeInspection}
                  onChange={(e) => setIncludeFreeInspection(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span className="font-semibold">ແຖວ Inspection check (free)</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vatIncluded}
                  onChange={(e) => setVatIncluded(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span className="font-semibold">
                  ລາຄາລວມ VAT {vatRate}% ແລ້ວ (ຕາມຟອມຕົ້ນສະບັບ)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOfficialStamp}
                  onChange={(e) => setShowOfficialStamp(e.target.checked)}
                  className="rounded text-red-600"
                />
                <span className="font-semibold">ສະແດງກາຈ້ຳບໍລິສັດ & ລາຍເຊັນ</span>
              </label>
            </div>

            {/* Terms Textarea */}
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                ເງື່ອນໄຂ ແລະ ການບໍລິການ (ແຕ່ລະແຖວຂຶ້ນຕົ້ນດ້ວຍ -)
              </label>
              <textarea
                rows={4}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white leading-relaxed"
              />
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors cursor-pointer"
              >
                ຍົກເລີກ
              </button>
              <button
                type="submit"
                disabled={itemsList.length === 0}
                className="px-5 py-2 bg-[#E31E24] hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-extrabold shadow-sm transition-colors cursor-pointer"
              >
                {editorMode === 'revise'
                  ? `ບັນທຶກສະບັບປັບປຸງ (Save Rev.${revision})`
                  : 'ບັນທຶກ ແລະ ເປີດໃບສະເໜີລາຄາ'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            ໃບສະເໜີລາຄາ (Quotations & PDF Export)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            ອອກໃບສະເໜີລາຄາ ແລະ ປັບປຸງ (Revise) ຕາມຮູບແບບມາດຕະຖານ QT-20261005-12.pdf
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openCreateModal(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>ສ້າງຈາກຟອມ QT-20261005-12</span>
          </button>
          <button
            type="button"
            onClick={() => openCreateModal(false)}
            className="bg-[#E31E24] hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ເພີ່ມໃໝ່</span>
          </button>
        </div>
      </div>

      {/* Featured Reference Card for QT-20261005-12.pdf */}
      {referenceQuotation && (
        <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-red-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                REFERENCE FORMAT • QT-20261005-12.pdf
              </span>
              <span className="text-xs font-mono text-red-200">
                Quote No: {referenceQuotation.refNo} • Rev.{referenceQuotation.revision ?? 1}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold">
              {referenceQuotation.customerName} — Controller HCE600 (2 ເຄື່ອງ)
            </h2>
            <p className="text-xs text-slate-300">
              ຍອດລວມສຸດທິ: <strong>LAK {referenceQuotation.total.toLocaleString()}.00</strong> •
              Handled by: {referenceQuotation.handledBy || 'Mr Pheng BOUNMUECHANYA'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => selectQuotation(referenceQuotation)}
              className="px-3.5 py-2 rounded-xl bg-white text-slate-950 hover:bg-slate-100 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-red-600" />
              <span>ເປີດເບິ່ງ & Export PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                selectQuotation(referenceQuotation);
                openReviseModal(referenceQuotation, true);
              }}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>ດັດແກ້ໃບສະເໜີລາຄາ (Revise)</span>
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ຄົ້ນຫາ ຊື່ລູກຄ້າ, ໝາຍເລກໃບສະເໜີ (QT-20261005-12 / 20261005-13)..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-hidden focus:border-red-500 shadow-2xs"
        />
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {filterChips.map((chip) => {
          const isSelected = chip === validityFilter;
          return (
            <button
              key={chip}
              onClick={() => setValidityFilter(chip)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#E31E24] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {chip}
            </button>
          );
        })}
      </div>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          ບໍ່ພົບຂໍ້ມູນໃບສະເໜີລາຄາທີ່ກົງກັບເງື່ອນໄຂ
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQuotations.map((qt) => (
            <div
              key={qt.id}
              onClick={() => selectQuotation(qt)}
              className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-red-400 transition-all cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold font-mono text-[#E31E24] dark:text-red-400">
                    {qt.id} (Quote No: {qt.refNo})
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    Rev.{qt.revision ?? 1}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{qt.date}</span>
                </span>
              </div>

              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                ລູກຄ້າ: {qt.customerName}
              </h2>

              {qt.remark && (
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  Remark: {qt.remark}
                </p>
              )}

              <p className="text-xs text-slate-500 dark:text-slate-400">
                ລາຍການສະເໜີ: {qt.items.length} ລາຍການ • ກຳນົດຍືນລາຄາ: {qt.validity} • ຜູ້ຮັບຜິດຊອບ:{' '}
                {qt.handledBy || 'Mr Pheng BOUNMUECHANYA'}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Grand Total:
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-extrabold text-[#E31E24] dark:text-red-400 font-mono">
                    {qt.currency || 'LAK'} {qt.total.toLocaleString()}.00
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-[11px]">
                    ເປີດຟອມ & Export PDF
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {showEditorModal && renderEditorModal()}
    </div>
  );
};
