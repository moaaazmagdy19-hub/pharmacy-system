import React, { useState } from 'react';
import { History, Search, ShieldCheck, Filter, User } from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatDateTime } from '../../lib/formatters';
import { Badge } from '../common/Badge';

export const AuditLogView: React.FC = () => {
  const { auditLogs } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const entities = Array.from(new Set(auditLogs.map(l => l.entity)));

  const filteredLogs = auditLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matches =
      log.user_name.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity_id.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);

    if (!matches) return false;
    if (entityFilter !== 'all' && log.entity !== entityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">سجل العمليات والتدقيق الأمني (Audit Log)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            توثيق كامل لكافة العمليات الحساسة (إنشاء فواتير، سداد ديون، تعديل أسعار أدوية، وإدخال بيانات)
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>نظام التتبع الأمني نشط وغير قابل للتلاعب</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المستخدم، نوع العملية، التفاصيل..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="all">جميع الجداول والكيانات</option>
          {entities.map(ent => (
            <option key={ent} value={ent}>
              {ent}
            </option>
          ))}
        </select>
      </div>

      {/* Log Feed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">التاريخ والوقت</th>
                <th className="py-3.5 px-4 font-bold">المستخدم المسؤول</th>
                <th className="py-3.5 px-4 font-bold">العملية المنفذة</th>
                <th className="py-3.5 px-4 font-bold">الكيان / الجدول</th>
                <th className="py-3.5 px-4 font-bold">معرف الكيان</th>
                <th className="py-3.5 px-4 font-bold">تفاصيل الحدث</th>
                <th className="py-3.5 px-4 font-bold">القيمة السابقة / الجديدة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                    {formatDateTime(log.timestamp)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      {log.user_name}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-blue-700">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="gray">{log.entity}</Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500">
                    {log.entity_id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 max-w-sm">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-4 text-[11px]">
                    {log.old_value || log.new_value ? (
                      <span className="font-mono text-slate-600">
                        {log.old_value && <span className="text-rose-600 line-through mr-1">{log.old_value}</span>}
                        {log.new_value && <span className="text-emerald-700 font-bold">{log.new_value}</span>}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
