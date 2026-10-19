import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Plus, Check, Edit2, Trash2, Sparkles, Package, ShoppingBasket } from 'lucide-react';
import { sounds } from '../utils/audio';

interface InventoryScreenProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onOpenQuickAdd: () => void;
  onOpenMarketPurchase?: () => void;
  onLoadStaples?: () => void;
  currency: string;
}

export const InventoryScreen: React.FC<InventoryScreenProps> = ({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onOpenQuickAdd,
  onOpenMarketPurchase,
  onLoadStaples,
  currency,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Track which cell is being edited inline: { id, field: 'sellingPrice' | 'costPrice' | 'stock' }
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'sellingPrice' | 'costPrice' | 'stock' } | null>(null);
  const [inlineValue, setInlineValue] = useState<string>('');

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCat = filterCategory === 'All' || p.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchCat;
    return (
      matchCat &&
      (p.name.toLowerCase().includes(q) ||
        (p.nameUrdu && p.nameUrdu.includes(q)) ||
        (p.barcode && p.barcode.includes(q)))
    );
  });

  const startInlineEdit = (product: Product, field: 'sellingPrice' | 'costPrice' | 'stock') => {
    setEditingCell({ id: product.id, field });
    setInlineValue(product[field].toString());
  };

  const saveInlineEdit = (product: Product) => {
    if (!editingCell) return;
    const num = parseFloat(inlineValue);
    if (isNaN(num) || num < 0) {
      sounds.playWarning();
      setEditingCell(null);
      return;
    }

    const updated: Product = {
      ...product,
      [editingCell.field]: num,
      updatedAt: new Date().toISOString(),
    };

    onUpdateProduct(updated);
    sounds.playScan();
    setEditingCell(null);
  };

  const quickAddStock = (product: Product, delta: number) => {
    const updated: Product = {
      ...product,
      stock: Math.max(0, product.stock + delta),
      updatedAt: new Date().toISOString(),
    };
    onUpdateProduct(updated);
    sounds.playScan();
  };

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 min-h-[48px] min-w-[48px] bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Stock & Price List</h2>
              <p className="text-xs font-urdu text-slate-600 font-bold">
                اسٹاک یا قیمت تبدیل کرنے کے لیے براہ راست نمبر پر کلک کریں
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {onOpenMarketPurchase && (
            <button
              onClick={onOpenMarketPurchase}
              className="w-full md:w-auto h-12 min-h-[48px] px-4 bg-slate-900 hover:bg-black active:scale-95 text-white font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition text-sm"
            >
              <><ShoppingBasket className="w-4 h-4" /> Market Purchase (مال خریدا)</>
            </button>
          )}

          <button
            onClick={onOpenQuickAdd}
            className="w-full md:w-auto h-12 min-h-[48px] px-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition text-sm"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>Add Item (نیا سامان)</span>
          </button>
        </div>
      </div>

      {/* Fresh start onboarding if empty */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-300 p-12 text-center max-w-lg mx-auto space-y-4">
          <Package className="w-16 h-16 text-slate-300 mx-auto" />
          <div>
            <h3 className="text-xl font-black text-slate-900">Inventory is Empty (اسٹاک خالی ہے)</h3>
            <p className="text-xs font-urdu text-slate-600 font-bold mt-1">
              دکان کا نیا آغاز ہے۔ سامان شامل کرنے کے لیے نیچے بٹن دبائیں
            </p>
          </div>
          <div className="space-y-2.5 pt-2">
            <button
              onClick={onOpenQuickAdd}
              className="w-full h-13 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>Add First Item (پہلا سامان شامل کریں)</span>
            </button>
            {onLoadStaples && (
              <button
                onClick={onLoadStaples}
                className="w-full h-12 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-xs transition"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Auto-Load Kiryana Essentials (چینی، آٹا، گھی، چائے، دال)</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search items by name / چینی، آٹا، گھی تلاش کریں..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 min-h-[48px] pl-12 pr-4 bg-white rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none text-sm font-bold"
              />
            </div>

            {categories.length > 2 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="h-12 min-h-[48px] px-4 bg-white rounded-2xl border-2 border-slate-300 text-sm font-black text-slate-800 outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    Category: {c}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Simple Table */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b-2 border-slate-200 text-xs font-black text-slate-600 uppercase tracking-wider">
                    <th className="py-4 px-4">Item Name (نام)</th>
                    <th className="py-4 px-4">Cost Price (خرید)</th>
                    <th className="py-4 px-4">Selling Price (فروخت)</th>
                    <th className="py-4 px-4">Current Stock (اسٹاک)</th>
                    <th className="py-4 px-4 text-center">Add Stock</th>
                    <th className="py-4 px-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredProducts.map((p) => {
                    const isOutOfStock = p.stock <= 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition group">
                        {/* Name */}
                        <td className="py-3 px-4">
                          <div className="font-black text-slate-900 text-base">{p.name}</div>
                          {p.nameUrdu && <div className="text-xs font-urdu text-slate-500 font-bold">{p.nameUrdu}</div>}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-4">
                          {editingCell?.id === p.id && editingCell.field === 'costPrice' ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={inlineValue}
                                onChange={(e) => setInlineValue(e.target.value)}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(p);
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                                }}
                                className="w-24 h-12 min-h-[48px] px-2 font-mono-num font-black text-sm border-2 border-emerald-500 rounded-xl outline-none bg-white"
                                autoFocus
                              />
                              <button
                                onClick={() => saveInlineEdit(p)}
                                className="w-12 h-12 min-w-[48px] min-h-[48px] bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-sm"
                              >
                                <Check className="w-5 h-5 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startInlineEdit(p, 'costPrice')}
                              className="h-12 min-h-[48px] font-mono-num font-bold text-slate-700 hover:text-emerald-700 hover:bg-slate-100 px-3 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer text-base"
                              title="Click to edit cost"
                            >
                              <span>{currency} {p.costPrice}</span>
                              <Edit2 className="w-3.5 h-3.5 opacity-60" />
                            </button>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-4">
                          {editingCell?.id === p.id && editingCell.field === 'sellingPrice' ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={inlineValue}
                                onChange={(e) => setInlineValue(e.target.value)}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(p);
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                                }}
                                className="w-24 h-12 min-h-[48px] px-2 font-mono-num font-black text-sm border-2 border-emerald-600 rounded-xl outline-none bg-emerald-50"
                                autoFocus
                              />
                              <button
                                onClick={() => saveInlineEdit(p)}
                                className="w-12 h-12 min-w-[48px] min-h-[48px] bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-sm"
                              >
                                <Check className="w-5 h-5 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startInlineEdit(p, 'sellingPrice')}
                              className="h-12 min-h-[48px] font-mono-num font-black text-lg text-emerald-800 hover:bg-emerald-100/70 px-3 py-1 rounded-xl border-2 border-emerald-300 transition flex items-center gap-2 cursor-pointer bg-emerald-50/50"
                              title="Click to edit selling price"
                            >
                              <span>{currency} {p.sellingPrice}</span>
                              <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                            </button>
                          )}
                        </td>

                        {/* Current Stock */}
                        <td className="py-3 px-4">
                          {editingCell?.id === p.id && editingCell.field === 'stock' ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                value={inlineValue}
                                onChange={(e) => setInlineValue(e.target.value)}
                                onWheel={(e) => (e.target as HTMLElement).blur()}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(p);
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                                }}
                                className="w-20 h-12 min-h-[48px] px-2 font-mono-num font-bold text-sm border-2 border-emerald-500 rounded-xl outline-none bg-white"
                                autoFocus
                              />
                              <button
                                onClick={() => saveInlineEdit(p)}
                                className="w-12 h-12 min-w-[48px] min-h-[48px] bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-sm"
                              >
                                <Check className="w-5 h-5 stroke-[3]" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startInlineEdit(p, 'stock')}
                              className={`h-12 min-h-[48px] px-3.5 py-1 rounded-2xl font-mono-num font-black text-xs sm:text-sm inline-flex items-center gap-1.5 transition cursor-pointer ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-800 border-2 border-red-200'
                                  : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                              }`}
                              title="Click to edit stock"
                            >
                              <span>{p.stock} {p.unit}</span>
                              <Edit2 className="w-3.5 h-3.5 opacity-60" />
                            </button>
                          )}
                        </td>

                        {/* Quick Add Stock Buttons (Min 48px height) */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => quickAddStock(p, 5)}
                              className="h-12 min-h-[48px] px-3 text-xs sm:text-sm font-black bg-slate-100 hover:bg-emerald-100 text-slate-800 hover:text-emerald-900 rounded-xl cursor-pointer border border-slate-300 transition active:scale-95 flex items-center justify-center"
                            >
                              +5
                            </button>
                            <button
                              onClick={() => quickAddStock(p, 10)}
                              className="h-12 min-h-[48px] px-3.5 text-xs sm:text-sm font-black bg-emerald-50 hover:bg-emerald-200 text-emerald-900 rounded-xl cursor-pointer border border-emerald-300 transition active:scale-95 flex items-center justify-center"
                            >
                              +10
                            </button>
                          </div>
                        </td>

                        {/* Delete (Min 48px touch area) */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${p.name}?`)) onDeleteProduct(p.id);
                            }}
                            className="w-12 h-12 min-w-[48px] min-h-[48px] text-slate-400 hover:text-red-600 rounded-xl cursor-pointer inline-flex items-center justify-center transition hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
