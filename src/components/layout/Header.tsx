import React, { useState } from 'react';
import {
  Search,
  Plus,
  Bell,
  UserCheck,
  Shield,
  User,
  ShoppingBag,
  UserPlus,
  Pill,
  FileText,
  CreditCard,
  CheckCircle,
  Menu,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatDateTime } from '../../lib/formatters';

interface HeaderProps {
  onOpenGlobalSearch: () => void;
  onOpenNewSale: () => void;
  onOpenNewCustomer: () => void;
  onOpenNewMedicine: () => void;
  onOpenNewPrescription: () => void;
  onOpenRecordPayment: () => void;
  onNavigateTab: (tab: string) => void;
  onToggleMobileMenu: () => void; // ✅ جديد
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGlobalSearch,
  onOpenNewSale,
  onOpenNewCustomer,
  onOpenNewMedicine,
  onOpenNewPrescription,
  onOpenRecordPayment,
  onNavigateTab,
  onToggleMobileMenu,
}) => {
  const { currentUser, switchRole, notifications, markNotificationRead, markAllNotificationsRead, settings } = usePharmacy();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 lg:px-8 py-3 transition-all">
      <div className="flex items-center justify-between gap-2 lg:gap-4">
        
        {/* ✅ اليمين: زرار القائمة (للموبايل) + اللوجو + البحث */}
        <div className="flex items-center gap-2 lg:gap-6 flex-1 max-w-2xl">
          
          {/* Hamburger Menu Button (للموبايل فقط) */}
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="القائمة"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateTab('dashboard')}>
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <svg className="w-5 h-5 lg:w-6 lg:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M2 12h20M7 7l10 10M17 7l-10 10"/>
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm lg:text-base font-black tracking-tight text-slate-900 leading-tight">
                {settings.name}
              </h1>
              <p className="text-[10px] lg:text-[11px] font-medium text-blue-600">نظام إدارة الصيدلية</p>
            </div>
          </div>

          {/* البحث - يظهر على الشاشات المتوسطة والكبيرة */}
          <div className="relative flex-1 hidden md:block">
            <button
              type="button"
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-right text-xs text-slate-500 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                <span className="font-semibold">ابحث باسم المريض أو رقم الهاتف...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[10px] text-slate-400 font-mono">
                Ctrl + K
              </kbd>
            </button>
          </div>
        </div>

        {/* ✅ الشمال: الإجراءات الأساسية */}
        <div className="flex items-center gap-1 lg:gap-2">
          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={onOpenGlobalSearch}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title="بحث"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Primary Quick Sale Button */}
          <button
            type="button"
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/25 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">بيع جديد</span>
          </button>

          {/* Quick Actions */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowQuickActions(!showQuickActions);
                setShowNotifications(false);
                setShowUserMenu(false);
              }}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="إجراءات سريعة"
            >
              <Plus className="w-5 h-5" />
            </button>

            {showQuickActions && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickActions(false);
                    onOpenNewCustomer();
                  }}
                  className="w-full px-4 py-2.5 text-right text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>تسجيل عميل جديد</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuickActions(false);
                    onOpenRecordPayment();
                  }}
                  className="w-full px-4 py-2.5 text-right text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  <span>تسجيل دفعة سداد دين</span>
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowQuickActions(false);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="التنبيهات"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">مركز التنبيهات</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs text-blue-600 hover:underline cursor-pointer"
                    >
                      تحديد الكل كمقروء
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      لا توجد تنبيهات حالياً
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          markNotificationRead(n.id);
                          if (n.link_tab) {
                            onNavigateTab(n.link_tab);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-3 ${
                          !n.is_read ? 'bg-blue-50/40' : ''
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            n.severity === 'danger'
                              ? 'bg-rose-500'
                              : n.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800">{n.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {formatDateTime(n.created_at)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
                setShowQuickActions(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                {currentUser.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500">{currentUser.email || 'حساب الصيدلية'}</p>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-bold text-slate-400 px-2 py-1">تبديل صلاحية المستخدم:</p>
                  <button
                    type="button"
                    onClick={() => {
                      switchRole('admin');
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-right text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      currentUser.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span>مدير الصيدلية</span>
                    </div>
                    {currentUser.role === 'admin' && <CheckCircle className="w-4 h-4 text-blue-600" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      switchRole('employee');
                      setShowUserMenu(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-right text-xs font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      currentUser.role === 'employee' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      <span>صيدلي مناوب</span>
                    </div>
                    {currentUser.role === 'employee' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};