import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  UserPlus,
  Stethoscope,
  Barcode,
  ShoppingBag,
  CreditCard,
  History,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { usePharmacy } from '../../context/PharmacyContext';
import { Medicine, Customer, Sale } from '../../types';
import { formatCurrency, formatDate } from '../../lib/formatters';
import { ReceiptModal } from './ReceiptModal';

interface CartItem {
  medicine: Medicine;
  quantity: number;
  unitPrice: number;
}

interface PosCheckoutProps {
  initialCustomerId?: string;
  onOpenNewCustomerModal: () => void;
  onNavigateToCustomerProfile: (customerId: string) => void;
  // ✅ ضفنا الحاجات دي عشان ملف المريض يقدر يضيف دواء مباشرة
  pendingCartItem?: { customerId: string; medicineId: string } | null;
  onClearPendingCartItem?: () => void;
}

export const PosCheckout: React.FC<PosCheckoutProps> = ({
  initialCustomerId,
  onOpenNewCustomerModal,
  onNavigateToCustomerProfile,
  pendingCartItem,
  onClearPendingCartItem,
}) => {
  const {
    medicines,
    customers,
    doctors,
    createSale,
    getCustomerMedicineHistory,
    customerMedicalAlerts,
  } = usePharmacy();

  // Search & Cart states
  const [medicineQuery, setMedicineQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  const [notes, setNotes] = useState('');

  // Returning Customer History Modal / Slideout
  const [showMedicineHistory, setShowMedicineHistory] = useState(false);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [salePrevBalance, setSalePrevBalance] = useState<number>(0);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCustomerId) {
      setSelectedCustomerId(initialCustomerId);
    }
  }, [initialCustomerId]);

  // ✅✅✅ إضافة الدواء للعربة أول ما نيجي من ملف المريض ✅✅✅
  useEffect(() => {
    if (pendingCartItem) {
      const med = medicines.find(m => m.id === pendingCartItem.medicineId);
      if (med) {
        addToCart(med);
      }
      if (onClearPendingCartItem) {
        onClearPendingCartItem();
      }
    }
  }, [pendingCartItem, medicines]);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);
  const previousDebt = selectedCustomer?.current_balance || 0;

  // ✅ فلترة التنبيهات الطبية الخاصة بالمريض
  const selectedCustomerAlerts = customerMedicalAlerts.filter(
    a => a.customer_id === selectedCustomerId
  );

  // Filter medicines
  const filteredMedicines = medicines.filter(m => {
    if (!medicineQuery.trim()) return true;
    const q = medicineQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.active_ingredient.toLowerCase().includes(q) ||
      m.barcode.includes(q) ||
      m.category.toLowerCase().includes(q)
    );
  }).slice(0, 12);

  // Cart operations
  const addToCart = (med: Medicine, qty = 1) => {
    if (med.current_stock <= 0) {
      alert(`عذراً، نفد رصيد الدواء "${med.name}" من المخزون!`);
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.medicine.id === med.id);
      if (existing) {
        const newQty = existing.quantity + qty;
        if (newQty > med.current_stock) {
          alert(`الكمية المتاحة في المخزون هي ${med.current_stock} فقط!`);
          return prev;
        }
        return prev.map(item =>
          item.medicine.id === med.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { medicine: med, quantity: qty, unitPrice: med.selling_price }];
    });
  };

  const updateQuantity = (medId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(medId);
      return;
    }
    const item = cart.find(i => i.medicine.id === medId);
    if (item && newQty > item.medicine.current_stock) {
      alert(`الكمية المتاحة في المخزون هي ${item.medicine.current_stock} فقط!`);
      return;
    }
    setCart(prev =>
      prev.map(i => (i.medicine.id === medId ? { ...i, quantity: newQty } : i))
    );
  };

  const removeFromCart = (medId: string) => {
    setCart(prev => prev.filter(i => i.medicine.id !== medId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setPaidAmount('');
    setNotes('');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const totalAmount = Math.max(0, subtotal - discount);
  const actualPaid = paidAmount === '' ? totalAmount : Number(paidAmount);
  const currentInvoiceRemaining = Math.max(0, totalAmount - actualPaid);
  const newTotalDebt = previousDebt + currentInvoiceRemaining;

  // Handle Barcode enter key
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const match = medicines.find(
        m => m.barcode === medicineQuery.trim() || m.name.toLowerCase() === medicineQuery.trim().toLowerCase()
      );
      if (match) {
        addToCart(match);
        setMedicineQuery('');
      }
    }
  };

  // Submit Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      alert('يرجى إضافة دواء واحد على الأقل للسلة');
      return;
    }

    const customerName = selectedCustomer ? selectedCustomer.name : 'عميل نقدي (طيار)';

    const prevBal = selectedCustomer?.current_balance || 0;
    setSalePrevBalance(prevBal);

    const sale = createSale({
      customerId: selectedCustomerId || undefined,
      customerName,
      doctorId: selectedDoctorId || undefined,
      items: cart.map(i => ({
        medicineId: i.medicine.id,
        medicineName: i.medicine.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        barcode: i.medicine.barcode,
      })),
      subtotal,
      discount,
      totalAmount,
      paidAmount: actualPaid,
      paymentMethod: currentInvoiceRemaining > 0 && actualPaid === 0 ? 'credit' : paymentMethod,
      notes,
    });

    // Confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // fallback
    }

    setCompletedSale(sale);
    clearCart();
  };

  // Fetch previous medicine history if customer selected
  const customerPastMeds = selectedCustomerId ? getCustomerMedicineHistory(selectedCustomerId) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">نقطة البيع وإصدار الفواتير (POS)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            صرف سريع للأدوية، تسجيل حسابات العملاء الآجلة، وتتبع المديونيات
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={clearCart}
            disabled={cart.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-xl disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تفريغ السلة</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Cart / Right Medicine Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Right side: Catalog & Search (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search bar & Barcode Reader simulation */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="relative">
              <input
                ref={barcodeInputRef}
                type="text"
                value={medicineQuery}
                onChange={e => setMedicineQuery(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                placeholder="ابحث عن اسم دواء، مادة فعالة، أو مرر الباركود واضغط Enter..."
                className="w-full pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>الأدوية المتاحة ({medicines.length})</span>
              <span className="flex items-center gap-1">
                <Barcode className="w-3.5 h-3.5 text-blue-600" /> يدعم قارئ الباركود تلقائياً
              </span>
            </div>
          </div>

          {/* Medicines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {filteredMedicines.map(med => {
              const inStock = med.current_stock > 0;
              const isLowStock = med.current_stock <= med.min_stock_level;
              const inCart = cart.find(i => i.medicine.id === med.id);

              return (
                <div
                  key={med.id}
                  onClick={() => inStock && addToCart(med)}
                  className={`relative p-3.5 rounded-2xl border transition-all text-right flex flex-col justify-between ${
                    !inStock
                      ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                      : inCart
                      ? 'bg-blue-50/70 border-blue-300 shadow-xs hover:border-blue-500 cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[120px]">
                        {med.category}
                      </span>
                      {isLowStock && inStock && (
                        <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          متبقي {med.current_stock}
                        </span>
                      )}
                      {!inStock && (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">
                          نفد
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                      {med.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {med.active_ingredient}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-blue-700">
                        {formatCurrency(med.selling_price)}
                      </span>
                    </div>
                    {inCart ? (
                      <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!inStock}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Left side: Active Cart & Fast Checkout Panel (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
            {/* Customer Selection Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>العميل / الحساب:</span>
                </label>
                <button
                  type="button"
                  onClick={onOpenNewCustomerModal}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ عميل جديد</span>
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">عميل نقدي (طيار بدون حساب)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) {c.current_balance > 0 ? `— مديونية: ${c.current_balance} ج.م` : '— خالص'}
                  </option>
                ))}
              </select>

              {/* ✅✅✅ تنبيهات طبية للمريض (Medical Alerts) ✅✅✅ */}
              {selectedCustomerAlerts.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-3 space-y-2">
                  <h4 className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" />
                    تنبيه: هذا المريض لديه حساسية/ملاحظات طبية
                  </h4>
                  <ul className="list-disc list-inside text-xs text-amber-700 font-bold space-y-1">
                    {selectedCustomerAlerts.map(alert => (
                      <li key={alert.id}>{alert.alert_type}: {alert.alert_text}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Returning Customer Intelligence Banner */}
              {selectedCustomer && (
                <div className="p-3 bg-gradient-to-l from-blue-50 to-indigo-50/40 rounded-xl border border-blue-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{selectedCustomer.name}</span>
                      <p className="text-[10px] text-slate-500 font-mono">{selectedCustomer.phone}</p>
                    </div>

                    <div className="text-left">
                      {previousDebt > 0 ? (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-black rounded-lg border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span>مديونية سابقة: {formatCurrency(previousDebt)}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          لا توجد مديونية سابقة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Customer Quick History Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-blue-200/60 text-xs">
                    <button
                      type="button"
                      onClick={() => setShowMedicineHistory(true)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1 cursor-pointer"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>أدوية العميل السابقة ({customerPastMeds.length})</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => onNavigateToCustomerProfile(selectedCustomer.id)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                    >
                      فتح الملف الكامل للعميل
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Selection (Optional) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                <span>الطبيب المعالج (اختياري / روشتة):</span>
              </label>
              <select
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="">بدون طبيب / شراء مباشر</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>أصناف الفاتورة الحالية ({cart.length})</span>
                <span className="text-slate-400 text-[11px]">المبلغ الإجمالي</span>
              </div>

              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
                  السلة فارغة. انقر على أي دواء لإضافته.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div
                      key={item.medicine.id}
                      className="p-2.5 bg-slate-50 hover:bg-slate-100/70 rounded-xl flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {item.medicine.name}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.unitPrice} ج.م × {item.quantity} = {item.unitPrice * item.quantity} ج.م
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicine.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.medicine.id, item.quantity + 1)}
                          className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.medicine.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals & Discounts */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">الخصم (ج.م):</span>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-left focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>صافي الفاتورة:</span>
                <span className="text-blue-700 text-base">{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment & Running Balance Calculation */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">المبلغ المدفوع حالياً:</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPaidAmount(totalAmount)}
                      className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-800 text-[10px] font-bold rounded cursor-pointer"
                    >
                      بالكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(0)}
                      className="px-2 py-0.5 bg-rose-100 hover:bg-rose-200 text-rose-800 text-[10px] font-bold rounded cursor-pointer"
                    >
                      آجل (0)
                    </button>
                  </div>
                </div>

                <input
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={`المبلغ (افتراضي: ${totalAmount})`}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-left"
                />
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  كاش (نقداً)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  فيزا / بطاقة
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank_transfer')}
                  className={`py-1.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                    paymentMethod === 'bank_transfer'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  إنستاباي / تحويل
                </button>
              </div>

              {/* The Core Financial Running Debt Display */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>المتبقي من هذه الفاتورة:</span>
                  <span className={`font-bold ${currentInvoiceRemaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(currentInvoiceRemaining)}
                  </span>
                </div>

                {selectedCustomer && (
                  <>
                    <div className="flex justify-between text-slate-500">
                      <span>مديونية العميل السابقة:</span>
                      <span>{formatCurrency(previousDebt)}</span>
                    </div>

                    <div className="flex justify-between text-xs font-black text-slate-900 pt-1.5 border-t border-slate-200 bg-white p-2 rounded-lg">
                      <span className="text-slate-800">إجمالي المديونية التراكمية الجديدة:</span>
                      <span className={newTotalDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                        {formatCurrency(newTotalDebt)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Notes */}
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="ملاحظات اختيارية على الفاتورة..."
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            />

            {/* Final Complete Sale Button */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-black rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>إتمام عملية البيع وطباعة الإيصال ({formatCurrency(totalAmount)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Returning Customer Past Medicines Slideout/Modal */}
      {showMedicineHistory && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  الأدوية التي سبق صرفها للعميل: {selectedCustomer.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowMedicineHistory(false)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer font-bold"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {customerPastMeds.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">
                  لا توجد أدوية مسجلة سابقاً لهذا العميل
                </p>
              ) : (
                customerPastMeds.map((med, idx) => {
                  const currentMed = medicines.find(m => m.id === med.medicineId || m.name === med.medicineName);

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-xl flex items-center justify-between gap-3 border border-slate-100 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{med.medicineName}</p>
                        {med.activeIngredient && (
                          <p className="text-[10px] text-slate-500">{med.activeIngredient}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          آخر تاريخ صرف: {formatDate(med.lastDispensedDate)} {med.doctorName && `— الطبيب: ${med.doctorName}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentMed ? (
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(currentMed);
                              setShowMedicineHistory(false);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>إضافة للسلة الآن</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400">غير متوفر بالمخزن</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {completedSale && (
        <ReceiptModal
          isOpen={Boolean(completedSale)}
          onClose={() => setCompletedSale(null)}
          sale={completedSale}
          previousBalance={salePrevBalance}
        />
      )}
    </div>
  );
};