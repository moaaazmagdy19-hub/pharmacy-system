import React, { useState } from 'react';
import {
  FileText,
  Search,
  Plus,
  Stethoscope,
  User,
  ShoppingBag,
  CheckCircle,
  Clock,
  Printer,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Prescription } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Badge } from '../common/Badge';

interface PrescriptionListProps {
  onOpenNewPrescription: () => void;
  onDispensePrescription: (prescription: Prescription) => void;
}

export const PrescriptionList: React.FC<PrescriptionListProps> = ({
  onOpenNewPrescription,
  onDispensePrescription,
}) => {
  const { prescriptions, customers, doctors } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'dispensed'>('all');

  const filtered = prescriptions.filter(rx => {
    const cust = customers.find(c => c.id === rx.customer_id);
    const doc = doctors.find(d => d.id === rx.doctor_id);
    const q = searchQuery.toLowerCase();

    const matches =
      rx.code.toLowerCase().includes(q) ||
      (cust && cust.name.toLowerCase().includes(q)) ||
      (doc && doc.name.toLowerCase().includes(q)) ||
      (rx.diagnosis && rx.diagnosis.toLowerCase().includes(q)) ||
      rx.items.some(i => i.medicine_name.toLowerCase().includes(q));

    if (!matches) return false;
    if (statusFilter !== 'all' && rx.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">إدارة الروشتات الطبية</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            أرشفة الوصفات الطبية، ربطها بالأطباء والعملاء، وتحويلها لعمليات بيع بنقرة واحدة
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewPrescription}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل روشتة جديدة</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم الروشتة، اسم المريض، الطبيب، أو اسم الدواء..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            الكل ({prescriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'pending' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            معلقة / لم تصرف ({prescriptions.filter(p => p.status === 'pending').length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('dispensed')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'dispensed' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            تم صرفها بالكامل ({prescriptions.filter(p => p.status === 'dispensed').length})
          </button>
        </div>
      </div>

      {/* Prescriptions Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 py-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            لم يتم العثور على أي روشتات مطابقة
          </div>
        ) : (
          filtered.map(rx => {
            const customer = customers.find(c => c.id === rx.customer_id);
            const doctor = doctors.find(d => d.id === rx.doctor_id);

            return (
              <div
                key={rx.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-colors"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-700">
                        {rx.code}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(rx.prescription_date)}
                      </span>
                    </div>

                    <div>
                      {rx.status === 'dispensed' ? (
                        <Badge variant="success" dot>تم الصرف</Badge>
                      ) : rx.status === 'pending' ? (
                        <Badge variant="warning" dot>معلقة للصرف</Badge>
                      ) : (
                        <Badge variant="danger">ملغاة</Badge>
                      )}
                    </div>
                  </div>

                  {/* Customer & Doctor Row */}
                  <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">المريض / العميل:</span>
                      <p className="font-bold text-slate-900">{customer?.name || 'عميل نقدي'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{customer?.phone}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">الطبيب المعالج:</span>
                      <p className="font-bold text-slate-900">{doctor?.name || '—'}</p>
                      <p className="text-[10px] text-slate-500">{doctor?.specialty}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {rx.diagnosis && (
                    <div className="py-2 text-xs text-slate-600 bg-slate-50 px-3 rounded-xl mt-2.5">
                      <span className="font-bold text-slate-700">التشخيص: </span>
                      <span>{rx.diagnosis}</span>
                    </div>
                  )}

                  {/* Medicines List */}
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-700 block">
                      الأدوية المقررة ({rx.items.length}):
                    </span>
                    <div className="space-y-1">
                      {rx.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-slate-50 px-2.5 py-1.5 rounded-lg"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{item.medicine_name}</span>
                            <span className="text-[10px] text-slate-500">({item.dosage})</span>
                          </div>
                          <span className="font-bold font-mono text-slate-700">
                            {item.quantity} عبوة
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bottom Total & Dispense Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">إجمالي قيمة الروشتة:</span>
                    <span className="text-sm font-black text-blue-700">
                      {formatCurrency(rx.total_price)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onDispensePrescription(rx)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>صرف الروشتة الآن</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
