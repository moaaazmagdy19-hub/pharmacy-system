import React, { useState, useEffect } from 'react';
import { Truck, Phone, MapPin, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Supplier } from '../../types';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => void;
  supplierToEdit?: Supplier | null;
}

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplierToEdit,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name);
      setPhone(supplierToEdit.phone || '');
      setAddress(supplierToEdit.address || '');
      setNotes(supplierToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
  }, [supplierToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('يرجى إدخال اسم المورد');
      return;
    }
    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplierToEdit ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
      subtitle="إضافة بيانات المورد لتتبع فواتير الشراء والمديونيات"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            <span>اسم المورد / الشركة *</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: شركة ابن سينا فارما"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>رقم الهاتف (اختياري)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="مثال: 01012345678"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <span>العنوان (اختياري)</span>
          </label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="مثال: شارع الجيش، المنصورة"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>ملاحظات (اختياري)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: مورد معتمد، كاش فقط..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

        {/* ✅✅✅ الأزرار جوه الفورم ✅✅✅ */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {supplierToEdit ? 'حفظ التعديلات' : 'إضافة المورد'}
          </button>
        </div>
      </form>
    </Modal>
  );
};