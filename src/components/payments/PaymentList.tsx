import React, { useState } from 'react';
import {
  CreditCard,
  Search,
  Plus,
  ArrowDownLeft,
  Calendar,
  User,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Payment } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Badge } from '../common/Badge';

interface PaymentListProps {
  onOpenRecordPayment: () => void;
  onSelectCustomer: (customerId: string) => void;
}

export const PaymentList: React.FC<PaymentListProps> = ({
  onOpenRecordPayment,
  onSelectCustomer,
}) => {
  const { payments } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'all' | 'cash' | 'card' | 'bank_transfer'>('all');

  const filtered = payments.filter(p => {
    const q = searchQuery.toLowerCase();
    const matches =
      p.payment_code.toLowerCase().includes(q) ||
      p.customer_name.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    if (!matches) return false;
    if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
    return true;
  });

  const totalCollected = filtered.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">سجل المدفوعات وسندات التحصيل</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل كافة المبالغ المستلمة من العملاء لسداد ديونهم مع أرصدة الحساب قبل وبعد السداد
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenRecordPayment}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل دفعة سداد جديدة</span>
        </button>
      </div>

      {/* KPI */}
      <div className="p-5 bg-gradient-to-l from-emerald-600 to-teal-700 rounded-2xl text-white shadow-md flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-emerald-100 block">إجمالي المقبوضات المعروضة</span>
          <p className="text-3xl font-black mt-1 font-mono">{formatCurrency(totalCollected)}</p>
        </div>
        <div className="text-left text-xs text-emerald-100 font-medium">
          {filtered.length} سند قبض مسجل
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم السند، اسم العميل، أو الملاحظات..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setMethodFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              methodFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            جميع الطرق
          </button>
          <button
            type="button"
            onClick={() => setMethodFilter('cash')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              methodFilter === 'cash' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            كاش (نقداً)
          </button>
          <button
            type="button"
            onClick={() => setMethodFilter('bank_transfer')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              methodFilter === 'bank_transfer' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            إنستاباي / تحويل
          </button>
          <button
            type="button"
            onClick={() => setMethodFilter('card')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              methodFilter === 'card' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            بطاقة فيزا
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">رقم السند</th>
                <th className="py-3.5 px-4 font-bold">التاريخ والوقت</th>
                <th className="py-3.5 px-4 font-bold">اسم العميل</th>
                <th className="py-3.5 px-4 font-bold">طريقة السداد</th>
                <th className="py-3.5 px-4 font-bold">المبلغ المسدد</th>
                <th className="py-3.5 px-4 font-bold">الرصيد قبل السداد</th>
                <th className="py-3.5 px-4 font-bold">الرصيد بعد السداد</th>
                <th className="py-3.5 px-4 font-bold">المسؤول</th>
                <th className="py-3.5 px-4 font-bold">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد سندات سداد مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                      {p.payment_code}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDateTime(p.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(p.customer_id)}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        {p.customer_name}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="info">
                        {p.payment_method === 'cash'
                          ? 'نقداً'
                          : p.payment_method === 'bank_transfer'
                          ? 'إنستاباي'
                          : 'بطاقة'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {formatCurrency(p.previous_balance)}
                    </td>
                    <td className="py-3.5 px-4 font-black font-mono text-slate-900">
                      {formatCurrency(p.new_balance)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.employee_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {p.notes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
