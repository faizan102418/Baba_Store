import React, { useState } from 'react';
import { Customer, KhataTransaction, Supplier, SupplierTransaction, ShopSettings } from '../types';
import { Search, UserPlus, Phone, ArrowUpRight, ArrowDownLeft, Trash2, MessageSquare, History, Check, UserX, Users, Store } from 'lucide-react';
import { sounds } from '../utils/audio';

interface KhataScreenProps {
  customers: Customer[];
  transactions: KhataTransaction[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddTransaction: (customerId: string, type: 'credit' | 'payment', amount: number, note?: string) => void;
  onDeleteCustomer: (id: string) => void;
  onDeleteTransaction: (id: string) => void;
  onAddSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onAddSupplierTransaction: (supplierId: string, type: 'purchase_credit' | 'payment_made', amount: number, note?: string) => void;
  onDeleteSupplier: (id: string) => void;
  onDeleteSupplierTransaction: (id: string) => void;
  onOpenMarketPurchase: () => void;
  settings: ShopSettings;
}

export const KhataScreen: React.FC<KhataScreenProps> = ({
  customers,
  transactions,
  suppliers,
  supplierTransactions,
  onAddCustomer,
  onAddTransaction,
  onDeleteCustomer,
  onDeleteTransaction,
  onAddSupplier,
  onAddSupplierTransaction,
  onDeleteSupplier,
  onDeleteSupplierTransaction,
  onOpenMarketPurchase,
  settings,
}) => {
  // Mode: Customers vs Wholesale Suppliers
  const [khataMode, setKhataMode] = useState<'customers' | 'suppliers'>('customers');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(customers[0]?.id || null);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(suppliers[0]?.id || null);

  // Customer Modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustInitialBalance, setNewCustInitialBalance] = useState('0');

  // Customer Transaction Modal
  const [txnModalType, setTxnModalType] = useState<'credit' | 'payment' | null>(null);
  const [txnAmount, setTxnAmount] = useState('');
  const [txnNote, setTxnNote] = useState('');

  // Supplier Modal
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppPhone, setNewSuppPhone] = useState('');
  const [newSuppInitialBalance, setNewSuppInitialBalance] = useState('0');

  // Supplier Transaction Modal
  const [suppTxnType, setSuppTxnType] = useState<'purchase_credit' | 'payment_made' | null>(null);
  const [suppTxnAmount, setSuppTxnAmount] = useState('');
  const [suppTxnNote, setSuppTxnNote] = useState('');

  // Filtered lists
  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const filteredSuppliers = suppliers.filter(
    (s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.phone.includes(searchQuery)
  );

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || null;
  const customerTransactions = selectedCustomer
    ? transactions
        .filter((t) => t.customerId === selectedCustomer.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const selectedSupplier = suppliers.find((s) => s.id === selectedSupplierId) || null;
  const currentSupplierTransactions = selectedSupplier
    ? supplierTransactions
        .filter((t) => t.supplierId === selectedSupplier.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const totalMarketCustomerDebt = customers.reduce((sum, c) => sum + (c.balance > 0 ? c.balance : 0), 0);
  const totalMarketSupplierPayable = suppliers.reduce((sum, s) => sum + (s.balance > 0 ? s.balance : 0), 0);

  // Customer handlers
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const initBal = parseFloat(newCustInitialBalance) || 0;
    onAddCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim() || '0300-0000000',
      balance: initBal,
    });
    sounds.playCashRegister();
    setNewCustName('');
    setNewCustPhone('');
    setNewCustInitialBalance('0');
    setIsAddCustomerOpen(false);
  };

