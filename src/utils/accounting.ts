import { AccountGroup, AccountItem, Product, Customer, Supplier, Sale, Expense, ShopSettings, KhataTransaction, SupplierTransaction } from '../types';

export const ACCOUNT_GROUPS: AccountGroup[] = [
  { code: '10000', name: 'Assets', nameUrdu: 'اثاثہ جات (مال و نقد)', type: 'debit' },
  { code: '20000', name: 'Liabilities', nameUrdu: 'واجبات (مارکیٹ کو ادائیگیاں)', type: 'credit' },
  { code: '30000', name: 'Equity', nameUrdu: 'سرمایہ (اونر ایکویٹی)', type: 'credit' },
  { code: '40000', name: 'Revenue', nameUrdu: 'آمدنی (سیلز و دیگر)', type: 'credit' },
  { code: '50000', name: 'Expenses & COGS', nameUrdu: 'اخراجات اور مال لاگت', type: 'debit' },
];

export const CHART_OF_ACCOUNTS: AccountItem[] = [
  // 10000 Assets
  {
    code: '10100',
    groupCode: '10000',
    name: 'Cash in Counter Drawer',
    nameUrdu: 'کاؤنٹر نقد کیش (دراز)',
    description: 'Physical cash available in the shop cash drawer',
    isSystem: true,
  },
  {
    code: '10200',
    groupCode: '10000',
    name: 'Accounts Receivable (Customer Khata)',
    nameUrdu: 'گاہک ادھار کھاتہ (وصولی)',
    description: 'Total money owed by credit customers to the shop',
    isSystem: true,
  },
  {
    code: '10300',
    groupCode: '10000',
    name: 'Merchandise Inventory / Products',
    nameUrdu: 'دکان میں موجود مال و پروڈکٹس (اسٹاک)',
    description: 'Main Head: 10000 Assets > Sub Head: 10300 Products (دکان کا مال برائے فروخت)',
    isSystem: true,
  },
  {
    code: '10400',
    groupCode: '10000',
    name: 'Bank & Mobile Wallet (JazzCash / EasyPaisa)',
    nameUrdu: 'بینک و موبائل اکاؤنٹ',
    description: 'Shop funds held in bank or digital merchant accounts',
    isSystem: false,
  },
  {
    code: '10500',
    groupCode: '10000',
    name: 'Shop Equipment & Fixed Assets',
    nameUrdu: 'دکان کے مستقل آلات و اثاثہ جات',
    description: 'Main Head: 10000 Assets > Sub Head: 10500 Fixed Assets (ڈیپ فریزر، ترازو، کاؤنٹر)',
    isSystem: false,
  },

  // 20000 Liabilities
  {
    code: '20100',
    groupCode: '20000',
    name: 'Accounts Payable (Wholesale / Supplier Khata)',
    nameUrdu: 'ہول سیلر / ڈیلر ادھار کھاتہ (ادائیگی)',
    description: 'Money owed to market dealers and distributors for stock bought on credit',
    isSystem: true,
  },
  {
    code: '20200',
    groupCode: '20000',
    name: 'Short-term Market Borrowings',
    nameUrdu: 'مختصر مدتی قرضہ جات',
    description: 'Temporary loans taken for store stock financing',
    isSystem: false,
  },
  {
    code: '20300',
    groupCode: '20000',
    name: 'Accrued Rent & Utilities Payable',
    nameUrdu: 'واجب الادا کرایہ و بجلی بل',
    description: 'Pending unpaid bills due at end of month',
    isSystem: false,
  },

  // 30000 Equity
  {
    code: '30100',
    groupCode: '30000',
    name: 'Investor Uncle Capital',
    nameUrdu: 'انویسٹر کا اصل سرمایہ',
    description: 'Primary capital invested into the shop by investor uncle',
    isSystem: false,
  },
  {
    code: '30200',
    groupCode: '30000',
    name: 'Cashier / Managing Partner Capital',
    nameUrdu: 'ورکنگ پارٹنر کا سرمایہ',
    description: 'Capital or sweat equity contributed by operating partner',
    isSystem: false,
  },
  {
    code: '30300',
    groupCode: '30000',
    name: 'Retained Earnings (Accumulated Profit)',
    nameUrdu: 'جمع شدہ خالص منافع',
    description: 'Net accumulated earnings from sales less COGS and expenses',
    isSystem: true,
  },

  // 40000 Revenue
  {
    code: '40100',
    groupCode: '40000',
    name: 'Retail Sales Revenue',
    nameUrdu: 'کاؤنٹر سیلز آمدنی',
    description: 'Total revenue earned from counter merchandise sales',
    isSystem: true,
  },
  {
    code: '40200',
    groupCode: '40000',
    name: 'Empty Carton & Scrap Income',
    nameUrdu: 'خالی کارٹن و متفرق آمدنی',
    description: 'Secondary income from selling empty cartons, bags, and scrap',
    isSystem: false,
  },

  // 50000 Expenses & COGS
  {
    code: '50100',
    groupCode: '50000',
    name: 'Cost of Goods Sold (COGS)',
    nameUrdu: 'فروخت شدہ مال کی اصل لاگت',
    description: 'Cost price of all items that were sold',
    isSystem: true,
  },
  {
    code: '50200',
    groupCode: '50000',
    name: 'Shop Rent Expense',
    nameUrdu: 'دکان کا کرایہ',
    description: 'Monthly commercial rental fee',
    isSystem: false,
  },
  {
    code: '50300',
    groupCode: '50000',
    name: 'Electricity & Utilities Expense',
    nameUrdu: 'بجلی و یوٹیلیٹی بل',
    description: 'Electricity, water, and municipal charges',
    isSystem: false,
  },
  {
    code: '50400',
    groupCode: '50000',
    name: 'Staff Wages & Daily Food',
    nameUrdu: 'ملازم دیہاڑی و روٹی',
    description: 'Salaries and daily meals for shop helpers',
    isSystem: false,
  },
  {
    code: '50500',
    groupCode: '50000',
    name: 'Market Freight & Carriage (Carriage Inward)',
    nameUrdu: 'منڈی کرایہ و باربرداری',
    description: 'Rickshaw, loader, and coolie transport fees from wholesale market',
    isSystem: false,
  },
  {
    code: '50600',
    groupCode: '50000',
    name: 'Damaged & Expired Goods Loss',
    nameUrdu: 'ضائع یا ایکسپائرڈ مال نقصان',
    description: 'Loss from broken eggs, leaked ghee, or weeviled flour',
    isSystem: false,
  },
  {
    code: '50700',
    groupCode: '50000',
    name: 'General Shop Refreshment & Tea',
    nameUrdu: 'چائے، پانی و متفرق اخراجات',
    description: 'Daily counter tea and guest hospitality',
    isSystem: false,
  },
];

