import React, { useState } from 'react';
import { ShopSettings } from '../types';
import { ShoppingCart, Package, BookOpen, TrendingUp, Settings, Volume2, VolumeX, Plus, ShoppingBasket } from 'lucide-react';
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
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 select-none shadow-md">
      <div className="max-w-[1680px] mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-x-5 gap-y-2">
        <div className="flex items-center gap-3 min-w-[170px]">
          <img
            src="/highfly-ai-wordmark.png"
            alt="HighFly AI"
            className="w-[5.25rem] h-10 shrink-0 rounded-lg bg-white px-1 object-contain"
          />
          <div>
            <h1 className="font-black text-lg sm:text-xl leading-tight tracking-tight text-white">
              {settings.shopName}
            </h1>
            <p className="font-urdu text-xs text-amber-300 font-bold leading-none mt-1">
              {settings.shopNameUrdu}
            </p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 gap-1 order-3 w-full sm:order-none sm:w-auto sm:mx-auto">
          <button
            onClick={() => onSelectTab('pos')}
            type="button"
            className={`h-11 min-h-[44px] flex-1 sm:flex-none px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              currentTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
            aria-current={currentTab === 'pos' ? 'page' : undefined}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Counter</div>
              <div className="text-[10px] font-urdu font-bold text-emerald-200">کاؤنٹر</div>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('inventory')}
            type="button"
            className={`h-11 min-h-[44px] flex-1 sm:flex-none px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              currentTab === 'inventory'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
            aria-current={currentTab === 'inventory' ? 'page' : undefined}
          >
            <Package className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Stock</div>
              <div className="text-[10px] font-urdu font-bold text-emerald-200">اسٹاک</div>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('khata')}
            type="button"
            className={`h-11 min-h-[44px] flex-1 sm:flex-none px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition cursor-pointer ${
              currentTab === 'khata'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
            aria-current={currentTab === 'khata' ? 'page' : undefined}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Khata</div>
              <div className="text-[10px] font-urdu font-bold text-red-200">ادھار</div>
            </div>
          </button>

          <button
            onClick={() => onSelectTab('investor')}
            type="button"
            className={`h-11 min-h-[44px] flex-1 sm:flex-none px-3 sm:px-4 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition cursor-pointer ${
              currentTab === 'investor'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-900'
            }`}
            aria-current={currentTab === 'investor' ? 'page' : undefined}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <div className="text-left">
              <div className="leading-tight">Investor</div>
              <div className="text-[10px] font-urdu font-bold opacity-80">حساب</div>
            </div>
          </button>
        </nav>

        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
          {onOpenMarketPurchase && (
            <button
              onClick={onOpenMarketPurchase}
              type="button"
              className="h-11 min-h-[44px] px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
              title="Record Market Stock Purchase (نقد یا ادھار مال خریدا)"
            >
              <ShoppingBasket className="w-4 h-4" />
              <span className="hidden lg:inline">Buy stock</span>
            </button>
          )}

          <button
            onClick={onOpenQuickAdd}
            type="button"
            className="h-11 min-h-[44px] px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4 stroke-[2.7]" />
            <span className="hidden md:inline">Add item</span>
          </button>

          <button
            onClick={toggleSound}
            type="button"
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
            title={isMuted ? 'Sound Off' : 'Sound On'}
            aria-label={isMuted ? 'Turn sounds on' : 'Turn sounds off'}
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-slate-500" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>

          <button
            onClick={onOpenSettings}
            type="button"
            className="w-11 h-11 min-h-[44px] min-w-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition"
            title="Settings (سیٹنگز)"
            aria-label="Settings and backup"
          >
            <Settings className="w-5 h-5" />
          </button>

          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};
