import React, { useState } from 'react';
import {
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Receipt,
  Pill,
  Clock,
  Printer,
  Plus,
  Send,
  Edit,
  ShieldAlert,
  FileText,
  AlertCircle,
  X,
  HeartPulse,
  Stethoscope,
} from 'lucide-react';
import { Customer, Sale } from '../../types';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency, formatDateTime, formatDate } from '../../lib/formatters';
import { Badge } from '../common/Badge';
import { ReceiptModal } from '../pos/ReceiptModal';

interface CustomerProfileProps {
  customerId: string;
  onBack: () => void;
  onOpenNewSaleForCustomer: (customerId: string) => void;
  onOpenRecordPayment: (customerId: string) => void;
  onEditCustomer: (customer: Customer) => void;
  onAddMedicineToCart: (customerId: string, medicineId: string) => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({
  customerId,
  onBack,
  onOpenNewSaleForCustomer,
  onOpenRecordPayment,
  onEditCustomer,
  onAddMedicineToCart,
}) => {
  const {
    customers,
    sales,
    ledgerEntries,
    doctors,
    prescriptions,
    getCustomerMedicineHistory,
    customerMedicalAlerts,
    addMedicalAlert,
    deleteMedicalAlert,
  } = usePharmacy();

  const [activeTab, setActiveTab] = useState<'purchases' | 'medicines' | 'ledger'>('purchases');
  const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<Sale | null>(null);

  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertType, setAlertType] = useState<'allergy' | 'contraindication' | 'medical_note' | 'injection_note' | 'other'>('allergy');
  const [alertText, setAlertText] = useState('');

  const customer = customers.find(c => c.id === customerId);

