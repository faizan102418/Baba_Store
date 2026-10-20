import React, { useState, useMemo } from 'react';
import { Sale, Expense, Product, Customer, Supplier, SupplierTransaction, ShopSettings, KhataTransaction } from '../types';
import { calculateFinancialSnapshot } from '../utils/accounting';
import { AccountChartComponent } from './AccountChartComponent';
import { exportSalesToCSV } from '../utils/csvExport';
import {
  Lock,
  Unlock,
  Plus,
  Download,
  BookOpen,
  Layers,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  Check,
  TrendingUp,
  Calendar,
  Search,
  Eye,
  FileSpreadsheet,
  X,
  CreditCard,
  Banknote,
  Percent,
  Info,
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface InvestorScreenProps {
  sales: Sale[];
  expenses: Expense[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  transactions?: KhataTransaction[];
  settings: ShopSettings;
  onAddExpense: (expense: Omit<Expense, 'id' | 'timestamp'>) => void;
  onDeleteExpense: (id: string) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddSupplierTransaction: (supplierId: string, type: 'purchase_credit' | 'payment_made', amount: number, note?: string) => void;
  onDeleteSupplier: (id: string) => void;
  onDeleteSupplierTransaction: (id: string) => void;
  onUpdateSettings: (settings: ShopSettings) => void;
}

type SalesFilterPreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'all' | 'custom';

export const InvestorScreen: React.FC<InvestorScreenProps> = ({
  sales,
  expenses,
  products,
  customers,
  suppliers,
  supplierTransactions,
  transactions = [],
  settings,
  onAddExpense,
  onDeleteExpense,
  onAddSupplier,
  onAddSupplierTransaction,
  onDeleteSupplier,
  onDeleteSupplierTransaction,
}) => {
  const [pinEntered, setPinEntered] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [isCashAuditOpen, setIsCashAuditOpen] = useState(false);

  // Sub-tabs inside Investor Mode: Overview, Sales History & Trends, Chart of Accounts, Suppliers
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'sales' | 'coa' | 'suppliers'>('overview');

  // Time filter for overview
  const [timeFilter, setTimeFilter] = useState<'today' | 'all'>('today');

  // ==========================================
  // SALES HISTORY & DATE RANGE FILTER STATES
  // ==========================================
  const [salesPreset, setSalesPreset] = useState<SalesFilterPreset>('this_month');

  // Default start date = 1st of current month, end date = today
  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  });

  const [endDate, setEndDate] = useState<string>(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  });

  const [salesSearchQuery, setSalesSearchQuery] = useState('');
  const [salesPaymentFilter, setSalesPaymentFilter] = useState<'all' | 'cash' | 'credit'>('all');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Quick preset button handler
  const handleSelectPreset = (preset: SalesFilterPreset) => {
    setSalesPreset(preset);
    const now = new Date();
    const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const yestStr = new Date(yest.getTime() - yest.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      setStartDate(yestStr);
      setEndDate(yestStr);
    } else if (preset === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now);
      monday.setDate(diff);
      const monStr = new Date(monday.getTime() - monday.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      setStartDate(monStr);
      setEndDate(todayStr);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      setStartDate(firstStr);
      setEndDate(todayStr);
    } else if (preset === 'last_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      const firstStr = new Date(firstDay.getTime() - firstDay.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const lastStr = new Date(lastDay.getTime() - lastDay.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      setStartDate(firstStr);
      setEndDate(lastStr);
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // Expense modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState<Expense['category']>('refreshment');

  // New Supplier modal
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppInitialBalance, setSuppInitialBalance] = useState('0');

  // Supplier transaction modal
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(suppliers[0]?.id || null);
  const [suppTxnType, setSuppTxnType] = useState<'purchase_credit' | 'payment_made' | null>(null);
  const [suppTxnAmount, setSuppTxnAmount] = useState('');
  const [suppTxnNote, setSuppTxnNote] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinEntered === settings.investorPin) {
      setIsUnlocked(true);
      setPinError(false);
      sounds.playCashRegister();
    } else {
      setPinError(true);
      sounds.playWarning();
    }
  };

  // Live real-time Chart of Accounts financial snapshot
  const snapshot = useMemo(() => {
    return calculateFinancialSnapshot(
      products,
      customers,
      suppliers,
      sales,
      expenses,
      settings,
      transactions,
      supplierTransactions
    );
  }, [products, customers, suppliers, sales, expenses, settings, transactions, supplierTransactions]);

  // Filter sales & expenses for overview
  const filteredSales = useMemo(() => {
    if (timeFilter === 'all') return sales;
    const today = new Date().toDateString();
    return sales.filter((s) => new Date(s.timestamp).toDateString() === today);
  }, [sales, timeFilter]);

  const filteredExpenses = useMemo(() => {
    if (timeFilter === 'all') return expenses;
    const today = new Date().toDateString();
    return expenses.filter((e) => new Date(e.timestamp).toDateString() === today);
  }, [expenses, timeFilter]);

  const totalSalesRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalCost = filteredSales.reduce((acc, s) => acc + s.costTotal, 0);
  const totalGrossProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
  const totalExpenseAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = totalGrossProfit - totalExpenseAmount;

  // ==========================================
  // FILTERED SALES FOR DATE-RANGE VIEW
  // ==========================================
  const rangeFilteredSales = useMemo(() => {
    return sales
      .filter((s) => {
        // 1. Date Range
        if (startDate || endDate) {
          const d = new Date(s.timestamp);
          const saleDateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
          if (startDate && saleDateStr < startDate) return false;
          if (endDate && saleDateStr > endDate) return false;
        }

        // 2. Payment Type
        if (salesPaymentFilter !== 'all' && s.paymentType !== salesPaymentFilter) {
          return false;
        }

        // 3. Search Query
        if (salesSearchQuery.trim()) {
          const q = salesSearchQuery.toLowerCase().trim();
          const matchInv = s.invoiceNumber.toLowerCase().includes(q);
          const matchCust = (s.customerName || '').toLowerCase().includes(q);
          const matchPhone = (s.customerPhone || '').includes(q);
          const matchItem = s.items?.some(
            (it) => it.name.toLowerCase().includes(q) || (it.nameUrdu && it.nameUrdu.includes(q))
          );
          if (!matchInv && !matchCust && !matchPhone && !matchItem) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, startDate, endDate, salesPaymentFilter, salesSearchQuery]);

  // Range Aggregates
  const rangeStats = useMemo(() => {
    const totalRev = rangeFilteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalCost = rangeFilteredSales.reduce((acc, s) => acc + s.costTotal, 0);
    const totalProfit = rangeFilteredSales.reduce((acc, s) => acc + s.profit, 0);
    const totalInvoices = rangeFilteredSales.length;
    const cashSales = rangeFilteredSales
      .filter((s) => s.paymentType === 'cash')
      .reduce((acc, s) => acc + s.total, 0);
    const creditSales = rangeFilteredSales
      .filter((s) => s.paymentType === 'credit')
      .reduce((acc, s) => acc + s.total, 0);
    const avgBasket = totalInvoices > 0 ? Math.round(totalRev / totalInvoices) : 0;
    const marginPercent = totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : '0';

    return {
      totalRev,
      totalCost,
      totalProfit,
      totalInvoices,
      cashSales,
      creditSales,
      avgBasket,
      marginPercent,
    };
  }, [rangeFilteredSales]);

  // Group by date for Daily Trends Chart
  const dailyTrends = useMemo(() => {
    const map = new Map<
      string,
      { dateStr: string; label: string; revenue: number; profit: number; count: number; cash: number; credit: number }
    >();

    rangeFilteredSales.forEach((s) => {
      const d = new Date(s.timestamp);
      const dateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const existing = map.get(dateStr) || {
        dateStr,
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        revenue: 0,
        profit: 0,
        count: 0,
        cash: 0,
        credit: 0,
      };
      existing.revenue += s.total;
      existing.profit += s.profit;
      existing.count += 1;
      if (s.paymentType === 'cash') existing.cash += s.total;
      else existing.credit += s.total;
      map.set(dateStr, existing);
    });

    // Chronological order for trend display
    return Array.from(map.values()).sort((a, b) => a.dateStr.localeCompare(b.dateStr));
  }, [rangeFilteredSales]);

  const maxDailyRevenue = useMemo(() => {
    if (dailyTrends.length === 0) return 1;
    return Math.max(...dailyTrends.map((t) => t.revenue), 1);
  }, [dailyTrends]);

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || null;
  const currentSupplierTransactions = selectedSupplier
    ? supplierTransactions
        .filter((t) => t.supplierId === selectedSupplier.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0 || !expTitle.trim()) return;

    onAddExpense({
      title: expTitle.trim(),
      amount: amt,
      category: expCategory,
      note: 'Logged via Investor Screen',
    });

    sounds.playCashRegister();
    setExpTitle('');
    setExpAmount('');
    setIsAddExpenseOpen(false);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName.trim()) return;

    const initBal = parseFloat(suppInitialBalance) || 0;
    onAddSupplier({
      name: suppName.trim(),
      phone: suppPhone.trim() || '0300-0000000',
      balance: initBal,
    });

    sounds.playCashRegister();
    setSuppName('');
    setSuppPhone('');
    setSuppInitialBalance('0');
    setIsAddSupplierOpen(false);
  };

  const handleRecordSupplierTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !suppTxnType) return;
    const amt = parseFloat(suppTxnAmount);
    if (isNaN(amt) || amt <= 0) return;

    onAddSupplierTransaction(selectedSupplier.id, suppTxnType, amt, suppTxnNote.trim() || undefined);
    if (suppTxnType === 'payment_made') {
      sounds.playCashRegister();
    } else {
      sounds.playScan();
    }

    setSuppTxnType(null);
    setSuppTxnAmount('');
    setSuppTxnNote('');
  };

  const handleExportFilteredSales = () => {
    exportSalesToCSV(rangeFilteredSales, settings.shopName);
    sounds.playCashRegister();
  };

  const downloadFullReport = () => {
    let report = `====================================================\n`;
    report += `  ${settings.shopName.toUpperCase()} - CHART OF ACCOUNTS (حساب کتاب)\n`;
    report += `  ${settings.shopNameUrdu}\n`;
    report += `  Date: ${new Date().toLocaleDateString()}\n`;
    report += `====================================================\n\n`;

    report += `10000 ASSETS (اثاثہ جات):\n`;
    report += `  10100 Cash in Drawer:           Rs ${snapshot.assets.cashDrawer.toLocaleString()}\n`;
    report += `  10200 Customer Receivables:     Rs ${snapshot.assets.accountsReceivable.toLocaleString()}\n`;
    report += `  10300 Merchandise Inventory:    Rs ${snapshot.assets.inventory.toLocaleString()}\n`;
    report += `  10400 Bank Balance:             Rs ${snapshot.assets.bank.toLocaleString()}\n`;
    report += `  TOTAL ASSETS:                   Rs ${snapshot.assets.total.toLocaleString()}\n\n`;

    report += `20000 LIABILITIES (واجبات / مارکیٹ کو ادائیگیاں):\n`;
    report += `  20100 Accounts Payable (Wholesale): Rs ${snapshot.liabilities.accountsPayable.toLocaleString()}\n`;
    report += `  20200 Short-term Debt:              Rs ${snapshot.liabilities.shortTermDebt.toLocaleString()}\n`;
    report += `  TOTAL LIABILITIES:              Rs ${snapshot.liabilities.total.toLocaleString()}\n\n`;

    report += `30000 EQUITY (سرمایہ):\n`;
    report += `  30100 Investor Capital:         Rs ${snapshot.equity.investorCapital.toLocaleString()}\n`;
    report += `  30200 Cashier Capital:          Rs ${snapshot.equity.cashierCapital.toLocaleString()}\n`;
    report += `  30300 Retained Net Profit:      Rs ${snapshot.equity.retainedEarnings.toLocaleString()}\n`;
    report += `  TOTAL EQUITY:                   Rs ${snapshot.equity.total.toLocaleString()}\n\n`;

    report += `40000 REVENUE (آمدنی):\n`;
    report += `  40100 Retail Sales Revenue:     Rs ${snapshot.revenue.retailSales.toLocaleString()}\n`;
    report += `  TOTAL REVENUE:                  Rs ${snapshot.revenue.total.toLocaleString()}\n\n`;

    report += `50000 EXPENSES & COGS (اخراجات و مال لاگت):\n`;
    report += `  50100 Cost of Goods Sold (COGS):Rs ${snapshot.expensesAndCogs.cogs.toLocaleString()}\n`;
    report += `  50200 Shop Rent:                Rs ${snapshot.expensesAndCogs.rent.toLocaleString()}\n`;
    report += `  50300 Electricity & Utility:    Rs ${snapshot.expensesAndCogs.electricity.toLocaleString()}\n`;
    report += `  50400 Staff Wages & Meals:      Rs ${snapshot.expensesAndCogs.wages.toLocaleString()}\n`;
    report += `  50500 Freight & Transport:      Rs ${snapshot.expensesAndCogs.freight.toLocaleString()}\n`;
    report += `  50700 Refreshment & Tea:        Rs ${snapshot.expensesAndCogs.refreshment.toLocaleString()}\n`;
    report += `  TOTAL EXPENSES & COGS:          Rs ${snapshot.expensesAndCogs.total.toLocaleString()}\n\n`;

    report += `----------------------------------------------------\n`;
    report += `NET PROFIT:                       Rs ${snapshot.netIncome.toLocaleString()}\n`;
    report += `ACCOUNTING BALANCE CHECK:         ${snapshot.balanceSheetInBalance ? 'PASSED (متوازن)' : 'DISCREPANCY'}\n`;
    report += `====================================================\n`;

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Babo_Store_COA_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Lock Screen
  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl border-2 border-slate-300 shadow-xl p-6 text-center space-y-5 animate-in fade-in">
          <div className="w-16 h-16 bg-slate-900 text-amber-400 rounded-2xl mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-xl font-black text-slate-900">Investor Uncle Mode</h2>
            <p className="text-sm font-urdu text-slate-600 font-bold mt-1">
              چارٹ آف اکاؤنٹس اور فنانشل رپورٹ (PIN: 1234)
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-black text-slate-700 block mb-2 uppercase tracking-wider">
                Enter 4-Digit PIN (خفیہ پن)
              </label>
              <input
                type="password"
                maxLength={4}
                autoFocus
                placeholder="••••"
                value={pinEntered}
                onChange={(e) => {
                  setPinEntered(e.target.value);
                  setPinError(false);
                }}
                className="w-full h-14 text-center font-mono-num text-3xl tracking-widest font-black rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none bg-slate-50"
              />
              {pinError && (
                <p className="text-xs text-red-600 font-black mt-2">
                  Incorrect PIN. Default is 1234
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full h-13 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 text-base"
            >
              <Unlock className="w-5 h-5 stroke-[2.5]" />
              <span>Unlock (کھولیں)</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 max-w-7xl mx-auto space-y-4">
      {/* Top Header Banner with 4 Clean Sub-Tabs */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Investor & Financial Accounts</span>
            <span className="text-amber-400 font-urdu text-lg">(حساب کتاب)</span>
          </h2>
          <p className="text-xs font-urdu text-slate-300 font-bold mt-1">
            سیلز ہسٹری، تاریخ فلٹرز، مکمل چارٹ آف اکاؤنٹس اور ہول سیلر ادھار کھاتہ
          </p>
        </div>

        {/* 4 Main Mode Switchers: Overview, Sales History, Chart of Accounts, Suppliers */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex gap-1 flex-wrap">
            <button
              onClick={() => setActiveSubTab('overview')}
              className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'overview'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Overview (خلاصہ)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('sales')}
              className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'sales'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Sales History (سیلز ہسٹری)</span>
              {sales.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-md bg-slate-900 text-[10px] text-amber-300 font-mono-num font-black">
                  {sales.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSubTab('coa')}
              className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'coa'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Accounts (حسابات)</span>
            </button>

            <button
              onClick={() => setActiveSubTab('suppliers')}
              className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'suppliers'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Suppliers (20100)</span>
            </button>
          </div>

          <button
            onClick={downloadFullReport}
            className="h-12 min-h-[48px] px-3 sm:px-4 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition active:scale-95"
            title="Download Full Accounting Ledger"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export COA</span>
          </button>

          <button
            onClick={() => setIsUnlocked(false)}
            className="h-12 min-h-[48px] px-3 sm:px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: OVERVIEW DASHBOARD */}
      {/* ========================================================================= */}
      {activeSubTab === 'overview' && (
        <div className="space-y-4">
          {/* Time Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-2xl border-2 border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setTimeFilter('today')}
                className={`h-12 min-h-[48px] px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  timeFilter === 'today' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Today (آج کا دن)
              </button>
              <button
                onClick={() => setTimeFilter('all')}
                className={`h-12 min-h-[48px] px-4 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                  timeFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Time (تمام ریکارڈ)
              </button>

              <button
                onClick={() => setActiveSubTab('sales')}
                className="h-12 min-h-[48px] px-4 rounded-xl text-xs sm:text-sm font-black bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>Custom Date Filter & Trends →</span>
              </button>
            </div>

            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="h-12 min-h-[48px] px-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Add Expense (خرچہ)</span>
            </button>
          </div>

          {/* 5 Balance Cards: Cash, Receivables, Inventory, Payables, Net Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 10100 Cash Drawer */}
            <div className={`p-4 rounded-3xl border-2 flex flex-col justify-between ${
              snapshot.assets.cashDrawer >= 0 ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-400'
            }`}>
              <div>
                <span className="text-[11px] font-black uppercase text-amber-900 block">10100 Cash in Drawer</span>
                <div className={`font-mono-num text-2xl font-black mt-1 ${
                  snapshot.assets.cashDrawer >= 0 ? 'text-amber-950' : 'text-red-700'
                }`}>
                  {settings.currency} {snapshot.assets.cashDrawer.toLocaleString()}
                </div>
                <p className="text-[11px] text-amber-800 font-bold mt-1">کاؤنٹر نقد کیش (خالص بعد از کٹوتیاں)</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCashAuditOpen(true)}
                className="mt-2 text-[10px] font-black bg-amber-200 hover:bg-amber-300 text-amber-950 px-2 py-1 rounded-lg cursor-pointer transition flex items-center gap-1 w-full justify-center"
              >
                <span>Audit Statement (حساب تفصیل) →</span>
              </button>
            </div>

            {/* 10200 Receivables (Customer Khata) */}
            <div className="bg-blue-50 p-4 rounded-3xl border-2 border-blue-300">
              <span className="text-[11px] font-black uppercase text-blue-900 block">10200 Receivables</span>
              <div className="font-mono-num text-2xl font-black text-blue-950 mt-1">
                {settings.currency} {snapshot.assets.accountsReceivable.toLocaleString()}
              </div>
              <p className="text-[11px] text-blue-800 font-bold mt-1">گاہکوں سے وصولی ادھار</p>
            </div>

            {/* 10300 Merchandise Inventory */}
            <div className="bg-slate-50 p-4 rounded-3xl border-2 border-slate-300">
              <span className="text-[11px] font-black uppercase text-slate-700 block">10300 Stock Inventory</span>
              <div className="font-mono-num text-2xl font-black text-slate-900 mt-1">
                {settings.currency} {snapshot.assets.inventory.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-600 font-bold mt-1">دکان میں موجود مال لاگت</p>
            </div>

            {/* 20100 Accounts Payable (Wholesale / Supplier Khata) */}
            <div className="bg-red-50 p-4 rounded-3xl border-2 border-red-300">
              <span className="text-[11px] font-black uppercase text-red-900 block">20100 Supplier Payables</span>
              <div className="font-mono-num text-2xl font-black text-red-950 mt-1">
                {settings.currency} {snapshot.liabilities.accountsPayable.toLocaleString()}
              </div>
              <p className="text-[11px] text-red-800 font-bold mt-1">ہول سیلر کو ادائیگیاں (ادائیگی سے کیش کٹتا ہے)</p>
            </div>

            {/* Net Profit */}
            <div className="bg-emerald-50 p-4 rounded-3xl border-2 border-emerald-400">
              <span className="text-[11px] font-black uppercase text-emerald-900 block">Net Profit</span>
              <div className={`font-mono-num text-2xl font-black mt-1 ${
                netProfit >= 0 ? 'text-emerald-950' : 'text-red-700'
              }`}>
                {settings.currency} {netProfit.toLocaleString()}
              </div>
              <p className="text-[11px] text-emerald-800 font-bold mt-1">صاف منافع (آمدنی منفی لاگت و خرچ)</p>
            </div>
          </div>

          {/* Cash Flow Reconciliation Ribbon */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-3 sm:p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                  Cash in Drawer Flow & Deductions (دراز نقد کیش آمد و کٹوتی کا توازن)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCashAuditOpen(true)}
                className="text-xs font-black text-amber-800 hover:text-amber-950 underline cursor-pointer"
              >
                View Full Audit (مکمل تفصیل)
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2 bg-slate-50 border rounded-xl">
                <div className="text-[10px] text-slate-500 font-bold">1. Opening Cash (ابتدائی)</div>
                <div className="font-mono-num font-black text-slate-800">
                  {settings.currency} {snapshot.cashDrawerBreakdown.initialCash.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] text-emerald-700 font-bold">2. (+) Cash Sales (نقد سیلز)</div>
                <div className="font-mono-num font-black text-emerald-800">
                  +{settings.currency} {snapshot.cashDrawerBreakdown.cashSales.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="text-[10px] text-emerald-700 font-bold">3. (+) Khata Recovery (وصولی)</div>
                <div className="font-mono-num font-black text-emerald-800">
                  +{settings.currency} {snapshot.cashDrawerBreakdown.customerRecoveries.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="text-[10px] text-red-600 font-bold">4. (-) Expenses (اخراجات)</div>
                <div className="font-mono-num font-black text-red-700">
                  -{settings.currency} {snapshot.cashDrawerBreakdown.expensesPaid.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl">
                <div className="text-[10px] text-red-600 font-bold">5. (-) Supplier Paid (ادائیگیاں)</div>
                <div className="font-mono-num font-black text-red-700">
                  -{settings.currency} {snapshot.cashDrawerBreakdown.supplierPaymentsPaid.toLocaleString()}
                </div>
              </div>
              <div className="p-2 bg-amber-100/70 border-2 border-amber-300 rounded-xl">
                <div className="text-[10px] text-amber-950 font-black">(=) Net Drawer Cash (نقد)</div>
                <div className="font-mono-num font-black text-amber-950 text-sm">
                  {settings.currency} {snapshot.cashDrawerBreakdown.netCashDrawer.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Expenses & Sales Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="font-black text-base text-slate-900">Expenses Log (اخراجات)</h3>
                <span className="font-mono-num font-bold text-xs text-red-700">
                  Total: {settings.currency} {totalExpenseAmount.toLocaleString()}
                </span>
              </div>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {filteredExpenses.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 font-bold">
                    No expenses logged for this period.
                  </div>
                ) : (
                  filteredExpenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 hover:bg-slate-100/70 transition"
                    >
                      <div className="flex-1">
                        <div className="font-black text-sm text-slate-900">{exp.title}</div>
                        <div className="text-xs text-slate-500 font-medium">Category: {exp.category}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-mono-num font-black text-sm text-red-700">
                          - {settings.currency} {exp.amount.toLocaleString()}
                        </div>

                        <button
                          onClick={() => {
                            if (
                              confirm(
                                `Delete expense "${exp.title}" (${settings.currency} ${exp.amount.toLocaleString()})? (کیا یہ خرچہ ختم کرنا ہے؟)`
                              )
                            ) {
                              onDeleteExpense(exp.id);
                              sounds.playScan();
                            }
                          }}
                          className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-6 bg-white rounded-3xl border-2 border-slate-200 p-5 space-y-3">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <h3 className="font-black text-base text-slate-900">Sales Summary (سیلز کا خلاصہ)</h3>
                <button
                  onClick={() => setActiveSubTab('sales')}
                  className="text-xs font-black text-emerald-700 hover:text-emerald-900 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Detailed Trends & Invoices →</span>
                </button>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 text-sm font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Retail Sales (40100):</span>
                  <span className="font-mono-num font-black text-slate-900">
                    {settings.currency} {totalSalesRevenue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Cost of Goods Sold (50100 COGS):</span>
                  <span className="font-mono-num font-black text-slate-700">
                    {settings.currency} {totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-emerald-800 font-black">
                  <span>Gross Profit (خالص نفع):</span>
                  <span className="font-mono-num text-base">
                    {settings.currency} {totalGrossProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: SALES HISTORY & TRENDS WITH DATE-RANGE FILTER                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales' && (
        <div className="space-y-4">
          {/* Main Control Card: Date Range Presets + Calendar Inputs */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-3 border-b-2 border-slate-100">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-700" />
                  <span>Sales History & Trends</span>
                  <span className="text-sm font-urdu text-slate-500">(سیلز کی تاریخ اور رجحان)</span>
                </h3>
                <p className="text-xs text-slate-600 font-bold mt-0.5">
                  Filter by day, week, month, or custom date range to see live revenue and daily performance.
                </p>
              </div>

              {/* Excel Export Button */}
              <button
                type="button"
                onClick={handleExportFilteredSales}
                className="h-12 min-h-[48px] px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md transition active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Export Filtered Sales (Excel CSV)</span>
              </button>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-slate-600 uppercase tracking-wider mr-1">Quick Filter:</span>

              <button
                type="button"
                onClick={() => handleSelectPreset('today')}
                className={`h-11 min-h-[44px] px-3.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  salesPreset === 'today'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Today (آج)
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('yesterday')}
                className={`h-11 min-h-[44px] px-3.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  salesPreset === 'yesterday'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Yesterday (گزشتہ کل)
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('this_week')}
                className={`h-11 min-h-[44px] px-3.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  salesPreset === 'this_week'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                This Week (اس ہفتے)
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('this_month')}
                className={`h-11 min-h-[44px] px-3.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  salesPreset === 'this_month'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                This Month (اس مہینے)
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('last_month')}
                className={`h-11 min-h-[44px] px-3.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  salesPreset === 'last_month'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Last Month (گزشتہ مہینہ)
              </button>

              <button
                type="button"
                onClick={() => handleSelectPreset('all')}
                className={`h-11 min-h-[44px] px-3.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  salesPreset === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Time (مکمل ریکارڈ)
              </button>
            </div>

            {/* Custom Date Pickers & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                  Start Date (تاریخ آغاز)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setSalesPreset('custom');
                    }}
                    className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold font-mono-num rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                  End Date (تاریخ اختتام)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setSalesPreset('custom');
                    }}
                    className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold font-mono-num rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none bg-white cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                  Payment Type (طریقہ ادائیگی)
                </label>
                <select
                  value={salesPaymentFilter}
                  onChange={(e) => setSalesPaymentFilter(e.target.value as any)}
                  className="w-full h-12 min-h-[48px] px-3 text-sm font-black rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none bg-white cursor-pointer"
                >
                  <option value="all">All Payments (نقد + ادھار)</option>
                  <option value="cash">Cash Sales Only (صرف نقد)</option>
                  <option value="credit">Credit / Khata Only (صرف ادھار)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-700 block mb-1">
                  Search Invoices / Customer (تلاش)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-4" />
                  <input
                    type="text"
                    placeholder="Invoice # or customer name..."
                    value={salesSearchQuery}
                    onChange={(e) => setSalesSearchQuery(e.target.value)}
                    className="w-full h-12 min-h-[48px] pl-10 pr-3.5 text-sm font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none bg-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4 Big KPI Cards for the Selected Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. Total Range Revenue */}
            <div className="bg-sky-50 border-2 border-sky-300 p-4 rounded-3xl">
              <span className="text-[11px] font-black uppercase text-sky-900 block">Total Range Sales (کل سیلز آمدنی)</span>
              <div className="font-mono-num text-2xl font-black text-sky-950 mt-1">
                {settings.currency} {rangeStats.totalRev.toLocaleString()}
              </div>
              <div className="text-[11px] text-sky-800 font-bold mt-1">
                {rangeStats.totalInvoices} Invoices (بل)
              </div>
            </div>

            {/* 2. Cash vs Credit Split */}
            <div className="bg-amber-50 border-2 border-amber-300 p-4 rounded-3xl">
              <span className="text-[11px] font-black uppercase text-amber-900 block">Cash vs Credit Breakdown</span>
              <div className="font-mono-num text-sm font-black text-amber-950 mt-1 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="text-emerald-800">Cash (نقد):</span>
                  <span>{settings.currency} {rangeStats.cashSales.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-amber-800">Khata (ادھار):</span>
                  <span>{settings.currency} {rangeStats.creditSales.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* 3. COGS / Wholesale Cost */}
            <div className="bg-slate-50 border-2 border-slate-300 p-4 rounded-3xl">
              <span className="text-[11px] font-black uppercase text-slate-700 block">Wholesale Cost (مال لاگت 50100)</span>
              <div className="font-mono-num text-2xl font-black text-slate-900 mt-1">
                {settings.currency} {rangeStats.totalCost.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-600 font-bold mt-1">
                Avg Basket: {settings.currency} {rangeStats.avgBasket.toLocaleString()}
              </div>
            </div>

            {/* 4. Gross Profit & Margin */}
            <div className="bg-emerald-50 border-2 border-emerald-400 p-4 rounded-3xl">
              <span className="text-[11px] font-black uppercase text-emerald-900 block">Gross Profit (خالص منافع)</span>
              <div className="font-mono-num text-2xl font-black text-emerald-950 mt-1">
                {settings.currency} {rangeStats.totalProfit.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-800 font-bold mt-1">
                Margin: {rangeStats.marginPercent}% on Retail Sales
              </div>
            </div>
          </div>

          {/* Daily Trends Visualization (Bar Chart & Daily Breakdown) */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b-2 border-slate-100 pb-2">
              <div>
                <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Daily Revenue Trend (روزانہ سیلز کا رجحان)</span>
                </h4>
                <p className="text-xs text-slate-500 font-bold">
                  Visual breakdown of sales per day across the selected date range.
                </p>
              </div>

              {dailyTrends.length > 0 && (
                <span className="text-xs font-mono-num font-black text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
                  {dailyTrends.length} Active Sales Days
                </span>
              )}
            </div>

            {dailyTrends.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-sm">
                No sales recorded in this date range. Try selecting "This Month" or "All Time".
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {/* Visual Bars Container */}
                <div className="flex items-end gap-2 overflow-x-auto pb-2 pt-6 min-h-[160px]">
                  {dailyTrends.map((day) => {
                    const heightPercent = Math.max(12, Math.round((day.revenue / maxDailyRevenue) * 100));
                    return (
                      <div
                        key={day.dateStr}
                        className="flex-1 min-w-[54px] max-w-[80px] flex flex-col items-center gap-1 group cursor-pointer"
                        title={`${day.dateStr}: ${settings.currency} ${day.revenue.toLocaleString()} (${day.count} sales, Profit: ${settings.currency} ${day.profit.toLocaleString()})`}
                      >
                        {/* Hover/Top Value */}
                        <span className="font-mono-num text-[10px] font-black text-slate-700 opacity-90 group-hover:text-emerald-700 group-hover:scale-105 transition-all text-center">
                          {day.revenue >= 1000 ? `${Math.round(day.revenue / 1000)}k` : day.revenue}
                        </span>

                        {/* Bar */}
                        <div className="w-full bg-slate-100 rounded-t-xl h-28 flex items-end overflow-hidden p-0.5">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full bg-linear-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all group-hover:from-emerald-700 group-hover:to-teal-500 shadow-xs"
                          />
                        </div>

                        {/* Date Label */}
                        <span className="text-[10px] font-bold text-slate-600 font-mono-num whitespace-nowrap">
                          {day.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Compact Daily Breakdown Table */}
                <div className="overflow-x-auto border-2 border-slate-100 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-white font-black uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Date (تاریخ)</th>
                        <th className="py-2.5 px-3 text-right">Invoices (بل)</th>
                        <th className="py-2.5 px-3 text-right">Cash (نقد)</th>
                        <th className="py-2.5 px-3 text-right">Khata Credit (ادھار)</th>
                        <th className="py-2.5 px-3 text-right">Total Revenue (کل آمدنی)</th>
                        <th className="py-2.5 px-3 text-right">Gross Profit (منافع)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono-num font-bold text-slate-800">
                      {dailyTrends
                        .slice()
                        .reverse()
                        .map((day) => (
                          <tr key={day.dateStr} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 font-sans font-black text-slate-900">{day.dateStr}</td>
                            <td className="py-2.5 px-3 text-right">{day.count}</td>
                            <td className="py-2.5 px-3 text-right text-emerald-700">
                              {settings.currency} {day.cash.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right text-amber-800">
                              {settings.currency} {day.credit.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-slate-900">
                              {settings.currency} {day.revenue.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-emerald-800">
                              {settings.currency} {day.profit.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Itemized Sales Records List */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-black text-slate-900 text-base">Invoices Log (تفصیلی رسیدات و بل)</h4>
                <p className="text-xs text-slate-500 font-bold">
                  Showing {rangeFilteredSales.length} matching invoices
                </p>
              </div>

              <div className="text-right">
                <span className="font-mono-num font-black text-base text-slate-900">
                  {settings.currency} {rangeStats.totalRev.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 font-bold block">Range Total</span>
              </div>
            </div>

            {rangeFilteredSales.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-bold text-sm">
                No invoices found matching current filter and search criteria.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {rangeFilteredSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 font-mono-num text-sm sm:text-base">
                          {sale.invoiceNumber}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-lg text-xs font-black flex items-center gap-1 ${
                            sale.paymentType === 'credit'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}
                        >
                          {sale.paymentType === 'credit' ? (
                            <>
                              <CreditCard className="w-3 h-3 text-amber-700" />
                              <span>Credit (ادھار)</span>
                            </>
                          ) : (
                            <>
                              <Banknote className="w-3 h-3 text-emerald-700" />
                              <span>Cash (نقد)</span>
                            </>
                          )}
                        </span>

                        {sale.customerName && (
                          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg">
                            👤 {sale.customerName}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 font-bold mt-1 flex items-center gap-2 flex-wrap">
                        <span>
                          {new Date(sale.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                        <span>•</span>
                        <span>{sale.items?.length || 0} items</span>
                        <span>•</span>
                        <span className="truncate max-w-[280px] sm:max-w-md text-slate-600">
                          {sale.items?.map((it) => `${it.name} (${it.quantity} ${it.unit})`).join(', ')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="font-mono-num font-black text-base sm:text-lg text-slate-900">
                          {settings.currency} {sale.total.toLocaleString()}
                        </div>
                        <div className="text-[11px] font-mono-num font-black text-emerald-700">
                          +{settings.currency} {sale.profit.toLocaleString()} profit
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSaleDetail(sale)}
                        className="h-10 min-h-[40px] px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                        title="View Full Receipt"
                      >
                        <Eye className="w-4 h-4 text-slate-600" />
                        <span className="hidden sm:inline">Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: FULL CHART OF ACCOUNTS (10000, 20000, 30000, 40000, 50000)   */}
      {/* ========================================================================= */}
      {activeSubTab === 'coa' && (
        <AccountChartComponent
          products={products}
          customers={customers}
          suppliers={suppliers}
          sales={sales}
          expenses={expenses}
          settings={settings}
          snapshot={snapshot}
          transactions={transactions}
          supplierTransactions={supplierTransactions}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: SUPPLIER / WHOLESALE KHATA (ACCOUNTS PAYABLE 20100)           */}
      {/* ========================================================================= */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Wholesale Supplier Khata (20100)</h2>
              <p className="text-xs font-urdu text-slate-600 font-bold">
                مارکیٹ و ہول سیلر ادھار — جب منڈی سے مال خریدیں یا ڈیلر کو ادائیگی کریں
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <div className="bg-red-50 border-2 border-red-300 px-4 py-2 rounded-2xl text-right">
                <span className="text-[11px] font-black text-red-700 block uppercase">Total Market Payable (کل واجب الادا)</span>
                <span className="font-mono-num font-black text-xl text-red-950">
                  {settings.currency} {snapshot.liabilities.accountsPayable.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="h-12 min-h-[48px] px-5 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition text-sm active:scale-95"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>New Supplier (نیا ڈیلر)</span>
              </button>
            </div>
          </div>

          {suppliers.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-4">
              <Users className="w-16 h-16 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-xl font-black text-slate-900">No Wholesale Suppliers Yet</h3>
                <p className="text-xs font-urdu text-slate-600 font-bold mt-1">
                  منڈی یا ہول سیلر کے ادھار کھاتے درج کرنے کے لیے بٹن دبائیں
                </p>
              </div>
              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="w-full h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition text-base"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>Add First Supplier (پہلا ڈیلر شامل کریں)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Suppliers List */}
              <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col h-[600px] overflow-hidden">
                <div className="p-3 bg-slate-50 border-b-2 border-slate-200">
                  <span className="text-xs font-black uppercase text-slate-700">Suppliers & Distributors</span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {suppliers.map((s) => {
                    const isSelected = selectedSupplier?.id === s.id;
                    const shopOwes = s.balance > 0;

                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSupplierId(s.id)}
                        type="button"
                        className={`w-full min-h-[56px] p-3 rounded-2xl text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-red-50 border-2 border-red-500 shadow-sm'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div>
                          <div className="font-black text-base text-slate-900 leading-tight">{s.name}</div>
                          <div className="text-xs text-slate-500 font-mono-num font-bold mt-0.5">📞 {s.phone}</div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`font-mono-num font-black text-base block ${
                              shopOwes ? 'text-red-700' : 'text-emerald-700'
                            }`}
                          >
                            {settings.currency} {s.balance.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 font-bold block">
                            {shopOwes ? 'Payable (دینا ہے)' : 'Cleared'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Supplier Ledger */}
              <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col h-[600px] overflow-hidden">
                {selectedSupplier ? (
                  <div className="flex flex-col h-full">
                    {/* Supplier Header */}
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                      <div>
                        <h3 className="font-black text-xl leading-tight">{selectedSupplier.name}</h3>
                        <p className="text-xs text-slate-300 font-mono-num font-bold mt-0.5">📞 {selectedSupplier.phone}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedSupplier.balance === 0 ? (
                          <button
                            onClick={() => {
                              if (confirm(`Delete supplier ${selectedSupplier.name}? (ڈیلر کا کھاتہ ختم کریں؟)`)) {
                                onDeleteSupplier(selectedSupplier.id);
                                setSelectedSupplierId(null);
                              }
                            }}
                            className="h-11 min-h-[44px] px-3.5 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
                            title="Supplier Paid Off - Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Paid Off: Delete (ڈیلر ختم کریں)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  `Supplier ${selectedSupplier.name} has pending balance of ${settings.currency} ${selectedSupplier.balance.toLocaleString()}. Are you sure you want to delete this supplier?`
                                )
                              ) {
                                onDeleteSupplier(selectedSupplier.id);
                                setSelectedSupplierId(null);
                              }
                            }}
                            className="h-11 min-h-[44px] px-3.5 bg-red-800 hover:bg-red-700 text-white font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Supplier (ڈیلر ختم کریں)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Balance Banner */}
                    <div className="p-4 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-black text-slate-600">
                          Balance Due (دکان نے ادا کرنے ہیں)
                        </span>
                        <p className="text-xs font-urdu font-black text-slate-500">واجب الادا رقم</p>
                      </div>
                      <div className="font-mono-num text-3xl font-black text-red-700">
                        {settings.currency} {selectedSupplier.balance.toLocaleString()}
                      </div>
                    </div>

                    {/* THE 2 GIANT ACTIONS FOR SUPPLIERS */}
                    <div className="p-4 grid grid-cols-2 gap-3 bg-slate-100 border-b-2 border-slate-200">
                      {/* 🔴 Bought Stock on Credit (Payable Increases) */}
                      <button
                        type="button"
                        onClick={() => setSuppTxnType('purchase_credit')}
                        className="h-16 min-h-[56px] rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black flex items-center justify-center gap-3 shadow-md shadow-red-600/20 cursor-pointer transition"
                      >
                        <ArrowUpRight className="w-7 h-7 stroke-[3]" />
                        <div className="text-left">
                          <div className="text-base font-black leading-tight">Stock on Credit</div>
                          <div className="text-xs font-urdu font-black opacity-95">ادھار مال خریدا (دینا بڑھا)</div>
                        </div>
                      </button>

                      {/* 🟢 Paid Supplier (Payable Decreases) */}
                      <button
                        type="button"
                        onClick={() => setSuppTxnType('payment_made')}
                        className="h-16 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black flex items-center justify-center gap-3 shadow-md shadow-emerald-600/20 cursor-pointer transition"
                      >
                        <ArrowDownLeft className="w-7 h-7 stroke-[3]" />
                        <div className="text-left">
                          <div className="text-base font-black leading-tight">Paid Supplier</div>
                          <div className="text-xs font-urdu font-black opacity-95">ڈیلر کو ادائیگی کی (دینا کم ہوا)</div>
                        </div>
                      </button>
                    </div>

                    {/* Ledger History */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      <span className="text-xs font-black text-slate-600 uppercase tracking-wider block mb-2">
                        Supplier Ledger History (کھاتہ تفصیل)
                      </span>

                      {currentSupplierTransactions.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 font-bold text-sm">
                          No transactions recorded yet with this dealer.
                        </div>
                      ) : (
                        currentSupplierTransactions.map((tx) => {
                          const isPurchase = tx.type === 'purchase_credit';
                          return (
                            <div
                              key={tx.id}
                              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-sm ${
                                isPurchase ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              <div>
                                <div className="font-black text-slate-900 text-sm sm:text-base">
                                  {isPurchase ? 'Bought Stock on Credit (مال خریدا)' : 'Paid Supplier (ادائیگی کی)'}
                                </div>
                                <div className="text-xs text-slate-600 font-bold mt-0.5">
                                  {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                  {tx.note && <span className="ml-2 font-black text-slate-800">• {tx.note}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div
                                    className={`font-mono-num font-black text-lg ${
                                      isPurchase ? 'text-red-700' : 'text-emerald-700'
                                    }`}
                                  >
                                    {isPurchase ? '+' : '-'} {settings.currency} {tx.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs font-mono-num font-bold text-slate-500">
                                    Balance: {settings.currency} {tx.balanceAfter.toLocaleString()}
                                  </div>
                                </div>

                                <button
                                  onClick={() => {
                                    if (confirm('Delete this supplier ledger entry? (کیا یہ انٹری ڈیلیٹ کرنی ہے؟)')) {
                                      onDeleteSupplierTransaction(tx.id);
                                    }
                                  }}
                                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-100 flex items-center justify-center transition cursor-pointer"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center p-6 text-slate-400 font-bold">
                    Select a supplier on the left to view ledger
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Invoice Details View                                              */}
      {/* ========================================================================= */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs uppercase tracking-wider text-amber-400 font-black">Invoice Details</span>
                <h3 className="font-mono-num font-black text-lg">{selectedSaleDetail.invoiceNumber}</h3>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer font-black text-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Invoice Meta */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-bold block">Date & Time:</span>
                <span className="font-black text-slate-900">
                  {new Date(selectedSaleDetail.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block">Payment Mode:</span>
                <span className="font-black text-slate-900 capitalize">
                  {selectedSaleDetail.paymentType === 'credit' ? 'Credit / Khata (ادھار)' : 'Cash (نقد)'}
                </span>
              </div>
              {selectedSaleDetail.customerName && (
                <div className="col-span-2">
                  <span className="text-slate-500 font-bold block">Customer:</span>
                  <span className="font-black text-slate-900">
                    {selectedSaleDetail.customerName} {selectedSaleDetail.customerPhone && `(${selectedSaleDetail.customerPhone})`}
                  </span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <span className="text-xs font-black uppercase text-slate-600 block mb-1">Purchased Items:</span>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {selectedSaleDetail.items?.map((it, idx) => (
                  <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-black text-slate-900">
                        {it.name} {it.nameUrdu && <span className="font-urdu text-slate-600">({it.nameUrdu})</span>}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono-num">
                        {it.quantity} {it.unit} × {settings.currency} {it.unitPrice}
                      </div>
                    </div>
                    <div className="font-mono-num font-black text-slate-900 text-sm">
                      {settings.currency} {it.total.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Profit Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 space-y-1.5 text-xs font-bold shrink-0">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono-num">{settings.currency} {selectedSaleDetail.subtotal.toLocaleString()}</span>
              </div>
              {selectedSaleDetail.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-mono-num">- {settings.currency} {selectedSaleDetail.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 border-t border-slate-300 pt-1.5">
                <span>Total Net Bill:</span>
                <span className="font-mono-num">{settings.currency} {selectedSaleDetail.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-black pt-0.5">
                <span>Estimated Gross Profit:</span>
                <span className="font-mono-num">+{settings.currency} {selectedSaleDetail.profit.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedSaleDetail(null)}
                className="w-full h-12 min-h-[48px] bg-slate-900 text-white font-black rounded-2xl cursor-pointer hover:bg-black transition text-sm"
              >
                Close (بند کریں)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-5 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-base text-slate-900">Add Shop Expense (خرچہ)</h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 font-black cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5">
              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Expense Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Electricity Bill (بجلی بل)"
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-2xl border-2 border-slate-200 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Amount ({settings.currency})</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="1000"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className="w-full h-13 min-h-[48px] px-3.5 font-mono-num text-xl font-black rounded-2xl border-2 border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black text-slate-700 block mb-1">Category (COA Account)</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as Expense['category'])}
                  className="w-full h-12 min-h-[48px] px-3 text-sm font-black rounded-2xl border-2 border-slate-200 outline-none bg-white cursor-pointer"
                >
                  <option value="rent">50200 Shop Rent (کرایہ)</option>
                  <option value="electricity">50300 Electricity & Utility (بجلی بل)</option>
                  <option value="salary">50400 Staff Wages & Meals (دیہاڑی و کھانا)</option>
                  <option value="transport">50500 Market Freight / Carriage (منڈی کرایہ)</option>
                  <option value="refreshment">50700 Refreshment & Tea (چائے پانی)</option>
                  <option value="other">50700 Other (متفرق)</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-amber-900">
                  <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Deduction from Cash in Drawer (دراز سے منہا ہوگا):</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 font-bold">
                  <span>Current Cash in Drawer:</span>
                  <span className="font-mono-num font-black">{settings.currency} {snapshot.assets.cashDrawer.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-red-600 font-bold">
                  <span>(-) Expense Amount:</span>
                  <span className="font-mono-num font-black">-{settings.currency} {(parseFloat(expAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 font-black border-t border-amber-200 pt-1">
                  <span>Remaining Cash in Drawer:</span>
                  <span className={`font-mono-num ${(snapshot.assets.cashDrawer - (parseFloat(expAmount) || 0)) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {settings.currency} {(snapshot.assets.cashDrawer - (parseFloat(expAmount) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="flex-1 h-12 min-h-[48px] rounded-2xl border border-slate-300 text-slate-700 font-black hover:bg-slate-100 cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 h-12 min-h-[48px] bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Save Expense</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">Add Wholesale Supplier (نیا ڈیلر)</h3>
              <button
                onClick={() => setIsAddSupplierOpen(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 font-black cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Supplier / Agency Name (ڈیلر یا ایجنسی کا نام) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandi Rice Wholesaler / گھی ڈسٹری بیوٹر"
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  className="w-full h-13 min-h-[48px] px-4 text-base font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Mobile Number (فون نمبر)
                </label>
                <input
                  type="tel"
                  placeholder="0300-1234567"
                  value={suppPhone}
                  onChange={(e) => setSuppPhone(e.target.value)}
                  className="w-full h-13 min-h-[48px] px-4 text-base font-mono-num font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Existing Outstanding Balance (پہلے سے موجود واجب الادا ادھار)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={suppInitialBalance}
                  onChange={(e) => setSuppInitialBalance(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className="w-full h-13 min-h-[48px] px-4 text-lg font-mono-num font-black rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="flex-1 h-13 min-h-[48px] rounded-2xl border-2 border-slate-300 font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Save Supplier</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Supplier Transaction */}
      {suppTxnType && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3
                  className={`font-black text-lg ${
                    suppTxnType === 'purchase_credit' ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {suppTxnType === 'purchase_credit' ? 'Bought Stock on Credit (مال خریدا)' : 'Paid Supplier (ادائیگی کی)'}
                </h3>
                <p className="text-xs text-slate-600 font-bold">Supplier: {selectedSupplier.name}</p>
              </div>
              <button
                onClick={() => setSuppTxnType(null)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 font-black cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordSupplierTxn} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Amount ({settings.currency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="5000"
                  value={suppTxnAmount}
                  onChange={(e) => setSuppTxnAmount(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className={`w-full h-14 min-h-[48px] px-4 font-mono-num text-2xl font-black rounded-2xl border-2 outline-none ${
                    suppTxnType === 'purchase_credit'
                      ? 'border-red-400 focus:border-red-600 bg-red-50 text-red-900'
                      : 'border-emerald-400 focus:border-emerald-600 bg-emerald-50 text-emerald-900'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Note / Invoice Details (سامان یا بل تفصیل)
                </label>
                <input
                  type="text"
                  placeholder={
                    suppTxnType === 'purchase_credit'
                      ? 'e.g. 10 bags sugar + 5 ghee cartons'
                      : 'e.g. Cash paid from counter drawer'
                  }
                  value={suppTxnNote}
                  onChange={(e) => setSuppTxnNote(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-2xl border-2 border-slate-300 outline-none"
                />
              </div>

              {suppTxnType === 'payment_made' && (
                <div className="p-3 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-950 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-amber-900">
                    <Banknote className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Deduction from Cash in Drawer (دراز سے کٹوتی ہوگی):</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 font-bold">
                    <span>Available Cash in Drawer:</span>
                    <span className="font-mono-num font-black">{settings.currency} {snapshot.assets.cashDrawer.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-red-600 font-bold">
                    <span>(-) Paid to Supplier:</span>
                    <span className="font-mono-num font-black">-{settings.currency} {(parseFloat(suppTxnAmount) || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-900 font-black border-t border-amber-200 pt-1">
                    <span>Remaining Cash in Drawer:</span>
                    <span className={`font-mono-num ${(snapshot.assets.cashDrawer - (parseFloat(suppTxnAmount) || 0)) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {settings.currency} {(snapshot.assets.cashDrawer - (parseFloat(suppTxnAmount) || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSuppTxnType(null)}
                  className="flex-1 h-13 min-h-[48px] rounded-2xl border-2 border-slate-300 font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-2 h-13 min-h-[48px] text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    suppTxnType === 'purchase_credit' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Confirm (درج کریں)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Full Cash in Drawer Audit & Reconciliation Modal */}
      {isCashAuditOpen && snapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Banknote className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg">
                    10100 Cash in Drawer Audit (کاؤنٹر دراز کیش حساب)
                  </h3>
                  <p className="text-xs font-urdu text-amber-300 font-bold">
                    آمد و خرچ، ادھار وصولی اور ہول سیلر ادائیگیاں
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCashAuditOpen(false)}
                className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center font-black text-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statement Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Highlight Net Cash Box */}
              <div className={`p-4 rounded-2xl border-2 text-center ${
                snapshot.cashDrawerBreakdown.netCashDrawer >= 0
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <span className="text-xs uppercase font-black tracking-wider block">
                  Net Available Cash in Drawer (موجودہ نقد رقم)
                </span>
                <div className="font-mono-num text-3xl sm:text-4xl font-black mt-1">
                  {settings.currency} {snapshot.cashDrawerBreakdown.netCashDrawer.toLocaleString()}
                </div>
                <p className="text-xs font-urdu font-bold mt-1 text-slate-600">
                  تمام نقد فروخت، اخراجات اور مارکیٹ ادائیگیوں کے بعد دراز میں موجود نقد کیش
                </p>
              </div>

              {/* Inflows & Outflows Itemized List */}
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 divide-y divide-slate-200 text-xs sm:text-sm font-bold">
                {/* 1. Starting Cash */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <div>
                      <div className="font-black text-slate-800">Starting Cash (ابتدائی دراز کیش)</div>
                      <div className="text-[11px] text-slate-500">Configured in Shop Settings</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-slate-800">
                    {settings.currency} {snapshot.cashDrawerBreakdown.initialCash.toLocaleString()}
                  </div>
                </div>

                {/* 2. Cash Sales Inflow */}
                <div className="p-3 flex items-center justify-between bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-black text-emerald-950">(+) Retail Cash Sales (نقد سیلز)</div>
                      <div className="text-[11px] text-emerald-800">Cash received from store merchandise sales</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-emerald-700">
                    +{settings.currency} {snapshot.cashDrawerBreakdown.cashSales.toLocaleString()}
                  </div>
                </div>

                {/* 3. Customer Khata Collections */}
                <div className="p-3 flex items-center justify-between bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-black text-emerald-950">(+) Customer Khata Recoveries (ادھار وصولی)</div>
                      <div className="text-[11px] text-emerald-800">Credit customers paying their balances</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-emerald-700">
                    +{settings.currency} {snapshot.cashDrawerBreakdown.customerRecoveries.toLocaleString()}
                  </div>
                </div>

                {/* 4. Operating Expenses Outflow */}
                <div className="p-3 flex items-center justify-between bg-rose-50/50">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <div className="font-black text-rose-950">(-) Cash Expenses Paid (دکان کے اخراجات)</div>
                      <div className="text-[11px] text-rose-800">Rent, electricity, wages, tea, freight</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-red-600">
                    -{settings.currency} {snapshot.cashDrawerBreakdown.expensesPaid.toLocaleString()}
                  </div>
                </div>

                {/* 5. Supplier / Wholesale Liability Payments Outflow */}
                <div className="p-3 flex items-center justify-between bg-rose-50/50">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <div className="font-black text-rose-950">(-) Supplier Payments (ہول سیلر کو ادائیگیاں)</div>
                      <div className="text-[11px] text-rose-800">Liabilities & wholesale market debts paid in cash</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-red-600">
                    -{settings.currency} {snapshot.cashDrawerBreakdown.supplierPaymentsPaid.toLocaleString()}
                  </div>
                </div>

                {/* Final Net Calculation */}
                <div className="p-3.5 flex items-center justify-between bg-amber-50">
                  <div className="font-black text-slate-900 text-sm">
                    (=) Net Cash in Drawer (موجودہ دراز نقد کیش)
                  </div>
                  <div className="font-mono-num font-black text-base sm:text-lg text-slate-900">
                    {settings.currency} {snapshot.cashDrawerBreakdown.netCashDrawer.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Informative Urdu Note */}
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="font-urdu leading-relaxed font-bold">
                  نوٹ: جب بھی آپ کسی ہول سیلر یا قرض خواہ کو رقم ادا کرتے ہیں، یا دکان کا کوئی خرچ کرتے ہیں تو وہ رقم خود بخود کاؤنٹر دراز کے کیش سے منہا (Minus) ہو جاتی ہے اور بیلنس شیٹ 100 فیصد بیلنس رہتی ہے۔
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCashAuditOpen(false)}
                className="h-12 min-h-[48px] px-6 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-sm cursor-pointer transition active:scale-95"
              >
                Close (بند کریں)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
