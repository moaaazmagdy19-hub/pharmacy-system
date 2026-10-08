import React, { useState, useEffect } from 'react';
import { User, Briefcase, Phone, DollarSign, Calendar, FileText } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Employee } from '../../types';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    job_title: string;
    phone?: string;
    monthly_salary: number;
    hire_date: string;
    notes?: string;
    is_active: boolean;
  }) => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeFormModal: React.FC<EmployeeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  employeeToEdit,
}) => {
  const [name, setName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>('');
  const [hireDate, setHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (employeeToEdit) {
      setName(employeeToEdit.name);
      setJobTitle(employeeToEdit.job_title);
      setPhone(employeeToEdit.phone || '');
      setMonthlySalary(employeeToEdit.monthly_salary);
      setHireDate(employeeToEdit.hire_date);
      setNotes(employeeToEdit.notes || '');
    } else {
      setName('');
      setJobTitle('');
      setPhone('');
      setMonthlySalary('');
      setHireDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
  }, [employeeToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !jobTitle.trim() || !monthlySalary || Number(monthlySalary) <= 0) {
      alert('يرجى إدخال الاسم، الوظيفة، والمرتب الشهري');
      return;
    }
    onSubmit({
      name: name.trim(),
      job_title: jobTitle.trim(),
      phone: phone.trim() || undefined,
      monthly_salary: Number(monthlySalary),
      hire_date: hireDate,
      notes: notes.trim() || undefined,
      is_active: true,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
      subtitle="بيانات الموظف تُستخدم في حساب الحضور والمرتب الشهري"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <User className="w-3.5 h-3.5 text-blue-600" />
            <span>اسم الموظف *</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="مثال: أحمد محمد"
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-600" />
              <span>الوظيفة *</span>
            </label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="مثال: صيدلي، عامل، محاسب"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              <span>رقم الهاتف</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="مثال: 01012345678"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>المرتب الشهري *</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={monthlySalary}
              onChange={e => setMonthlySalary(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 5000"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>تاريخ التعيين *</span>
            </label>
            <input
              type="date"
              required
              value={hireDate}
              onChange={e => setHireDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
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
            placeholder="أي ملاحظات عن الموظف..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
        </div>

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
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {employeeToEdit ? 'حفظ التعديلات' : 'إضافة الموظف'}
          </button>
        </div>
      </form>
    </Modal>
  );
};