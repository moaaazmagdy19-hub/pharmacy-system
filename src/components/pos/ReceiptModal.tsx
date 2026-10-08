import React, { useRef } from 'react';
import { Printer, CheckCircle, X, Download } from 'lucide-react';
import { Sale } from '../../types';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency, formatDateTime } from '../../lib/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  previousBalance?: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  sale,
  previousBalance = 0,
}) => {
  const { settings } = usePharmacy();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const currentRemaining = sale.remaining_amount;
  const newTotalDebt = previousBalance + currentRemaining;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Actions */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between no-print">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm font-bold text-slate-800">تم حفظ عملية البيع بنجاح</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة الإيصال</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Area */}
        <div className="p-6 overflow-y-auto print-area font-mono text-slate-800" ref={printRef}>
          {/* Header */}
          <div className="text-center pb-4 border-b border-dashed border-slate-300">
            <h2 className="text-base font-black text-slate-900">{settings.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{settings.address}</p>
            <p className="text-xs text-slate-500 font-mono">هاتف: {settings.phone}</p>
            {settings.tax_number && (
              <p className="text-[11px] text-slate-400">س.ت / ب.ض: {settings.tax_number}</p>
            )}
          </div>

          {/* Invoice Meta */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">رقم الفاتورة:</span>
              <span className="font-bold">{sale.invoice_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">التاريخ والوقت:</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">اسم العميل:</span>
              <span className="font-bold">{sale.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">المسؤول:</span>
              <span>{sale.employee_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">طريقة الدفع:</span>
              <span className="font-bold">
                {sale.payment_method === 'cash'
                  ? 'نقداً'
                  : sale.payment_method === 'card'
                  ? 'بطاقة دفع'
                  : sale.payment_method === 'bank_transfer'
                  ? 'تحويل بنكي'
                  : 'آجل / حساب'}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="py-3 border-b border-dashed border-slate-300">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[11px]">
                  <th className="text-right pb-1">الصنف</th>
                  <th className="text-center pb-1">الكمية</th>
                  <th className="text-left pb-1">السعر</th>
                  <th className="text-left pb-1">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="text-slate-800">
                    <td className="py-1.5 text-right font-sans font-medium">{item.medicine_name}</td>
                    <td className="py-1.5 text-center">{item.quantity}</td>
                    <td className="py-1.5 text-left">{item.unit_price}</td>
                    <td className="py-1.5 text-left font-bold">{item.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="py-3 border-b border-dashed border-slate-300 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">إجمالي الأصناف:</span>
              <span>{formatCurrency(sale.subtotal)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم الممنوح:</span>
                <span>-{formatCurrency(sale.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>صافي الفاتورة:</span>
              <span>{formatCurrency(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>المبلغ المدفوع:</span>
              <span>{formatCurrency(sale.paid_amount)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>المتبقي من الفاتورة:</span>
              <span className="font-bold">{formatCurrency(sale.remaining_amount)}</span>
            </div>

            {/* Customer Running Debt Details */}
            {sale.customer_id && (
              <div className="mt-2 pt-2 border-t border-slate-200 bg-slate-50 p-2 rounded-lg space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>المديونية السابقة للعميل:</span>
                  <span>{formatCurrency(previousBalance)}</span>
                </div>
                <div className="flex justify-between text-rose-700 font-black text-xs pt-1 border-t border-slate-200">
                  <span>إجمالي المديونية الحالية:</span>
                  <span>{formatCurrency(newTotalDebt)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer & Barcode Mockup */}
          <div className="pt-4 text-center">
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{settings.receipt_footer}</p>
            <div className="mt-3 flex flex-col items-center justify-center">
              <div className="h-9 w-44 bg-slate-200 rounded flex items-center justify-center font-mono text-[10px] text-slate-500 tracking-widest">
                ||||| | |||| |||||| || |
              </div>
              <span className="text-[9px] text-slate-400 mt-1">{sale.invoice_number}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between no-print">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-200 hover:bg-slate-300/80 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            إغلاق ومتابعة البيع
          </button>
        </div>
      </div>
    </div>
  );
};
