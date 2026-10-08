import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { LedgerEntry } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Badge } from '../common/Badge';

interface FinancialLedgerProps {
  onSelectCustomer: (customerId: string) => void;
}

export const FinancialLedger: React.FC<FinancialLedgerProps> = ({ onSelectCustomer }) => {
  const { ledgerEntries } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'payment' | 'adjustment'>('all');

  const filteredEntries = ledgerEntries.filter(entry => {
    const q = searchQuery.toLowerCase();
    const matches =
      entry.reference_code.toLowerCase().includes(q) ||
      entry.customer_name.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.employee_name.toLowerCase().includes(q);

    if (!matches) return false;
    if (typeFilter !== 'all' && entry.entry_type !== typeFilter) return false;
    return true;
  });

  const totalDebits = filteredEntries.reduce((sum, e) => sum + e.debit, 0);
  const totalCredits = filteredEntries.reduce((sum, e) => sum + e.credit, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">دفتر الأستاذ المالي الموحد (General Ledger)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            السجل المحاسبي غير القابل للتعديل أو الحذف، يوثق كل تدفق مالي من فواتير ومقبوضات وتسويات
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة اليومية العامة</span>
        </button>
      </div>

      {/* Ledger Totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800">إجمالي مدين (قيمة المبيعات والمستحقات)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-700 mt-1 font-mono">{formatCurrency(totalDebits)}</p>
          <span className="text-[10px] text-slate-400">مجموع المبالغ المقيدة على حسابات العملاء</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">إجمالي دائن (المقبوضات والمسدد)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1 font-mono">{formatCurrency(totalCredits)}</p>
          <span className="text-[10px] text-emerald-600">مجموع المبالغ المحصلة فعلياً بالصيدلية</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <span className="text-xs font-bold text-blue-800 block">صافي الفارق المعلق (المديونية الصافية)</span>
          <p className="text-2xl font-black text-blue-700 mt-1 font-mono">
            {formatCurrency(Math.max(0, totalDebits - totalCredits))}
          </p>
          <span className="text-[10px] text-slate-400">رصيد الحسابات التراكمي في الدفتر</span>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم المعاملة، اسم العميل، البيان، أو الصيدلي المسؤول..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            جميع المعاملات
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('sale')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              typeFilter === 'sale' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            مبيعات
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('payment')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              typeFilter === 'payment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            سداد وتحصيل
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('adjustment')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              typeFilter === 'adjustment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            تسويات
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">التاريخ والوقت</th>
                <th className="py-3.5 px-4 font-bold">نوع المعاملة</th>
                <th className="py-3.5 px-4 font-bold">رقم السند المرجعي</th>
                <th className="py-3.5 px-4 font-bold">اسم العميل</th>
                <th className="py-3.5 px-4 font-bold">البيان والشرح</th>
                <th className="py-3.5 px-4 font-bold">مدين (المستحق)</th>
                <th className="py-3.5 px-4 font-bold">دائن (المسدد)</th>
                <th className="py-3.5 px-4 font-bold">الرصيد بعد الحركة</th>
                <th className="py-3.5 px-4 font-bold">المسؤول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    لا توجد قيود يومية مطابقة
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDateTime(entry.created_at)}
                    </td>
                    <td className="py-3.5 px-4">
                      {entry.entry_type === 'sale' && (
                        <Badge variant="primary">فاتورة بيع</Badge>
                      )}
                      {entry.entry_type === 'payment' && (
                        <Badge variant="success">سند تحصيل</Badge>
                      )}
                      {entry.entry_type === 'adjustment' && (
                        <Badge variant="warning">تسوية رصيد</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {entry.reference_code}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(entry.customer_id)}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        {entry.customer_name}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                      {entry.description}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600 font-mono">
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600 font-mono">
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black font-mono text-slate-900">
                      {formatCurrency(entry.balance_after)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {entry.employee_name}
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
