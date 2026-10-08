import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  Search,
  FileSpreadsheet,
  Users,
  Pill,
  Stethoscope,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency, formatDate } from '../../lib/formatters';

export const ReportsView: React.FC = () => {
  const { sales, customers, medicines, prescriptions, doctors, payments } = usePharmacy();
  const [activeReportTab, setActiveReportTab] = useState<'sales' | 'debts' | 'medicines' | 'doctors' | 'employees'>('sales');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Sales Report calculations
  const totalSalesRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalTransactionsCount = sales.length;
  const avgTransactionValue = totalTransactionsCount > 0 ? totalSalesRevenue / totalTransactionsCount : 0;

  // 2. Debts Report calculations
  const debtorCustomers = customers
    .filter(c => c.current_balance > 0)
    .sort((a, b) => b.current_balance - a.current_balance);

  // 3. Medicine Report calculations
  const medicineReportMap: { [medName: string]: { name: string; qtySold: number; revenue: number; stock: number } } = {};
  medicines.forEach(m => {
    medicineReportMap[m.name] = {
      name: m.name,
      qtySold: 0,
      revenue: 0,
      stock: m.current_stock,
    };
  });
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (medicineReportMap[item.medicine_name]) {
        medicineReportMap[item.medicine_name].qtySold += item.quantity;
        medicineReportMap[item.medicine_name].revenue += item.total_price;
      } else {
        medicineReportMap[item.medicine_name] = {
          name: item.medicine_name,
          qtySold: item.quantity,
          revenue: item.total_price,
          stock: 0,
        };
      }
    });
  });
  const medicineReportList = Object.values(medicineReportMap).sort((a, b) => b.qtySold - a.qtySold);

  // 4. Doctor Report calculations
  const doctorReportList = doctors.map(doc => {
    const docRx = prescriptions.filter(p => p.doctor_id === doc.id);
    const docSales = sales.filter(s => s.doctor_id === doc.id);
    const uniqueCust = new Set([
      ...docRx.map(p => p.customer_id),
      ...docSales.map(s => s.customer_id).filter(Boolean),
    ]);
    const totalVal = docSales.reduce((sum, s) => sum + s.total_amount, 0);

    return {
      name: doc.name,
      specialty: doc.specialty,
      rxCount: docRx.length,
      customersCount: uniqueCust.size,
      totalSales: totalVal,
    };
  }).sort((a, b) => b.totalSales - a.totalSales);

  // 5. Employee Report calculations
  const employeeMap: { [empName: string]: { name: string; salesCount: number; salesTotal: number; collectedTotal: number } } = {};
  sales.forEach(s => {
    if (!employeeMap[s.employee_name]) {
      employeeMap[s.employee_name] = { name: s.employee_name, salesCount: 0, salesTotal: 0, collectedTotal: 0 };
    }
    employeeMap[s.employee_name].salesCount += 1;
    employeeMap[s.employee_name].salesTotal += s.total_amount;
    employeeMap[s.employee_name].collectedTotal += s.paid_amount;
  });
  payments.forEach(p => {
    if (!employeeMap[p.employee_name]) {
      employeeMap[p.employee_name] = { name: p.employee_name, salesCount: 0, salesTotal: 0, collectedTotal: 0 };
    }
    employeeMap[p.employee_name].collectedTotal += p.amount;
  });
  const employeeReportList = Object.values(employeeMap);

  // CSV Export utility
  const handleExportCSV = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM for Arabic excel compatibility

    if (activeReportTab === 'sales') {
      csvContent += 'رقم الفاتورة,التاريخ,العميل,الإجمالي,المدفوع,المتبقي,الحالة,المسؤول\n';
      sales.forEach(s => {
        csvContent += `"${s.invoice_number}","${s.created_at}","${s.customer_name}",${s.total_amount},${s.paid_amount},${s.remaining_amount},"${s.payment_status}","${s.employee_name}"\n`;
      });
    } else if (activeReportTab === 'debts') {
      csvContent += 'كود العميل,الاسم,الهاتف,المديونية المستحقة,إجمالي المشتريات,إجمالي المسدد\n';
      debtorCustomers.forEach(c => {
        csvContent += `"${c.code}","${c.name}","${c.phone}",${c.current_balance},${c.total_purchased},${c.total_paid}\n`;
      });
    } else if (activeReportTab === 'medicines') {
      csvContent += 'اسم الدواء,الكمية المباعة,إيرادات المبيعات,الرصيد المتبقي بالمخزن\n';
      medicineReportList.forEach(m => {
        csvContent += `"${m.name}",${m.qtySold},${m.revenue},${m.stock}\n`;
      });
    } else if (activeReportTab === 'doctors') {
      csvContent += 'اسم الطبيب,التخصص,عدد الروشتات,عدد المرضى,إجمالي قيمة المبيعات\n';
      doctorReportList.forEach(d => {
        csvContent += `"${d.name}","${d.specialty}",${d.rxCount},${d.customersCount},${d.totalSales}\n`;
      });
    } else if (activeReportTab === 'employees') {
      csvContent += 'الموظف,عدد الفواتير,إجمالي المبيعات,إجمالي النقد المحصل\n';
      employeeReportList.forEach(e => {
        csvContent += `"${e.name}",${e.salesCount},${e.salesTotal},${e.collectedTotal}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pharmacy_report_${activeReportTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">التقارير والإحصائيات التحليلية</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            تقارير تفصيلية عن المبيعات، مديونيات العملاء، حركة الأدوية، أداء الأطباء والموظفين
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير إلى Excel (CSV)</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveReportTab('sales')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'sales'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>تقرير المبيعات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('debts')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'debts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>تقرير مديونيات العملاء</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('medicines')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'medicines'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Pill className="w-4 h-4" />
          <span>تقرير حركة الأدوية والمخزون</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('doctors')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'doctors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>تقرير الأطباء والروشتات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveReportTab('employees')}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeReportTab === 'employees'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>تقرير إنتاجية الصيادلة</span>
        </button>
      </div>

      {/* 1. Sales Report */}
      {activeReportTab === 'sales' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">إجمالي المبيعات</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(totalSalesRevenue)}</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">عدد العمليات</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalTransactionsCount} فاتورة</p>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500">متوسط قيمة الفاتورة</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{formatCurrency(avgTransactionValue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">الفاتورة</th>
                    <th className="py-3 px-4 font-bold">التاريخ</th>
                    <th className="py-3 px-4 font-bold">العميل</th>
                    <th className="py-3 px-4 font-bold">قيمة الفاتورة</th>
                    <th className="py-3 px-4 font-bold">المدفوع</th>
                    <th className="py-3 px-4 font-bold">المتبقي (آجل)</th>
                    <th className="py-3 px-4 font-bold">المسؤول</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-bold text-blue-700">{s.invoice_number}</td>
                      <td className="py-3 px-4 text-slate-600">{formatDate(s.created_at)}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{s.customer_name}</td>
                      <td className="py-3 px-4 font-black">{formatCurrency(s.total_amount)}</td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">{formatCurrency(s.paid_amount)}</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">
                        {s.remaining_amount > 0 ? formatCurrency(s.remaining_amount) : '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{s.employee_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Customer Debt Report */}
      {activeReportTab === 'debts' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900">
              إجمالي مديونيات العملاء المطلوبة للصيدلية:
            </span>
            <span className="text-xl font-black text-rose-600 font-mono">
              {formatCurrency(debtorCustomers.reduce((sum, c) => sum + c.current_balance, 0))}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">العميل</th>
                    <th className="py-3 px-4 font-bold">الهاتف</th>
                    <th className="py-3 px-4 font-bold">المديونية المستحقة (تنازلياً)</th>
                    <th className="py-3 px-4 font-bold">إجمالي المشتريات</th>
                    <th className="py-3 px-4 font-bold">إجمالي المسدد</th>
                    <th className="py-3 px-4 font-bold">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {debtorCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-600">{c.phone}</td>
                      <td className="py-3 px-4 font-black text-rose-600 text-sm">
                        {formatCurrency(c.current_balance)}
                      </td>
                      <td className="py-3 px-4 text-slate-800">{formatCurrency(c.total_purchased)}</td>
                      <td className="py-3 px-4 text-emerald-700 font-bold">{formatCurrency(c.total_paid)}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. Medicine Report */}
      {activeReportTab === 'medicines' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الصنف الدوائي</th>
                  <th className="py-3 px-4 font-bold">الكمية المباعة (عبوة)</th>
                  <th className="py-3 px-4 font-bold">إجمالي المبيعات المحققة</th>
                  <th className="py-3 px-4 font-bold">الرصيد المتاح بالمخزن</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {medicineReportList.map((m, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{m.qtySold} عبوة</td>
                    <td className="py-3 px-4 font-black">{formatCurrency(m.revenue)}</td>
                    <td className="py-3 px-4 font-mono">{m.stock} عبوة</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Doctor Report */}
      {activeReportTab === 'doctors' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">اسم الطبيب</th>
                  <th className="py-3 px-4 font-bold">التخصص</th>
                  <th className="py-3 px-4 font-bold">عدد الروشتات</th>
                  <th className="py-3 px-4 font-bold">عدد المرضى المحولين</th>
                  <th className="py-3 px-4 font-bold">إجمالي قيمة المبيعات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctorReportList.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{doc.name}</td>
                    <td className="py-3 px-4 text-slate-600">{doc.specialty}</td>
                    <td className="py-3 px-4 font-mono font-bold">{doc.rxCount} روشتة</td>
                    <td className="py-3 px-4 font-mono">{doc.customersCount} مريض</td>
                    <td className="py-3 px-4 font-black text-emerald-700">{formatCurrency(doc.totalSales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Employee Report */}
      {activeReportTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">الصيدلي / الموظف</th>
                  <th className="py-3 px-4 font-bold">عدد الفواتير الصادرة</th>
                  <th className="py-3 px-4 font-bold">إجمالي المبيعات</th>
                  <th className="py-3 px-4 font-bold">إجمالي النقد المحصل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeReportList.map((emp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 font-bold text-slate-900">{emp.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-700">{emp.salesCount} فاتورة</td>
                    <td className="py-3 px-4 font-black">{formatCurrency(emp.salesTotal)}</td>
                    <td className="py-3 px-4 font-black text-emerald-700">{formatCurrency(emp.collectedTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
