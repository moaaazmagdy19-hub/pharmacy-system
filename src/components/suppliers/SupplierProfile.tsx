import React, { useState } from 'react';
import {
  Truck,
  Phone,
  MapPin,
  ArrowRight,
  ShoppingCart,
  CreditCard,
  FileText,
  Printer,
  DollarSign,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Badge } from '../common/Badge';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';

interface SupplierProfileProps {
  supplierId: string;
  onBack: () => void;
}

export const SupplierProfile: React.FC<SupplierProfileProps> = ({
  supplierId,
  onBack,
}) => {
  const {
    suppliers,
    purchaseInvoices,
    supplierPayments,
    getSupplierBalance,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments'>('invoices');
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const supplier = suppliers.find(s => s.id === supplierId);

  if (!supplier) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">لم يتم العثور على المورد المطلوب</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          العودة لقائمة الموردين
        </button>
      </div>
    );
  }

  const balance = getSupplierBalance(supplierId);

  const supplierInvoices = purchaseInvoices
    .filter(inv => inv.supplier_id === supplierId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const supplierPays = supplierPayments
    .filter(p => p.supplier_id === supplierId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalPurchased = supplierInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = supplierPays.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 lg:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={onBack}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer mt-1"
            >
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
              <Truck className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">{supplier.name}</h2>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                {supplier.phone && (
                  <span className="flex items-center gap-1 font-mono text-slate-700 font-bold">
                    <Phone className="w-3.5 h-3.5 text-blue-600" />
                    {supplier.phone}
                  </span>
                )}
                {supplier.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {supplier.address}
                  </span>
                )}
              </div>
              {supplier.notes && (
                <p className="text-xs text-slate-500 mt-2 italic">{supplier.notes}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none px-5 py-3 rounded-2xl border text-center ${
              balance > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 block mb-0.5">المديونية الحالية</span>
              <span className={`text-xl font-black block ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(balance)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>فاتورة شراء جديدة</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                disabled={balance <= 0}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>تسجيل دفعة سداد</span>
              </button>
            </div>
          </div>
        </div>

        {/* Small Stats Bar */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="text-slate-500">
              إجمالي المشتريات: <span className="font-black text-slate-800">{formatCurrency(totalPurchased)}</span>
            </span>
            <span className="text-slate-500">
              إجمالي المسدد: <span className="font-black text-emerald-700">{formatCurrency(totalPaid)}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3 h-3" />
            <span>طباعة كشف الحساب</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'invoices'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>فواتير الشراء ({supplierInvoices.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>سجل المدفوعات ({supplierPays.length})</span>
        </button>
      </div>

      {/* Tab 1: Invoices */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم الفاتورة</th>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">الإجمالي</th>
                  <th className="py-3 px-4 font-bold">المدفوع</th>
                  <th className="py-3 px-4 font-bold">المتبقي</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد فواتير شراء مسجلة
                    </td>
                  </tr>
                ) : (
                  supplierInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(inv.invoice_date)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(inv.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatCurrency(inv.paid_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        {inv.remaining_amount > 0 ? formatCurrency(inv.remaining_amount) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {inv.payment_status === 'paid' && <Badge variant="success">مدفوعة</Badge>}
                        {inv.payment_status === 'partial' && <Badge variant="warning">جزئي</Badge>}
                        {inv.payment_status === 'unpaid' && <Badge variant="danger">آجلة</Badge>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم السند</th>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">المبلغ</th>
                  <th className="py-3 px-4 font-bold">طريقة الدفع</th>
                  <th className="py-3 px-4 font-bold">الرصيد قبل</th>
                  <th className="py-3 px-4 font-bold">الرصيد بعد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supplierPays.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      لا توجد مدفوعات مسجلة
                    </td>
                  </tr>
                ) : (
                  supplierPays.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {p.payment_code}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(p.created_at)}
                      </td>
                      <td className="py-3.5 px-4 font-black text-emerald-700">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {p.payment_method === 'cash' ? 'كاش' : p.payment_method === 'card' ? 'بطاقة' : 'تحويل'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-rose-600">
                        {formatCurrency(p.previous_balance)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700">
                        {formatCurrency(p.new_balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PurchaseInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        preselectedSupplierId={supplierId}
      />

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedSupplierId={supplierId}
      />
    </div>
  );
};