  if (!customer) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
        <p className="text-slate-500 text-sm">لم يتم العثور على العميل المطلوب</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
        >
          العودة لقائمة العملاء
        </button>
      </div>
    );
  }

  const customerAlerts = customerMedicalAlerts.filter(a => a.customer_id === customerId);

  const customerSales = sales
    .filter(s => s.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const customerLedger = ledgerEntries
    .filter(l => l.customer_id === customerId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const medicineHistory = getCustomerMedicineHistory(customerId);

  const handleSendWhatsAppReminder = () => {
    if (customer.current_balance <= 0) {
      alert('العميل ليس عليه أي مديونية مستحقة!');
      return;
    }
    const cleanPhone = customer.phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('0') ? `2${cleanPhone}` : cleanPhone;
    const message = encodeURIComponent(
      `مرحباً أستاذ ${customer.name}، تحية طيبة من صيدلية الشفاء التخصصية.\nنود تذكير سيادتكم بأن الرصيد المتبقي على حسابكم هو ${customer.current_balance} ج.م.\nشاكرين لتعاملكم الدائم معنا!`
    );
    window.open(`https://wa.me/${phoneWithCountry}?text=${message}`, '_blank');
  };

  const handlePrintStatement = () => {
    window.print();
  };

  const handleSaveAlert = () => {
    if (!alertText.trim()) {
      alert('يرجى كتابة نص التنبيه الطبي');
      return;
    }

    addMedicalAlert({
      customer_id: customer.id,
      alert_type: alertType,
      alert_text: alertText.trim(),
      created_by: 'د. أحمد (مدير الصيدلية)',
    });

    setAlertText('');
    setAlertType('allergy');
    setIsAlertModalOpen(false);
  };

  const handleDeleteAlert = (alertId: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا التنبيه الطبي؟')) {
      deleteMedicalAlert(alertId);
    }
  };

  const alertTypeLabels: Record<string, string> = {
    allergy: 'حساسية',
    contraindication: 'ممنوع استخدام',
    medical_note: 'ملاحظة طبية',
    injection_note: 'ملاحظة حقن',
    other: 'أخرى',
  };

  return (
    <div className="space-y-6">
      {/* ✅ التنبيهات الطبية - فوق خالص */}
      {customerAlerts.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm font-black text-rose-800">
                ⚠️ تنبيهات طبية هامة (يجب مراجعتها قبل الصرف)
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsAlertModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة تنبيه</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {customerAlerts.map((alert) => (
              <div
                key={alert.id}
                className="group flex items-center gap-2 bg-white border border-rose-200 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 shadow-sm hover:border-rose-400 transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-500">{alertTypeLabels[alert.alert_type] || alert.alert_type}:</span>
                <span>{alert.alert_text}</span>
                <button
                  type="button"
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="mr-1 p-1 text-rose-300 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                  title="حذف التنبيه"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ✅ لو مفيش تنبيهات، نعرض زرار إضافة واضح */}
      {customerAlerts.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="w-4 h-4 text-slate-400" />
            <span>لا توجد تنبيهات طبية مسجلة لهذا المريض</span>
          </div>
          <button
            type="button"
            onClick={() => setIsAlertModalOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة تنبيه طبي</span>
          </button>
        </div>
      )}

      {/* ✅✅✅ البيانات الطبية للمريض (الأمراض المزمنة + الأدوية الحالية) ✅✅✅ */}
      {(customer.chronic_diseases || customer.current_medications) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {customer.chronic_diseases && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-orange-100 text-orange-700 rounded-xl shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-orange-800 mb-1">الأمراض المزمنة</h4>
                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                  {customer.chronic_diseases}
                </p>
              </div>
            </div>
          )}

          {customer.current_medications && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-xl shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-blue-800 mb-1">الأدوية الحالية (بياخدها بشكل مستمر)</h4>
                <p className="text-sm font-bold text-slate-800 leading-relaxed">
                  {customer.current_medications}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ✅ الهيدر المبسط */}
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

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20 shrink-0">
              {customer.name.slice(0, 1)}
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">{customer.name}</h2>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-mono font-bold rounded-md">
                  {customer.code}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                <span className="flex items-center gap-1 font-mono text-slate-700 font-bold">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  {customer.phone}
                </span>
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {customer.address}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {formatDate(customer.created_at)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none px-5 py-3 rounded-2xl border text-center ${
              customer.current_balance > 0
                ? 'bg-rose-50 border-rose-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <span className="text-[10px] font-bold text-slate-500 block mb-0.5">المديونية الحالية</span>
              <span className={`text-xl font-black block ${customer.current_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(customer.current_balance)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onOpenNewSaleForCustomer(customer.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-colors cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>بيع جديد</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenRecordPayment(customer.id)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>تسجيل سداد</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrintStatement}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3 h-3" />
              <span>طباعة كشف الحساب</span>
            </button>
            {customer.current_balance > 0 && (
              <button
                type="button"
                onClick={handleSendWhatsAppReminder}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                <Send className="w-3 h-3" />
                <span>تذكير واتساب</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => onEditCustomer(customer)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
          >
            <Edit className="w-3 h-3" />
            <span>تعديل البيانات</span>
          </button>
        </div>
      </div>

      {/* ✅ التابات */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'purchases'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>سجل المشتريات ({customerSales.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('medicines')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'medicines'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>الأدوية السابقة ({medicineHistory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>كشف الحساب ({customerLedger.length})</span>
        </button>
      </div>

      {/* ✅ تاب 1: سجل المشتريات */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">رقم الفاتورة</th>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">الأدوية</th>
                  <th className="py-3 px-4 font-bold">الإجمالي</th>
                  <th className="py-3 px-4 font-bold">المتبقي</th>
                  <th className="py-3 px-4 font-bold">الحالة</th>
                  <th className="py-3 px-4 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerSales.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      لا توجد فواتير سابقة لهذا العميل
                    </td>
                  </tr>
                ) : (
                  customerSales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {sale.invoice_number}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(sale.created_at)}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 truncate">
                          {sale.items.map(i => `${i.medicine_name} (${i.quantity})`).join('، ')}
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(sale.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        {sale.remaining_amount > 0 ? formatCurrency(sale.remaining_amount) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {sale.payment_status === 'paid' && <Badge variant="success">مدفوعة</Badge>}
                        {sale.payment_status === 'partial' && <Badge variant="warning">جزئي</Badge>}
                        {sale.payment_status === 'unpaid' && <Badge variant="danger">آجلة</Badge>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedSaleForReceipt(sale)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
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
      )}

      {/* ✅ تاب 2: الأدوية السابقة */}
      {activeTab === 'medicines' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">الأدوية السابقة للعميل</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك إضافة أي دواء للفاتورة الحالية بضغطة واحدة
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الدواء</th>
                  <th className="py-3 px-4 font-bold">آخر صرف</th>
                  <th className="py-3 px-4 font-bold">الطبيب</th>
                  <th className="py-3 px-4 font-bold text-center">إضافة للفاتورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicineHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      لا يوجد سجل أدوية سابقة
                    </td>
                  </tr>
                ) : (
                  medicineHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.medicineName}
                        {item.activeIngredient && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {item.activeIngredient}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(item.lastDispensedDate)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.doctorName || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onAddMedicineToCart(customer.id, item.medicineId)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة للفاتورة</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ تاب 3: كشف الحساب */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-800">كشف الحساب الجاري</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">التاريخ</th>
                  <th className="py-3 px-4 font-bold">البيان</th>
                  <th className="py-3 px-4 font-bold">مدين</th>
                  <th className="py-3 px-4 font-bold">دائن</th>
                  <th className="py-3 px-4 font-bold">الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerLedger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      لا توجد حركات مالية
                    </td>
                  </tr>
                ) : (
                  customerLedger.map(entry => (
                    <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        {entry.description}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-black font-mono text-slate-900">
                        {formatCurrency(entry.balance_after)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ✅ Medical Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-900">إضافة تنبيه طبي جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAlertModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">نوع التنبيه:</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="allergy">حساسية (Allergy)</option>
                  <option value="contraindication">ممنوع استخدام (Contraindication)</option>
                  <option value="medical_note">ملاحظة طبية (Medical Note)</option>
                  <option value="injection_note">ملاحظة حقن (Injection Note)</option>
                  <option value="other">أخرى (Other)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">نص التنبيه:</label>
                <textarea
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
                  placeholder="مثال: حساسية من البنسلين، ممنوع استخدام الأسبرين..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSaveAlert}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 transition-colors cursor-pointer"
                >
                  حفظ التنبيه الطبي
                </button>
                <button
                  type="button"
                  onClick={() => setIsAlertModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
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