export interface CashDrawerBreakdown {
  initialCash: number;            // Opening cash (ابتدائی کاؤنٹر کیش)
  cashSales: number;              // (+) Cash received from sales (نقد فروخت)
  customerRecoveries: number;     // (+) Customer debt payments collected in cash (گاہک کھاتہ وصولی)
  expensesPaid: number;           // (-) Cash expenses paid (دکان کے اخراجات)
  supplierPaymentsPaid: number;   // (-) Liability / wholesale supplier payments paid in cash (ہول سیلر کو ادائیگیاں)
  netCashDrawer: number;          // (=) Available physical cash in counter drawer (موجودہ نقد کیش)
}

export interface FinancialSnapshot {
  assets: {
    cashDrawer: number;
    accountsReceivable: number;
    inventory: number;
    bank: number;
    total: number;
  };
  liabilities: {
    accountsPayable: number;
    shortTermDebt: number;
    accruedExpenses: number;
    total: number;
  };
  equity: {
    investorCapital: number;
    cashierCapital: number;
    retainedEarnings: number;
    total: number;
  };
  revenue: {
    retailSales: number;
    otherIncome: number;
    total: number;
  };
  expensesAndCogs: {
    cogs: number;
    rent: number;
    electricity: number;
    wages: number;
    freight: number;
    damageLoss: number;
    refreshment: number;
    total: number;
  };
  netIncome: number;
  balanceSheetInBalance: boolean;
  discrepancy: number;
  cashDrawerBreakdown: CashDrawerBreakdown;
}

