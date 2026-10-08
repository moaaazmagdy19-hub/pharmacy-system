import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Eye,
  CreditCard,
  ShoppingBag,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Customer } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface CustomerListProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenNewCustomer: () => void;
  onOpenNewSale: (customerId: string) => void;
  onOpenRecordPayment: (customerId: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onSelectCustomer,
  onOpenNewCustomer,
  onOpenNewSale,
  onOpenRecordPayment,
}) => {
  const { customers } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [debtFilter, setDebtFilter] = useState<'all' | 'with_debt' | 'no_debt'>('all');
  const [sortBy, setSortBy] = useState<'debt_desc' | 'name' | 'newest'>('debt_desc');

  // Filter & Search
  const filtered = customers.filter(customer => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(q) ||
      customer.phone.includes(q) ||
      customer.code.toLowerCase().includes(q) ||
      (customer.address && customer.address.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (debtFilter === 'with_debt') return customer.current_balance > 0;
    if (debtFilter === 'no_debt') return customer.current_balance <= 0;
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'debt_desc') return b.current_balance - a.current_balance;
    if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return 0;
  });

  const totalOutstandingDebt = customers.reduce((sum, c) => sum + c.current_balance, 0);
  const customersWithDebtCount = customers.filter(c => c.current_balance > 0).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">سجل وحسابات العملاء</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            إدارة بيانات العملاء، تتبع المديونيات الآجلة، واستعراض السجل الطبي والمالي لكل عميل
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewCustomer}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>تسجيل عميل جديد</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">إجمالي عدد العملاء</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{customers.length} عميل</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs">
          <span className="text-xs font-bold text-rose-700">العملاء ذوو المديونية</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{customersWithDebtCount} عميل</p>
        </div>
        <div className="p-4 bg-white rounded-2xl border border-blue-200 bg-blue-50/30 shadow-xs">
          <span className="text-xs font-bold text-blue-700">إجمالي المديونيات المستحقة</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{formatCurrency(totalOutstandingDebt)}</p>
        </div>
      </div>

      {/* Controls Bar: Search, Filter, Sort */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، أو كود العميل..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Debt Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setDebtFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                debtFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الكل ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setDebtFilter('with_debt')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                debtFilter === 'with_debt' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              عليهم دين ({customersWithDebtCount})
            </button>
            <button
              type="button"
              onClick={() => setDebtFilter('no_debt')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                debtFilter === 'no_debt' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              خالصين ({customers.length - customersWithDebtCount})
            </button>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="debt_desc">المديونية (الأعلى أولاً)</option>
              <option value="name">الاسم (أبجدياً)</option>
              <option value="newest">الأحدث تسجيلاً</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">كود العميل</th>
                <th className="py-3.5 px-4 font-bold">اسم العميل</th>
                <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                <th className="py-3.5 px-4 font-bold">العنوان</th>
                <th className="py-3.5 px-4 font-bold">المديونية الحالية</th>
                <th className="py-3.5 px-4 font-bold">إجمالي المشتريات</th>
                <th className="py-3.5 px-4 font-bold">إجمالي المسدد</th>
                <th className="py-3.5 px-4 font-bold text-center">إجراءات سريعة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لم يتم العثور على أي عملاء تطابق معايير البحث
                  </td>
                </tr>
              ) : (
                sorted.map(customer => (
                  <tr
                    key={customer.id}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    onClick={() => onSelectCustomer(customer.id)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      {customer.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                      {customer.notes && (
                        <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {customer.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                      {customer.phone}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {customer.address || '—'}
                    </td>
                    <td className="py-3.5 px-4 font-black">
                      {customer.current_balance > 0 ? (
                        <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          {formatCurrency(customer.current_balance)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 font-semibold">
                          0.00 ج.م (خالص)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(customer.total_purchased)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-700">
                      {formatCurrency(customer.total_paid)}
                    </td>
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(customer.id)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="عرض الملف الكامل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenRecordPayment(customer.id)}
                          className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          title="تسجيل سداد دين"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenNewSale(customer.id)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="عملية بيع سريعة للعميل"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
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
