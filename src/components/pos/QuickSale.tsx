import React, { useState } from 'react';
import {
  ShoppingCart,
  User,
  Search,
  DollarSign,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';

interface QuickSaleProps {
  onBack: () => void;
}

export const QuickSale: React.FC<QuickSaleProps> = ({ onBack }) => {
  const { customers, createSale, getCustomerBalance } = usePharmacy();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer'>('cash');
  const [notes, setNotes] = useState('');
  const [completedSale, setCompletedSale] = useState<{ invoiceNumber: string; amount: number } | null>(null);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const previousBalance = selectedCustomer ? getCustomerBalance(selectedCustomer.id) : 0;

  const total = Number(totalAmount) || 0;
  const paid = paidAmount === '' ? total : Number(paidAmount);
  const remaining = Math.max(0, total - paid);
  const newTotalDebt = previousBalance + remaining;

  const filteredCustomers = customers.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  }).slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (total <= 0) {
      alert('يرجى إدخال إجمالي الفاتورة');
      return;
    }

    if (paid > total) {
      alert('المبلغ المدفوع لا يمكن أن يكون أكبر من الإجمالي');
      return;
    }

    const customerName = selectedCustomer ? selectedCustomer.name : 'عميل نقدي';

    const sale = createSale({
      customerId: selectedCustomerId || undefined,
      customerName,
      items: [],
      subtotal: total,
      discount: 0,
      totalAmount: total,
      paidAmount: paid,
      paymentMethod: remaining > 0 && paid === 0 ? 'credit' : paymentMethod,
      notes: notes.trim() || undefined,
    });

    setCompletedSale({
      invoiceNumber: sale.invoice_number,
      amount: total,
    });

    setTimeout(() => {
      setSelectedCustomerId('');
      setSearchQuery('');
      setTotalAmount('');
      setPaidAmount('');
      setNotes('');
      setCompletedSale(null);
    }, 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between bg-gradient-to-l from-blue-700 via-blue-600 to-indigo-700 p-5 rounded-3xl text-white shadow-lg">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="p-2.5 bg-white/15 rounded-2xl">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black">فاتورة سريعة</h2>
            <p className="text-xs text-blue-100 mt-0.5">تسجيل فاتورة بإجمالي يدوي بدون أصناف</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>العميل (اختياري - لو فاضي يبقى عميل نقدي)</span>
          </label>

          {selectedCustomer ? (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">{selectedCustomer.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{selectedCustomer.phone}</p>
                {previousBalance > 0 && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">
                    ⚠️ مديونية سابقة: {formatCurrency(previousBalance)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedCustomerId(''); setSearchQuery(''); }}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                تغيير
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم العميل أو رقم الهاتف..."
                className="w-full pr-10 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-400" />

              {searchQuery && filteredCustomers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCustomerId(c.id);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-2.5 text-right hover:bg-blue-50 transition-colors cursor-pointer border-b border-slate-100 last:border-0"
                    >
                      <p className="font-bold text-slate-800 text-sm">{c.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{c.phone}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              <span>إجمالي الفاتورة *</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 350"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>المبلغ المدفوع</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="اتركه فارغ لو دفع كامل"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-lg font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setPaidAmount(total)}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                دفع كامل
              </button>
              <button
                type="button"
                onClick={() => setPaidAmount(0)}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
              >
                آجل بالكامل
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-2 block">طريقة الدفع:</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', label: 'كاش' },
              { id: 'card', label: 'بطاقة' },
              { id: 'bank_transfer', label: 'تحويل' },
            ].map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => setPaymentMethod(m.id as any)}
                className={`py-2.5 rounded-2xl text-xs font-bold border transition-colors cursor-pointer ${
                  paymentMethod === m.id
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {total > 0 && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-bold text-slate-600">المتبقي من الفاتورة:</span>
              <span className={`font-black ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(remaining)}
              </span>
            </div>
            {selectedCustomer && (
              <>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">المديونية السابقة:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(previousBalance)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                  <span className="font-black text-slate-800">إجمالي المديونية الجديدة:</span>
                  <span className={`font-black text-base ${newTotalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(newTotalDebt)}
                  </span>
                </div>
              </>
            )}
          </div>
        )}

        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="ملاحظات (اختياري)..."
          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />

        <button
          type="submit"
          disabled={total <= 0}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-base font-black rounded-2xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>إتمام الفاتورة ({formatCurrency(total)})</span>
        </button>
      </form>

      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-sm w-full">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">تم حفظ الفاتورة بنجاح!</h3>
            <p className="text-sm text-slate-500 mb-1">رقم الفاتورة: <span className="font-mono font-bold text-blue-700">{completedSale.invoiceNumber}</span></p>
            <p className="text-sm text-slate-500">الإجمالي: <span className="font-bold text-slate-800">{formatCurrency(completedSale.amount)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};