import React from 'react';
import {
  Search,
  Users,
  Truck,
  CalendarCheck,
  Settings,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  UserPlus,
  CreditCard,
  X,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean; // ✅ جديد
  onCloseMobile: () => void; // ✅ جديد
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const { customers } = usePharmacy();

  const customersWithDebtCount = customers.filter(c => c.current_balance > 0).length;

  const navItems = [
    { id: 'dashboard', label: 'الصفحة الرئيسية', icon: Search, highlight: true },
    { id: 'quick-sale', label: 'فاتورة سريعة', icon: ShoppingCart },
    { id: 'new-customer', label: 'إضافة عميل جديد', icon: UserPlus },
    {
      id: 'customers',
      label: 'قائمة العملاء',
      icon: Users,
      badge: customers.length > 0 ? `${customers.length}` : undefined,
      badgeColor: 'blue',
    },
    {
      id: 'debts',
      label: 'المديونيات',
      icon: CreditCard,
      badge: customersWithDebtCount > 0 ? `${customersWithDebtCount}` : undefined,
      badgeColor: 'rose',
    },
    { id: 'suppliers', label: 'المخازن والموردين', icon: Truck },
    { id: 'attendance', label: 'الحضور والغياب', icon: CalendarCheck },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ];

  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile(); // نقفل القائمة على الموبايل بعد الاختيار
  };

  return (
    <>
      {/* Overlay على الموبايل لما القائمة تكون مفتوحة */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* الـ Sidebar نفسه */}
      <aside
        className={`fixed lg:relative top-0 right-0 h-screen lg:h-auto bg-white border-l border-slate-200 flex flex-col transition-transform duration-300 z-50 lg:z-20 ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-72 ${
          isMobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* زرار إغلاق القائمة (للموبايل فقط) */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <span className="text-sm font-black text-slate-900">القائمة</span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* زرار تصغير القائمة (للكمبيوتر فقط) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden lg:flex absolute -left-3.5 top-6 w-7 h-7 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 rounded-full items-center justify-center shadow-xs cursor-pointer z-30 transition-transform"
          title={isCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : item.highlight
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    isActive
                      ? 'text-white'
                      : item.highlight
                      ? 'text-blue-600'
                      : 'text-slate-400 group-hover:text-blue-600'
                  }`}
                />

                {!isCollapsed && (
                  <span className="flex-1 text-right truncate">{item.label}</span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-black rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : item.badgeColor === 'rose'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {isCollapsed && (
                  <div className="absolute right-full mr-2 hidden lg:group-hover:block bg-slate-900 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg z-50 pointer-events-none">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {!isCollapsed && (
          <div className="p-3.5 m-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100 text-right hidden lg:block">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-slate-800">النظام متصل ويعمل</span>
            </div>
            <p className="text-[10px] text-slate-500">حفظ محلي فوري + دعم Supabase</p>
          </div>
        )}
      </aside>
    </>
  );
};