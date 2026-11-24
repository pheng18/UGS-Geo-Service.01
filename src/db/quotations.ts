import { asc, desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { quotations, quotationItems } from './schema.ts';
import type { Quotation, QuotationItem } from '../types/index.ts';

export interface QuotationTotalPriceReport {
  quotationCount: number;
  totalItemsCount: number;
  totalSubtotal: number;
  totalVat: number;
  grandTotalPrice: number;
  averageQuotationValue: number;
  highestQuotationValue: number;
  currency: string;
  byQuotation: Array<{
    id: string;
    refNo: string;
    revision: number;
    customerName: string;
    date: string;
    itemCount: number;
    subtotal: number;
    vat: number;
    totalPrice: number;
    currency: string;
    handledBy: string;
  }>;
}

export async function getAllQuotationsWithItems(): Promise<Quotation[]> {
  try {
    const rows = await db
      .select()
      .from(quotations)
      .orderBy(desc(quotations.updatedAt), asc(quotations.id));

    const itemRows = await db
      .select()
      .from(quotationItems)
      .orderBy(asc(quotationItems.sortOrder), asc(quotationItems.id));

    const itemsByQuotationId: Record<string, QuotationItem[]> = {};
    for (const item of itemRows) {
      if (!itemsByQuotationId[item.quotationId]) {
        itemsByQuotationId[item.quotationId] = [];
      }
      itemsByQuotationId[item.quotationId].push({
        id: item.id,
        description: item.description,
        details: item.details,
        unit: item.unit,
        qty: item.qty,
        unitPrice: item.unitPrice,
        isFree: item.isFree
      });
    }

    return rows.map((row) => ({
      id: row.id,
      refNo: row.refNo,
      revision: row.revision,
      handledBy: row.handledBy,
      customerName: row.customerName,
      customerPhone: row.customerPhone,
      deliveryTo: row.deliveryTo,
      deliveryLeadTime: row.deliveryLeadTime,
      deliveryTerms: row.deliveryTerms,
      currency: row.currency,
      date: row.date,
      validity: row.validity,
      remark: row.remark,
      items: itemsByQuotationId[row.id] || [],
      includeFreeInspection: row.includeFreeInspection,
      terms: row.terms,
      subtotal: row.subtotal,
      vat: row.vat,
      vatRate: row.vatRate,
      vatIncluded: row.vatIncluded,
      total: row.total,
      showOfficialStamp: row.showOfficialStamp
    }));
  } catch (error) {
    console.error('Database query failed in getAllQuotationsWithItems:', error);
    throw new Error('Failed to load quotations from database.', { cause: error });
  }
}

export async function upsertQuotationWithItems(
  qt: Quotation,
  userUid?: string
): Promise<Quotation> {
  try {
    const subtotal =
      typeof qt.subtotal === 'number'
        ? qt.subtotal
        : (qt.items || []).reduce(
            (sum, it) => sum + (it.isFree ? 0 : it.qty * it.unitPrice),
            0
          );
    const vatRate = qt.vatRate ?? 10;
    const vatIncluded = qt.vatIncluded ?? true;
    const vat =
      typeof qt.vat === 'number'
        ? qt.vat
        : vatIncluded
        ? 0
        : Math.round(subtotal * (vatRate / 100));
    const total = typeof qt.total === 'number' ? qt.total : subtotal + vat;

    await db
      .insert(quotations)
      .values({
        id: qt.id,
        refNo: qt.refNo,
        revision: qt.revision ?? 1,
        handledBy: qt.handledBy || 'Mr Pheng BOUNMUECHANYA',
        customerName: qt.customerName,
        customerPhone: qt.customerPhone || '020 96 666 082',
        deliveryTo: qt.deliveryTo || qt.customerName,
        deliveryLeadTime: qt.deliveryLeadTime || '30 Days',
        deliveryTerms: qt.deliveryTerms || 'Repair Service',
        currency: qt.currency || 'LAK',
        date: qt.date,
        validity: qt.validity || '30 Days',
        remark: qt.remark || '',
        includeFreeInspection: qt.includeFreeInspection ?? true,
        terms: qt.terms || '',
        subtotal,
        vat,
        vatRate,
        vatIncluded,
        total,
        showOfficialStamp: qt.showOfficialStamp ?? true,
        userUid: userUid || null,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: quotations.id,
        set: {
          refNo: qt.refNo,
          revision: qt.revision ?? 1,
          handledBy: qt.handledBy || 'Mr Pheng BOUNMUECHANYA',
          customerName: qt.customerName,
          customerPhone: qt.customerPhone || '020 96 666 082',
          deliveryTo: qt.deliveryTo || qt.customerName,
          deliveryLeadTime: qt.deliveryLeadTime || '30 Days',
          deliveryTerms: qt.deliveryTerms || 'Repair Service',
          currency: qt.currency || 'LAK',
          date: qt.date,
          validity: qt.validity || '30 Days',
          remark: qt.remark || '',
          includeFreeInspection: qt.includeFreeInspection ?? true,
          terms: qt.terms || '',
          subtotal,
          vat,
          vatRate,
          vatIncluded,
          total,
          showOfficialStamp: qt.showOfficialStamp ?? true,
          userUid: userUid || null,
          updatedAt: new Date()
        }
      });

    // Replace line items for this quotation
    await db.delete(quotationItems).where(eq(quotationItems.quotationId, qt.id));

    if (Array.isArray(qt.items) && qt.items.length > 0) {
      await db.insert(quotationItems).values(
        qt.items.map((item, idx) => ({
          id: item.id || `${qt.id}-item-${idx + 1}`,
          quotationId: qt.id,
          description: item.description,
          details: item.details || '',
          unit: item.unit || 'Pc',
          qty: Number(item.qty) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: item.isFree ? 0 : (Number(item.qty) || 1) * (Number(item.unitPrice) || 0),
          isFree: Boolean(item.isFree),
          sortOrder: idx + 1
        }))
      );
    }

    return {
      ...qt,
      subtotal,
      vat,
      vatRate,
      vatIncluded,
      total
    };
  } catch (error) {
    console.error('Database upsert failed in upsertQuotationWithItems:', error);
    throw new Error('Failed to save quotation to database.', { cause: error });
  }
}

export async function getQuotationDashboardSummary(): Promise<QuotationTotalPriceReport> {
  try {
    const allQuotations = await getAllQuotationsWithItems();
    const quotationCount = allQuotations.length;
    let totalItemsCount = 0;
    let totalSubtotal = 0;
    let totalVat = 0;
    let grandTotalPrice = 0;
    let highestQuotationValue = 0;

    const byQuotation = allQuotations.map((q) => {
      const itemCount = q.items.reduce((acc, it) => acc + (Number(it.qty) || 1), 0);
      totalItemsCount += itemCount;
      totalSubtotal += q.subtotal || 0;
      totalVat += q.vat || 0;
      grandTotalPrice += q.total || 0;
      if ((q.total || 0) > highestQuotationValue) {
        highestQuotationValue = q.total || 0;
      }

      return {
        id: q.id,
        refNo: q.refNo,
        revision: q.revision ?? 1,
        customerName: q.customerName,
        date: q.date,
        itemCount,
        subtotal: q.subtotal || 0,
        vat: q.vat || 0,
        totalPrice: q.total || 0,
        currency: q.currency || 'LAK',
        handledBy: q.handledBy || 'Mr Pheng BOUNMUECHANYA'
      };
    });

    const averageQuotationValue =
      quotationCount > 0 ? Math.round(grandTotalPrice / quotationCount) : 0;

    return {
      quotationCount,
      totalItemsCount,
      totalSubtotal,
      totalVat,
      grandTotalPrice,
      averageQuotationValue,
      highestQuotationValue,
      currency: 'LAK',
      byQuotation
    };
  } catch (error) {
    console.error('Database summary query failed in getQuotationDashboardSummary:', error);
    throw new Error('Failed to compute quotation total price report.', { cause: error });
  }
}
