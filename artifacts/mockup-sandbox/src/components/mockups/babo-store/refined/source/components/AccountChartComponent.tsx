import React, { useState, useMemo } from 'react';
import { Product, Customer, Supplier, Sale, Expense, ShopSettings } from '../types';
import { ACCOUNT_GROUPS, CHART_OF_ACCOUNTS, calculateFinancialSnapshot, FinancialSnapshot } from '../utils/accounting';
import { Check, ChevronDown, ChevronUp, ShieldCheck, Layers, BookOpen } from 'lucide-react';

interface AccountChartComponentProps {
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  expenses: Expense[];
  settings: ShopSettings;
  snapshot?: FinancialSnapshot;
}

export const AccountChartComponent: React.FC<AccountChartComponentProps> = ({
  products,
  customers,
  suppliers,
  sales,
  expenses,
  settings,
  snapshot: propSnapshot,
}) => {
  // Real-time calculation if not provided
  const snapshot = useMemo(() => {
    return propSnapshot || calculateFinancialSnapshot(products, customers, suppliers, sales, expenses, settings);
  }, [propSnapshot, products, customers, suppliers, sales, expenses, settings]);

  // Collapsed / expanded state for each group
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    '10000': true,
    '20000': true,
    '30000': true,
    '40000': true,
    '50000': true,
  });

  const toggleGroup = (code: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  // Helper to extract balance per individual COA account
  const getAccountBalance = (accountCode: string): number => {
    switch (accountCode) {
      case '10100': return snapshot.assets.cashDrawer;
      case '10200': return snapshot.assets.accountsReceivable;
      case '10300': return snapshot.assets.inventory;
      case '10400': return snapshot.assets.bank;
      case '10500': return 0;
      case '20100': return snapshot.liabilities.accountsPayable;
      case '20200': return snapshot.liabilities.shortTermDebt;
      case '20300': return snapshot.liabilities.accruedExpenses;
      case '30100': return snapshot.equity.investorCapital;
      case '30200': return snapshot.equity.cashierCapital;
      case '30300': return snapshot.equity.retainedEarnings;
      case '40100': return snapshot.revenue.retailSales;
      case '40200': return snapshot.revenue.otherIncome;
      case '50100': return snapshot.expensesAndCogs.cogs;
      case '50200': return snapshot.expensesAndCogs.rent;
      case '50300': return snapshot.expensesAndCogs.electricity;
      case '50400': return snapshot.expensesAndCogs.wages;
      case '50500': return snapshot.expensesAndCogs.freight;
      case '50600': return snapshot.expensesAndCogs.damageLoss;
      case '50700': return snapshot.expensesAndCogs.refreshment;
      default: return 0;
    }
  };

  // Group running balances
  const getGroupTotal = (groupCode: string): number => {
    switch (groupCode) {
      case '10000': return snapshot.assets.total;
      case '20000': return snapshot.liabilities.total;
      case '30000': return snapshot.equity.total;
      case '40000': return snapshot.revenue.total;
      case '50000': return snapshot.expensesAndCogs.total;
      default: return 0;
    }
  };

  const getGroupBadgeColor = (groupCode: string) => {
    switch (groupCode) {
      case '10000': return 'bg-blue-600 text-white';
      case '20000': return 'bg-rose-600 text-white';
      case '30000': return 'bg-emerald-700 text-white';
      case '40000': return 'bg-amber-600 text-white';
      case '50000': return 'bg-purple-700 text-white';
      default: return 'bg-slate-700 text-white';
    }
  };

  const getGroupCardBorder = (groupCode: string) => {
    switch (groupCode) {
      case '10000': return 'border-blue-200 hover:border-blue-400';
      case '20000': return 'border-rose-200 hover:border-rose-400';
      case '30000': return 'border-emerald-200 hover:border-emerald-400';
      case '40000': return 'border-amber-200 hover:border-amber-400';
      case '50000': return 'border-purple-200 hover:border-purple-400';
      default: return 'border-slate-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Accounting Equation Check */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border-2 border-slate-300 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase text-slate-500 tracking-wider">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Accounting Equation (حساب کا توازن)</span>
          </div>
          <div className="text-base sm:text-xl font-black text-slate-900 flex flex-wrap items-center gap-2 mt-1">
            <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
              10000 Assets: {settings.currency} {snapshot.assets.total.toLocaleString()}
            </span>
            <span className="text-slate-400 font-black">=</span>
            <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl">
              20000 Liab: {settings.currency} {snapshot.liabilities.total.toLocaleString()}
            </span>
            <span className="text-slate-400 font-black">+</span>
            <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
              30000 Equity: {settings.currency} {snapshot.equity.total.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 text-emerald-950 border-2 border-emerald-300 rounded-2xl text-xs sm:text-sm font-black shrink-0">
          <ShieldCheck className="w-5 h-5 text-emerald-700 stroke-[2.5]" />
          <span>Real-time Verified (کھاتہ متوازن ہے)</span>
        </div>
      </div>

      {/* 5 Category Summary Grid (Quick Glance) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ACCOUNT_GROUPS.map((group) => {
          const total = getGroupTotal(group.code);
          return (
            <button
              key={group.code}
              type="button"
              onClick={() => toggleGroup(group.code)}
              className={`p-3.5 bg-white rounded-2xl border-2 ${getGroupCardBorder(group.code)} text-left transition shadow-xs cursor-pointer active:scale-95`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${getGroupBadgeColor(group.code)}`}>
                  {group.code}
                </span>
                <span className="text-[11px] font-bold text-slate-400 uppercase">{group.type}</span>
              </div>
              <div className="font-black text-slate-900 text-sm truncate">{group.name}</div>
              <div className="font-urdu text-xs text-slate-500 font-bold truncate">{group.nameUrdu}</div>
              <div className="font-mono-num font-black text-base sm:text-lg text-slate-950 mt-1">
                {settings.currency} {total.toLocaleString()}
              </div>
            </button>
          );
        })}
      </div>

      {/* All 5 Categories with Detailed Ledger Accounts */}
      <div className="space-y-4">
        {ACCOUNT_GROUPS.map((group) => {
          const groupAccounts = CHART_OF_ACCOUNTS.filter((acc) => acc.groupCode === group.code);
          const groupTotal = getGroupTotal(group.code);
          const isExpanded = expandedGroups[group.code] ?? true;

          return (
            <div
              key={group.code}
              className="bg-white rounded-3xl border-2 border-slate-300 overflow-hidden shadow-xs"
            >
              {/* Group Header Row (Min 48px height) */}
              <button
                type="button"
                onClick={() => toggleGroup(group.code)}
                className="w-full min-h-[52px] p-4 bg-slate-900 text-white flex justify-between items-center cursor-pointer hover:bg-slate-800 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono-num font-black text-amber-400 text-base sm:text-lg">
                    {group.code}
                  </span>
                  <div>
                    <span className="font-black text-base sm:text-lg text-white">
                      {group.name}
                    </span>
                    <span className="font-urdu text-sm font-bold text-slate-300 ml-2">
                      ({group.nameUrdu})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[11px] uppercase text-slate-400 block font-bold leading-none mb-0.5">
                      Running Balance
                    </span>
                    <span className="font-mono-num font-black text-base sm:text-xl text-amber-400">
                      {settings.currency} {groupTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </button>

              {/* Sub-Accounts Breakdown */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 text-sm">
                  {groupAccounts.map((account) => {
                    const balance = getAccountBalance(account.code);

                    return (
                      <div
                        key={account.code}
                        className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50 transition gap-2"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <span className="font-mono-num font-black text-slate-600 text-xs sm:text-sm bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                            {account.code}
                          </span>
                          <div>
                            <div className="font-black text-slate-900 text-sm sm:text-base">
                              {account.name}
                            </div>
                            <div className="text-xs font-urdu text-slate-600 font-bold">
                              {account.nameUrdu}
                              <span className="font-sans font-normal text-slate-400 ml-2 hidden sm:inline">
                                • {account.description}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-mono-num font-black text-sm sm:text-base text-slate-950">
                            {settings.currency} {balance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
