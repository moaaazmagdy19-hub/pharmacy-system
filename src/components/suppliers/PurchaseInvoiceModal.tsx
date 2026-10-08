import React, { useState, useEffect } from 'react';
import { FileText, Truck, Calendar, DollarSign } from 'lucide-react';
import { Modal } from '../common/Modal';
import { usePharmacy } from '../../context/PharmacyContext';
import { formatCurrency } from '../../lib/formatters';

interface PurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedSupplierId?: string;
}

export const PurchaseInvoiceModal: React.FC<PurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  preselectedSupplierId,
}) => {
  const { suppliers, addPurchaseInvoice } = usePharmacy();

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSupplierId(preselectedSupplierId || '');
      const suggestedNum = `PUR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;
      setInvoiceNumber(suggestedNum);
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setTotalAmount('');
      setPaidAmount('');
      setNotes('');
    }
  }, [isOpen, preselectedSupplierId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!supplierId) {
      alert('يرجى اختيار المورد');
      return;
    }
    if (!totalAmount || Number(totalAmount) <= 0) {
      alert('يرجى إدخال إجمالي الفاتورة');
      return;
    }

    const total = Number(totalAmount);
    const paid = paidAmount === '' ? 0 : Number(paidAmount);
    const remaining = Math.max(0, total - paid);

    if (paid > total) {
      alert('المبلغ المدفوع لا يمكن أن يكون أكبر من الإجمالي');
      return;
    }

    let status: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (paid <= 0) status = 'unpaid';
    else if (remaining > 0) status = 'partial';

    const supplier = suppliers.find(s => s.id === supplierId);

    addPurchaseInvoice({
      invoice_number: invoiceNumber.trim(),
      supplier_id: supplierId,
      supplier_name: supplier?.name || '',
      invoice_date: invoiceDate,
      total_amount: total,
      paid_amount: paid,
      remaining_amount: remaining,
      payment_status: status,
      notes: notes.trim() || undefined,
      employee_name: 'د. أحمد (مدير الصيدلية)',
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل فاتورة شراء جديدة"
      subtitle="إضافة فاتورة بضاعة من مورد لتتبع المديونية والمدفوعات"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <Truck className="w-3.5 h-3.5 text-slate-600" />
            <span>المورد / الشركة *</span>
          </label>
          <select
            required
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">اختر المورد...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} {s.phone ? `— ${s.phone}` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>رقم الفاتورة *</span>
            </label>
            <input
              type="text"
              required
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              placeholder="مثال: PUR-2026-0001"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>تاريخ الفاتورة *</span>
            </label>
            <input
              type="date"
              required
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-600" />
              <span>إجمالي الفاتورة *</span>
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={totalAmount}
              onChange={e => setTotalAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 2000"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>المبلغ المدفوع (اختياري)</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="اتركه فارغ لو الفاتورة آجلة"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {totalAmount !== '' && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-600">المتبقي (مديونية للمورد):</span>
            <span className={`font-black ${Number(totalAmount) - (Number(paidAmount) || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {formatCurrency(Number(totalAmount) - (Number(paidAmount) || 0))}
            </span>
          </div>
        )}

        <div>
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>ملاحظات (اختياري)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: بضاعة شتوية، خصم 5%..."
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
            حفظ الفاتورة
          </button>
        </div>
      </form>
    </Modal>
  );
};