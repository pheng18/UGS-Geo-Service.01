import { auth } from '../firebase';
import { Quotation } from '../types';

export interface QuotationReportEntry {
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
}

export interface QuotationTotalPriceReport {
  quotationCount: number;
  totalItemsCount: number;
  totalSubtotal: number;
  totalVat: number;
  grandTotalPrice: number;
  averageQuotationValue: number;
  highestQuotationValue: number;
  currency: string;
  byQuotation: QuotationReportEntry[];
}

let cachedTokenInMemory: string | null = null;

export function setAuthTokenInMemory(token: string | null): void {
  cachedTokenInMemory = token;
}

async function getAuthBearerToken(): Promise<string | null> {
  try {
    if (auth.currentUser) {
      cachedTokenInMemory = await auth.currentUser.getIdToken();
      return cachedTokenInMemory;
    }
    return cachedTokenInMemory;
  } catch {
    return cachedTokenInMemory;
  }
}

export function computeClientQuotationReport(
  quotations: Quotation[]
): QuotationTotalPriceReport {
  const quotationCount = quotations.length;
  let totalItemsCount = 0;
  let totalSubtotal = 0;
  let totalVat = 0;
  let grandTotalPrice = 0;
  let highestQuotationValue = 0;

  const byQuotation = quotations.map((q) => {
    const itemCount = (q.items || []).reduce((acc, it) => acc + (Number(it.qty) || 1), 0);
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
}

export async function fetchQuotationsAndReportFromSql(): Promise<{
  quotations: Quotation[];
  report: QuotationTotalPriceReport;
} | null> {
  try {
    const token = await getAuthBearerToken();
    if (!token) return null;

    const response = await fetch('/api/quotations', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) return null;
    const data = await response.json();
    if (data && Array.isArray(data.quotations)) {
      return {
        quotations: data.quotations,
        report: data.report || computeClientQuotationReport(data.quotations)
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveQuotationToSql(
  quotation: Quotation
): Promise<{
  quotation: Quotation;
  report: QuotationTotalPriceReport;
} | null> {
  try {
    const token = await getAuthBearerToken();
    if (!token) return null;

    const response = await fetch('/api/quotations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quotation)
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