// Compute live real-time physical Cash in Drawer
// = Initial Opening Cash + Cash Sales + Customer Khata Collections - Cash Expenses - Supplier / Liability Payments
export function calculateCashDrawerBreakdown(
  settings: ShopSettings,
  sales: Sale[] = [],
  expenses: Expense[] = [],
  transactions: KhataTransaction[] = [],
  supplierTransactions: SupplierTransaction[] = []
): CashDrawerBreakdown {
  const initialCash = Number(settings.initialCashInDrawer) || 0;

  // 1. Cash Sales (from retail POS)
  const cashSales = sales
    .filter((s) => s.paymentType === 'cash')
    .reduce((acc, s) => acc + (Number(s.total) || 0), 0);

  // 2. Customer Khata Recoveries (customer paid their credit debt in cash)
  const customerRecoveries = transactions
    .filter((t) => t.type === 'payment')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  // 3. Operating Expenses paid in cash
  const expensesPaid = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);

  // 4. Wholesale / Supplier / Liability Payments made in cash
  const supplierPaymentsPaid = supplierTransactions
    .filter((t) => t.type === 'payment_made')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  const netCashDrawer = initialCash + cashSales + customerRecoveries - expensesPaid - supplierPaymentsPaid;

  return {
    initialCash,
    cashSales,
    customerRecoveries,
    expensesPaid,
    supplierPaymentsPaid,
    netCashDrawer,
  };
}

// Compute live real-time financial snapshot from operational data
export function calculateFinancialSnapshot(
  products: Product[],
  customers: Customer[],
  suppliers: Supplier[],
  sales: Sale[],
  expenses: Expense[],
  settings: ShopSettings,
  transactions: KhataTransaction[] = [],
  supplierTransactions: SupplierTransaction[] = []
): FinancialSnapshot {
  // 10100 Cash in Counter Drawer
  const cashBreakdown = calculateCashDrawerBreakdown(
    settings,
    sales,
    expenses,
    transactions,
    supplierTransactions
  );
  const cashDrawer = cashBreakdown.netCashDrawer;

  // 10200 Customer Receivables
  const accountsReceivable = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);

  // 10300 Inventory at Cost
  const inventory = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);

  // 10400 Bank Balance
  const bank = settings.bankBalance || 0;

  const totalAssets = cashDrawer + accountsReceivable + inventory + bank;

  // 20100 Accounts Payable (Wholesale Suppliers)
  const accountsPayable = suppliers.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);
  const shortTermDebt = 0;
  const accruedExpenses = 0;
  const totalLiabilities = accountsPayable + shortTermDebt + accruedExpenses;

  // 40100 Revenue
  const retailSales = sales.reduce((acc, s) => acc + s.total, 0);
  const otherIncome = 0;
  const totalRevenue = retailSales + otherIncome;

  // 50100 COGS
  const cogs = sales.reduce((acc, s) => acc + s.costTotal, 0);

  // Categorize expenses
  let rent = 0;
  let electricity = 0;
  let wages = 0;
  let freight = 0;
  let damageLoss = 0;
  let refreshment = 0;

  expenses.forEach((e) => {
    if (e.category === 'rent') rent += e.amount;
    else if (e.category === 'electricity') electricity += e.amount;
    else if (e.category === 'salary') wages += e.amount;
    else if (e.category === 'transport') freight += e.amount;
    else if (e.category === 'refreshment') refreshment += e.amount;
    else refreshment += e.amount;
  });

  const totalOperatingExpenses = rent + electricity + wages + freight + damageLoss + refreshment;
  const totalExpensesAndCogs = cogs + totalOperatingExpenses;
  const netIncome = totalRevenue - totalExpensesAndCogs;

  // 30000 Equity (Owner Net Worth)
  // Double Entry Identity: Total Assets = Total Liabilities + Total Equity
  // Therefore: Total Equity = Total Assets - Total Liabilities
  const totalEquity = totalAssets - totalLiabilities;
  const retainedEarnings = netIncome;
  const contributedCapital = totalEquity - retainedEarnings;

  const investorShareRatio = (settings.investorSharePercent ?? 50) / 100;
  const investorCapital = Math.round(contributedCapital * investorShareRatio);
  const cashierCapital = contributedCapital - investorCapital;

  const discrepancy = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  const balanceSheetInBalance = discrepancy < 0.01;

  return {
    assets: {
      cashDrawer,
      accountsReceivable,
      inventory,
      bank,
      total: totalAssets,
    },
    liabilities: {
      accountsPayable,
      shortTermDebt,
      accruedExpenses,
      total: totalLiabilities,
    },
    equity: {
      investorCapital,
      cashierCapital,
      retainedEarnings,
      total: totalEquity,
    },
    revenue: {
      retailSales,
      otherIncome,
      total: totalRevenue,
    },
    expensesAndCogs: {
      cogs,
      rent,
      electricity,
      wages,
      freight,
      damageLoss,
      refreshment,
      total: totalExpensesAndCogs,
    },
    netIncome,
    balanceSheetInBalance,
    discrepancy,
    cashDrawerBreakdown: cashBreakdown,
  };
}
