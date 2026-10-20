import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, CartItem, Customer, Sale, Expense, KhataTransaction, SupplierTransaction, ShopSettings } from '../types';
import { calculateCashDrawerBreakdown, CashDrawerBreakdown } from '../utils/accounting';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  UserCheck,
  Check,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
  CreditCard,
  Receipt,
  ChevronDown,
  ChevronUp,
 replit-agent
  ShoppingBasket,
  Store,

  Banknote,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  X,
 main
} from 'lucide-react';
import { sounds } from '../utils/audio';

interface POSScreenProps {
  products: Product[];
  customers: Customer[];
  sales?: Sale[];
  expenses?: Expense[];
  transactions?: KhataTransaction[];
  supplierTransactions?: SupplierTransaction[];
  settings?: ShopSettings;
  cashDrawerBreakdown?: CashDrawerBreakdown;
  onCompleteSale: (sale: Omit<Sale, 'id' | 'invoiceNumber' | 'timestamp'>) => void;
  onOpenQuickAdd: () => void;
  onOpenMarketPurchase?: () => void;
  onLoadStaples?: () => void;
  currency: string;
}

export const POSScreen: React.FC<POSScreenProps> = ({
  products,
  customers,
  sales = [],
  expenses = [],
  transactions = [],
  supplierTransactions = [],
  settings,
  cashDrawerBreakdown,
  onCompleteSale,
  onOpenQuickAdd,
  onOpenMarketPurchase,
  onLoadStaples,
  currency,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const tenderInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tenderedAmount, setTenderedAmount] = useState<string>('');

  // Khata selection modal state
  const [isKhataMode, setIsKhataMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerSearch, setCustomerSearch] = useState('');

  // Cash in Drawer Audit Statement Modal state
  const [isCashDrawerModalOpen, setIsCashDrawerModalOpen] = useState(false);

  // Daily Sales Summary View toggle
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(true);

  // Live Physical Cash in Drawer Breakdown
  const drawer = useMemo(() => {
    if (cashDrawerBreakdown) return cashDrawerBreakdown;
    if (settings) {
      return calculateCashDrawerBreakdown(settings, sales, expenses, transactions, supplierTransactions);
    }
    return null;
  }, [cashDrawerBreakdown, settings, sales, expenses, transactions, supplierTransactions]);

  // Daily Sales Summary (Today's performance calculations)
  const todaySummary = useMemo(() => {
    const todayStr = new Date().toDateString();
    const todaySales = sales.filter(
      (s) => new Date(s.timestamp).toDateString() === todayStr
    );

    const cashSales = todaySales
      .filter((s) => s.paymentType === 'cash')
      .reduce((sum, s) => sum + s.total, 0);

    const creditSales = todaySales
      .filter((s) => s.paymentType === 'credit')
      .reduce((sum, s) => sum + s.total, 0);

    const totalSales = todaySales.reduce((sum, s) => sum + s.total, 0);
    const totalProfit = todaySales.reduce((sum, s) => sum + s.profit, 0);
    const billsCount = todaySales.length;

    return {
      cashSales,
      creditSales,
      totalSales,
      totalProfit,
      billsCount,
    };
  }, [sales]);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products by query & category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchName = p.name.toLowerCase().includes(q);
      const matchUrdu = p.nameUrdu ? p.nameUrdu.includes(q) : false;
      const matchBarcode = p.barcode ? p.barcode.includes(q) : false;
      return matchCat && (matchName || matchUrdu || matchBarcode);
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart calculations
  const grandTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.customPrice ?? item.product.sellingPrice) * item.quantity, 0);
  }, [cart]);

  const costTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.costPrice * item.quantity, 0);
  }, [cart]);

  const profit = Math.max(0, grandTotal - costTotal);

  const tenderNum = parseFloat(tenderedAmount) || 0;
  const changeToReturn = Math.max(0, tenderNum - grandTotal);
  const isTenderSufficient = tenderNum >= grandTotal && grandTotal > 0;

  // Autofocus search on load
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Hardware barcode scanner & keyboard shortcuts listener
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' || e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else if (cart.length > 0) {
          if (confirm('Clear cart? (کیا ٹوکری خالی کرنی ہے؟)')) {
            setCart([]);
            setTenderedAmount('');
          }
        }
        return;
      }

      if (e.key === 'Enter' && isTenderSufficient && document.activeElement === tenderInputRef.current) {
        handleCashCheckout();
        return;
      }

      // Barcode detection
      const now = Date.now();
      if (now - lastKeyTime > 60) buffer = '';
      lastKeyTime = now;

      if (e.key === 'Enter' && buffer.length >= 4) {
        const matched = products.find((p) => p.barcode === buffer);
        if (matched) {
          addToCart(matched);
          buffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, cart, isTenderSufficient, searchQuery]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      sounds.playWarning();
      alert(`${product.name} is out of stock. (اسٹاک ختم ہو چکا ہے)`);
      return;
    }

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product, quantity: 1 }];
    });

    sounds.playScan();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const applyQuickTender = (amount: number) => {
    setTenderedAmount(amount.toString());
    sounds.playScan();
  };

  const applyExactTender = () => {
    setTenderedAmount(grandTotal.toString());
    sounds.playScan();
  };

  const handleCashCheckout = () => {
    if (cart.length === 0) return;
    if (tenderNum < grandTotal) {
      sounds.playWarning();
      alert(`Cash received is less than the bill. (وصول رقم بل سے کم ہے)`);
      return;
    }

    onCompleteSale({
      items: cart.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        nameUrdu: i.product.nameUrdu,
        quantity: i.quantity,
        unit: i.product.unit,
        unitPrice: i.customPrice ?? i.product.sellingPrice,
        costPrice: i.product.costPrice,
        total: (i.customPrice ?? i.product.sellingPrice) * i.quantity,
      })),
      subtotal: grandTotal,
      discount: 0,
      total: grandTotal,
      costTotal,
      profit,
      tendered: tenderNum,
      change: changeToReturn,
      paymentType: 'cash',
    });

    setCart([]);
    setTenderedAmount('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const handleKhataCheckout = () => {
    if (!selectedCustomerId) {
      alert('Please select a customer (گاہک منتخب کریں)');
      return;
    }
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (!customer) return;

    onCompleteSale({
      items: cart.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        nameUrdu: i.product.nameUrdu,
        quantity: i.quantity,
        unit: i.product.unit,
        unitPrice: i.customPrice ?? i.product.sellingPrice,
        costPrice: i.product.costPrice,
        total: (i.customPrice ?? i.product.sellingPrice) * i.quantity,
      })),
      subtotal: grandTotal,
      discount: 0,
      total: grandTotal,
      costTotal,
      profit,
      tendered: 0,
      change: 0,
      paymentType: 'credit',
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
    });

    setCart([]);
    setTenderedAmount('');
    setIsKhataMode(false);
    setSelectedCustomerId('');
    setSearchQuery('');
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  );

  return (
    <div className="pos-screen flex flex-col gap-2.5 h-[calc(100vh-80px)] p-2.5 overflow-hidden">
      {/* DAILY SALES SUMMARY BAR (Quick Operational Insight) */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs px-3.5 py-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-black uppercase text-slate-800 tracking-wider">
              Today's Sales Summary (آج کی کل فروخت و نفع)
            </span>
            <span className="text-xs font-mono-num font-black text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
              {todaySummary.billsCount} {todaySummary.billsCount === 1 ? 'Bill' : 'Bills'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
            className="h-9 px-3 rounded-xl text-xs font-black text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 flex items-center gap-1 cursor-pointer transition"
          >
            <span>{isSummaryExpanded ? 'Compact (مختصر)' : 'Expand (تفصیل)'}</span>
            {isSummaryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isSummaryExpanded ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
            {/* 1. Cash in Drawer (Live physical cash with all deductions) */}
            {drawer ? (
              <button
                type="button"
                onClick={() => setIsCashDrawerModalOpen(true)}
                className={`p-2.5 rounded-xl border-2 flex items-center justify-between text-left transition cursor-pointer group ${
                  drawer.netCashDrawer >= 0
                    ? 'bg-amber-50 hover:bg-amber-100/90 border-amber-300'
                    : 'bg-red-50 hover:bg-red-100 border-red-400'
                }`}
                title="Click to view Cash Drawer Audit & Statement (دراز حساب)"
              >
                <div>
                  <div className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-amber-700" />
                    <span>Cash in Drawer (دراز کیش)</span>
                    <span className="text-[9px] bg-amber-200 text-amber-950 px-1 py-0.2 rounded font-black group-hover:bg-amber-300">
                      Audit
                    </span>
                  </div>
                  <div className={`font-mono-num font-black text-base sm:text-lg mt-0.5 ${
                    drawer.netCashDrawer >= 0 ? 'text-amber-950' : 'text-red-700'
                  }`}>
                    {currency} {drawer.netCashDrawer.toLocaleString()}
                  </div>
                </div>
              </button>
            ) : (
              <div className="p-2.5 bg-amber-50/80 border-2 border-amber-300 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                    <Banknote className="w-3.5 h-3.5 text-amber-700" />
                    <span>Cash in Drawer</span>
                  </div>
                  <div className="font-mono-num font-black text-base sm:text-lg text-amber-950 mt-0.5">
                    {currency} 0
                  </div>
                </div>
              </div>
            )}

            {/* 2. Cash Sales */}
            <div className="p-2.5 bg-emerald-50/80 border-2 border-emerald-300 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cash Sales (نقد فروخت)</span>
                </div>
                <div className="font-mono-num font-black text-base sm:text-lg text-emerald-950 mt-0.5">
                  {currency} {todaySummary.cashSales.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 3. Credit Sales */}
            <div className="p-2.5 bg-rose-50/80 border-2 border-rose-300 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase text-rose-900 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-rose-700" />
                  <span>Credit Sales (ادھار فروخت)</span>
                </div>
                <div className="font-mono-num font-black text-base sm:text-lg text-rose-950 mt-0.5">
                  {currency} {todaySummary.creditSales.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 4. Total Sales */}
            <div className="p-2.5 bg-blue-50/80 border-2 border-blue-300 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase text-blue-900 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                  <span>Total Sales (کل سیلز)</span>
                </div>
                <div className="font-mono-num font-black text-base sm:text-lg text-blue-950 mt-0.5">
                  {currency} {todaySummary.totalSales.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 5. Total Profit */}
            <div className="p-2.5 bg-purple-50/90 border-2 border-purple-300 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-black uppercase text-purple-950 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-700" />
                  <span>Total Profit (آج کا منافع)</span>
                </div>
                <div className="font-mono-num font-black text-base sm:text-lg text-purple-950 mt-0.5">
                  {currency} {todaySummary.totalProfit.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-black pt-1.5 border-t border-slate-100 mt-1">
            {drawer && (
              <button
                type="button"
                onClick={() => setIsCashDrawerModalOpen(true)}
                className="text-amber-950 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-lg border border-amber-300 cursor-pointer flex items-center gap-1"
              >
                <span>Drawer:</span>
                <span className="font-mono-num">{currency} {drawer.netCashDrawer.toLocaleString()}</span>
              </button>
            )}
            <span className="text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
              Cash: {currency} {todaySummary.cashSales.toLocaleString()}
            </span>
            <span className="text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
              Credit: {currency} {todaySummary.creditSales.toLocaleString()}
            </span>
            <span className="text-blue-900 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
              Total: {currency} {todaySummary.totalSales.toLocaleString()}
            </span>
            <span className="text-purple-950 bg-purple-100 px-2.5 py-0.5 rounded-lg border border-purple-300">
              Profit: {currency} {todaySummary.totalProfit.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* MAIN POS WORKSPACE: Left Catalog + Right Cart */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 overflow-hidden">
        {/* LEFT SECTION: Search + Product Cards */}
        <div className="flex-1 flex flex-col bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
        {/* Giant Search Bar */}
        <div className="p-3 border-b-2 border-slate-200 bg-slate-50">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-3.5 w-6 h-6 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search Item / سامان تلاش کریں... (F1 /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-13 min-h-[48px] pl-12 pr-4 text-base sm:text-lg font-bold rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 h-8 px-3 text-slate-500 hover:text-slate-800 font-black text-xs bg-slate-200 rounded-xl cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Buy Stock Button */}
            {onOpenMarketPurchase && (
              <button
                onClick={onOpenMarketPurchase}
                type="button"
                className="h-13 min-h-[48px] px-3.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer transition shrink-0"
                title="Log Market Stock Purchase (نقد یا ادھار مال خریدا)"
              >
                <ShoppingBasket className="w-4 h-4" />
                <span className="hidden sm:inline">Buy Stock (مال خریدا)</span>
              </button>
            )}

            {/* Add Item Button: min 48px height */}
            <button
              onClick={onOpenQuickAdd}
              type="button"
              className="h-13 min-h-[48px] px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition shrink-0"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span className="hidden sm:inline">Add Item (نیا سامان)</span>
            </button>
          </div>

          {/* Categories Filter (Only shown if products exist, min 48px touch targets) */}
          {categories.length > 2 && (
            <div className="flex items-center gap-2 overflow-x-auto pt-2.5 pb-0.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`h-12 min-h-[48px] px-4 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition cursor-pointer active:scale-95 flex items-center justify-center ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Grid or Clean Fresh Start */}
        <div className="flex-1 p-3 overflow-y-auto">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Babo Store Counter Ready</h3>
                <p className="text-sm font-urdu text-slate-600 font-bold mt-1">
                  سامان شامل کرنے کے لیے نیچے بٹن دبائیں
                </p>
              </div>

              <div className="space-y-2.5 w-full pt-2">
                <button
                  onClick={onOpenQuickAdd}
                  className="w-full h-14 min-h-[48px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition cursor-pointer text-base"
                >
                  <Plus className="w-6 h-6 stroke-[3]" />
                  <span>Add First Item (پہلا سامان شامل کریں)</span>
                </button>

                {onLoadStaples && (
                  <button
                    onClick={onLoadStaples}
                    className="w-full h-12 min-h-[48px] bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer text-xs"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Auto-Load 6 Kiryana Staples (چینی، آٹا، گھی، چائے، دال، انڈے)</span>
                  </button>
                )}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <p className="font-bold text-base text-slate-700">No item found for "{searchQuery}"</p>
              <button
                onClick={onOpenQuickAdd}
                className="mt-3 h-12 min-h-[48px] px-5 bg-emerald-600 text-white font-black rounded-2xl text-sm cursor-pointer shadow-md"
              >
                + Quick Add "{searchQuery}"
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock <= 0;
                const inCart = cart.find((i) => i.product.id === p.id);

                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    type="button"
                    className={`p-3 rounded-2xl border-2 text-left flex flex-col justify-between min-h-[120px] transition cursor-pointer active:scale-95 select-none ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                        : inCart
                        ? 'bg-emerald-50 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-black text-sm sm:text-base text-slate-900 line-clamp-2 leading-tight">
                          {p.name}
                        </span>
                        {inCart && (
                          <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs font-black rounded-lg shrink-0">
                            ×{inCart.quantity}
                          </span>
                        )}
                      </div>
                      {p.nameUrdu && (
                        <p className="font-urdu text-xs text-slate-500 font-bold mt-0.5 line-clamp-1">{p.nameUrdu}</p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-end justify-between">
                      <span className="font-mono-num font-black text-lg text-emerald-800">
                        {currency} {p.sellingPrice}
                      </span>
                      <span className="text-xs font-black px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {isOutOfStock ? '0 stock' : `${p.stock} ${p.unit}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION: Cart + Big Bill + 48px Minimum Actions */}
      <div className="w-full lg:w-[420px] xl:w-[450px] flex flex-col bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden shrink-0">
        {/* Cart Header */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-black text-base leading-tight">Current Bill (گاہک کا بل)</h3>
            <p className="text-xs text-slate-300 font-bold">
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="h-10 px-3 text-xs text-red-300 hover:text-white font-black bg-red-950/70 rounded-xl cursor-pointer"
            >
              Clear (صاف کریں)
            </button>
          )}
        </div>

        {/* Cart Items List with 48px Minimum Steppers */}
        <div className="flex-1 p-2.5 overflow-y-auto divide-y divide-slate-100 max-h-[38vh] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <ShoppingBag className="w-8 h-8 text-slate-300 mb-1" />
              <p className="font-bold text-sm text-slate-600">Cart is empty</p>
              <p className="text-xs font-urdu font-bold text-slate-400">سامان پر کلک کریں</p>
            </div>
          ) : (
            cart.map((item) => {
              const itemTotal = (item.customPrice ?? item.product.sellingPrice) * item.quantity;
              return (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900 truncate">{item.product.name}</p>
                    <p className="text-xs text-slate-500 font-mono-num font-bold">
                      {currency} {item.product.sellingPrice} / {item.product.unit}
                    </p>
                  </div>

                  {/* Quantity Stepper with 48px touch targets */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1 border border-slate-200">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-white text-slate-800 flex items-center justify-center font-black active:scale-90 transition cursor-pointer shadow-xs text-lg"
                      aria-label="Decrease"
                    >
                      <Minus className="w-5 h-5 stroke-[3]" />
                    </button>
                    <span className="w-9 text-center font-mono-num font-black text-base text-slate-900">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black active:scale-90 transition cursor-pointer shadow-xs text-lg"
                      aria-label="Increase"
                    >
                      <Plus className="w-5 h-5 stroke-[3]" />
                    </button>
                  </div>

                  <div className="text-right w-20 shrink-0">
                    <div className="font-mono-num font-black text-sm text-slate-900">
                      {currency} {itemTotal}
                    </div>
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                        title="Remove from cart"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOTTOM CHECKOUT PANEL: Total Bill, Tendered, and Cash Checkout */}
        <div className="p-3 bg-slate-50 border-t-2 border-slate-200 space-y-2.5">
          {/* Big Total Box */}
          <div className="p-3 bg-white rounded-2xl border-2 border-slate-300 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase text-slate-600">Total Bill</span>
              <div className="text-xs font-urdu font-black text-slate-500">صافی بل</div>
            </div>
            <div className="font-mono-num text-3xl sm:text-4xl font-black text-slate-900">
              {currency} {grandTotal.toLocaleString()}
            </div>
          </div>

          {/* Quick Cash Buttons (All strictly >= 48px height) */}
          <div>
            <div className="flex justify-between items-center mb-1 text-xs font-black text-slate-700">
              <span>Quick Cash (نقد رقم):</span>
              <button
                type="button"
                onClick={applyExactTender}
                disabled={grandTotal === 0}
                className="text-emerald-700 hover:underline cursor-pointer font-black"
              >
                Exact (پورا بل)
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[100, 500, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => applyQuickTender(amt)}
                  disabled={grandTotal === 0}
                  className="h-12 min-h-[48px] bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-xl font-mono-num font-black text-xs sm:text-sm text-slate-900 transition active:scale-95 cursor-pointer shadow-2xs disabled:opacity-40"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          {/* Tendered & Change (Min 48px inputs) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-black text-slate-700 block mb-1">Tendered (وصول):</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-400 font-black text-xs">{currency}</span>
                <input
                  ref={tenderInputRef}
                  type="number"
                  placeholder="0"
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  onWheel={(e) => (e.target as HTMLElement).blur()}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  }}
                  className="w-full h-12 min-h-[48px] pl-9 pr-2 font-mono-num text-lg font-black rounded-2xl border-2 border-slate-300 focus:border-emerald-600 outline-none bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-emerald-800 block mb-1">Change (بقایا واپس):</label>
              <div
                className={`h-12 min-h-[48px] px-3 rounded-2xl flex items-center justify-between font-mono-num font-black text-lg border-2 ${
                  changeToReturn > 0
                    ? 'bg-emerald-600 border-emerald-700 text-white shadow-md'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}
              >
                <span className="text-xs font-black opacity-80">{currency}</span>
                <span>{changeToReturn.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Cash Sale and Udhaar (Both >= 48px height) */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleCashCheckout}
              disabled={cart.length === 0 || !isTenderSufficient}
              className={`h-14 min-h-[48px] rounded-2xl font-black flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 shadow-md ${
                isTenderSufficient && cart.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Check className="w-6 h-6 stroke-[3]" />
              <div className="text-left">
                <div className="text-base font-black leading-tight">Cash Sale</div>
                <div className="text-xs font-urdu font-black text-emerald-200 leading-none">نقد وصولی [Enter]</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setIsKhataMode(true)}
              disabled={cart.length === 0}
              className={`h-14 min-h-[48px] rounded-2xl font-black border-2 flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 ${
                cart.length > 0
                  ? 'bg-red-50 hover:bg-red-100 border-red-300 text-red-800'
                  : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <UserCheck className="w-5 h-5 text-red-600" />
              <div className="text-left">
                <div className="text-base font-black leading-tight">Udhaar</div>
                <div className="text-xs font-urdu font-black text-red-600 leading-none">ادھار کھاتہ</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* KHATA MODAL */}
      {isKhataMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-5 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-black text-lg text-red-700">Select Customer for Khata</h3>
                <p className="text-xs font-urdu font-bold text-slate-500">کس گاہک کے کھاتے میں لکھنا ہے؟</p>
              </div>
              <button
                onClick={() => setIsKhataMode(false)}
                className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-700 cursor-pointer text-lg font-black"
              >
                ✕
              </button>
            </div>

            <div className="bg-red-50 p-3 rounded-2xl border-2 border-red-200 flex justify-between items-center text-sm font-black text-red-900">
              <span>Bill to Add:</span>
              <span className="font-mono-num text-xl">{currency} {grandTotal}</span>
            </div>

            {customers.length === 0 ? (
              <div className="py-6 text-center text-slate-600 text-sm space-y-2">
                <p className="font-bold">No customers in Khata yet.</p>
                <p className="text-xs font-urdu text-slate-500 font-bold">پہلے کھاتہ میں جا کر گاہک شامل کریں</p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search Customer... (نام یا فون)"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full h-12 min-h-[48px] px-3.5 rounded-2xl border-2 border-slate-300 focus:border-red-500 outline-none text-sm font-bold"
                  autoFocus
                />

                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCustomerId(c.id)}
                      className={`w-full min-h-[48px] p-2.5 rounded-2xl border-2 text-left flex items-center justify-between transition cursor-pointer ${
                        selectedCustomerId === c.id
                          ? 'bg-red-100 border-red-500'
                          : 'bg-white hover:bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-black text-sm text-slate-900">{c.name}</div>
                        <div className="text-xs text-slate-500 font-mono-num font-bold">{c.phone}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono-num font-black text-xs text-red-700">
                          {currency} {c.balance.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsKhataMode(false)}
                className="flex-1 h-12 min-h-[48px] rounded-2xl border border-slate-300 text-slate-700 font-black hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleKhataCheckout}
                disabled={!selectedCustomerId}
                className={`flex-2 h-12 min-h-[48px] rounded-2xl font-black flex items-center justify-center gap-2 cursor-pointer transition ${
                  selectedCustomerId
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Confirm (درج کریں)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CASH DRAWER AUDIT & RECONCILIATION STATEMENT MODAL */}
      {isCashDrawerModalOpen && drawer && (
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
                    Cash in Drawer Audit (کاؤنٹر دراز حساب)
                  </h3>
                  <p className="text-xs font-urdu text-amber-300 font-bold">
                    آمد و خرچ، ادھار وصولی اور ہول سیلر ادائیگیاں
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCashDrawerModalOpen(false)}
                className="w-10 h-10 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center font-black text-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Statement Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Highlight Net Cash Box */}
              <div className={`p-4 rounded-2xl border-2 text-center ${
                drawer.netCashDrawer >= 0
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <span className="text-xs uppercase font-black tracking-wider block">
                  Net Available Cash in Drawer (موجودہ نقد رقم)
                </span>
                <div className="font-mono-num text-3xl sm:text-4xl font-black mt-1">
                  {currency} {drawer.netCashDrawer.toLocaleString()}
                </div>
                <p className="text-xs font-urdu font-bold mt-1 text-slate-600">
                  تمام نقد فروخت، اخراجات اور مارکیٹ ادائیگیوں کے بعد دراز میں موجود رقم
                </p>
              </div>

              {/* Inflows & Outflows Itemized List */}
              <div className="bg-slate-50 rounded-2xl border-2 border-slate-200 divide-y divide-slate-200 text-xs sm:text-sm font-bold">
                {/* 1. Starting Cash */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <div>
                      <div className="font-black text-slate-800">Starting Cash (ابتدائی کاؤنٹر کیش)</div>
                      <div className="text-[11px] text-slate-500">Configured in Shop Settings</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-slate-800">
                    {currency} {drawer.initialCash.toLocaleString()}
                  </div>
                </div>

                {/* 2. Cash Sales Inflow */}
                <div className="p-3 flex items-center justify-between bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-black text-emerald-950">(+) Retail Cash Sales (نقد سیلز)</div>
                      <div className="text-[11px] text-emerald-800">Direct cash received from counter sales</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-emerald-700">
                    +{currency} {drawer.cashSales.toLocaleString()}
                  </div>
                </div>

                {/* 3. Customer Khata Collections */}
                <div className="p-3 flex items-center justify-between bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-black text-emerald-950">(+) Customer Khata Recoveries (ادھار وصولی)</div>
                      <div className="text-[11px] text-emerald-800">Credit customers paying back their balance</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-emerald-700">
                    +{currency} {drawer.customerRecoveries.toLocaleString()}
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
                    -{currency} {drawer.expensesPaid.toLocaleString()}
                  </div>
                </div>

                {/* 5. Supplier / Wholesale Liability Payments Outflow */}
                <div className="p-3 flex items-center justify-between bg-rose-50/50">
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4 text-red-600 shrink-0" />
                    <div>
                      <div className="font-black text-rose-950">(-) Supplier Payments (ہول سیلر کو ادائیگیاں)</div>
                      <div className="text-[11px] text-rose-800">Liabilities & stock credit debt paid in cash</div>
                    </div>
                  </div>
                  <div className="font-mono-num font-black text-red-600">
                    -{currency} {drawer.supplierPaymentsPaid.toLocaleString()}
                  </div>
                </div>

                {/* Final Net Calculation */}
                <div className="p-3.5 flex items-center justify-between bg-amber-50">
                  <div className="font-black text-slate-900 text-sm">
                    (=) Net Cash in Drawer (موجودہ دراز نقد کیش)
                  </div>
                  <div className="font-mono-num font-black text-base sm:text-lg text-slate-900">
                    {currency} {drawer.netCashDrawer.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Informative Urdu Note */}
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="font-urdu leading-relaxed font-bold">
                  نوٹ: جب بھی آپ کسی ہول سیلر یا قرض خواہ کو رقم ادا کرتے ہیں، یا دکان کا کوئی خرچ کرتے ہیں تو وہ رقم فوری طور پر کاؤنٹر دراز کے کیش سے منہا (Minus) ہو جاتی ہے۔
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCashDrawerModalOpen(false)}
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
