import React, { useState } from 'react';
import {
  Calculator,
  Calendar,
  Users,
  UserCheck,
  UserX,
  DollarSign,
  Save,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';

interface PayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    employees,
    getEmployeeAttendance,
    calculatePayroll,
    savePayroll,
    getPayroll,
  } = usePharmacy();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const activeEmployees = employees.filter(e => e.is_active);

  const handleSavePayroll = (employeeId: string) => {
    const payrollData = calculatePayroll(employeeId, month, year);
    savePayroll({
      employee_id: payrollData.employee_id,
      employee_name: payrollData.employee_name,
      month: payrollData.month,
      year: payrollData.year,
      base_salary: payrollData.base_salary,
      working_days: payrollData.working_days,
      absent_days: payrollData.absent_days,
      daily_rate: payrollData.daily_rate,
      deductions: payrollData.deductions,
      additions: payrollData.additions,
      net_salary: payrollData.net_salary,
      is_paid: false,
    });
    setSavedIds(prev => new Set(prev).add(employeeId));
  };

  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="حساب المرتبات الشهرية"
      subtitle="حساب المرتب تلقائياً بناءً على أيام الحضور والغياب"
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* اختيار الشهر والسنة */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-600">اختر الشهر والسنة لحساب المرتبات:</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={month}
              onChange={e => setMonth(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-500"
            >
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <input
              type="number"
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* الجدول */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الموظف</th>
                  <th className="py-3 px-4 font-bold">المرتب الأساسي</th>
                  <th className="py-3 px-4 font-bold text-emerald-700">أيام الحضور</th>
                  <th className="py-3 px-4 font-bold text-rose-700">أيام الغياب</th>
                  <th className="py-3 px-4 font-bold">قيمة الخصم</th>
                  <th className="py-3 px-4 font-bold">صافي المرتب</th>
                  <th className="py-3 px-4 font-bold text-center">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-bold">لا يوجد موظفين مسجلين حالياً</p>
                    </td>
                  </tr>
                ) : (
                  activeEmployees.map(employee => {
                    const payrollData = calculatePayroll(employee.id, month, year);
                    const isSaved = savedIds.has(employee.id) || getPayroll(employee.id, month, year) !== null;

                    return (
                      <tr key={employee.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {employee.name}
                          <span className="block text-[10px] text-slate-400 font-normal">{employee.job_title}</span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {formatCurrency(employee.monthly_salary)}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-700">
                          {payrollData.working_days} يوم
                        </td>
                        <td className="py-3.5 px-4 font-black text-rose-700">
                          {payrollData.absent_days} يوم
                        </td>
                        <td className="py-3.5 px-4 font-bold text-rose-600">
                          {payrollData.deductions > 0 ? `- ${formatCurrency(payrollData.deductions)}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 font-black text-blue-700 text-sm">
                          {formatCurrency(payrollData.net_salary)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isSaved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              تم الحفظ
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSavePayroll(employee.id)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              حفظ
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ملخص */}
        {activeEmployees.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-blue-700" />
              <h4 className="text-xs font-black text-blue-900">ملخص الشهر {months.find(m => m.value === month)?.label} {year}</h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-600 block">إجمالي المرتبات الأساسية:</span>
                <span className="font-black text-slate-800">{formatCurrency(activeEmployees.reduce((s, e) => s + e.monthly_salary, 0))}</span>
              </div>
              <div>
                <span className="text-slate-600 block">إجمالي الخصومات:</span>
                <span className="font-black text-rose-600">
                  {formatCurrency(activeEmployees.reduce((s, e) => s + calculatePayroll(e.id, month, year).deductions, 0))}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block">إجمالي الصافي:</span>
                <span className="font-black text-emerald-700">
                  {formatCurrency(activeEmployees.reduce((s, e) => s + calculatePayroll(e.id, month, year).net_salary, 0))}
                </span>
              </div>
              <div>
                <span className="text-slate-600 block">عدد الموظفين:</span>
                <span className="font-black text-blue-700">{activeEmployees.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};