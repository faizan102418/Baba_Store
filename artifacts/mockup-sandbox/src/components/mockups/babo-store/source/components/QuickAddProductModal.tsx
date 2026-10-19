import React, { useState, useEffect, useRef } from 'react';
import { Product, UnitType } from '../types';
import { X, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void;
}

// Rapid presets for Kiryana staples with generous touch targets
const QUICK_TEMPLATES = [
  { name: 'Sugar (چینی)', nameUrdu: 'چینی عمدہ', cost: 135, price: 150, stock: 50, unit: 'kg' as UnitType },
  { name: 'Atta 10kg (آٹا ۱۰ کلو)', nameUrdu: 'گندم آٹا', cost: 1100, price: 1220, stock: 20, unit: 'bag' as UnitType },
  { name: 'Ghee 1kg (گھی پاؤچ)', nameUrdu: 'بناسپتی گھی', cost: 470, price: 510, stock: 25, unit: 'packet' as UnitType },
  { name: 'Tea Danedar (چائے)', nameUrdu: 'دانہ دار چائے', cost: 540, price: 590, stock: 15, unit: 'packet' as UnitType },
  { name: 'Dal Chana (دال چنا)', nameUrdu: 'دال چنا سپیشل', cost: 220, price: 260, stock: 30, unit: 'kg' as UnitType },
  { name: 'Eggs (انڈے درجن)', nameUrdu: 'فارمی انڈے', cost: 270, price: 300, stock: 20, unit: 'dozen' as UnitType },
];

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onAddProduct,
}) => {
  const nameInputRef = useRef<HTMLInputElement>(null);

  // 4 Core Mandatory Fields
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [stock, setStock] = useState<string>('10');
  const [unit, setUnit] = useState<UnitType>('kg');
  const [nameUrdu, setNameUrdu] = useState('');
  const [barcode, setBarcode] = useState('');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 80);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const costNum = parseFloat(costPrice) || 0;
  const sellNum = parseFloat(sellingPrice) || 0;
  const stockNum = parseFloat(stock) || 0;

  const profitPerUnit = sellNum - costNum;
  const profitPercent = sellNum > 0 ? ((profitPerUnit / sellNum) * 100).toFixed(1) : '0';
  const isLoss = sellNum > 0 && profitPerUnit < 0;

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setName(tpl.name);
    setNameUrdu(tpl.nameUrdu);
    setCostPrice(tpl.cost.toString());
    setSellingPrice(tpl.price.toString());
    setStock(tpl.stock.toString());
    setUnit(tpl.unit);
    sounds.playScan();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter item name (سامان کا نام درج کریں)');
      sounds.playWarning();
      return;
    }
    if (sellNum <= 0) {
      setError('Please enter valid selling price (فروخت قیمت درج کریں)');
      sounds.playWarning();
      return;
    }

    onAddProduct({
      name: name.trim(),
      nameUrdu: nameUrdu.trim() || undefined,
      costPrice: costNum,
      sellingPrice: sellNum,
      stock: Math.max(0, stockNum),
      unit,
      category: 'General',
      barcode: barcode.trim() || undefined,
      minStockAlert: 5,
    });

    sounds.playCashRegister();
    setName('');
    setNameUrdu('');
    setCostPrice('');
    setSellingPrice('');
    setStock('10');
    setBarcode('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden animate-in fade-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h2 className="text-xl font-black tracking-tight">Add New Item</h2>
            <p className="text-xs font-urdu text-amber-300 font-bold mt-0.5">نیا سامان شامل کریں (صرف ضروری معلومات)</p>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 1-Tap Staples Presets (Each button min 48px height) */}
        <div className="bg-slate-50 border-b border-slate-200 p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-700">
              Quick Templates (فوری ریڈی میڈ سامان):
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => applyTemplate(tpl)}
                className="h-12 min-h-[48px] px-2 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-slate-200 hover:border-emerald-500 rounded-xl font-black text-xs text-slate-800 transition active:scale-95 cursor-pointer flex items-center justify-center text-center shadow-2xs leading-tight"
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Accounting Head Hierarchy Badge */}
          <div className="p-3 bg-blue-50/80 border-2 border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-900 uppercase">Head:</span>
              <span className="font-mono-num font-black text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                Main: 10000 Assets (اثاثہ جات)
              </span>
              <span className="text-slate-400 font-bold">&gt;</span>
              <span className="font-mono-num font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                Sub: 10300 Products (پروڈکٹس)
              </span>
            </div>
            <span className="text-[11px] font-urdu font-bold text-slate-500">
              دکان کا مال برائے فروخت
            </span>
          </div>

          {error && (
            <div className="p-3 text-sm font-bold text-red-800 bg-red-100 border-2 border-red-300 rounded-2xl">
              {error}
            </div>
          )}

          {/* 1. Name */}
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                1. Item Name (نام) <span className="text-red-500">*</span>
              </label>
              <span className="text-xs font-urdu font-bold text-slate-500">اردو یا انگلش نام</span>
            </div>
            <input
              ref={nameInputRef}
              type="text"
              required
              placeholder="e.g. Sugar (چینی)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-13 min-h-[48px] px-4 text-base font-bold rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none transition bg-white"
            />
          </div>

          {/* 2 & 3. Cost Price & Selling Price Side-by-Side */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  2. Cost Price
                </label>
                <span className="text-xs font-urdu font-bold text-slate-500">خرید قیمت</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-slate-400 font-black text-sm">Rs</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="130"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className="w-full h-13 min-h-[48px] pl-11 pr-3 font-mono-num text-lg font-black rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none transition bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                  3. Selling Price <span className="text-red-500">*</span>
                </label>
                <span className="text-xs font-urdu font-black text-emerald-700">فروخت قیمت</span>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-emerald-700 font-black text-sm">Rs</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="150"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className="w-full h-13 min-h-[48px] pl-11 pr-3 font-mono-num text-lg font-black rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 focus:border-emerald-600 outline-none transition text-emerald-950"
                />
              </div>
            </div>
          </div>

          {/* Real-time Profit Badge */}
          {sellNum > 0 && (
            <div className={`p-3 rounded-2xl border-2 flex items-center justify-between font-black text-sm ${
              isLoss ? 'bg-red-50 border-red-300 text-red-800' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
            }`}>
              <span>{isLoss ? 'Loss Warning (نقصان)' : 'Profit per unit (فی یونٹ منافع):'}</span>
              <span className="font-mono-num text-base font-black">
                Rs {profitPerUnit.toFixed(0)} ({profitPercent}%)
              </span>
            </div>
          )}

          {/* 4. Stock Quantity & Unit Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  4. Current Stock
                </label>
                <span className="text-xs font-urdu font-bold text-slate-500">موجودہ اسٹاک</span>
              </div>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="25"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                onWheel={(e) => (e.target as HTMLElement).blur()}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                }}
                className="w-full h-13 min-h-[48px] px-4 font-mono-num text-lg font-black rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none transition bg-white text-slate-900"
              />
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider">
                  Unit
                </label>
                <span className="text-xs font-urdu font-bold text-slate-500">پیمانہ</span>
              </div>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full h-13 min-h-[48px] px-3.5 text-base font-black rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none transition bg-white text-slate-800 cursor-pointer"
              >
                <option value="kg">kg (کلو)</option>
                <option value="packet">packet (پیکٹ)</option>
                <option value="piece">piece (عدد)</option>
                <option value="bag">bag (بوری/تھیلا)</option>
                <option value="dozen">dozen (درجن)</option>
                <option value="liter">liter (لیٹر)</option>
              </select>
            </div>
          </div>

          {/* Action Buttons: strictly >= 48px height */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-13 min-h-[48px] rounded-2xl border-2 border-slate-300 hover:bg-slate-100 font-black text-slate-700 transition cursor-pointer text-base"
            >
              Cancel (منسوخ)
            </button>
            <button
              type="submit"
              className="flex-2 h-13 min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black transition shadow-lg shadow-emerald-600/30 active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-base"
            >
              <Check className="w-5 h-5 stroke-[3]" />
              <span>Save Item (محفوظ کریں)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
