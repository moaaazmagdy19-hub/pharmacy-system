import React, { useState } from 'react';
import {
  Stethoscope,
  Search,
  Plus,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  Users,
  Pill,
  Edit,
  Eye,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Doctor } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { Modal } from '../common/Modal';

interface DoctorListProps {
  onOpenNewDoctor: () => void;
  onEditDoctor: (doctor: Doctor) => void;
}

export const DoctorList: React.FC<DoctorListProps> = ({
  onOpenNewDoctor,
  onEditDoctor,
}) => {
  const { doctors, prescriptions, sales, customers } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorForDetails, setSelectedDoctorForDetails] = useState<Doctor | null>(null);

  const filteredDoctors = doctors.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q) ||
      d.phone.includes(q) ||
      (d.clinic_address && d.clinic_address.toLowerCase().includes(q))
    );
  });

  // Calculate doctor metrics
  const getDoctorStats = (docId: string) => {
    const docPrescriptions = prescriptions.filter(p => p.doctor_id === docId);
    const docSales = sales.filter(s => s.doctor_id === docId);
    const uniqueCustomerIds = new Set([
      ...docPrescriptions.map(p => p.customer_id),
      ...docSales.map(s => s.customer_id).filter(Boolean),
    ]);

    const totalGeneratedSales = docSales.reduce((sum, s) => sum + s.total_amount, 0);

    // Top prescribed medicines
    const medFreq: { [name: string]: number } = {};
    docPrescriptions.forEach(p => {
      p.items.forEach(i => {
        medFreq[i.medicine_name] = (medFreq[i.medicine_name] || 0) + i.quantity;
      });
    });

    const topMedicines = Object.entries(medFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, qty]) => ({ name, qty }));

    return {
      prescriptionsCount: docPrescriptions.length,
      customersCount: uniqueCustomerIds.size,
      totalSales: totalGeneratedSales,
      topMedicines,
      prescriptions: docPrescriptions,
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">سجل الأطباء والعيادات المحولة</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة إحصائيات الروشتات، أكثر الأطباء تحويلاً للمرضى، وحجم المبيعات الناتجة عن كل عيادة
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewDoctor}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة طبيب جديد</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم، التخصص، رقم الهاتف، أو عنوان العيادة..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDoctors.map(doctor => {
          const stats = getDoctorStats(doctor.id);

          return (
            <div
              key={doctor.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all text-right"
            >
              <div>
                {/* Doctor Head */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-black">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{doctor.name}</h3>
                      <p className="text-xs text-blue-600 font-semibold">{doctor.specialty}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEditDoctor(doctor)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    title="تعديل بيانات الطبيب"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                {/* Contact & Clinic */}
                <div className="py-2.5 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono">{doctor.phone}</span>
                  </div>
                  {doctor.clinic_address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{doctor.clinic_address}</span>
                    </div>
                  )}
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 bg-slate-50/70 p-2.5 rounded-xl text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 block">الروشتات</span>
                    <span className="text-sm font-black text-slate-900">
                      {stats.prescriptionsCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">المرضى</span>
                    <span className="text-sm font-black text-slate-900">
                      {stats.customersCount}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">المبيعات</span>
                    <span className="text-xs font-black text-emerald-700">
                      {formatCurrency(stats.totalSales)}
                    </span>
                  </div>
                </div>

                {/* Top Prescribed Medicines */}
                {stats.topMedicines.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">
                      أكثر الأدوية الموصوفة:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {stats.topMedicines.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md"
                        >
                          {m.name} ({m.qty})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* View Doctor Prescriptions */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForDetails(doctor)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>عرض تاريخ الروشتات الصادرة</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Doctor Prescriptions Details Modal */}
      {selectedDoctorForDetails && (
        <Modal
          isOpen={Boolean(selectedDoctorForDetails)}
          onClose={() => setSelectedDoctorForDetails(null)}
          title={`سجل روشتات: ${selectedDoctorForDetails.name}`}
          subtitle={selectedDoctorForDetails.specialty}
          maxWidth="2xl"
          footer={
            <button
              type="button"
              onClick={() => setSelectedDoctorForDetails(null)}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              إغلاق
            </button>
          }
        >
          <div className="space-y-3">
            {prescriptions.filter(p => p.doctor_id === selectedDoctorForDetails.id).length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                لا توجد روشتات مسجلة لهذا الطبيب حالياً
              </p>
            ) : (
              prescriptions
                .filter(p => p.doctor_id === selectedDoctorForDetails.id)
                .map(p => {
                  const cust = customers.find(c => c.id === p.customer_id);
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-700">{p.code}</span>
                          <span className="font-bold text-slate-800">{cust?.name || 'عميل نقدي'}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {p.items.map(i => `${i.medicine_name} (${i.quantity})`).join('، ')}
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-900 block">{formatCurrency(p.total_price)}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(p.prescription_date)}</span>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
