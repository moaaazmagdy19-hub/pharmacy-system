import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, DollarSign, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplierId?: string;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplierId,
}) => {
  const { suppliers, getSupplierBalance, recordSupplierPayment } = usePharmacy();

  const [supplierId, setSupplierId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');

  const selectedSupplier = suppliers.find(s => s.id === supplierId);
  const currentBalance = supplierId ? getSupplierBalance(supplierId) : 0;
  const newBalance = Math.max(0, currentBalance - (Number(amount) || 0));

  useEffect(() => {
    if (isOpen) {
      setSupplierId(preselectedSupplierId || '');
      setAmount('');
      setPaymentMethod('cash');
      setNotes('');
    }
  }, [isOpen, preselectedSupplierId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      alert('يرجى اختيار المورد');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('يرجى إدخال مبلغ السداد');
      return;
    }
    if (Number(amount) > currentBalance) {
      alert('المبلغ أكبر من المديونية الحالية للمورد!');
      return;
    }

    recordSupplierPayment({
      supplierId,
      amount: Number(amount),
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل دفعة سداد للمورد"
      subtitle="سداد جزء أو كل المديونية المستحقة للمورد"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            <span>المورد *</span>
          </label>
          <select
            required
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            disabled={!!preselectedSupplierId}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60"
          >
            <option value="">اختر المورد...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} — مديونية: {getSupplierBalance(s.id)} ج.م
              </option>
            ))}
          </select>
        </div>

        {/* عرض الرصيد الحالي */}
        {supplierId && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-sm">
            <span className="font-bold text-rose-800">الرصيد الحالي المستحق:</span>
            <span className="font-black text-rose-700 text-lg">
              {formatCurrency(currentBalance)}
            </span>
          </div>
        )}

        {/* المبلغ */}
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>المبلغ المسدد *</span>
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="مثال: 500"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
          {supplierId && currentBalance > 0 && (
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setAmount(currentBalance)}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                سداد كامل المبلغ
              </button>
              <button
                type="button"
                onClick={() => setAmount(Math.floor(currentBalance / 2))}
                className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
              >
                سداد النصف
              </button>
            </div>
          )}
        </div>

        {/* عرض الرصيد الجديد */}
        {supplierId && Number(amount) > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-sm">
            <span className="font-bold text-emerald-800">الرصيد بعد السداد:</span>
            <span className="font-black text-emerald-700 text-lg">
              {formatCurrency(newBalance)}
            </span>
          </div>
        )}

        {/* طريقة الدفع */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">طريقة الدفع:</label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              كاش
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                paymentMethod === 'card'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              بطاقة
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                paymentMethod === 'bank_transfer'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-700 border-slate-200'
              }`}
            >
              تحويل
            </button>
          </div>
        </div>

        {/* ملاحظات */}
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>ملاحظات (اختياري)</span>
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: سداد جزء من فاتورة..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* الأزرار */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            تأكيد السداد
          </button>
        </div>
      </form>
    </Modal>
  );
};