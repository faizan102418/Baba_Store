import React, { useState } from 'react';
import { Supplier, Product, UnitType } from '../types';
import { X, Check, ShoppingCart, PackagePlus, AlertCircle, ShoppingBasket } from 'lucide-react';
import { sounds } from '../utils/audio';

interface MarketPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onRecordPurchase: (data: {
    supplierId?: string;
    newSupplierName?: string;
    newSupplierPhone?: string;
    totalBill: number;
    paidCashNow: number;
    unpaidCredit: number; // added to Accounts Payable 20100
    note: string;
    purchaseHead?: 'asset_products' | 'asset_equipment' | 'expense_supplies';
    assetEquipmentName?: string;
    expenseItemName?: string;
    addedStockProduct?: {
      productId?: string;
      newProductName?: string;
      newProductNameUrdu?: string;
      qtyToAdd: number;
      unit?: UnitType;
      dynamicCostPrice?: number;
      newSellingPrice?: number;
    };
  }) => void;
  currency: string;
  cashDrawer?: number;
}

export const MarketPurchaseModal: React.FC<MarketPurchaseModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onRecordPurchase,
  currency,
  cashDrawer,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(suppliers[0]?.id || 'new');
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');

  const [totalBill, setTotalBill] = useState('');
  const [paymentOption, setPaymentOption] = useState<'later' | 'full_cash' | 'partial'>('later');
  const [paidCashAmount, setPaidCashAmount] = useState('');

  const [note, setNote] = useState('');

  // Accounting Head selection: Main Head Assets vs Expenses
  const [purchaseHead, setPurchaseHead] = useState<'asset_products' | 'asset_equipment' | 'expense_supplies'>('asset_products');
  const [assetEquipmentName, setAssetEquipmentName] = useState('');
  const [expenseItemName, setExpenseItemName] = useState('');

  // Bulk stock addition state
  const [stockMode, setStockMode] = useState<'existing' | 'new_item' | 'none'>('existing');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'none');
  const [bulkQty, setBulkQty] = useState('');
  const [dynamicCostPrice, setDynamicCostPrice] = useState('');
  const [newSellingPrice, setNewSellingPrice] = useState('');

  // New item fields
  const [newItemName, setNewItemName] = useState('');
  const [newItemNameUrdu, setNewItemNameUrdu] = useState('');
  const [newItemUnit, setNewItemUnit] = useState<UnitType>('packet');

  if (!isOpen) return null;

  const billNum = parseFloat(totalBill) || 0;
  const cashNum = parseFloat(paidCashAmount) || 0;

  // Calculate unpaid credit (Accounts Payable)
  let unpaidCredit = 0;
  let paidCashNow = 0;

  if (paymentOption === 'later') {
    unpaidCredit = billNum;
    paidCashNow = 0;
  } else if (paymentOption === 'full_cash') {
    unpaidCredit = 0;
    paidCashNow = billNum;
  } else {
    paidCashNow = Math.min(billNum, cashNum);
    unpaidCredit = Math.max(0, billNum - paidCashNow);
  }

  // Handle product selection to auto-fill current prices
  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setDynamicCostPrice(prod.costPrice.toString());
      setNewSellingPrice(prod.sellingPrice.toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (billNum <= 0) {
      alert('Please enter valid bill amount (بل کی رقم درج کریں)');
      return;
    }

    if (selectedSupplierId === 'new' && !newSupplierName.trim()) {
      alert('Please enter supplier name (ہول سیلر کا نام درج کریں)');
      return;
    }

    // Build addedStockProduct payload
    let addedStockProduct: Parameters<MarketPurchaseModalProps['onRecordPurchase']>[0]['addedStockProduct'] = undefined;

    const parsedQty = parseFloat(bulkQty) || 0;
    const parsedCost = parseFloat(dynamicCostPrice) || undefined;
    const parsedSelling = parseFloat(newSellingPrice) || undefined;

    if (stockMode === 'existing' && selectedProductId !== 'none' && parsedQty > 0) {
      addedStockProduct = {
        productId: selectedProductId,
        qtyToAdd: parsedQty,
        dynamicCostPrice: parsedCost,
        newSellingPrice: parsedSelling,
      };
    } else if (stockMode === 'new_item' && newItemName.trim() && parsedQty > 0) {
      addedStockProduct = {
        newProductName: newItemName.trim(),
        newProductNameUrdu: newItemNameUrdu.trim() || undefined,
        qtyToAdd: parsedQty,
        unit: newItemUnit,
        dynamicCostPrice: parsedCost || 0,
        newSellingPrice: parsedSelling || 0,
      };
    }

    let finalNote = note.trim();
    if (purchaseHead === 'asset_equipment') {
      finalNote = `Fixed Asset: ${assetEquipmentName.trim() || 'Shop Equipment'} ${finalNote ? `(${finalNote})` : ''}`;
    } else if (purchaseHead === 'expense_supplies') {
      finalNote = `Store Consumables / Supplies: ${expenseItemName.trim() || 'Operational Supplies'} ${finalNote ? `(${finalNote})` : ''}`;
    } else if (!finalNote) {
      finalNote = 'Market Stock Purchase (10000 Assets > 10300 Products)';
    }

    onRecordPurchase({
      supplierId: selectedSupplierId === 'new' ? undefined : selectedSupplierId,
      newSupplierName: newSupplierName.trim() || undefined,
      newSupplierPhone: newSupplierPhone.trim() || undefined,
      totalBill: billNum,
      paidCashNow,
      unpaidCredit,
      note: finalNote,
      purchaseHead,
      assetEquipmentName: assetEquipmentName.trim() || undefined,
      expenseItemName: expenseItemName.trim() || undefined,
      addedStockProduct: purchaseHead === 'asset_products' ? addedStockProduct : undefined,
    });

    sounds.playCashRegister();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl">
              <ShoppingBasket className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black">Market Stock Purchase</h2>
              <p className="text-xs font-urdu text-amber-300 font-bold mt-0.5">
                منڈی یا ہول سیلر سے مال خریدا (نقد یا ادھار بعد میں ادائیگی)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white cursor-pointer font-black text-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* Step 1: Wholesaler / Dealer */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 block mb-1">
              1. Supplier / Wholesaler (ہول سیلر یا ڈیلر) <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full h-12 min-h-[48px] px-3.5 text-sm font-black rounded-2xl border-2 border-slate-300 outline-none bg-white cursor-pointer"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Current Payable: {currency} {s.balance.toLocaleString()})
                </option>
              ))}
              <option value="new">+ Add New Wholesaler / Supplier (نیا ڈیلر)</option>
            </select>
          </div>

          {selectedSupplierId === 'new' && (
            <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Supplier Name (ڈیلر / ایجنسی کا نام) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandi Rice Dealer / گھی ایجنسی"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-3 text-sm font-bold rounded-xl border border-slate-300 outline-none bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Phone (فون نمبر)
                </label>
                <input
                  type="tel"
                  placeholder="0300-1234567"
                  value={newSupplierPhone}
                  onChange={(e) => setNewSupplierPhone(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-3 text-sm font-mono-num font-bold rounded-xl border border-slate-300 outline-none bg-white"
                />
              </div>
            </div>
          )}

          {/* Step 2: Total Purchase Bill */}
          <div>
            <label className="text-xs font-black uppercase text-slate-700 block mb-1">
              2. Total Market Bill (کل خریداری بل) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3.5 text-slate-400 font-black text-sm">{currency}</span>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 15000"
                value={totalBill}
                onChange={(e) => setTotalBill(e.target.value)}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                }}
                className="w-full h-13 min-h-[48px] pl-11 pr-3 font-mono-num text-xl font-black rounded-2xl border-2 border-slate-300 focus:border-slate-900 outline-none text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Step 3: Payment Option (Pay Later vs Paid Cash Now) */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 block">
              3. How is Cashier paying this bill? (ادائیگی کا طریقہ) <span className="text-red-500">*</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {/* Option A: Pay Later (Credit / Accounts Payable) */}
              <button
                type="button"
                onClick={() => setPaymentOption('later')}
                className={`h-14 min-h-[48px] p-2 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  paymentOption === 'later'
                    ? 'bg-red-50 border-red-600 text-red-900 ring-2 ring-red-400/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="font-black text-xs sm:text-sm leading-tight">Pay Later (ادھار)</span>
                <span className="text-[10px] font-urdu font-black text-red-600 leading-none mt-0.5">بعد میں دیں گے</span>
              </button>

              {/* Option B: Paid Full Cash Now */}
              <button
                type="button"
                onClick={() => setPaymentOption('full_cash')}
                className={`h-14 min-h-[48px] p-2 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  paymentOption === 'full_cash'
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-400/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="font-black text-xs sm:text-sm leading-tight">Paid Cash (نقد)</span>
                <span className="text-[10px] font-urdu font-black text-emerald-700 leading-none mt-0.5">پورا کیش دیا</span>
              </button>

              {/* Option C: Partial Payment */}
              <button
                type="button"
                onClick={() => setPaymentOption('partial')}
                className={`h-14 min-h-[48px] p-2 rounded-2xl border-2 text-center transition cursor-pointer flex flex-col items-center justify-center ${
                  paymentOption === 'partial'
                    ? 'bg-amber-50 border-amber-600 text-amber-950 ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="font-black text-xs sm:text-sm leading-tight">Partial (کچھ نقد)</span>
                <span className="text-[10px] font-urdu font-black text-amber-700 leading-none mt-0.5">باقی ادھار</span>
              </button>
            </div>

            {paymentOption === 'partial' && (
              <div className="pt-2">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Cash Paid Now from Drawer (ابھی نقد ادا کی گئی رقم):
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">{currency}</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={paidCashAmount}
                    onChange={(e) => setPaidCashAmount(e.target.value)}
                    onWheel={(e) => (e.target as HTMLElement).blur()}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                    }}
                    className="w-full h-12 min-h-[48px] pl-11 pr-3 font-mono-num text-lg font-bold rounded-xl border-2 border-amber-400 outline-none bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Breakdown Summary */}
          <div className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-2xl space-y-2 text-xs font-black">
            <div className="flex justify-between text-slate-700">
              <span>Total Bill (کل بل):</span>
              <span className="font-mono-num">{currency} {billNum.toLocaleString()}</span>
            </div>
            {typeof cashDrawer === 'number' && (
              <div className="flex justify-between text-amber-900 bg-amber-100/60 p-2 rounded-xl">
                <span>Available Cash in Drawer (دراز میں دستیاب کیش):</span>
                <span className="font-mono-num">{currency} {cashDrawer.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-emerald-800">
              <span>Cash Out from Drawer (نقد ادائیگی):</span>
              <span className="font-mono-num">- {currency} {paidCashNow.toLocaleString()}</span>
            </div>
            {typeof cashDrawer === 'number' && paidCashNow > 0 && (
              <div className="flex justify-between text-slate-900 bg-slate-100 p-2 rounded-xl border border-slate-200">
                <span>Remaining in Drawer (بقایا دراز کیش):</span>
                <span className={`font-mono-num ${(cashDrawer - paidCashNow) < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {currency} {(cashDrawer - paidCashNow).toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-red-700 border-t border-slate-200 pt-1 text-sm">
              <span>Added to Accounts Payable 20100 (واجب الادا ادھار):</span>
              <span className="font-mono-num font-black">+ {currency} {unpaidCredit.toLocaleString()}</span>
            </div>

            {typeof cashDrawer === 'number' && paidCashNow > cashDrawer && (
              <div className="p-2.5 bg-red-100 border border-red-300 rounded-xl text-[11px] font-bold text-red-950 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>⚠️ Caution: Cash payment exceeds current physical cash in drawer!</span>
              </div>
            )}

            {paymentOption !== 'full_cash' && (
              <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-950 leading-relaxed">
 replit-agent
                <strong>بعد میں ادائیگی (Pay Later) کا طریقہ:</strong> یہ رقم خود بخود <strong>Accounts Payable (Account 20100 - واجب الادا)</strong> میں جمع ہو جائے گی۔ بعد میں جب کیش ادا کریں، <strong>Khata &gt; Wholesale Suppliers</strong> میں جا کر &ldquo;Paid Supplier&rdquo; کا بٹن دبائیں۔

                💡 <strong>بعد میں ادائیگی (Pay Later) کا طریقہ:</strong> یہ رقم خود بخود <strong>Accounts Payable (Account 20100 - واجب الادا)</strong> میں جمع ہو جائے گی۔ بعد میں جب کیش ادا کریں، <strong>Khata &gt; Wholesale Suppliers</strong> میں جا کر &ldquo;Paid Supplier&rdquo; کا بٹن دبائیں اور یہ دراز کے کیش سے منہا ہو جائے گی۔
   main
              </div>
            )}
          </div>

          {/* Step 4: Accounting Heads Classification (Main Head: Assets, Sub Head: Products) */}
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-slate-800 block">
                4. Select Accounting Head (کھاتہ ہیڈ منتخب کریں) <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] font-mono-num font-black text-slate-500">
                Main Head: Assets vs Other
              </span>
            </div>

            {/* 3 Clear Head Options (Each button min 48px touch target) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Option 1: Main Head Assets > Sub Head Products */}
              <button
                type="button"
                onClick={() => setPurchaseHead('asset_products')}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between min-h-[56px] ${
                  purchaseHead === 'asset_products'
                    ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-emerald-700 text-white">
                    Main: 10000 Assets
                  </span>
                  <div className="font-black text-slate-900 text-sm mt-1">Sub: Products (پروڈکٹس)</div>
                  <div className="text-[11px] font-urdu font-bold text-emerald-800">10300 دکان میں فروخت کا مال</div>
                </div>
                <div className="text-[10px] text-slate-600 mt-2 font-bold leading-tight">
                  اسٹاک میں شامل ہوگا، گاہک کو بیچ کر نفع ہوگا
                </div>
              </button>

              {/* Option 2: Main Head Assets > Sub Head Equipment */}
              <button
                type="button"
                onClick={() => setPurchaseHead('asset_equipment')}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between min-h-[56px] ${
                  purchaseHead === 'asset_equipment'
                    ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-blue-700 text-white">
                    Main: 10000 Assets
                  </span>
                  <div className="font-black text-slate-900 text-sm mt-1">Sub: Equipment (آلات)</div>
                  <div className="text-[11px] font-urdu font-bold text-blue-800">10500 مستقل سامان / آلات</div>
                </div>
                <div className="text-[10px] text-slate-600 mt-2 font-bold leading-tight">
                  ڈیپ فریزر، ترازو، کاؤنٹر، پنکھا، ریکس
                </div>
              </button>

              {/* Option 3: Main Head Expenses > Sub Head Consumables */}
              <button
                type="button"
                onClick={() => setPurchaseHead('expense_supplies')}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer flex flex-col justify-between min-h-[56px] ${
                  purchaseHead === 'expense_supplies'
                    ? 'bg-purple-50 border-purple-600 ring-2 ring-purple-500/30'
                    : 'bg-white border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-md bg-purple-700 text-white">
                    Main: 50000 Expenses
                  </span>
                  <div className="font-black text-slate-900 text-sm mt-1">Sub: Consumables (خرچہ)</div>
                  <div className="text-[11px] font-urdu font-bold text-purple-800">50700 شاپ سامان و اخراجات</div>
                </div>
                <div className="text-[10px] text-slate-600 mt-2 font-bold leading-tight">
                  شاپر تھیلے، صفائی کا سامان، چائے، روزمرہ خرچہ
                </div>
              </button>
            </div>
          </div>

          {/* Conditional Detail Form based on Selected Accounting Head */}
          {purchaseHead === 'asset_equipment' && (
            <div className="p-4 bg-blue-50/70 border-2 border-blue-300 rounded-2xl space-y-2">
              <label className="text-xs font-black uppercase text-blue-950 block">
                Fixed Equipment Description (مستقل سامان یا مشینری کی تفصیل) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Haier Deep Freezer / الیکٹرانک وزنی کنڈا / شاپ کاؤنٹر"
                value={assetEquipmentName}
                onChange={(e) => setAssetEquipmentName(e.target.value)}
                className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-xl border border-blue-300 outline-none bg-white"
              />
              <p className="text-[11px] font-urdu text-blue-800 font-bold">
                یہ رقم دکان کے مستقل اثاثہ جات (10500 Shop Equipment) میں بطور اثاثہ ریکارڈ ہوگی۔
              </p>
            </div>
          )}

          {purchaseHead === 'expense_supplies' && (
            <div className="p-4 bg-purple-50/70 border-2 border-purple-300 rounded-2xl space-y-2">
              <label className="text-xs font-black uppercase text-purple-950 block">
                Consumables / Supplies Description (استعمال کے سامان کی تفصیل) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 5 Bundles Shopping Bags (شاپرز) / صفائی صابن و وائپر"
                value={expenseItemName}
                onChange={(e) => setExpenseItemName(e.target.value)}
                className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-xl border border-purple-300 outline-none bg-white"
              />
              <p className="text-[11px] font-urdu text-purple-800 font-bold">
                یہ رقم براہ راست دکان کے اخراجات (50700 Consumables Expense) میں ریکارڈ ہوگی۔
              </p>
            </div>
          )}

          {/* Step 5: Bulk Stock Inward & Dynamic Market Prices (When Head is 10000 Assets > 10300 Products) */}
          {purchaseHead === 'asset_products' && (
          <div className="p-4 bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                <PackagePlus className="w-4 h-4 text-emerald-700" />
                <span>5. Bulk Stock Inward & Dynamic Prices (اسٹاک کا اندراج)</span>
              </label>
            </div>

            {/* Mode selection */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStockMode('existing')}
                className={`h-11 min-h-[44px] px-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                  stockMode === 'existing'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Existing Item (موجودہ مال)
              </button>
              <button
                type="button"
                onClick={() => setStockMode('new_item')}
                className={`h-11 min-h-[44px] px-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                  stockMode === 'new_item'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                + New Item (نیا سامان)
              </button>
              <button
                type="button"
                onClick={() => setStockMode('none')}
                className={`h-11 min-h-[44px] px-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                  stockMode === 'none'
                    ? 'bg-slate-700 text-white border-slate-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                Skip Stock (اسٹاک نہ بڑھائیں)
              </button>
            </div>

            {/* Existing Item Form */}
            {stockMode === 'existing' && products.length > 0 && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Select Product (سامان منتخب کریں):
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(e.target.value)}
                    className="w-full h-12 min-h-[48px] px-3 text-sm font-black rounded-xl border border-emerald-400 outline-none bg-white cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Current Stock: {p.stock} {p.unit} | Cost: {currency} {p.costPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">
                      Bulk Qty to Add (تعداد) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="e.g. 50"
                      value={bulkQty}
                      onChange={(e) => setBulkQty(e.target.value)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      className="w-full h-12 min-h-[48px] px-3 font-mono-num font-black text-sm rounded-xl border border-emerald-400 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">
                      New Cost Price (خرید قیمت)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 120"
                      value={dynamicCostPrice}
                      onChange={(e) => setDynamicCostPrice(e.target.value)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      className="w-full h-12 min-h-[48px] px-3 font-mono-num font-bold text-sm rounded-xl border border-emerald-400 outline-none bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">
                      Selling Price (فروخت قیمت)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="e.g. 150"
                      value={newSellingPrice}
                      onChange={(e) => setNewSellingPrice(e.target.value)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      className="w-full h-12 min-h-[48px] px-3 font-mono-num font-bold text-sm rounded-xl border border-emerald-400 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Brand New Item Form */}
            {stockMode === 'new_item' && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Item Name (سامان کا نام) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sugar / چینی"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full h-12 min-h-[48px] px-3 text-sm font-bold rounded-xl border border-emerald-400 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Unit (پیمائش)
                    </label>
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value as UnitType)}
                      className="w-full h-12 min-h-[48px] px-3 text-sm font-bold rounded-xl border border-emerald-400 outline-none bg-white cursor-pointer"
                    >
                      <option value="packet">packet (پیکٹ)</option>
                      <option value="kg">kg (کلو)</option>
                      <option value="piece">piece (عدد)</option>
                      <option value="liter">liter (لیٹر)</option>
                      <option value="dozen">dozen (درجن)</option>
                      <option value="bag">bag (بوری/تھیلا)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">
                      Bulk Stock Qty <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="50"
                      value={bulkQty}
                      onChange={(e) => setBulkQty(e.target.value)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      className="w-full h-12 min-h-[48px] px-3 font-mono-num font-black text-sm rounded-xl border border-emerald-400 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">
                      Cost Price (خرید)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="100"
                      value={dynamicCostPrice}
                      onChange={(e) => setDynamicCostPrice(e.target.value)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      className="w-full h-12 min-h-[48px] px-3 font-mono-num font-bold text-sm rounded-xl border border-emerald-400 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-700 block mb-1">
                      Selling Price (فروخت)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="120"
                      value={newSellingPrice}
                      onChange={(e) => setNewSellingPrice(e.target.value)}
                      onWheel={(e) => (e.target as HTMLElement).blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      className="w-full h-12 min-h-[48px] px-3 font-mono-num font-bold text-sm rounded-xl border border-emerald-400 outline-none bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Invoice Note */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Note / Bill Details (بل تفصیل یا سامان)
            </label>
            <input
              type="text"
              placeholder="e.g. 5 bags sugar + 10 ghee pouches (بل نمبر / تاریخ)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full h-12 min-h-[48px] px-3.5 text-sm font-bold rounded-2xl border-2 border-slate-300 outline-none bg-white"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-13 min-h-[48px] rounded-2xl border-2 border-slate-300 font-black text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md text-base transition active:scale-98"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Confirm Purchase (محفوظ کریں)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
