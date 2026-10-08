import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Phone,
  ArrowLeft,
  Scale,
  FileText,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';
import { Supplier } from '../../types';
import { SupplierFormModal } from './SupplierFormModal';
import { PurchaseInvoiceModal } from './PurchaseInvoiceModal';

interface SupplierListProps {
  onSelectSupplier: (supplierId: string) => void;
}

export const SupplierList: React.FC<SupplierListProps> = ({ onSelectSupplier }) => {
  const {
    suppliers,
    purchaseInvoices,
    supplierPayments,
    getSupplierBalance,
    addSupplier,
    updateSupplier,
  } = usePharmacy();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const totalSuppliers = suppliers.length;
  const totalDebt = suppliers.reduce((sum, s) => sum + getSupplierBalance(s.id), 0);
  const totalInvoices = purchaseInvoices.length;
  const totalPurchases = purchaseInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const totalPaid = supplierPayments.reduce((sum, p) => sum + p.amount, 0);

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.phone && s.phone.includes(q));
  });

  const handleOpenNewSupplier = () => {
    setSupplierToEdit(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenNewInvoice = () => {
    if (suppliers.length === 0) {
      alert('يجب إضافة مورد أولاً قبل تسجيل فاتورة شراء');
      return;
    }
    setIsInvoiceModalOpen(true);
  };

  const handleSubmitSupplier = (data: {
    name: string;
    phone?: string;
    address?: string;
    notes?: string;
  }) => {
    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, data);
    } else {
      addSupplier(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-l from-slate-700 via-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold bg-white/10 px-3 py-1 rounded-full">
              إدارة الموردين والمخازن
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            سجل الموردين وفواتير الشراء
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            متابعة مديونيات الموردين، فواتير الشراء، والمدفوعات
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleOpenNewSupplier}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs sm:text-sm font-black rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد</span>
          </button>
          <button
            type="button"
            onClick={handleOpenNewInvoice}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>فاتورة شراء جديدة</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">عدد الموردين</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">
            {totalSuppliers} مورد
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold text-rose-700">إجمالي المديونيات</span>
            <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-rose-600">
            {formatCurrency(totalDebt)}
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي المشتريات</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-slate-900">
            {formatCurrency(totalPurchases)}
          </p>
          <span className="text-[10px] text-slate-400 block mt-1">{totalInvoices} فاتورة</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold">إجمالي المسدد</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-black text-emerald-700">
            {formatCurrency(totalPaid)}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المورد أو رقم الهاتف..."
            className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 font-bold">اسم المورد</th>
                <th className="py-3 px-4 font-bold">رقم الهاتف</th>
                <th className="py-3 px-4 font-bold">إجمالي المشتريات</th>
                <th className="py-3 px-4 font-bold">إجمالي المسدد</th>
                <th className="py-3 px-4 font-bold">المديونية الحالية</th>
                <th className="py-3 px-4 font-bold text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Truck className="w-8 h-8" />
                      <p className="text-sm font-bold">
                        {searchQuery ? 'لا يوجد موردين مطابقين للبحث' : 'لا يوجد موردين مسجلين حالياً'}
                      </p>
                      <p className="text-xs">
                        {searchQuery ? 'جرب البحث باسم آخر' : 'ابدأ بإضافة أول مورد من الزر بالأعلى'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map(supplier => {
                  const balance = getSupplierBalance(supplier.id);
                  const supplierInvoices = purchaseInvoices.filter(inv => inv.supplier_id === supplier.id);
                  const totalPurchased = supplierInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
                  const supplierPays = supplierPayments.filter(p => p.supplier_id === supplier.id);
                  const totalPaidAmount = supplierPays.reduce((sum, p) => sum + p.amount, 0);

                  return (
                    <tr key={supplier.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {supplier.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {supplier.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-blue-500" />
                            {supplier.phone}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(totalPurchased)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">
                        {formatCurrency(totalPaidAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black ${
                          balance > 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {balance > 0 ? formatCurrency(balance) : 'خالص ✓'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {/* ✅ التعديل هنا: بننادي على onSelectSupplier */}
                        <button
                          type="button"
                          onClick={() => onSelectSupplier(supplier.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>فتح الملف</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setIsSupplierModalOpen(false);
          setSupplierToEdit(null);
        }}
        supplierToEdit={supplierToEdit}
        onSubmit={handleSubmitSupplier}
      />

      <PurchaseInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </div>
  );
};