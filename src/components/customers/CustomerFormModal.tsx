import React, { useState, useEffect } from 'react';
import { User, Phone, MapPin, FileText, HeartPulse, Stethoscope } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Customer } from '../../types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone: string;
    address?: string;
    notes?: string;
    chronic_diseases?: string;
    current_medications?: string;
  }) => void;
  customerToEdit?: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerToEdit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  // ✅ الحقول الجديدة
  const [chronicDiseases, setChronicDiseases] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setAddress(customerToEdit.address || '');
      setNotes(customerToEdit.notes || '');
      // ✅ تحميل البيانات القديمة
      setChronicDiseases(customerToEdit.chronic_diseases || '');
      setCurrentMedications(customerToEdit.current_medications || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      // ✅ تصفير الحقول الجديدة
      setChronicDiseases('');
      setCurrentMedications('');
    }
  }, [customerToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('يرجى إدخال اسم العميل ورقم هاتفه');
      return;
    }
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      chronic_diseases: chronicDiseases.trim() || undefined, // ✅
      current_medications: currentMedications.trim() || undefined, // ✅
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customerToEdit ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
      subtitle="إضافة بيانات العميل لتتبع مديونياته وسجل أدويته ومشترياته السابقة"
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {customerToEdit ? 'حفظ التعديلات' : 'إضافة العميل'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>اسم العميل ثلاثي أو ثنائي *</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: أحمد محمد علي"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>رقم الهاتف / واتساب *</span>
          </label>
          <input
            type="tel"
            required
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="مثال: 01012345678"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>العنوان / المنطقة (اختياري)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="مثال: شارع التحرير، الدقي، الجيزة"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* ✅✅✅ قسم البيانات الطبية ✅✅✅ */}
        <div className="pt-2 border-t border-slate-100 space-y-4">
          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
            البيانات الطبية (اختياري)
          </h4>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-orange-500" />
              <span>الأمراض المزمنة</span>
            </label>
            <input
              type="text"
              value={chronicDiseases}
              onChange={e => setChronicDiseases(e.target.value)}
              placeholder="مثال: سكر، ضغط، قلب..."
              className="w-full px-3.5 py-2 bg-orange-50/50 border border-orange-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
              <span>الأدوية الحالية (بياخدها بشكل مستمر)</span>
            </label>
            <textarea
              rows={2}
              value={currentMedications}
              onChange={e => setCurrentMedications(e.target.value)}
              placeholder="مثال: Concor 5mg، Glucophage 1000mg..."
              className="w-full px-3.5 py-2 bg-blue-50/50 border border-blue-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>ملاحظات عامة (اختياري)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: مريض يشتري شهرياً، يسدد عبر إنستاباي..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>
      </form>
    </Modal>
  );
};