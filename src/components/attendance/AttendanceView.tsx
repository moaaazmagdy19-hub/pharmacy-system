import React, { useState } from 'react';
import {
  CalendarCheck,
  Plus,
  UserCheck,
  UserX,
  Users,
  Search,
  Briefcase,
  Clock,
  Calculator,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';
import { EmployeeFormModal } from './EmployeeFormModal';
import { PayrollModal } from './PayrollModal';

export const AttendanceView: React.FC = () => {
  const {
    employees,
    markAttendance,
    getAttendanceByDate,
    addEmployee,
  } = usePharmacy();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);

  // إحصائيات اليوم المختار
  const todayAttendance = getAttendanceByDate(selectedDate);
  const presentCount = todayAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
  const absentCount = todayAttendance.filter(a => a.status === 'absent').length;
  const totalEmployees = employees.filter(e => e.is_active).length;

  // فلترة الموظفين
  const filteredEmployees = employees.filter(e => {
    if (!e.is_active) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || e.job_title.toLowerCase().includes(q);
  });

  // الحصول على حالة الحضور لموظف معين في التاريخ المختار
  const getEmployeeAttendanceStatus = (employeeId: string) => {
    const record = todayAttendance.find(a => a.employee_id === employeeId);
    return record?.status || null;
  };

  // تسجيل الحضور/الغياب
  const handleMarkAttendance = (
    employeeId: string,
    employeeName: string,
    status: 'present' | 'absent' | 'late' | 'excused'
  ) => {
    markAttendance({
      employee_id: employeeId,
      employee_name: employeeName,
      attendance_date: selectedDate,
      status,
    });
  };

  // حفظ الموظف الجديد
  const handleSubmitEmployee = (data: {
    name: string;
    job_title: string;
    phone?: string;
    monthly_salary: number;
    hire_date: string;
    notes?: string;
    is_active: boolean;
  }) => {
    addEmployee(data);
  };

  // تسميات الحضور
  const statusLabels: Record<string, string> = {
    present: 'حاضر',
    absent: 'غايب',
    late: 'متأخر',
    excused: 'إذن',
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-indigo-600 via-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
              إدارة الحضور والغياب
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            سجل حضور وغياب الموظفين
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-1">
            تسجيل الحضور اليومي ومتابعة المرتبات الشهرية
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsPayrollModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-800 hover:bg-blue-900 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" />
            <span>حساب المرتبات</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEmployeeModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة موظف</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي الموظفين</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">{totalEmployees} موظف</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-emerald-700">حاضر اليوم</span>
            <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-emerald-600">{presentCount} موظف</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-rose-700">غايب اليوم</span>
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-rose-600">{absentCount} موظف</p>
        </div>
      </div>

      {/* Date Picker + Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-600 whitespace-nowrap">تاريخ الحضور:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الموظف أو الوظيفة..."
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">اسم الموظف</th>
                <th className="py-3 px-4 font-bold">الوظيفة</th>
                <th className="py-3 px-4 font-bold">المرتب الشهري</th>
                <th className="py-3 px-4 font-bold">حالة الحضور</th>
                <th className="py-3 px-4 font-bold text-center">تسجيل الحضور</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Users className="w-8 h-8" />
                      <p className="text-sm font-bold">
                        {searchQuery ? 'لا يوجد موظفين مطابقين للبحث' : 'لا يوجد موظفين مسجلين حالياً'}
                      </p>
                      <p className="text-xs">
                        {searchQuery ? 'جرب البحث باسم آخر' : 'ابدأ بإضافة أول موظف من الزر بالأعلى'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(employee => {
                  const currentStatus = getEmployeeAttendanceStatus(employee.id);

                  return (
                    <tr key={employee.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {employee.name}
                        {employee.phone && (
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            {employee.phone}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          {employee.job_title}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {formatCurrency(employee.monthly_salary)}
                      </td>
                      <td className="py-3.5 px-4">
                        {currentStatus ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[11px] ${
                            currentStatus === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            currentStatus === 'absent' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            currentStatus === 'late' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {statusLabels[currentStatus]}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">لم يتم التسجيل</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(employee.id, employee.name, 'present')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700'
                            }`}
                          >
                            حاضر
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(employee.id, employee.name, 'absent')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700'
                            }`}
                          >
                            غايب
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMarkAttendance(employee.id, employee.name, 'excused')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                              currentStatus === 'excused'
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-blue-100 hover:text-blue-700'
                            }`}
                          >
                            إذن
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ملاحظة */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-3">
        <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-900">
            ملاحظة: في آخر الشهر، يتم حساب المرتب تلقائياً بناءً على أيام الحضور والغياب.
          </p>
          <p className="text-[11px] text-blue-700 mt-1">
            خصم اليوم = المرتب الشهري ÷ 30 يوم. كل يوم غياب يتم خصمه من المرتب.
          </p>
        </div>
      </div>

      {/* Modals */}
      <EmployeeFormModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSubmit={handleSubmitEmployee}
      />

      <PayrollModal
        isOpen={isPayrollModalOpen}
        onClose={() => setIsPayrollModalOpen(false)}
      />
    </div>
  );
};