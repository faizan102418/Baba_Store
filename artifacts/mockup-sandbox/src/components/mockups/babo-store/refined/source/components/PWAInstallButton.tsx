import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Laptop, Check, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // If already running in standalone desktop mode, show a small offline ready indicator or hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Edge / Laptop desktop browser prompt
  if (isInstallable) {
    return (
      <button
        onClick={install}
        type="button"
        className="h-12 min-h-[48px] px-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-2xl shadow-sm flex items-center gap-2 cursor-pointer transition text-xs sm:text-sm"
        title="Install Babo Store as desktop application for offline use"
      >
        <Laptop className="w-4 h-4 stroke-[2.5]" />
        <span className="hidden sm:inline">Install Offline App (لیپ ٹاپ ایپ)</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // Fallback button to show quick instructions for Chrome/Edge or Safari
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        type="button"
        className="h-12 min-h-[48px] px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black rounded-2xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition text-xs"
        title="Offline App Installation Guide"
      >
        <Laptop className="w-4 h-4 text-amber-400" />
        <span className="hidden md:inline">Offline Guide (آف لائن ایپ)</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-slate-300 p-6 space-y-4 animate-in fade-in text-slate-900">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Laptop className="w-6 h-6 text-emerald-600" />
                <h3 className="font-black text-lg">Shop Laptop Offline App</h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-800 font-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <p className="font-black text-emerald-950">
                  ⚡ 100% Offline Capability (بغیر انٹرنیٹ استعمال کریں):
                </p>
                <p className="text-xs text-emerald-900 font-urdu font-bold mt-1">
                  یہ ایپ آپ کے شاپ لیپ ٹاپ کی میموری (LocalStorage) میں ڈیٹا محفوظ کرتی ہے۔ انٹرنیٹ بند ہونے پر بھی بلنگ، کھاتہ، اور اسٹاک بلاتعطل کام کرتے ہیں۔
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-black text-slate-900">How to Install on Shop Laptop (طریقہ کار):</p>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs font-bold text-slate-700">
                  <li>
                    اوپر براؤزر (Chrome یا Edge) کے ایڈریس بار میں <strong>Install Icon (⊕)</strong> پر کلک کریں۔
                  </li>
                  <li>
                    یا براؤزر کے مینو (3 ڈاٹس) میں جا کر <strong>&quot;Save and share&quot; &gt; &quot;Install Babo Store&quot;</strong> منتخب کریں۔
                  </li>
                  <li>
                    ڈیسک ٹاپ شارٹ کٹ بن جائے گا اور ایپ ایک علیحدہ فل سکرین ونڈو میں بغیر براؤزر بار کے کھلے گی۔
                  </li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="w-full h-12 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl transition cursor-pointer"
            >
              OK, Got it (سمجھ گیا)
            </button>
          </div>
        </div>
      )}
    </>
  );
};
