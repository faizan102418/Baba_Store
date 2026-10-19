import { Product, Sale, Customer, Supplier, KhataTransaction, SupplierTransaction } from '../types';

/**
 * Escapes a field for safe CSV representation.
 * Handles quotes, commas, newlines, and undefined/null.
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts an array of string rows into a CSV string with UTF-8 BOM.
 */
function buildCSVString(headers: string[], rows: (string | number | undefined | null)[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map((row) => row.map(escapeCSV).join(',')).join('\r\n');
  return `\uFEFF${headerLine}\r\n${rowLines}`;
}

/**
 * Triggers a client-side file download for a CSV string.
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates and downloads Inventory Products CSV for Excel.
 */
export function exportInventoryToCSV(products: Product[], shopName: string = 'Babo Store'): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const headers = [
    'Product ID (آئی ڈی)',
    'Name English (پروڈکٹ کا نام)',
    'Name Urdu (اردو نام)',
    'Category (کیٹیگری)',
    'Unit (پیمائش / یونٹ)',
    'Current Stock (موجودہ اسٹاک)',
    'Cost Price (خرید قیمت)',
    'Selling Price (فروخت قیمت)',
    'Total Stock Cost Value (کل مالیت خرید)',
    'Total Stock Sale Value (کل مالیت فروخت)',
    'Estimated Gross Profit Potential (متوقع نفع)',
    'Low Stock Alert (کم از کم حد)',
    'Barcode (بارکوڈ)',
    'Last Updated (آخری تبدیلی)',
  ];

  const rows = products.map((p) => {
    const costVal = Number((p.stock * p.costPrice).toFixed(2));
    const saleVal = Number((p.stock * p.sellingPrice).toFixed(2));
    const profitVal = Number((saleVal - costVal).toFixed(2));

    return [
      p.id,
      p.name,
      p.nameUrdu || '',
      p.category,
      p.unit,
      p.stock,
      p.costPrice,
      p.sellingPrice,
      costVal,
      saleVal,
      profitVal,
      p.minStockAlert,
      p.barcode || '',
      p.updatedAt ? new Date(p.updatedAt).toLocaleString('en-GB') : '',
    ];
  });

  const csv = buildCSVString(headers, rows);
  downloadCSV(`${shopName.replace(/\s+/g, '_')}_Inventory_${dateStr}.csv`, csv);
}

/**
 * Generates and downloads Sales Records CSV for Excel.
 */
export function exportSalesToCSV(sales: Sale[], shopName: string = 'Babo Store'): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const headers = [
    'Invoice Number (انوائس نمبر)',
    'Date & Time (تاریخ و وقت)',
    'Payment Method (طریقہ ادائیگی)',
    'Customer Name (کسٹمر کا نام)',
    'Customer Phone (کسٹمر فون)',
    'Items Count (اشیاء کی تعداد)',
    'Purchased Items Details (اشیاء کی تفصیلات)',
    'Subtotal (سب ٹوٹل)',
    'Discount (رعایت)',
    'Total Bill (کل بل)',
    'Cost Total (خرید لاگت)',
    'Gross Profit (نفع)',
    'Cash Tendered (وصول شدہ)',
    'Change Returned (بقایا)',
  ];

  const rows = sales.map((sale) => {
    const itemsSummary = (sale.items || [])
      .map((it) => `${it.name}${it.nameUrdu ? ` (${it.nameUrdu})` : ''}: ${it.quantity} ${it.unit} @ Rs. ${it.unitPrice} = Rs. ${it.total}`)
      .join(' | ');

    return [
      sale.invoiceNumber,
      sale.timestamp ? new Date(sale.timestamp).toLocaleString('en-GB') : '',
      sale.paymentType === 'credit' ? 'Credit (ادھار کھاتہ)' : 'Cash (نقد)',
      sale.customerName || (sale.customerId ? 'Registered Customer' : 'Walk-in Cash Customer'),
      sale.customerPhone || '',
      sale.items?.length || 0,
      itemsSummary,
      sale.subtotal,
      sale.discount,
      sale.total,
      sale.costTotal,
      sale.profit,
      sale.tendered,
      sale.change,
    ];
  });

  const csv = buildCSVString(headers, rows);
  downloadCSV(`${shopName.replace(/\s+/g, '_')}_Sales_${dateStr}.csv`, csv);
}

