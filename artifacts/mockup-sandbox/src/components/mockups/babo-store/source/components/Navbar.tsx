import React, { useState } from 'react';
import { ShopSettings } from '../types';
import { ShoppingCart, Package, BookOpen, TrendingUp, Settings, Volume2, VolumeX, Plus } from 'lucide-react';
import { sounds } from '../utils/audio';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  currentTab: 'pos' | 'inventory' | 'khata' | 'investor';
  onSelectTab: (tab: 'pos' | 'inventory' | 'khata' | 'investor') => void;
  onOpenQuickAdd: () => void;
  onOpenMarketPurchase?: () => void;
  onOpenSettings: () => void;
  settings: ShopSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenQuickAdd,
  onOpenMarketPurchase,
  onOpenSettings,
  settings,
}) => {
  const [isMuted, setIsMuted] = useState(!sounds.isEnabled());

  const toggleSound = () => {
    const next = !sounds.isEnabled();
    sounds.setSoundEnabled(next);
    setIsMuted(!next);
    if (next) sounds.playScan();
  };

  return (
    <header className="bg-slate-900 text-white border-b-2 border-slate-800 sticky top-0 z-40 select-none shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-18">
        {/* Left: Store Name in English & Urdu */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-2xl shadow-sm">
            🏪
          </div>
          <div>
            <h1 className="font-black text-xl sm:text-2xl leading-tight tracking-tight text-white">
              {settings.shopName}
            </h1>
            <p className="font-urdu text-xs text-amber-300 font-black leading-none mt-1">
              {settings.shopNameUrdu}
            </p>
          </div>
        </div>

        {/* Center: The 4 Core Navigation Tabs (All min-h-[48px] with clear English + Urdu) */}
        <nav className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 gap-1">
          {/* Tab 1: Counter */}
          <button
            onClick={() => onSelectTab('pos')}
            type="button"
            className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer active:scale-95 ${
              currentTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Counter</div>
              <div className="text-[10px] font-urdu font-black text-emerald-200">کاؤنٹر</div>
            </div>
          </button>

          {/* Tab 2: Stock */}
          <button
            onClick={() => onSelectTab('inventory')}
            type="button"
            className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer active:scale-95 ${
              currentTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Stock</div>
              <div className="text-[10px] font-urdu font-black text-emerald-200">اسٹاک</div>
            </div>
          </button>

          {/* Tab 3: Khata */}
          <button
            onClick={() => onSelectTab('khata')}
            type="button"
            className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer active:scale-95 ${
              currentTab === 'khata'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Khata</div>
              <div className="text-[10px] font-urdu font-black text-red-200">ادھار</div>
            </div>
          </button>

          {/* Tab 4: Investor */}
          <button
            onClick={() => onSelectTab('investor')}
            type="button"
            className={`h-12 min-h-[48px] px-3 sm:px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
              currentTab === 'investor'
                ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Investor</div>
              <div className="text-[10px] font-urdu font-black opacity-80">حساب</div>
            </div>
          </button>
        </nav>

        {/* Right: Buy Stock + Add Item + Sound + Settings (All 48px height minimum) */}
        <div className="flex items-center gap-2">
          {/* Market Stock Purchase (Cashier buys stock: cash or pay later on credit) */}
          {onOpenMarketPurchase && (
            <button
              onClick={onOpenMarketPurchase}
              type="button"
              className="h-12 min-h-[48px] px-3 sm:px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md transition"
              title="Record Market Stock Purchase (نقد یا ادھار مال خریدا)"
            >
              <span>🛒</span>
              <span className="hidden md:inline">Buy Stock (مال خریدا)</span>
              <span className="md:hidden">Stock</span>
            </button>
          )}

          {/* Quick Add Product Button */}
          <button
            onClick={onOpenQuickAdd}
            type="button"
            className="h-12 min-h-[48px] px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-md transition"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span className="hidden sm:inline">Add Item (نیا سامان)</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            type="button"
            className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
            title={isMuted ? 'Sound Off' : 'Sound On'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Settings & Backup */}
          <button
            onClick={onOpenSettings}
            type="button"
            className="w-12 h-12 min-h-[48px] min-w-[48px] rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
            title="Settings (سیٹنگز)"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Offline / Laptop App Install */}
          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
