import React from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Quotation } from '../types';

interface QuotationReferenceSheetProps {
  quotation: Quotation;
  sheetRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Original uploaded brand logo assets from /public/assets/aistudio/
 */
export const ORIGINAL_BRAND_LOGOS = {
  uniqtekPng: '/assets/aistudio/Uniqtek_42798572.png',
  uniqtekJpg: '/assets/aistudio/UNIQTEK_LOGO_ae28408c.jpg',
  uniqtekIcon: '/assets/aistudio/logo_c1a28654.jpg',
  chcnav: '/assets/aistudio/CHCNAV_LOGO_011aeb07.jpg',
  dji: '/assets/aistudio/DJI_logo_12d35ec9.jpg',
  esri: '/assets/aistudio/Esri_logo_ff12f147.jpg'
};

/**
 * Exports the rendered A4 Quotation Reference Sheet element directly to a downloadable PDF file.
 */
export async function exportQuotationElementToPdf(
  element: HTMLElement | null,
  quotation: Quotation
): Promise<boolean> {
  if (!element) return false;
  try {
    const canvas = await html2canvas(element, {
      scale: 2.5,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Maintain aspect ratio within A4 page
    const canvasRatio = canvas.height / canvas.width;
    let renderWidth = pdfWidth;
    let renderHeight = pdfWidth * canvasRatio;

    if (renderHeight > pdfHeight) {
      renderHeight = pdfHeight;
      renderWidth = pdfHeight / canvasRatio;
    }

    const offsetX = (pdfWidth - renderWidth) / 2;
    pdf.addImage(imgData, 'PNG', offsetX, 0, renderWidth, renderHeight, undefined, 'FAST');

    const revSuffix = quotation.revision ? `_Rev${quotation.revision}` : '';
    const cleanFileName = `${quotation.id || quotation.refNo || 'QT-20261005-12'}${revSuffix}.pdf`;
    pdf.save(cleanFileName);
    return true;
  } catch (err) {
    console.error('Failed exporting quotation PDF:', err);
    return false;
  }
}

const RedArrowDivider: React.FC = () => (
  <div className="relative flex items-center w-full my-1.5 select-none">
    <div
      className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-r-[7px] border-r-[#E31E24]"
      aria-hidden="true"
    />
    <div className="flex-1 border-t-[1.5px] border-b-[1px] border-[#E31E24] h-[3px]" />
    <div
      className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-[#E31E24]"
      aria-hidden="true"
    />
  </div>
);

/**
 * Uses the original UniqTek logo asset (/assets/aistudio/Uniqtek_42798572.png)
 */
const UniqTekBannerWordmark: React.FC = () => (
  <div className="flex items-center justify-center py-1.5 px-2 select-none">
    <img
      src={ORIGINAL_BRAND_LOGOS.uniqtekPng}
      alt="UNIQTEK Original Logo"
      crossOrigin="anonymous"
      className="w-full max-w-[270px] max-h-[54px] object-contain"
    />
  </div>
);

export const QuotationReferenceSheet: React.FC<QuotationReferenceSheetProps> = ({
  quotation,
  sheetRef
}) => {
  const currency = quotation.currency || 'LAK';
  const handledBy = quotation.handledBy || 'Mr Pheng BOUNMUECHANYA';
  const revision = quotation.revision ?? 1;
  const customerPhone = quotation.customerPhone || '020 96 666 082';
  const deliveryTo = quotation.deliveryTo || quotation.customerName;
  const deliveryLeadTime = quotation.deliveryLeadTime || '30 Days';
  const deliveryTerms = quotation.deliveryTerms || 'Repair Service';
  const validity = quotation.validity || '30 Days';
  const remark =
    quotation.remark ??
    'ລະບົບສຳຜັດໜ້າຈໍບໍ່ເຮັດວຽກ (Touchscreen ບໍ່ຕອບສະໜອງທັງສ່ວນເທິງ ແລະ ສ່ວນລຸ່ມ) ແລະ ປຸ່ມກົດປິດເຄື່ອງຂັດຂ້ອງ';
  const includeFreeInspection = quotation.includeFreeInspection ?? true;
  const vatRate = quotation.vatRate ?? 10;
  const vatIncluded = quotation.vatIncluded ?? true;

  const formatMoney = (amount: number) =>
    amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

  const termLines = (quotation.terms || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div
      ref={sheetRef}
      data-testid="quotation_reference_sheet"
      className="bg-white text-black w-full max-w-[820px] mx-auto px-6 sm:px-10 py-6 sm:py-8 shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-4 font-sans text-[12px] leading-snug"
    >
      {/* Top Red Arrow Line */}
      <RedArrowDivider />

      {/* Top 3-Column Header Box */}
      <div className="grid grid-cols-12 border border-black">
        {/* Col 1: Original UniqTek Logo */}
        <div className="col-span-12 sm:col-span-6 border-b sm:border-b-0 sm:border-r border-black px-3 py-2 flex items-center justify-center bg-white">
          <UniqTekBannerWordmark />
        </div>

        {/* Col 2: Address */}
        <div className="col-span-6 sm:col-span-3 border-r border-black px-2.5 py-2 text-[10.5px] leading-relaxed flex flex-col justify-center font-serif">
          <p>3rd Floor, UniqTek Building, No.1048,</p>
          <p>Unit 16, Phakhao Village, Xaythany</p>
          <p>District, Vientiane Capital, Lao P.D.R</p>
        </div>

        {/* Col 3: Contact */}
        <div className="col-span-6 sm:col-span-3 px-2.5 py-2 text-[10.5px] leading-relaxed flex flex-col justify-center font-serif">
          <p>Tel: +856 20 28 887 777</p>
          <p>Mobile: +(856) 20 76 111 800</p>
          <p>Email: pheng@uniqteklao.com</p>
        </div>
      </div>

      {/* Second Red Arrow Line */}
      <RedArrowDivider />

      {/* Main Document Title */}
      <div className="text-center py-1.5">
        <h1 className="text-lg sm:text-xl font-bold tracking-wide text-black font-serif">
          QUOTATION <span className="font-sans">ໃບສະເໜີລາຄາ</span>
        </h1>
      </div>

      {/* Metadata & Parties Table */}
      <div className="border border-black text-[11.5px]">
        {/* Row 1: Handled by | Date | Quote No. | Revision */}
        <div className="grid grid-cols-12 bg-[#EE1C25] text-white font-bold border-b border-black">
          <div className="col-span-6 px-2 py-0.5 border-r border-black/30">
            Handled by
          </div>
          <div className="col-span-2 px-2 py-0.5 text-center border-r border-black/30">
            Date
          </div>
          <div className="col-span-2 px-2 py-0.5 text-center border-r border-black/30">
            Quote No.
          </div>
          <div className="col-span-2 px-2 py-0.5 text-center">Revision</div>
        </div>

        {/* Row 2: Handled by values */}
        <div className="grid grid-cols-12 bg-white text-black border-b border-black">
          <div className="col-span-6 px-2 py-1 border-r border-black font-serif">
            {handledBy}
          </div>
          <div className="col-span-2 px-2 py-1 text-center border-r border-black font-serif">
            {quotation.date}
          </div>
          <div className="col-span-2 px-2 py-1 text-center border-r border-black font-serif">
            {quotation.refNo}
          </div>
          <div className="col-span-2 px-2 py-1 text-center font-serif">
            {revision}
          </div>
        </div>

        {/* Row 3: Supplier | Purchaser headers */}
        <div className="grid grid-cols-12 text-white font-bold border-b border-black">
          <div className="col-span-6 bg-[#EE1C25] px-2 py-0.5 border-r border-black">
            Supplier
          </div>
          <div className="col-span-6 bg-[#FF5050] px-2 py-0.5">Purchaser</div>
        </div>

        {/* Row 4: Supplier | Purchaser details */}
        <div className="grid grid-cols-12 bg-white text-black border-b border-black">
          <div className="col-span-6 px-2 py-1.5 border-r border-black font-serif text-[11px] leading-snug space-y-0.5">
            <p className="font-semibold">UniqTek Co., Ltd</p>
            <p>
              3rd Floor, UniqTek Building, No.1048, Unit 16, Phakhao Village,
              Xaythany District, Vientiane Capital, Lao P.D.R
            </p>
            <p>Tel: 020 2888 7777, +85620 7611 1800</p>
            <p>Email: pheng@uniqteklao.com</p>
          </div>
          <div className="col-span-6 px-2 py-1.5 text-[12px] font-medium">
            <p>{quotation.customerName}</p>
          </div>
        </div>

        {/* Row 5: Delivery to | Delivery lead time | Delivery Terms */}
        <div className="grid grid-cols-12 bg-[#EE1C25] text-white font-bold border-b border-black">
          <div className="col-span-6 px-2 py-0.5 border-r border-black">
            Delivery to
          </div>
          <div className="col-span-3 px-2 py-0.5 border-r border-black/30">
            Delivery lead time
          </div>
          <div className="col-span-3 px-2 py-0.5">Delivery Terms</div>
        </div>

        {/* Row 6: Delivery to left block + Right sub-rows */}
        <div className="grid grid-cols-12 bg-white text-black">
          {/* Left: Delivery To + Phone */}
          <div className="col-span-6 px-2 py-2 border-r border-black flex flex-col justify-between min-h-[104px]">
            <div className="text-[12px] font-medium">{deliveryTo}</div>
            <div className="font-serif text-[11.5px] pb-1">{customerPhone}</div>
          </div>

          {/* Right: Lead time, Currency, Validity */}
          <div className="col-span-6 flex flex-col">
            <div className="grid grid-cols-6 border-b border-black font-serif text-[11px]">
              <div className="col-span-3 px-2 py-0.5 border-r border-black">
                {deliveryLeadTime}
              </div>
              <div className="col-span-3 px-2 py-0.5">{deliveryTerms}</div>
            </div>

            <div className="bg-[#F29B7E] text-black px-2 py-0.5 border-b border-black font-serif text-[11px]">
              Currency of Payment
            </div>
            <div className="px-2 py-0.5 border-b border-black font-serif text-[11px]">
              {currency}
            </div>

            <div className="bg-[#F29B7E] text-black px-2 py-0.5 border-b border-black font-serif text-[11px]">
              Quotation Validity
            </div>
            <div className="px-2 py-0.5 font-serif text-[11px]">{validity}</div>
          </div>
        </div>
      </div>

      {/* Remark Line */}
      <div className="py-1 px-1 text-[11.5px] text-black">
        <span className="font-serif font-semibold">Remark: </span>
        <span>{remark}</span>
      </div>

      {/* Line Items Table */}
      <table className="w-full border-collapse border border-black text-[11.5px]">
        <thead>
          <tr className="border-b border-black font-serif font-bold text-black bg-white">
            <th className="border-r border-black px-1.5 py-1 text-center w-[7%]">
              No
            </th>
            <th className="border-r border-black px-2 py-1 text-left w-[45%]">
              List detail
            </th>
            <th className="border-r border-black px-1.5 py-1 text-center w-[9%]">
              Unit
            </th>
            <th className="border-r border-black px-1.5 py-1 text-center w-[9%]">
              Qty
            </th>
            <th className="border-r border-black px-2 py-1 text-center w-[15%]">
              Unit Price
            </th>
            <th className="px-2 py-1 text-right w-[15%]">Total Price</th>
          </tr>
        </thead>
        <tbody>
          {quotation.items.map((item, idx) => {
            const lineTotal = item.isFree ? 0 : item.qty * item.unitPrice;
            return (
              <tr key={item.id} className="border-b border-black align-middle">
                <td className="border-r border-black px-1.5 py-1.5 text-center font-serif">
                  {idx + 1}
                </td>
                <td className="border-r border-black px-2 py-1.5">
                  <div className="font-medium text-black leading-snug">
                    {item.description}
                  </div>
                  {item.details && (
                    <div className="text-black leading-snug mt-0.5">
                      {item.details}
                    </div>
                  )}
                </td>
                <td className="border-r border-black px-1.5 py-1.5 text-center font-serif">
                  {item.unit || 'Pc'}
                </td>
                <td className="border-r border-black px-1.5 py-1.5 text-center font-serif">
                  {item.qty}
                </td>
                <td className="border-r border-black px-2 py-1.5 text-center font-serif">
                  {item.isFree ? 'free' : formatMoney(item.unitPrice)}
                </td>
                <td className="px-2 py-1.5 text-right font-serif">
                  {item.isFree ? 'free' : formatMoney(lineTotal)}
                </td>
              </tr>
            );
          })}

          {/* Optional Free Inspection Check Row (as in QT-20261005-12.pdf) */}
          {includeFreeInspection && (
            <tr className="border-b border-black h-8">
              <td className="border-r border-black px-1.5 py-1 text-center" />
              <td className="border-r border-black px-2 py-1 font-serif">
                Inspection check
              </td>
              <td className="border-r border-black px-1.5 py-1 text-center" />
              <td className="border-r border-black px-1.5 py-1 text-center" />
              <td className="border-r border-black px-2 py-1 text-center" />
              <td className="px-2 py-1 text-center font-serif">free</td>
            </tr>
          )}

          {/* Spacer Empty Row matching Reference PDF */}
          <tr className="border-b border-black h-4">
            <td className="border-r border-black" />
            <td className="border-r border-black" />
            <td className="border-r border-black" />
            <td className="border-r border-black" />
            <td className="border-r border-black" />
            <td />
          </tr>

          {/* Subtotal Row */}
          <tr className="border-b border-black font-serif">
            <td colSpan={4} className="border-r border-black px-2 py-1" />
            <td className="border-r border-black px-2 py-1 text-right font-bold" />
            <td className="px-2 py-1 text-right font-bold whitespace-nowrap">
              {currency} {formatMoney(quotation.subtotal)}
            </td>
          </tr>

          {/* VAT Row */}
          <tr className="border-b border-black font-serif">
            <td colSpan={4} className="px-2 py-1" />
            <td className="border-r border-black px-2 py-1 text-right">
              VAT {vatRate}%
            </td>
            <td className="px-2 py-1 text-right whitespace-nowrap">
              {vatIncluded || quotation.vat === 0
                ? ''
                : `${currency} ${formatMoney(quotation.vat)}`}
            </td>
          </tr>

          {/* Grand Total Row */}
          <tr className="font-serif font-bold">
            <td colSpan={4} className="px-2 py-1.5" />
            <td className="border-r border-black px-2 py-1.5 text-right">
              Grand Total
            </td>
            <td className="px-2 py-1.5 text-right whitespace-nowrap">
              {currency} {formatMoney(quotation.total)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Terms & Service Section (ເງື່ອນໄຂ ແລະ ການບໍລິການ) */}
      <div className="mt-2.5 mb-3 px-1">
        <h3 className="text-[#E31E24] font-bold underline text-[12.5px] mb-1">
          ເງື່ອນໄຂ ແລະ ການບໍລິການ
        </h3>
        <div className="space-y-0.5 text-[11.5px] text-black leading-relaxed">
          {termLines.map((line, i) => (
            <p key={i}>{line.startsWith('-') ? line : `- ${line}`}</p>
          ))}
        </div>
      </div>

      {/* Quoted by / Approved by Client Red Header Bar */}
      <div className="mt-3">
        <div className="grid grid-cols-2 bg-[#FF242B] text-white font-serif font-bold text-center py-1 text-[12px]">
          <div>Quoted by</div>
          <div>Approved by Client</div>
        </div>

        {/* Stamp & Signatures Row */}
        <div className="grid grid-cols-2 min-h-[150px] pt-2 pb-1 items-start">
          <div className="flex flex-col items-center justify-center h-full" />
          <div className="flex flex-col items-center justify-end h-full" />
        </div>
      </div>

      {/* Bottom Red Arrow Line */}
      <RedArrowDivider />

      {/* Authorized representation + Original Partner Logos Bar (CHCNAV, DJI, UniqTek, Esri, GARMIN) */}
      <div className="pt-1 flex flex-wrap items-center justify-between gap-4 px-2 select-none bg-white">
        {/* Original CHCNAV Logo + Authorized representation */}
        <div className="flex flex-col items-start">
          <div className="text-[10.5px] font-serif text-[#2563EB] mb-0.5">
            Authorized representation
          </div>
          <img
            src={ORIGINAL_BRAND_LOGOS.chcnav}
            alt="CHCNAV Original Logo"
            crossOrigin="anonymous"
            className="h-11 w-auto object-contain"
          />
        </div>

        {/* Original DJI Logo */}
        <div className="flex items-center justify-center">
          <img
            src={ORIGINAL_BRAND_LOGOS.dji}
            alt="DJI Original Logo"
            crossOrigin="anonymous"
            className="h-11 w-auto object-contain"
          />
        </div>

        {/* Original UniqTek Symbol / Logo */}
        <div className="flex items-center justify-center">
          <img
            src={ORIGINAL_BRAND_LOGOS.uniqtekIcon}
            alt="UniqTek Original Logo"
            crossOrigin="anonymous"
            className="h-11 w-11 object-contain rounded-lg"
          />
        </div>

        {/* Original Esri Logo */}
        <div className="flex items-center justify-center">
          <img
            src={ORIGINAL_BRAND_LOGOS.esri}
            alt="Esri Original Logo"
            crossOrigin="anonymous"
            className="h-11 w-auto object-contain"
          />
        </div>

        {/* GARMIN Logo */}
        <div className="flex flex-col items-end">
          <div
            className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-[#0284C7] mr-3 mb-0.5"
            aria-hidden="true"
          />
          <span className="text-xl font-black tracking-widest text-black font-sans">
            GARMIN
            <span className="text-[7px] align-baseline font-normal">®</span>
          </span>
        </div>
      </div>
    </div>
  );
};