  const handleRecordCustomerTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !txnModalType) return;
    const amt = parseFloat(txnAmount);
    if (isNaN(amt) || amt <= 0) return;
    onAddTransaction(selectedCustomer.id, txnModalType, amt, txnNote.trim() || undefined);
    if (txnModalType === 'payment') sounds.playCashRegister();
    else sounds.playScan();
    setTxnModalType(null);
    setTxnAmount('');
    setTxnNote('');
  };

  // Supplier handlers
  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName.trim()) return;
    const initBal = parseFloat(newSuppInitialBalance) || 0;
    onAddSupplier({
      name: newSuppName.trim(),
      phone: newSuppPhone.trim() || '0300-0000000',
      balance: initBal,
    });
    sounds.playCashRegister();
    setNewSuppName('');
    setNewSuppPhone('');
    setNewSuppInitialBalance('0');
    setIsAddSupplierOpen(false);
  };

  const handleRecordSupplierTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !suppTxnType) return;
    const amt = parseFloat(suppTxnAmount);
    if (isNaN(amt) || amt <= 0) return;
    onAddSupplierTransaction(selectedSupplier.id, suppTxnType, amt, suppTxnNote.trim() || undefined);
    if (suppTxnType === 'payment_made') sounds.playCashRegister();
    else sounds.playScan();
    setSuppTxnType(null);
    setSuppTxnAmount('');
    setSuppTxnNote('');
  };

  const openWhatsAppReminder = (customer: Customer) => {
    const phone = customer.phone.replace(/[^0-9]/g, '');
    const cleanPhone = phone.startsWith('0') ? '92' + phone.substring(1) : phone;
    const message = `السلام علیکم محترم ${customer.name} صاحب!
${settings.shopName} (${settings.shopNameUrdu}) کی طرف سے یاد دہانی کہ آپ کا بقایا ادھار Rs ${customer.balance.toLocaleString()} ہے۔
برائے مہربانی فراغت ملتے ہی بقایا رقم ادا فرما دیجیئے گا۔
جزاک اللہ خیر۔
رابطہ: ${settings.phone}`;
    const url = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Toggle between Customer Khata and Wholesale Supplier Khata */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-2xl flex border-2 border-slate-200">
            <button
              onClick={() => setKhataMode('customers')}
              className={`h-12 min-h-[48px] px-4 rounded-xl font-black text-sm flex items-center gap-2 transition cursor-pointer ${
                khataMode === 'customers' ? 'bg-red-600 text-white shadow-md' : 'text-slate-700 hover:text-black'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Customers Khata (گاہک ادھار)</span>
            </button>

            <button
              onClick={() => setKhataMode('suppliers')}
              className={`h-12 min-h-[48px] px-4 rounded-xl font-black text-sm flex items-center gap-2 transition cursor-pointer ${
                khataMode === 'suppliers' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-700 hover:text-black'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Wholesale Suppliers (ہول سیلر ادھار)</span>
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {khataMode === 'customers' ? (
            <>
              <div className="bg-red-50 border-2 border-red-300 px-4 py-2 rounded-2xl text-right">
                <span className="text-[11px] font-black text-red-700 block uppercase">Customer Receivables (10200)</span>
                <span className="font-mono-num font-black text-xl text-red-900">
                  {settings.currency} {totalMarketCustomerDebt.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => setIsAddCustomerOpen(true)}
                className="h-12 min-h-[48px] px-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition text-sm active:scale-95"
              >
                <UserPlus className="w-5 h-5 stroke-[2.5]" />
                <span>New Customer (نیا گاہک)</span>
              </button>
            </>
          ) : (
            <>
              <div className="bg-red-50 border-2 border-red-300 px-4 py-2 rounded-2xl text-right">
                <span className="text-[11px] font-black text-red-700 block uppercase">Supplier Payables (20100)</span>
                <span className="font-mono-num font-black text-xl text-red-900">
                  {settings.currency} {totalMarketSupplierPayable.toLocaleString()}
                </span>
              </div>

              <button
                onClick={onOpenMarketPurchase}
                className="h-12 min-h-[48px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition text-sm active:scale-95"
              >
                <Store className="w-5 h-5 stroke-[2.5]" />
                <span>+ Buy Market Stock (مال خریدا)</span>
              </button>

              <button
                onClick={() => setIsAddSupplierOpen(true)}
                className="h-12 min-h-[48px] px-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition text-sm active:scale-95"
              >
                <UserPlus className="w-5 h-5 stroke-[2.5]" />
                <span>New Supplier (نیا ڈیلر)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. CUSTOMERS KHATA VIEW */}
      {/* ========================================================================= */}
      {khataMode === 'customers' && (
        <>
          {customers.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-4">
              <UserX className="w-16 h-16 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-xl font-black text-slate-900">No Customers in Khata Yet</h3>
                <p className="text-xs font-urdu text-slate-600 font-bold mt-1">
                  ابھی تک کوئی ادھار گاہک شامل نہیں ہے۔ نیا گاہک درج کرنے کے لیے بٹن دبائیں۔
                </p>
              </div>
              <button
                onClick={() => setIsAddCustomerOpen(true)}
                className="w-full h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition text-base"
              >
                <UserPlus className="w-5 h-5" />
                <span>Add First Customer (پہلا گاہک بنائیں)</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Customer List */}
              <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
                <div className="p-3 border-b-2 border-slate-200 bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Customer... (نام یا فون)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 min-h-[48px] pl-12 pr-3 bg-white rounded-2xl border-2 border-slate-300 focus:border-red-500 outline-none text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {filteredCustomers.map((cust) => {
                    const isSelected = selectedCustomer?.id === cust.id;
                    const owesMoney = cust.balance > 0;

                    return (
                      <button
                        key={cust.id}
                        onClick={() => setSelectedCustomerId(cust.id)}
                        type="button"
                        className={`w-full min-h-[56px] p-3 rounded-2xl text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-red-50 border-2 border-red-500 shadow-sm'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center font-black text-lg ${
                            owesMoney ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {cust.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-black text-base text-slate-900 leading-tight">{cust.name}</div>
                            <div className="text-xs text-slate-500 font-mono-num font-bold flex items-center gap-1 mt-0.5">
                              <Phone className="w-3.5 h-3.5 opacity-60" />
                              <span>{cust.phone}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-mono-num font-black text-base block ${
                            owesMoney ? 'text-red-700' : 'text-emerald-700'
                          }`}>
                            {settings.currency} {cust.balance.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 font-bold block">
                            {owesMoney ? 'Owed (بقایا)' : 'Paid / 0 Balance'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Customer Details, 2 Actions, and Delete Button */}
              <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
                {selectedCustomer ? (
                  <div className="flex flex-col h-full">
                    {/* Customer Header */}
                    <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-xl leading-tight">{selectedCustomer.name}</h3>
                        <div className="text-xs text-slate-300 font-mono-num font-bold mt-1">
                          <span>📞 {selectedCustomer.phone}</span>
                        </div>
                      </div>

                      {/* Header Actions: WhatsApp & Delete Person Button */}
                      <div className="flex items-center gap-2">
                        {selectedCustomer.balance > 0 && (
                          <button
                            onClick={() => openWhatsAppReminder(selectedCustomer)}
                            className="h-12 min-h-[48px] px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>WhatsApp Reminder</span>
                          </button>
                        )}

                        {/* DELETE PERSON BUTTON */}
                        {selectedCustomer.balance === 0 ? (
                          <button
                            onClick={() => {
                              if (confirm(`Customer ${selectedCustomer.name} has 0 balance (حساب بیباق). Delete customer account? (کیا یہ کھاتہ ختم کرنا ہے؟)`)) {
                                onDeleteCustomer(selectedCustomer.id);
                                setSelectedCustomerId(null);
                              }
                            }}
                            className="h-12 min-h-[48px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
                            title="Customer Balance Settled - Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Paid Off: Delete Person (حساب بیباق - کھاتہ ختم کریں)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (confirm(`Delete customer ${selectedCustomer.name} with pending balance of ${settings.currency} ${selectedCustomer.balance.toLocaleString()}? (کیا واقعی یہ کھاتہ ڈیلیٹ کرنا ہے؟)`)) {
                                onDeleteCustomer(selectedCustomer.id);
                                setSelectedCustomerId(null);
                              }
                            }}
                            className="h-12 min-h-[48px] px-4 bg-red-800 hover:bg-red-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                            title="Delete Customer Account"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete Person (کھاتہ ختم کریں)</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Balance Banner */}
                    <div className="p-4 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-black text-slate-600">
                          Balance (کل بقایا ادھار)
                        </span>
                        <p className="text-xs font-urdu font-black text-slate-500">گاہک نے دکان کو دینا ہے</p>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono-num text-3xl sm:text-4xl font-black ${
                          selectedCustomer.balance > 0 ? 'text-red-700' : 'text-emerald-700'
                        }`}>
                          {settings.currency} {selectedCustomer.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* THE 2 GIANT ACTIONS */}
                    <div className="p-4 grid grid-cols-2 gap-3 bg-slate-100 border-b-2 border-slate-200">
                      <button
                        type="button"
                        onClick={() => setTxnModalType('credit')}
                        className="h-16 min-h-[56px] rounded-2xl bg-red-600 hover:bg-red-700 active:scale-98 text-white font-black flex items-center justify-center gap-3 shadow-md shadow-red-600/20 cursor-pointer transition"
                      >
                        <ArrowUpRight className="w-7 h-7 stroke-[3]" />
                        <div className="text-left">
                          <div className="text-base font-black leading-tight">Gave Credit</div>
                          <div className="text-xs font-urdu font-black opacity-95">ادھار دیا (رقم بڑھے گی)</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTxnModalType('payment')}
                        className="h-16 min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black flex items-center justify-center gap-3 shadow-md shadow-emerald-600/20 cursor-pointer transition"
                      >
                        <ArrowDownLeft className="w-7 h-7 stroke-[3]" />
                        <div className="text-left">
                          <div className="text-base font-black leading-tight">Received Payment</div>
                          <div className="text-xs font-urdu font-black opacity-95">وصولی کی (رقم کم ہوگی)</div>
                        </div>
                      </button>
                    </div>

                    {/* Ledger History with Individual Delete Buttons */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                        <History className="w-4 h-4" />
                        <span>Ledger History (کھاتہ تفصیل)</span>
                      </div>

                      {customerTransactions.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 font-bold text-sm">
                          No transactions recorded yet.
                        </div>
                      ) : (
                        customerTransactions.map((tx) => {
                          const isCredit = tx.type === 'credit';
                          return (
                            <div
                              key={tx.id}
                              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between text-sm transition ${
                                isCredit ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{isCredit ? '🔴' : '🟢'}</span>
                                <div>
                                  <div className="font-black text-slate-900 text-sm sm:text-base">
                                    {isCredit ? 'Gave Credit (ادھار دیا)' : 'Received Payment (وصولی کی)'}
                                  </div>
                                  <div className="text-xs text-slate-600 font-bold mt-0.5">
                                    {new Date(tx.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                                    {tx.note && <span className="ml-2 font-black text-slate-800">• {tx.note}</span>}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className={`font-mono-num font-black text-lg ${
                                    isCredit ? 'text-red-700' : 'text-emerald-700'
                                  }`}>
                                    {isCredit ? '+' : '-'} {settings.currency} {tx.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs font-mono-num font-bold text-slate-500">
                                    Bal: {settings.currency} {tx.balanceAfter.toLocaleString()}
                                  </div>
                                </div>

                                {/* DELETE ENTRY BUTTON */}
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this ledger entry? (کیا یہ انٹری ڈیلیٹ کرنی ہے؟)')) {
                                      onDeleteTransaction(tx.id);
                                    }
                                  }}
                                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-100 flex items-center justify-center transition cursor-pointer"
                                  title="Delete this entry"
                                >
                                  <Trash2 className="w-5 h-5" />
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
                    Select a customer on the left to view ledger
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* 2. WHOLESALE SUPPLIERS KHATA VIEW (ACCOUNTS PAYABLE 20100) */}
      {/* ========================================================================= */}
      {khataMode === 'suppliers' && (
        <>
          {suppliers.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center max-w-md mx-auto space-y-4">
              <Store className="w-16 h-16 text-slate-300 mx-auto" />
              <div>
                <h3 className="text-xl font-black text-slate-900">No Wholesale Suppliers Yet</h3>
                <p className="text-xs font-urdu text-slate-600 font-bold mt-1">
                  منڈی یا ہول سیلر سے مال ادھار خریدا ہو تو یہاں ڈیلر شامل کریں
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={onOpenMarketPurchase}
                  className="w-full h-13 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition text-base"
                >
                  <Store className="w-5 h-5" />
                  <span>Log Market Stock Purchase (مال خریدا)</span>
                </button>
                <button
                  onClick={() => setIsAddSupplierOpen(true)}
                  className="w-full h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition text-base"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Add First Supplier (پہلا ڈیلر شامل کریں)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left Column: Suppliers List */}
              <div className="lg:col-span-5 bg-white rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
                <div className="p-3 border-b-2 border-slate-200 bg-slate-50">
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search Supplier... (ڈیلر یا منڈی نام)"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 min-h-[48px] pl-12 pr-3 bg-white rounded-2xl border-2 border-slate-300 focus:border-red-500 outline-none text-sm font-bold"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                  {filteredSuppliers.map((supp) => {
                    const isSelected = selectedSupplier?.id === supp.id;
                    const shopOwes = supp.balance > 0;

                    return (
                      <button
                        key={supp.id}
                        onClick={() => setSelectedSupplierId(supp.id)}
                        type="button"
                        className={`w-full min-h-[56px] p-3 rounded-2xl text-left flex items-center justify-between transition cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-red-50 border-2 border-red-500 shadow-sm'
                            : 'hover:bg-slate-50 border-2 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl flex items-center justify-center font-black text-lg ${
                            shopOwes ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            🏢
                          </div>
                          <div>
                            <div className="font-black text-base text-slate-900 leading-tight">{supp.name}</div>
                            <div className="text-xs text-slate-500 font-mono-num font-bold mt-0.5">📞 {supp.phone}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-mono-num font-black text-base block ${
                            shopOwes ? 'text-red-700' : 'text-emerald-700'
                          }`}>
                            {settings.currency} {supp.balance.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 font-bold block">
                            {shopOwes ? 'Payable (دینا ہے)' : 'Cleared / 0 Due'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Supplier Details & Delete Button */}
              <div className="lg:col-span-7 bg-white rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
                {selectedSupplier ? (
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-xl leading-tight">{selectedSupplier.name}</h3>
                        <div className="text-xs text-slate-300 font-mono-num font-bold mt-1">
                          <span>📞 {selectedSupplier.phone}</span>
                        </div>
                      </div>

                      {/* DELETE SUPPLIER BUTTON */}
                      {selectedSupplier.balance === 0 ? (
                        <button
                          onClick={() => {
                            if (confirm(`Supplier ${selectedSupplier.name} has 0 balance (ادائیگی مکمل). Delete supplier account? (کیا یہ ڈیلر ختم کرنا ہے؟)`)) {
                              onDeleteSupplier(selectedSupplier.id);
                              setSelectedSupplierId(null);
                            }
                          }}
                          className="h-12 min-h-[48px] px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95 shadow-sm"
                          title="Supplier Paid Off - Delete Supplier"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Paid Off: Delete Supplier (ادائیگی مکمل - ڈیلر ختم کریں)</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`Delete supplier ${selectedSupplier.name} with pending payable balance of ${settings.currency} ${selectedSupplier.balance.toLocaleString()}? (کیا واقعی یہ ہول سیلر ڈیلیٹ کرنا ہے؟)`)) {
                              onDeleteSupplier(selectedSupplier.id);
                              setSelectedSupplierId(null);
                            }
                          }}
                          className="h-12 min-h-[48px] px-4 bg-red-800 hover:bg-red-700 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                          title="Delete Supplier Account"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Supplier (ڈیلر ختم کریں)</span>
                        </button>
                      )}
                    </div>

                    {/* Balance Banner */}
                    <div className="p-4 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-xs uppercase font-black text-slate-600">
                          Balance Due (دکان نے ادا کرنے ہیں)
                        </span>
                        <p className="text-xs font-urdu font-black text-slate-500">واجب الادا ادھار</p>
                      </div>
                      <div className="text-right">
                        <div className="font-mono-num text-3xl sm:text-4xl font-black text-red-700">
                          {settings.currency} {selectedSupplier.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* THE 2 ACTIONS FOR SUPPLIERS */}
                    <div className="p-4 grid grid-cols-2 gap-3 bg-slate-100 border-b-2 border-slate-200">
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

                    {/* Supplier Ledger History with Individual Delete Buttons */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-600 uppercase tracking-wider mb-2">
                        <History className="w-4 h-4" />
                        <span>Supplier Ledger History (ڈیلر کھاتہ تفصیل)</span>
                      </div>

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
                                  <div className={`font-mono-num font-black text-lg ${
                                    isPurchase ? 'text-red-700' : 'text-emerald-700'
                                  }`}>
                                    {isPurchase ? '+' : '-'} {settings.currency} {tx.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs font-mono-num font-bold text-slate-500">
                                    Balance: {settings.currency} {tx.balanceAfter.toLocaleString()}
                                  </div>
                                </div>

                                {/* DELETE SUPPLIER ENTRY BUTTON */}
                                <button
                                  onClick={() => {
                                    if (confirm('Delete this supplier ledger entry? (کیا یہ انٹری ڈیلیٹ کرنی ہے؟)')) {
                                      onDeleteSupplierTransaction(tx.id);
                                    }
                                  }}
                                  className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-100 flex items-center justify-center transition cursor-pointer"
                                  title="Delete this entry"
                                >
                                  <Trash2 className="w-5 h-5" />
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
        </>
      )}

      {/* MODAL: Add Customer */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">Add Customer (نیا گاہک کھاتہ)</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer font-black text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Customer Name (گاہک کا نام) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Bashir / ماسٹر بشیر"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full h-13 min-h-[48px] px-4 text-base font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Mobile Number</label>
                <input
                  type="tel"
                  placeholder="0300-1234567"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full h-13 min-h-[48px] px-4 text-base font-mono-num font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Previous Debt if any (سابقہ ادھار)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newCustInitialBalance}
                  onChange={(e) => setNewCustInitialBalance(e.target.value)}
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
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="flex-1 h-13 min-h-[48px] rounded-2xl border-2 border-slate-300 font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>Save (محفوظ کریں)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Customer Transaction */}
      {txnModalType && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className={`font-black text-lg ${txnModalType === 'credit' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {txnModalType === 'credit' ? 'Gave Credit (ادھار دیا)' : 'Received Payment (وصولی کی)'}
                </h3>
                <p className="text-xs text-slate-600 font-bold">Customer: {selectedCustomer.name}</p>
              </div>
              <button onClick={() => setTxnModalType(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer font-black text-lg">✕</button>
            </div>

            <form onSubmit={handleRecordCustomerTxn} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Amount ({settings.currency}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  placeholder="500"
                  value={txnAmount}
                  onChange={(e) => setTxnAmount(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className={`w-full h-14 min-h-[48px] px-4 font-mono-num text-2xl font-black rounded-2xl border-2 outline-none ${
                    txnModalType === 'credit' ? 'border-red-400 focus:border-red-600 bg-red-50 text-red-900' : 'border-emerald-400 focus:border-emerald-600 bg-emerald-50 text-emerald-900'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Note (تفصیل / سامان)</label>
                <input
                  type="text"
                  placeholder={txnModalType === 'credit' ? 'e.g. Sugar 2kg + Atta' : 'e.g. Cash received'}
                  value={txnNote}
                  onChange={(e) => setTxnNote(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-2xl border-2 border-slate-300 outline-none"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setTxnModalType(null)}
                  className="flex-1 h-13 min-h-[48px] rounded-2xl border-2 border-slate-300 font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`flex-2 h-13 min-h-[48px] text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                    txnModalType === 'credit' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
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

      {/* MODAL: Add Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-black text-lg text-slate-900">Add Wholesale Supplier (نیا ڈیلر)</h3>
              <button onClick={() => setIsAddSupplierOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer font-black text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">
                  Supplier Name (ڈیلر کا نام) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandi Rice Dealer / گھی ایجنسی"
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  className="w-full h-13 min-h-[48px] px-4 text-base font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Mobile Phone (فون نمبر)</label>
                <input
                  type="tel"
                  placeholder="0300-1234567"
                  value={newSuppPhone}
                  onChange={(e) => setNewSuppPhone(e.target.value)}
                  className="w-full h-13 min-h-[48px] px-4 text-base font-mono-num font-bold rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Previous Debt if any (سابقہ ادھار)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={newSuppInitialBalance}
                  onChange={(e) => setNewSuppInitialBalance(e.target.value)}
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

      {/* MODAL: Supplier Transaction */}
      {suppTxnType && selectedSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-6 space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className={`font-black text-lg ${suppTxnType === 'purchase_credit' ? 'text-red-700' : 'text-emerald-700'}`}>
                  {suppTxnType === 'purchase_credit' ? 'Bought Stock on Credit (مال خریدا)' : 'Paid Supplier (ادائیگی کی)'}
                </h3>
                <p className="text-xs text-slate-600 font-bold">Supplier: {selectedSupplier.name}</p>
              </div>
              <button onClick={() => setSuppTxnType(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer font-black text-lg">✕</button>
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
                    suppTxnType === 'purchase_credit' ? 'border-red-400 focus:border-red-600 bg-red-50 text-red-900' : 'border-emerald-400 focus:border-emerald-600 bg-emerald-50 text-emerald-900'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Note (سامان یا بل تفصیل)</label>
                <input
                  type="text"
                  placeholder={suppTxnType === 'purchase_credit' ? 'e.g. 10 bags sugar + 5 ghee cartons' : 'e.g. Cash paid from counter drawer'}
                  value={suppTxnNote}
                  onChange={(e) => setSuppTxnNote(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-2xl border-2 border-slate-300 outline-none"
                />
              </div>

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
    </div>
  );
};
