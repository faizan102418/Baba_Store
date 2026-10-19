import React, { useState } from 'react';
import { ShopSettings, Product, Customer, Supplier, SupplierTransaction, Sale, Expense, KhataTransaction } from '../types';
import { X, Save, Download, Upload, RotateCcw, Check, Store, Laptop, FileSpreadsheet, Package, Receipt, BookOpen, Zap } from 'lucide-react';
import { sounds } from '../utils/audio';
import {
  exportInventoryToCSV,
  exportSalesToCSV,
  exportTransactionsToCSV,
  exportAllDataToCSV,
} from '../utils/csvExport';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ShopSettings;
  onSaveSettings: (settings: ShopSettings) => void;
  allData: {
    products: Product[];
    customers: Customer[];
    suppliers?: Supplier[];
    supplierTransactions?: SupplierTransaction[];
    sales: Sale[];
    expenses: Expense[];
    transactions: KhataTransaction[];
  };
  onRestoreData: (data: {
    products: Product[];
    customers: Customer[];
    suppliers?: Supplier[];
    supplierTransactions?: SupplierTransaction[];
    sales: Sale[];
    expenses: Expense[];
    transactions: KhataTransaction[];
    settings: ShopSettings;
  }) => void;
  onResetToDemo: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  allData,
  onRestoreData,
  onResetToDemo,
}) => {
  const [formData, setFormData] = useState<ShopSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    sounds.playCashRegister();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  const notifyExportSuccess = (tag: string) => {
    sounds.playCashRegister();
    setExportSuccess(tag);
    setTimeout(() => setExportSuccess(null), 2500);
  };

  const handleExportAllCSV = async () => {
    await exportAllDataToCSV({
      products: allData.products,
      sales: allData.sales,
      customers: allData.customers,
      suppliers: allData.suppliers,
      transactions: allData.transactions,
      supplierTransactions: allData.supplierTransactions,
      shopName: formData.shopName,
    });
    notifyExportSuccess('all');
  };

  const handleExportInventory = () => {
    exportInventoryToCSV(allData.products, formData.shopName);
    notifyExportSuccess('inventory');
  };

  const handleExportSales = () => {
    exportSalesToCSV(allData.sales, formData.shopName);
    notifyExportSuccess('sales');
  };

  const handleExportTransactions = () => {
    exportTransactionsToCSV(
      allData.transactions,
      allData.customers,
      allData.suppliers || [],
      allData.supplierTransactions || [],
      formData.shopName
    );
    notifyExportSuccess('transactions');
  };

  const handleDownloadBackup = () => {
    const backupObj = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      shopName: formData.shopName,
      settings: formData,
      products: allData.products,
      customers: allData.customers,
      suppliers: allData.suppliers || [],
      supplierTransactions: allData.supplierTransactions || [],
      sales: allData.sales,
      expenses: allData.expenses,
      transactions: allData.transactions,
    };

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.shopName.replace(/\s+/g, '_')}_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    sounds.playCashRegister();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.products && json.customers) {
          onRestoreData(json);
          sounds.playCashRegister();
          alert('Backup restored successfully! (بیک اپ بحال ہو گیا)');
          onClose();
        } else {
          alert('Invalid backup file format');
        }
      } catch {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  const totalLedgerTransactions =
    (allData.transactions?.length || 0) + (allData.supplierTransactions?.length || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black">Shop Settings (دکان سیٹنگز)</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer font-black text-lg transition hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Shop Profile Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Shop Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Shop Name (Urdu / نام)
                </label>
                <input
                  type="text"
                  dir="rtl"
                  value={formData.shopNameUrdu}
                  onChange={(e) => setFormData({ ...formData, shopNameUrdu: e.target.value })}
                  className="w-full h-12 min-h-[48px] px-3.5 text-sm font-urdu font-black rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Phone (فون نمبر)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full h-12 min-h-[48px] px-3.5 text-sm font-mono-num font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Investor PIN (خفیہ پن)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  value={formData.investorPin}
                  onChange={(e) => setFormData({ ...formData, investorPin: e.target.value })}
                  className="w-full h-12 min-h-[48px] px-3.5 text-center text-sm font-mono-num font-black rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                Shop Address (دکان کا پتہ)
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                Starting Cash in Drawer ({formData.currency})
              </label>
              <input
                type="number"
                min="0"
                value={formData.initialCashInDrawer}
                onChange={(e) => setFormData({ ...formData, initialCashInDrawer: parseFloat(e.target.value) || 0 })}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                }}
                className="w-full h-12 min-h-[48px] px-3.5 text-base font-mono-num font-black rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition active:scale-95 text-base"
            >
              {saveSuccess ? <Check className="w-5 h-5 text-emerald-400 stroke-[3]" /> : <Save className="w-5 h-5" />}
              <span>{saveSuccess ? 'Saved! (محفوظ ہو گیا)' : 'Save Settings (سیٹنگز محفوظ کریں)'}</span>
            </button>
          </form>

          {/* ========================================================================= */}
          {/* EXPORT DATA FEATURE (CSV FOR MICROSOFT EXCEL / GOOGLE SHEETS)            */}
          {/* ========================================================================= */}
          <div className="pt-5 border-t-2 border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight">
                    Export Data to Excel (ایکسل ریکارڈ ایکسپورٹ)
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">
                    Download CSV files formatted for Microsoft Excel, Google Sheets, or LibreOffice Calc
                  </p>
                </div>
              </div>
              {exportSuccess && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-900 text-xs font-black rounded-xl animate-in fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                  <span>Downloaded!</span>
                </span>
              )}
            </div>

            {/* Master Export All Button */}
            <button
              type="button"
              onClick={handleExportAllCSV}
              className="w-full h-13 min-h-[48px] px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-sm flex items-center justify-between cursor-pointer transition active:scale-98 shadow-md"
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                <div className="text-left">
                  <div className="text-xs uppercase tracking-wider text-emerald-100">One-Click Excel Export</div>
                  <div className="text-sm font-black">Export All Data (تمام ریکارڈز ڈاؤن لوڈ کریں)</div>
                </div>
              </div>
              <Download className="w-5 h-5 text-emerald-200" />
            </button>

            {/* Individual CSV Download Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Inventory CSV */}
              <button
                type="button"
                onClick={handleExportInventory}
                className="h-16 min-h-[48px] p-2.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-300 text-emerald-950 rounded-2xl flex flex-col justify-center items-start text-left cursor-pointer transition active:scale-95 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                    <Package className="w-4 h-4 text-emerald-700" />
                    Inventory CSV
                  </span>
                  <Download className="w-3.5 h-3.5 text-emerald-700 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  {allData.products.length} Products (اسٹاک)
                </div>
              </button>

              {/* 2. Sales CSV */}
              <button
                type="button"
                onClick={handleExportSales}
                className="h-16 min-h-[48px] p-2.5 bg-sky-50 hover:bg-sky-100 border-2 border-sky-300 text-sky-950 rounded-2xl flex flex-col justify-center items-start text-left cursor-pointer transition active:scale-95 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-black text-sky-900">
                    <Receipt className="w-4 h-4 text-sky-700" />
                    Sales CSV
                  </span>
                  <Download className="w-3.5 h-3.5 text-sky-700 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <div className="text-[11px] font-bold text-sky-700 mt-0.5">
                  {allData.sales.length} Invoices (سیلز)
                </div>
              </button>

              {/* 3. Khata & Supplier Transactions CSV */}
              <button
                type="button"
                onClick={handleExportTransactions}
                className="h-16 min-h-[48px] p-2.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-300 text-amber-950 rounded-2xl flex flex-col justify-center items-start text-left cursor-pointer transition active:scale-95 group"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5 text-xs font-black text-amber-900">
                    <BookOpen className="w-4 h-4 text-amber-700" />
                    Transactions CSV
                  </span>
                  <Download className="w-3.5 h-3.5 text-amber-700 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <div className="text-[11px] font-bold text-amber-700 mt-0.5">
                  {totalLedgerTransactions} Khata Logs (کھاتہ)
                </div>
              </button>
            </div>

            <div className="text-[11px] text-slate-500 font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <Zap className="inline w-3.5 h-3.5 text-amber-600 mr-1" /><strong>Excel Tip:</strong> All CSV files include UTF-8 Byte Order Mark (BOM), ensuring Urdu product names, customer names, and Pakistani Rupee calculations open cleanly without font corruption.
            </div>
          </div>

          {/* BACKUP & RESTORE SECTION */}
          <div className="pt-4 border-t-2 border-slate-200 space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-600 tracking-wider">
              System Backup & Migration (مکمل سسٹم بیک اپ)
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="h-12 min-h-[48px] px-3 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-900 font-black rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
              >
                <Download className="w-4 h-4 text-slate-700" />
                <span>JSON System Backup</span>
              </button>

              <label className="h-12 min-h-[48px] px-3 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 text-slate-800 font-black rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Restore JSON Backup</span>
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Offline Deployment & Local Database Info Box */}
            <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-black text-slate-900">
                <Laptop className="w-4 h-4 text-emerald-600" />
                <span>Shop Laptop Offline Deployment (آف لائن استعمال)</span>
              </div>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed font-urdu">
                یہ ایپ <strong>100% بغیر انٹرنیٹ</strong> کام کرتی ہے۔ تمام ڈیٹا آپ کے لیپ ٹاپ کے براؤزر کی اندرونی میموری (LocalStorage / IndexedDB) میں خود بخود محفوظ رہتا ہے۔ ہفتہ وار یا روزانہ اوپر دیئے گئے <strong>Export Data to Excel</strong> یا <strong>Download Backup</strong> بٹن سے ریکارڈ اپنی یو ایس بی (USB) یا ہارڈ ڈرائیو میں محفوظ کر لیا کریں۔
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Clear all products, sales, and khata records to start fresh? (کیا تمام ریکارڈ صاف کر کے نیا آغاز کرنا ہے؟)')) {
                  onResetToDemo();
                  onClose();
                }
              }}
              className="w-full h-12 min-h-[48px] text-xs text-red-700 hover:text-red-900 font-black flex items-center justify-center gap-2 cursor-pointer bg-red-50 hover:bg-red-100 rounded-2xl border-2 border-red-200 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Clear All Data to Fresh Start (نیا آغاز / تمام ڈیٹا صاف کریں)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
