import React, { useState } from 'react';
import { FileText, Plus, Trash2, User, Stethoscope, Pill } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePharmacy } from '../../context/PharmacyContext';
import { PrescriptionItem } from '../../types';
import { formatCurrency } from '../../lib/formatters';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispenseImmediately?: (prescriptionId: string) => void;
}

export const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { customers, doctors, medicines, addPrescription } = usePharmacy();

  const [customerId, setCustomerId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');

  // Prescription items
  const [items, setItems] = useState<PrescriptionItem[]>([
    {
      id: 'pi-1',
      medicine_name: '',
      dosage: 'قرص 3 مرات يومياً بعد الأكل',
      quantity: 1,
      unit_price: 0,
    },
  ]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `pi-${Date.now()}`,
        medicine_name: '',
        dosage: 'قرص مرتين يومياً',
        quantity: 1,
        unit_price: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof PrescriptionItem, value: any) => {
    setItems(prev =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        const updated = { ...item, [field]: value };

        // If medicine changed, auto-fill unit_price
        if (field === 'medicine_name') {
          const matchedMed = medicines.find(m => m.name === value || m.id === value);
          if (matchedMed) {
            updated.medicine_id = matchedMed.id;
            updated.medicine_name = matchedMed.name;
            updated.unit_price = matchedMed.selling_price;
          }
        }
        return updated;
      })
    );
  };

  const calculatedTotal = items.reduce(
    (sum, item) => sum + item.quantity * (item.unit_price || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !doctorId) {
      alert('يرجى اختيار العميل والطبيب المعالج');
      return;
    }

    const validItems = items.filter(i => i.medicine_name.trim().length > 0);
    if (validItems.length === 0) {
      alert('يرجى إضافة دواء واحد على الأقل في الروشتة');
      return;
    }

    addPrescription({
      customer_id: customerId,
      doctor_id: doctorId,
      prescription_date: prescriptionDate,
      diagnosis: diagnosis.trim() || undefined,
      status: 'pending',
      items: validItems,
      total_price: calculatedTotal,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل روشتة طبية جديدة"
      subtitle="إدخال أدوية الروشتة، الطبيب المعالج، والجرعات المقررة للعميل"
      maxWidth="3xl"
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
            حفظ الروشتة
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top: Customer, Doctor, Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>العميل *</span>
            </label>
            <select
              required
              value={customerId}
              onChange={e => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="">اختر العميل...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>الطبيب كاتب الروشتة *</span>
            </label>
            <select
              required
              value={doctorId}
              onChange={e => setDoctorId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            >
              <option value="">اختر الطبيب...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.specialty}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              تاريخ الروشتة
            </label>
            <input
              type="date"
              value={prescriptionDate}
              onChange={e => setPrescriptionDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 text-right"
            />
          </div>
        </div>

        {/* Diagnosis */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            التشخيص / ملاحظات الحالة (اختياري)
          </label>
          <input
            type="text"
            value={diagnosis}
            onChange={e => setDiagnosis(e.target.value)}
            placeholder="مثال: التهاب حاد بالشعب الهوائية / متابعة سكري من النوع الثاني"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Multiple Prescription Items List */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-blue-600" />
              <span>أدوية الروشتة والجرعات ({items.length})</span>
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ إضافة دواء آخر للروشتة</span>
            </button>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
              >
                {/* Medicine Picker / Autocomplete */}
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    list="available-medicines"
                    value={item.medicine_name}
                    onChange={e => handleItemChange(idx, 'medicine_name', e.target.value)}
                    placeholder="اختر الدواء أو اكتب اسمه..."
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <datalist id="available-medicines">
                    {medicines.map(m => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.selling_price} ج.م)
                      </option>
                    ))}
                  </datalist>
                </div>

                {/* Dosage */}
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={item.dosage}
                    onChange={e => handleItemChange(idx, 'dosage', e.target.value)}
                    placeholder="الجرعة (مثال: قرص 3 مرات يومياً)"
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Quantity */}
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={e => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Remove button */}
                <div className="sm:col-span-1 text-center">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-between items-center text-xs font-bold text-slate-700">
            <span>القيمة التقديرية للأدوية:</span>
            <span className="text-sm font-black text-blue-700">{formatCurrency(calculatedTotal)}</span>
          </div>
        </div>

        {/* General Notes */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            ملاحظات إضافية
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="ملاحظات الصيدلي حول الروشتة..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
};
