import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Calendar,
  Eye,
  Filter,
  ArrowUpDown,
  ShoppingBag,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/formatters';
import { Badge } from '../common/Badge';
import { ReceiptModal } from '../pos/ReceiptModal';

interface SalesListProps {
  onOpenNewSale: () => void;
}

export const SalesList: React.FC<SalesListProps> = ({ onOpenNewSale }) => {
  const { sales, doctors } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const now = new Date();

  const filteredSales = sales.filter(sale => {
    const q = searchQuery.toLowerCase();
    const matches =
      sale.invoice_number.toLowerCase().includes(q) ||
      sale.customer_name.toLowerCase().includes(q) ||
      sale.items.some(i => i.medicine_name.toLowerCase().includes(q));

    if (!matches) return false;

    if (statusFilter !== 'all' && sale.payment_status !== statusFilter) return false;

    if (dateFilter !== 'all') {
      const saleDate = new Date(sale.created_at);
      if (dateFilter === 'today') {
        if (saleDate.toDateString() !== now.toDateString()) return false;
      } else if (dateFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < weekAgo) return false;
      } else if (dateFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (saleDate < monthAgo) return false;
      }
    }

    return true;
  });

  const totalSalesAmount = filteredSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalPaidAmount = filteredSales.reduce((sum, s) => sum + s.paid_amount, 0);
  const totalRemainingAmount = filteredSales.reduce((sum, s) => sum + s.remaining_amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">سجل فواتير المبيعات</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            سجل مالي متكامل وغير قابل للحذف، يوضح تفاصيل كل عملية بيع والمدفوع والآجل منها
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewSale}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>عملية بيع جديدة (POS)</span>
        </button>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">إجمالي قيمة الفواتير المعروضة</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalSalesAmount)}</p>
          <span className="text-[10px] text-slate-400">{filteredSales.length} فاتورة</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-bold text-emerald-800">إجمالي النقد المحصل</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{formatCurrency(totalPaidAmount)}</p>
          <span className="text-[10px] text-emerald-600">سداد فوري بنقطة البيع</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-xs font-bold text-rose-700">إجمالي المتبقي (آجل على الحساب)</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(totalRemainingAmount)}</p>
          <span className="text-[10px] text-rose-600">أضيفت لمديونيات العملاء</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الفاتورة، اسم العميل، أو اسم الدواء..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setDateFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('today')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'today' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              اليوم
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('week')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('month')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                dateFilter === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              آخر 30 يوماً
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">جميع الحالات</option>
            <option value="paid">مدفوعة بالكامل</option>
            <option value="partial">مدفوعة جزئياً</option>
            <option value="unpaid">آجلة بالكامل</option>
          </select>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">رقم الفاتورة</th>
                <th className="py-3.5 px-4 font-bold">التاريخ والوقت</th>
                <th className="py-3.5 px-4 font-bold">اسم العميل</th>
                <th className="py-3.5 px-4 font-bold">الأدوية</th>
                <th className="py-3.5 px-4 font-bold">طريقة الدفع</th>
                <th className="py-3.5 px-4 font-bold">إجمالي الفاتورة</th>
                <th className="py-3.5 px-4 font-bold">المدفوع</th>
                <th className="py-3.5 px-4 font-bold">المتبقي (آجل)</th>
                <th className="py-3.5 px-4 font-bold">حالة السداد</th>
                <th className="py-3.5 px-4 font-bold text-center">الإيصال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    لا توجد فواتير مطابقة
                  </td>
                </tr>
              ) : (
                filteredSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                      {sale.invoice_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatDateTime(sale.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {sale.customer_name}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                      {sale.items.map(i => `${i.medicine_name} (${i.quantity})`).join('، ')}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {sale.payment_method === 'cash'
                        ? 'كاش'
                        : sale.payment_method === 'card'
                        ? 'بطاقة دفع'
                        : sale.payment_method === 'bank_transfer'
                        ? 'إنستاباي'
                        : 'آجل'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {formatCurrency(sale.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatCurrency(sale.paid_amount)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">
                      {sale.remaining_amount > 0 ? formatCurrency(sale.remaining_amount) : '0.00 ج.م'}
                    </td>
                    <td className="py-3.5 px-4">
                      {sale.payment_status === 'paid' && (
                        <Badge variant="success">مدفوعة</Badge>
                      )}
                      {sale.payment_status === 'partial' && (
                        <Badge variant="warning">جزئي</Badge>
                      )}
                      {sale.payment_status === 'unpaid' && (
                        <Badge variant="danger">آجل</Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedSaleForReceipt(sale)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedSaleForReceipt && (
        <ReceiptModal
          isOpen={Boolean(selectedSaleForReceipt)}
          onClose={() => setSelectedSaleForReceipt(null)}
          sale={selectedSaleForReceipt}
        />
      )}
    </div>
  );
};
