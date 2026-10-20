import React from 'react';
import { Sale, ShopSettings } from '../types';
import { Printer, X, Share2, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  settings: ShopSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  settings,
}) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const phone = sale.customerPhone ? sale.customerPhone.replace(/[^0-9]/g, '') : '';
    let text = `*${settings.shopName}*\n`;
    text += `*${settings.shopNameUrdu}*\n`;
    text += `Bill #: ${sale.invoiceNumber}\n`;
    text += `Date: ${new Date(sale.timestamp).toLocaleString()}\n`;
    text += `---------------------------\n`;
    sale.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.name} x ${item.quantity} ${item.unit} = Rs ${item.total}\n`;
    });
    text += `---------------------------\n`;
    text += `*Total: Rs ${sale.total}*\n`;
    if (sale.paymentType === 'cash') {
      text += `Cash Paid: Rs ${sale.tendered}\n`;
      text += `Change Returned: Rs ${sale.change}\n`;
    } else {
      text += `Payment: Added to Khata (ادھار)\n`;
      if (sale.customerName) text += `Customer: ${sale.customerName}\n`;
    }
    text += `\nشکریہ! دوبارہ تشریف لائیں۔`;

    const cleanPhone = phone.startsWith('0') ? '92' + phone.substring(1) : phone;
    const url = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Sale Completed (فروخت مکمل)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Slip Preview */}
        <div className="p-4 bg-slate-50 flex justify-center max-h-[60vh] overflow-y-auto">
          <div 
            id="thermal-receipt-area" 
            className="w-full bg-white border border-dashed border-slate-300 p-4 rounded-lg shadow-xs text-slate-800 font-mono-num text-xs leading-relaxed"
          >
            {/* Store Name */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300 mb-2">
              <h3 className="font-extrabold text-base tracking-tight text-slate-900">
                {settings.shopName}
              </h3>
              <p className="font-urdu text-sm font-bold text-slate-700 mt-0.5">
                {settings.shopNameUrdu}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">{settings.address}</p>
              <p className="text-[11px] text-slate-500 font-bold">Ph: {settings.phone}</p>
            </div>

            {/* Invoice meta */}
            <div className="flex justify-between text-[11px] text-slate-600 mb-2">
              <span>Bill #: <strong>{sale.invoiceNumber}</strong></span>
              <span>{new Date(sale.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div className="text-[10px] text-slate-500 mb-2">
              {new Date(sale.timestamp).toLocaleDateString()}
            </div>

            {sale.customerName && (
              <div className="bg-amber-50 p-1.5 rounded border border-amber-200 text-amber-900 text-[11px] mb-2 font-semibold">
                Customer (گاہک): {sale.customerName}
              </div>
            )}

            {/* Table Header */}
            <div className="border-t border-b border-dashed border-slate-400 py-1 font-bold text-slate-700 flex justify-between">
              <span className="w-1/2">Item (آئٹم)</span>
              <span className="w-1/4 text-center">Qty</span>
              <span className="w-1/4 text-right">Total</span>
            </div>

            {/* Items */}
            <div className="divide-y divide-dashed divide-slate-200 py-1">
              {sale.items.map((item, i) => (
                <div key={i} className="py-1 flex justify-between items-start">
                  <div className="w-1/2 pr-1">
                    <div className="font-bold text-slate-900 text-[11px] leading-tight">{item.name}</div>
                    <div className="text-[10px] text-slate-500">@ Rs {item.unitPrice} / {item.unit}</div>
                  </div>
                  <div className="w-1/4 text-center font-bold">{item.quantity}</div>
                  <div className="w-1/4 text-right font-bold text-slate-900">Rs {item.total}</div>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="border-t-2 border-slate-900 pt-2 space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (کل رقم):</span>
                <span>Rs {sale.subtotal}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount (رعایت):</span>
                  <span>- Rs {sale.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-300">
                <span>Grand Total (صافی بل):</span>
                <span className="text-base text-emerald-800">Rs {sale.total}</span>
              </div>

              {sale.paymentType === 'cash' ? (
                <>
                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Cash Tendered (وصول رقم):</span>
                    <span>Rs {sale.tendered}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-700 text-xs bg-emerald-50 p-1 rounded">
                    <span>Change Returned (بقایا واپس):</span>
                    <span>Rs {sale.change}</span>
                  </div>
                </>
              ) : (
                <div className="bg-red-50 text-red-800 p-1.5 rounded font-bold text-[11px] text-center border border-red-200 mt-1">
                  Placed on Udhaar Khata (ادھار کھاتے میں درج)
                </div>
              )}
            </div>

            {/* Footer message */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 mt-3 text-[11px] font-urdu text-slate-600 leading-normal">
              تشریف لانے کا شکریہ! خریدا ہوا مال تبدیل ہو سکتا ہے۔
            </div>
          </div>
        </div>

        {/* Modal Actions (All >= 48px height) */}
        <div className="p-3 bg-white border-t-2 border-slate-200 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 h-13 min-h-[48px] bg-slate-900 hover:bg-black text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 text-sm"
          >
            <Printer className="w-5 h-5" />
            <span>Print Slip (پرنٹ)</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="h-13 min-h-[48px] px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 text-sm"
            title="WhatsApp Receipt"
          >
            <Share2 className="w-5 h-5" />
            <span>WhatsApp</span>
          </button>

          <button
            onClick={onClose}
            className="h-13 min-h-[48px] px-4 bg-slate-200 hover:bg-slate-300 text-slate-900 font-black rounded-2xl cursor-pointer transition text-sm"
          >
            Done (مکمل)
          </button>
        </div>
      </div>
    </div>
  );
};
