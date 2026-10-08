import React from 'react';
import {
  UserPlus,
  Users,
  CreditCard,
  Search,
  Truck,
  CalendarCheck,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

interface DashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab }) => {
  const { customers } = usePharmacy();
  const customersWithDebt = customers.filter(c => c.current_balance > 0).length;

  const cards = [
    {
      id: 'quick-sale',
      title: 'فاتورة سريعة',
      subtitle: 'تسجيل بيع بإجمالي يدوي',
      icon: ShoppingCart,
      color: 'blue',
      badge: null,
    },
    {
      id: 'new-customer',
      title: 'إضافة عميل جديد',
      subtitle: 'تسجيل عميل جديد',
      icon: UserPlus,
      color: 'emerald',
      badge: null,
    },
    {
      id: 'customers',
      title: 'قائمة العملاء',
      subtitle: 'كل العملاء والبحث',
      icon: Users,
      color: 'indigo',
      badge: customers.length > 0 ? `${customers.length}` : null,
    },
    {
      id: 'debts',
      title: 'المديونيات',
      subtitle: 'متابعة العملاء اللي عليهم فلوس',
      icon: CreditCard,
      color: 'rose',
      badge: customersWithDebt > 0 ? `${customersWithDebt}` : null,
    },
    {
      id: 'suppliers',
      title: 'المخازن والموردين',
      subtitle: 'فواتير الشراء والمدفوعات',
      icon: Truck,
      color: 'slate',
      badge: null,
    },
    {
      id: 'attendance',
      title: 'الحضور والغياب',
      subtitle: 'سجل الموظفين والمرتبات',
      icon: CalendarCheck,
      color: 'teal',
      badge: null,
    },
    {
      id: 'settings',
      title: 'الإعدادات',
      subtitle: 'بيانات الصيدلية والنظام',
      icon: Settings,
      color: 'slate',
      badge: null,
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    blue: { bg: 'bg-blue-50 hover:bg-blue-100', text: 'text-blue-700', border: 'border-blue-200 hover:border-blue-400', badge: 'bg-blue-600' },
    indigo: { bg: 'bg-indigo-50 hover:bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200 hover:border-indigo-400', badge: 'bg-indigo-600' },
    emerald: { bg: 'bg-emerald-50 hover:bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200 hover:border-emerald-400', badge: 'bg-emerald-600' },
    rose: { bg: 'bg-rose-50 hover:bg-rose-100', text: 'text-rose-700', border: 'border-rose-200 hover:border-rose-400', badge: 'bg-rose-600' },
    slate: { bg: 'bg-slate-50 hover:bg-slate-100', text: 'text-slate-700', border: 'border-slate-200 hover:border-slate-400', badge: 'bg-slate-600' },
    teal: { bg: 'bg-teal-50 hover:bg-teal-100', text: 'text-teal-700', border: 'border-teal-200 hover:border-teal-400', badge: 'bg-teal-600' },
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-blue-700 via-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-lg shadow-blue-500/15">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black">
              أهلاً بك في نظام إدارة الصيدلية
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
              اضغط على أي كارت للانتقال إلى الصفحة المطلوبة
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateTab('customers')}
          className="w-full flex items-center justify-between px-4 py-3 bg-white/95 hover:bg-white text-slate-800 rounded-2xl shadow-md transition-all cursor-pointer group mt-2"
        >
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-bold">ابحث باسم المريض أو رقم الهاتف...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] text-slate-500 font-mono">
            Ctrl + K
          </kbd>
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          const colors = colorClasses[card.color];

          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onNavigateTab(card.id)}
              className={`relative p-5 rounded-3xl border-2 ${colors.bg} ${colors.border} transition-all cursor-pointer text-right group hover:shadow-lg hover:-translate-y-0.5`}
            >
              {card.badge && (
                <span className={`absolute top-3 left-3 ${colors.badge} text-white text-[10px] font-black px-2 py-0.5 rounded-full min-w-[22px] text-center`}>
                  {card.badge}
                </span>
              )}

              <div className="flex flex-col items-start gap-3">
                <div className={`w-14 h-14 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-7 h-7 ${colors.text}`} />
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900 mb-0.5">
                    {card.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {card.subtitle}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};