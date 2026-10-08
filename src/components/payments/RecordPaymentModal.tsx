import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, User, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCustomerId?: string;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  initialCustomerId,
}) => {
  const { customers, recordPayment } = usePharmacy();
  const [customerId, setCustomerId] = useState(initialCustomerId || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialCustomerId) {
      setCustomerId(initialCustomerId);
    }
  }, [initialCustomerId, isOpen]);

  const selectedCustomer = customers.find(c => c.id === customerId);
  const currentDebt = selectedCustomer ? selectedCustomer.current_balance : 0;
  const numAmount = amount === '' ? 0 : Number(amount);
  const newDebt = Math.max(0, currentDebt - numAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      alert('يرجى اختيار العميل');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('يرجى إدخال مبلغ سداد صحيح أكبر من الصفر');
      return;
    }

    recordPayment({
      customerId,
      amount: Number(amount),
      paymentMethod,
      notes: notes.trim() || undefined,
    });

    onClose();
    setAmount('');
    setNotes('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل دفعة سداد دين / تحصيل"
      subtitle="إثبات سداد نقدي أو إلكتروني وتخفيض مديونية العميل في دفتر الأستاذ"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            تأكيد تسجيل السند
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Select */}
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>العميل المسدد *</span>
          </label>
          <select
            required
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">اختر العميل...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.phone}) {c.current_balance > 0 ? `— مديونية: ${c.current_balance} ج.م` : '— خالص'}
              </option>
            ))}
          </select>
        </div>

        {/* Customer Debt Status Card */}
        {selectedCustomer && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>المديونية الحالية المستحقة:</span>
              <span className="font-bold text-rose-600 text-sm">
                {formatCurrency(currentDebt)}
              </span>
            </div>
            {currentDebt === 0 && (
              <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                تنبيه: العميل ليس عليه مديونية حالياً، أي سداد سيعتبر رصيداً دائناً له.
              </p>
            )}
          </div>
        )}

        {/* Amount */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              <span>المبلغ المسدد (ج.م) *</span>
            </label>
            {currentDebt > 0 && (
              <button
                type="button"
                onClick={() => setAmount(currentDebt)}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                سداد كامل المديونية ({currentDebt} ج.م)
              </button>
            )}
          </div>
          <input
            type="number"
            min="1"
            step="1"
            required
            value={amount}
            onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="مثال: 250"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:border-blue-500 text-left"
          />
        </div>

        {/* Running Balance Simulation */}
        {selectedCustomer && (
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600">
              <span>الرصيد قبل السداد:</span>
              <span className="font-bold font-mono">{formatCurrency(currentDebt)}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-bold">
              <span>المبلغ المسدد:</span>
              <span className="font-mono">-{formatCurrency(numAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-blue-200">
              <span>الرصيد المتبقي الجديد:</span>
              <span className="font-mono text-blue-700">{formatCurrency(newDebt)}</span>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            طريقة التحصيل *
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                paymentMethod === 'cash'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              نقداً (كاش)
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('bank_transfer')}
              className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                paymentMethod === 'bank_transfer'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              إنستاباي / محفظة
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`py-2 rounded-xl font-bold border transition-colors cursor-pointer ${
                paymentMethod === 'card'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              بطاقة دفع
            </button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            ملاحظات السند (اختياري)
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: سداد عبر تطبيق InstaPay، استلمها بالصيدلية..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
};
