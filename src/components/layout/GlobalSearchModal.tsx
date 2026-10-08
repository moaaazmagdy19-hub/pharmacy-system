import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  Pill,
  FileText,
  Stethoscope,
  Receipt,
  X,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customerId: string) => void;
  onSelectMedicine: (medicineId: string) => void;
  onSelectPrescription: (prescriptionId: string) => void;
  onSelectDoctor: (doctorId: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCustomer,
  onSelectMedicine,
  onSelectPrescription,
  onSelectDoctor,
  onNavigateTab,
}) => {
  const { customers, medicines, prescriptions, doctors, sales } = usePharmacy();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut listener for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent or state
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();

  const matchedCustomers = trimmed
    ? customers.filter(
        c =>
          c.name.toLowerCase().includes(trimmed) ||
          c.phone.includes(trimmed) ||
          c.code.toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchedMedicines = trimmed
    ? medicines.filter(
        m =>
          m.name.toLowerCase().includes(trimmed) ||
          m.active_ingredient.toLowerCase().includes(trimmed) ||
          m.barcode.includes(trimmed) ||
          m.code.toLowerCase().includes(trimmed)
      ).slice(0, 5)
    : [];

  const matchedDoctors = trimmed
    ? doctors.filter(
        d =>
          d.name.toLowerCase().includes(trimmed) ||
          d.specialty.toLowerCase().includes(trimmed) ||
          d.phone.includes(trimmed)
      ).slice(0, 4)
    : [];

  const matchedPrescriptions = trimmed
    ? prescriptions.filter(
        p =>
          p.code.toLowerCase().includes(trimmed) ||
          (p.diagnosis && p.diagnosis.toLowerCase().includes(trimmed))
      ).slice(0, 4)
    : [];

  const matchedSales = trimmed
    ? sales.filter(
        s =>
          s.invoice_number.toLowerCase().includes(trimmed) ||
          s.customer_name.toLowerCase().includes(trimmed)
      ).slice(0, 4)
    : [];

  const hasResults =
    matchedCustomers.length > 0 ||
    matchedMedicines.length > 0 ||
    matchedDoctors.length > 0 ||
    matchedPrescriptions.length > 0 ||
    matchedSales.length > 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="ابحث بالاسم، رقم الهاتف، اسم الدواء، المادة الفعالة، الباركود، أو رقم الفاتورة..."
            className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="px-2 py-1 text-[11px] font-mono bg-slate-100 text-slate-500 rounded-md shrink-0">
            Esc
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!trimmed && (
            <div className="py-6 text-center">
              <p className="text-xs font-semibold text-slate-400">
                جرّب البحث مثلاً عن: <span className="text-blue-600 font-bold">أحمد</span>،{' '}
                <span className="text-blue-600 font-bold">Panadol</span>،{' '}
                <span className="text-blue-600 font-bold">010</span>،{' '}
                <span className="text-blue-600 font-bold">INV</span>
              </p>
            </div>
          )}

          {trimmed && !hasResults && (
            <div className="py-12 text-center">
              <p className="text-sm font-bold text-slate-700">لم يتم العثور على أي نتائج</p>
              <p className="text-xs text-slate-400 mt-1">تأكد من صحة كتابة كلمة البحث</p>
            </div>
          )}

          {/* Customers Results */}
          {matchedCustomers.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2 text-xs font-bold text-blue-700">
                <Users className="w-4 h-4" />
                <span>العملاء ({matchedCustomers.length})</span>
              </div>
              <div className="space-y-1">
                {matchedCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onClick={() => {
                      onSelectCustomer(customer.id);
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-blue-50/80 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{customer.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{customer.phone}</span>
                      </div>
                      {customer.notes && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">{customer.notes}</p>
                      )}
                    </div>
                    <div className="text-left">
                      {customer.current_balance > 0 ? (
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          مديونية: {formatCurrency(customer.current_balance)}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          لا توجد مديونية
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medicines Results */}
          {matchedMedicines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2 text-xs font-bold text-emerald-700">
                <Pill className="w-4 h-4" />
                <span>الأدوية والمخزون ({matchedMedicines.length})</span>
              </div>
              <div className="space-y-1">
                {matchedMedicines.map(med => (
                  <div
                    key={med.id}
                    onClick={() => {
                      onSelectMedicine(med.id);
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-emerald-50/80 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{med.name}</span>
                        <span className="text-[11px] text-slate-400">({med.category})</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        المادة الفعالة: <span className="font-semibold text-slate-700">{med.active_ingredient}</span>
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black text-blue-700">{formatCurrency(med.selling_price)}</p>
                      <span className={`text-[11px] font-bold ${med.current_stock <= med.min_stock_level ? 'text-rose-600' : 'text-slate-500'}`}>
                        المخزون: {med.current_stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Doctors Results */}
          {matchedDoctors.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2 text-xs font-bold text-indigo-700">
                <Stethoscope className="w-4 h-4" />
                <span>الأطباء ({matchedDoctors.length})</span>
              </div>
              <div className="space-y-1">
                {matchedDoctors.map(doctor => (
                  <div
                    key={doctor.id}
                    onClick={() => {
                      onSelectDoctor(doctor.id);
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/80 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <span className="text-sm font-bold text-slate-800">{doctor.name}</span>
                      <p className="text-xs text-slate-500">{doctor.specialty}</p>
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{doctor.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sales Invoices Results */}
          {matchedSales.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2 text-xs font-bold text-amber-700">
                <Receipt className="w-4 h-4" />
                <span>فواتير المبيعات ({matchedSales.length})</span>
              </div>
              <div className="space-y-1">
                {matchedSales.map(sale => (
                  <div
                    key={sale.id}
                    onClick={() => {
                      onNavigateTab('sales');
                      onClose();
                    }}
                    className="p-3 bg-slate-50 hover:bg-amber-50/80 rounded-xl flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800">{sale.invoice_number}</span>
                        <span className="text-xs text-slate-600">{sale.customer_name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{new Date(sale.created_at).toLocaleDateString('ar-EG')}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900">{formatCurrency(sale.total_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>اضغط على أي عنصر للانتقال الفوري إليه</span>
          <span className="font-mono text-[11px]">PharmacyOS QuickSearch</span>
        </div>
      </div>
    </div>
  );
};