/**
 * Generates and downloads Customer & Supplier Khata Transactions CSV for Excel.
 */
export function exportTransactionsToCSV(
  transactions: KhataTransaction[] = [],
  customers: Customer[] = [],
  suppliers: Supplier[] = [],
  supplierTransactions: SupplierTransaction[] = [],
  shopName: string = 'Babo Store'
): void {
  const dateStr = new Date().toISOString().slice(0, 10);
  const headers = [
    'Transaction ID (ٹرانزیکشن نمبر)',
    'Date & Time (تاریخ و وقت)',
    'Ledger Head (کھاتہ قسم)',
    'Party Type (فریق)',
    'Party Name (نام)',
    'Phone (فون نمبر)',
    'Transaction Type (نوعیت)',
    'Debit / Udhar Given (ادھار / خریدا گیا)',
    'Credit / Payment Received (وصول کیا / ادا کیا)',
    'Balance After (نیا بیلنس)',
    'Reference / Invoice (حوالہ انوائس)',
    'Notes / Details (تفصیل / وجہ)',
  ];

  const customerRows = (transactions || []).map((t) => {
    const cust = customers.find((c) => c.id === t.customerId);
    const isCredit = t.type === 'credit';

    return [
      t.id,
      t.timestamp ? new Date(t.timestamp).toLocaleString('en-GB') : '',
      '10200 Accounts Receivable (گاہک ادھار کھاتہ)',
      'Customer (گاہک)',
      cust?.name || 'Customer',
      cust?.phone || '',
      isCredit ? 'Credit Given (ادھار دیا)' : 'Payment Received (رقم وصول کی)',
      isCredit ? t.amount : 0,
      !isCredit ? t.amount : 0,
      t.balanceAfter,
      t.saleId || '',
      t.note || (isCredit ? 'POS Credit Sale' : 'Cash Khata Recovery'),
    ];
  });

  const supplierRows = (supplierTransactions || []).map((st) => {
    const sup = suppliers.find((s) => s.id === st.supplierId);
    const isPurchase = st.type === 'purchase_credit';

    return [
      st.id,
      st.timestamp ? new Date(st.timestamp).toLocaleString('en-GB') : '',
      '20100 Accounts Payable (سپلائر / مارکیٹ واجبات)',
      'Supplier / Wholesaler (ڈیلر / ہول سیلر)',
      sup?.name || 'Supplier',
      sup?.phone || '',
      isPurchase ? 'Market Stock Purchase (ادھار مال خریدا)' : 'Supplier Bill Payment (سپلائر کو ادائگی)',
      isPurchase ? st.amount : 0,
      !isPurchase ? st.amount : 0,
      st.balanceAfter,
      '',
      st.note || (isPurchase ? 'Stock Inward Bill' : 'Payment to Supplier'),
    ];
  });

  // Combine and sort by date descending
  const combinedRows = [...customerRows, ...supplierRows];

  const csv = buildCSVString(headers, combinedRows);
  downloadCSV(`${shopName.replace(/\s+/g, '_')}_Khata_Transactions_${dateStr}.csv`, csv);
}

/**
 * Exports all three files consecutively with brief delay to avoid browser popup blocking.
 */
export async function exportAllDataToCSV(data: {
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  suppliers?: Supplier[];
  transactions: KhataTransaction[];
  supplierTransactions?: SupplierTransaction[];
  shopName?: string;
}): Promise<void> {
  const shopName = data.shopName || 'Babo Store';

  // 1. Inventory
  exportInventoryToCSV(data.products, shopName);

  // 2. Sales (with brief delay)
  await new Promise((resolve) => setTimeout(resolve, 350));
  exportSalesToCSV(data.sales, shopName);

  // 3. Transactions (with brief delay)
  await new Promise((resolve) => setTimeout(resolve, 350));
  exportTransactionsToCSV(
    data.transactions,
    data.customers,
    data.suppliers || [],
    data.supplierTransactions || [],
    shopName
  );
}
