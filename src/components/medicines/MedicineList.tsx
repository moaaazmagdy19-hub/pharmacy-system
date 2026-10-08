import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  Edit,
  Trash2,
  Package,
  Layers,
  Barcode,
  ArrowUpDown,
  SlidersHorizontal,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { Medicine } from '../../types';
import { formatCurrency, formatDate, getDaysUntilExpiry } from '../../lib/formatters';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface MedicineListProps {
  onOpenNewMedicine: () => void;
  onEditMedicine: (medicine: Medicine) => void;
}

export const MedicineList: React.FC<MedicineListProps> = ({
  onOpenNewMedicine,
  onEditMedicine,
}) => {
  const { medicines, adjustStock, deleteMedicine, currentUser } = usePharmacy();
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'expiring_soon' | 'out_of_stock'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Stock Adjustment Modal state
  const [adjustingMedicine, setAdjustingMedicine] = useState<Medicine | null>(null);
  const [stockChange, setStockChange] = useState<number | ''>('');
  const [adjustReason, setAdjustReason] = useState('توريد شحنة جديدة');

  const categories = Array.from(new Set(medicines.map(m => m.category)));

  // Filter
  const filtered = medicines.filter(med => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      med.name.toLowerCase().includes(q) ||
      med.active_ingredient.toLowerCase().includes(q) ||
      med.barcode.includes(q) ||
      (med.manufacturer && med.manufacturer.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (categoryFilter !== 'all' && med.category !== categoryFilter) return false;

    if (stockFilter === 'low_stock') {
      return med.current_stock <= med.min_stock_level && med.current_stock > 0;
    }
    if (stockFilter === 'out_of_stock') {
      return med.current_stock === 0;
    }
    if (stockFilter === 'expiring_soon') {
      const days = getDaysUntilExpiry(med.expiry_date);
      return days <= 60;
    }

    return true;
  });

  const lowStockCount = medicines.filter(m => m.current_stock <= m.min_stock_level && m.current_stock > 0).length;
  const outOfStockCount = medicines.filter(m => m.current_stock === 0).length;
  const expiringSoonCount = medicines.filter(m => getDaysUntilExpiry(m.expiry_date) <= 60).length;

  const handleApplyAdjustment = () => {
    if (!adjustingMedicine || stockChange === '' || Number(stockChange) === 0) {
      alert('يرجى تحديد كمية التعديل المطلوبة');
      return;
    }
    adjustStock(adjustingMedicine.id, Number(stockChange), adjustReason);
    setAdjustingMedicine(null);
    setStockChange('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Pill className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">سجل الأدوية والمخزون الصيدلاني</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            متابعة الأرصدة، الباركود، التسعيرة الجبرية، تنبيهات النواقص وتواريخ انتهاء الصلاحية
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenNewMedicine}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة دواء جديد</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500">إجمالي أصناف الأدوية</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{medicines.length} دواء</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <span className="text-xs font-bold text-amber-800">أدوية تحت الحد الأدنى</span>
          <p className="text-2xl font-black text-amber-700 mt-1">{lowStockCount} دواء</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <span className="text-xs font-bold text-rose-700">نفدت من المخزون</span>
          <p className="text-2xl font-black text-rose-600 mt-1">{outOfStockCount} دواء</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <span className="text-xs font-bold text-indigo-700">أدوية قريبة الصلاحية</span>
          <p className="text-2xl font-black text-indigo-600 mt-1">{expiringSoonCount} دواء</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم التجاري، المادة الفعالة، الباركود..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">جميع التصنيفات</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Stock Condition filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                stockFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              الكل
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('low_stock')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                stockFilter === 'low_stock' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              نواقص ({lowStockCount})
            </button>
            <button
              type="button"
              onClick={() => setStockFilter('expiring_soon')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                stockFilter === 'expiring_soon' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              قريب الصلاحية ({expiringSoonCount})
            </button>
          </div>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 font-bold">الدواء التجاري</th>
                <th className="py-3.5 px-4 font-bold">المادة الفعالة والتصنيف</th>
                <th className="py-3.5 px-4 font-bold">الباركود</th>
                <th className="py-3.5 px-4 font-bold">سعر البيع</th>
                <th className="py-3.5 px-4 font-bold">سعر الشراء</th>
                <th className="py-3.5 px-4 font-bold">المخزون الحالي</th>
                <th className="py-3.5 px-4 font-bold">تاريخ الانتهاء</th>
                <th className="py-3.5 px-4 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    لم يتم العثور على أدوية مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map(med => {
                  const daysToExpiry = getDaysUntilExpiry(med.expiry_date);
                  const isExpiringSoon = daysToExpiry <= 60;
                  const isLowStock = med.current_stock <= med.min_stock_level;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{med.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {med.manufacturer || 'مستحضر دوائي'} • {med.unit}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-700">{med.active_ingredient}</div>
                        <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-0.5 inline-block">
                          {med.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                        {med.barcode}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {formatCurrency(med.selling_price)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-bold">
                        {formatCurrency(med.purchase_price)}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-black font-mono text-sm ${
                              med.current_stock === 0
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-slate-800'
                            }`}
                          >
                            {med.current_stock}
                          </span>
                          {med.current_stock === 0 ? (
                            <Badge variant="danger">نفد</Badge>
                          ) : isLowStock ? (
                            <Badge variant="warning">حرج</Badge>
                          ) : (
                            <Badge variant="success">متوفر</Badge>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          حد الطلب: {med.min_stock_level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${isExpiringSoon ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                            {med.expiry_date}
                          </span>
                          {isExpiringSoon && (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {daysToExpiry > 0 ? `متبقي ${daysToExpiry} يوماً` : 'منتهي الصلاحية!'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Stock Adjustment Trigger */}
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustingMedicine(med);
                              setStockChange('');
                            }}
                            className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="تسوية / تعديل المخزون"
                          >
                            <Package className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditMedicine(med)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="تعديل بيانات الدواء"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {currentUser.role === 'admin' && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من حذف دواء "${med.name}"؟`)) {
                                  deleteMedicine(med.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="حذف الدواء (Admin)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* Stock Adjustment Modal */}
      {adjustingMedicine && (
        <Modal
          isOpen={Boolean(adjustingMedicine)}
          onClose={() => setAdjustingMedicine(null)}
          title={`تسوية وجرد مخزون: ${adjustingMedicine.name}`}
          subtitle={`الرصيد الفعلي الحالي في النظام: ${adjustingMedicine.current_stock} عبوة`}
          maxWidth="md"
          footer={
            <>
              <button
                type="button"
                onClick={() => setAdjustingMedicine(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleApplyAdjustment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
              >
                تطبيق التسوية على المخزن
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                مقدار التغيير (اكتب رقماً موجباً للزيادة مثل +10، أو سالباً للنقص مثل -2):
              </label>
              <input
                type="number"
                value={stockChange}
                onChange={e => setStockChange(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="مثال: +10 أو -3"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-left"
              />
              {stockChange !== '' && (
                <p className="text-xs text-blue-600 font-bold mt-1.5">
                  الرصيد الجديد بعد التسوية سيكون:{' '}
                  {Math.max(0, adjustingMedicine.current_stock + Number(stockChange))} عبوة
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                سبب التسوية / البيان:
              </label>
              <select
                value={adjustReason}
                onChange={e => setAdjustReason(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500"
              >
                <option value="توريد شحنة جديدة من الشركة">توريد شحنة جديدة من الشركة</option>
                <option value="جرد دوري وتصحيح رصيد">جرد دوري وتصحيح رصيد</option>
                <option value="توالف أو كسر عبوات">توالف أو كسر عبوات</option>
                <option value="مرتجع من عميل">مرتجع من عميل</option>
              </select>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
