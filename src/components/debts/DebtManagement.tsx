import React, { useState } from 'react';
import {
  Scale,
  Search,
  Send,
  CreditCard,
  Eye,
  AlertTriangle,
  Printer,
  TrendingDown,
  Phone,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Customer } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';

interface DebtManagementProps {
  onSelectCustomer: (customerId: string) => void;
  onOpenRecordPayment: (customerId: string) => void;
}

export const DebtManagement: React.FC<DebtManagementProps> = ({
  onSelectCustomer,
  onOpenRecordPayment,
}) => {
  const { customers, settings } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Customers with outstanding balance
  const debtors = customers
    .filter(c => c.current_balance > 0)
    .sort((a, b) => b.current_balance - a.current_balance);

  const filteredDebtors = debtors.filter(customer => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      customer.name.toLowerCase().includes(q) ||
      customer.phone.includes(q) ||
      customer.code.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (tierFilter === 'high') return customer.current_balance >= 500;
    if (tierFilter === 'medium') return customer.current_balance >= 100 && customer.current_balance < 500;
    if (tierFilter === 'low') return customer.current_balance < 100;
    return true;
  });

  const totalDebt = debtors.reduce((sum, c) => sum + c.current_balance, 0);
  const highDebtCount = debtors.filter(c => c.current_balance >= 500).length;

  const handleWhatsAppReminder = (customer: Customer) => {
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `السلام عليكم أستاذ ${customer.name}، تحية طيبة من ${settings.name}.\nنود تذكير سيادتكم بلطف بوجود رصيد متبقي على حسابكم بقيمة ${customer.current_balance} ج.م.\nشاكرين لتعاونكم وثقتكم بنا!`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const handlePrintDebts = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">إدارة مديونيات العملاء والتحصيل</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة الحسابات المعلقة، تذكيرات السداد الآلي عبر واتساب، وكشوفات الحساب الجارية
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrintDebts}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>طباعة كشف المديونيات</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-gradient-to-l from-rose-600 to-rose-700 rounded-2xl text-white shadow-md">
          <span className="text-xs font-semibold text-rose-100 block">إجمالي أموال الصيدلية لدى العملاء</span>
          <p className="text-3xl font-black mt-1 font-mono">{formatCurrency(totalDebt)}</p>
          <span className="text-[11px] text-rose-200 mt-1 block">{debtors.length} عملاء عليهم مديونيات</span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-amber-200 shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs font-bold">مديونيات مرتفعة (≥ 500 ج.م)</span>
          </div>
          <p className="text-2xl font-black text-amber-700">{highDebtCount} عميل</p>
          <p className="text-[11px] text-slate-400 mt-1">يوصى بالمتابعة والتذكير العاجل</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 block mb-1">متوسط مديونية العميل</span>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(debtors.length > 0 ? totalDebt / debtors.length : 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">لكل عميل عليه حساب مفتوح</p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم العميل أو رقم الهاتف..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setTierFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              tierFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            جميع المديونيات ({debtors.length})
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('high')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              tierFilter === 'high' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            مرتفعة (≥ 500)
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('medium')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              tierFilter === 'medium' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            متوسطة (100 - 500)
          </button>
          <button
            type="button"
            onClick={() => setTierFilter('low')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              tierFilter === 'low' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            بسيطة (&lt; 100)
          </button>
        </div>
      </div>

      {/* Debtors List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">العميل</th>
                <th className="py-3.5 px-4 font-bold">رقم الهاتف</th>
                <th className="py-3.5 px-4 font-bold">المديونية المستحقة</th>
                <th className="py-3.5 px-4 font-bold">إجمالي المشتريات</th>
                <th className="py-3.5 px-4 font-bold">إجمالي ما سدده</th>
                <th className="py-3.5 px-4 font-bold">ملاحظات الحساب</th>
                <th className="py-3.5 px-4 font-bold text-center">إجراءات السداد والتذكير</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebtors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    لا توجد مديونيات مسجلة مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredDebtors.map(customer => (
                  <tr key={customer.id} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onSelectCustomer(customer.id)}
                        className="font-bold text-slate-900 hover:text-blue-600 hover:underline text-sm cursor-pointer"
                      >
                        {customer.name}
                      </button>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {customer.code}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {customer.phone}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block font-mono">
                        {formatCurrency(customer.current_balance)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(customer.total_purchased)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      {formatCurrency(customer.total_paid)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                      {customer.notes || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* WhatsApp reminder */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppReminder(customer)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                          title="إرسال رسالة تذكير عبر واتساب"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>تذكير واتساب</span>
                        </button>

                        {/* Record Payment */}
                        <button
                          type="button"
                          onClick={() => onOpenRecordPayment(customer.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>سداد دين</span>
                        </button>

                        {/* Customer profile */}
                        <button
                          type="button"
                          onClick={() => onSelectCustomer(customer.id)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="عرض كشف الحساب والملف الكامل"
                        >
                          <Eye className="w-4 h-4" />
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
