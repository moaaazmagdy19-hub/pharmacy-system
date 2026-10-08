import React, { useState, useEffect } from 'react';
import { Stethoscope, Phone, MapPin, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Doctor } from '../../types';

interface DoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Doctor, 'id' | 'code' | 'created_at'>) => void;
  doctorToEdit?: Doctor | null;
}

export const DoctorModal: React.FC<DoctorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  doctorToEdit,
}) => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phone, setPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (doctorToEdit) {
      setName(doctorToEdit.name);
      setSpecialty(doctorToEdit.specialty);
      setPhone(doctorToEdit.phone);
      setClinicAddress(doctorToEdit.clinic_address || '');
      setNotes(doctorToEdit.notes || '');
    } else {
      setName('');
      setSpecialty('');
      setPhone('');
      setClinicAddress('');
      setNotes('');
    }
  }, [doctorToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !specialty.trim() || !phone.trim()) {
      alert('يرجى ملء جميع الحقول الإلزامية (اسم الطبيب، التخصص، ورقم الهاتف)');
      return;
    }

    onSubmit({
      name: name.trim(),
      specialty: specialty.trim(),
      phone: phone.trim(),
      clinic_address: clinicAddress.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={doctorToEdit ? 'تعديل بيانات الطبيب' : 'إضافة طبيب جديد'}
      subtitle="تسجيل الطبيب لمتابعة الروشتات الصادرة منه وحجم المبيعات الناتجة عنها"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
          >
            {doctorToEdit ? 'حفظ التعديلات' : 'إضافة الطبيب'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>اسم الطبيب واللقب العلمي *</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: د. محمد حسن رضوان"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            التخصص الطبي *
          </label>
          <input
            type="text"
            required
            value={specialty}
            onChange={e => setSpecialty(e.target.value)}
            placeholder="مثال: استشاري الباطنة والغدد الصماء والسكري"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>رقم هاتف العيادة أو الطبيب *</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="مثال: 01011122233"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 text-right"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>عنوان العيادة / المركز الطبي</span>
          </label>
          <input
            type="text"
            value={clinicAddress}
            onChange={e => setClinicAddress(e.target.value)}
            placeholder="مثال: برج الأطباء، شارع التحرير، الدقي"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            ملاحظات
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="أوقات العمل، الأدوية الأكثر كتابة في روشتاته..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
};
