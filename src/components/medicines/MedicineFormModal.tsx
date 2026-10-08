import React, { useState, useEffect } from 'react';
import { Pill, Barcode, DollarSign, Calendar, Package, Layers } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Medicine } from '../../types';

interface MedicineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Medicine, 'id' | 'code' | 'created_at'>) => void;
  medicineToEdit?: Medicine | null;
}

export const MedicineFormModal: React.FC<MedicineFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  medicineToEdit,
}) => {
  const [name, setName] = useState('');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [category, setCategory] = useState('مسكنات وخافض حرارة');
  const [manufacturer, setManufacturer] = useState('');
  const [barcode, setBarcode] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [purchasePrice, setPurchasePrice] = useState<number | ''>('');
  const [currentStock, setCurrentStock] = useState<number | ''>(20);
  const [minStockLevel, setMinStockLevel] = useState<number | ''>(5);
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [unit, setUnit] = useState('علبة');
  const [notes, setNotes] = useState('');

  const categories = [
    'مسكنات وخافض حرارة',
    'مضادات حيوية',
    'أدوية البرد والإنفلونزا',
    'أدوية الضغط والقلب',
    'أدوية السكري',
    'أدوية الجهاز الهضمي والمعدة',
    'مطهرات معوية',
    'أدوية الأنف والأذن',
    'مضادات الحساسية',
    'فيتامينات ومكملات غذائية',
    'مستحضرات جلدية وتجميل',
    'أدوية الصدر والجهاز التنفسي',
    'أخرى',
  ];

  useEffect(() => {
    if (medicineToEdit) {
      setName(medicineToEdit.name);
      setActiveIngredient(medicineToEdit.active_ingredient);
      setCategory(medicineToEdit.category);
      setManufacturer(medicineToEdit.manufacturer || '');
      setBarcode(medicineToEdit.barcode || '');
      setSellingPrice(medicineToEdit.selling_price);
      setPurchasePrice(medicineToEdit.purchase_price);
      setCurrentStock(medicineToEdit.current_stock);
      setMinStockLevel(medicineToEdit.min_stock_level);
      setExpiryDate(medicineToEdit.expiry_date);
      setUnit(medicineToEdit.unit || 'علبة');
      setNotes(medicineToEdit.notes || '');
    } else {
      setName('');
      setActiveIngredient('');
      setCategory('مسكنات وخافض حرارة');
      setManufacturer('');
      // Generate a mock barcode if empty
      setBarcode(`622100${Math.floor(1000000 + Math.random() * 9000000)}`);
      setSellingPrice('');
      setPurchasePrice('');
      setCurrentStock(20);
      setMinStockLevel(5);
      setExpiryDate('2027-12-31');
      setUnit('علبة');
      setNotes('');
    }
  }, [medicineToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !activeIngredient.trim() || !sellingPrice || !purchasePrice) {
      alert('يرجى ملء جميع الحقول الإلزامية المطلوبة (الاسم، المادة الفعالة، وسعري البيع والشراء)');
      return;
    }

    onSubmit({
      name: name.trim(),
      active_ingredient: activeIngredient.trim(),
      category,
      manufacturer: manufacturer.trim(),
      barcode: barcode.trim(),
      selling_price: Number(sellingPrice),
      purchase_price: Number(purchasePrice),
      current_stock: Number(currentStock) || 0,
      min_stock_level: Number(minStockLevel) || 5,
      expiry_date: expiryDate,
      unit,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medicineToEdit ? 'تعديل بيانات الدواء' : 'إضافة دواء جديد للمخزون'}
      subtitle="إدخال التفاصيل الصيدلانية، المادة الفعالة، التسعيرة الرسمية، وحدود المخزون"
      maxWidth="2xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl cursor-pointer transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            {medicineToEdit ? 'حفظ التعديلات' : 'إضافة الدواء للمخزون'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name & Active Ingredient */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Pill className="w-3.5 h-3.5 text-blue-600" />
              <span>الاسم التجاري للدواء *</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="مثال: Panadol Extra 500mg"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>المادة الفعالة والتركيز *</span>
            </label>
            <input
              type="text"
              required
              value={activeIngredient}
              onChange={e => setActiveIngredient(e.target.value)}
              placeholder="مثال: Paracetamol 500mg + Caffeine 65mg"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Row 2: Category & Manufacturer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              التصنيف الدوائي *
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              الشركة المصنعة / الموزع
            </label>
            <input
              type="text"
              value={manufacturer}
              onChange={e => setManufacturer(e.target.value)}
              placeholder="مثال: Amoun / Novartis / Pfizer"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Row 3: Barcode & Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Barcode className="w-3.5 h-3.5 text-slate-500" />
              <span>رقم الباركود الدولي (Barcode)</span>
            </label>
            <input
              type="text"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="مثال: 6221001001234"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 focus:outline-none focus:border-blue-500 text-right"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              شكل العبوة / الوحدة
            </label>
            <input
              type="text"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              placeholder="مثال: علبة (20 قرص) أو شراب أو أمبول"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Row 4: Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
          <div>
            <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-blue-600" />
              <span>سعر البيع للجمهور (ج.م) *</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              value={sellingPrice}
              onChange={e => setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 45.00"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-left"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5 mb-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-500" />
              <span>سعر الشراء / التكلفة (ج.م) *</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              required
              value={purchasePrice}
              onChange={e => setPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="مثال: 36.00"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-left"
            />
          </div>
        </div>

        {/* Row 5: Stock & Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>الرصيد بالمخزن حالياً</span>
            </label>
            <input
              type="number"
              min="0"
              value={currentStock}
              onChange={e => setCurrentStock(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-left"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              الحد الأدنى للتنبيه
            </label>
            <input
              type="number"
              min="1"
              value={minStockLevel}
              onChange={e => setMinStockLevel(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-left"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>تاريخ انتهاء الصلاحية *</span>
            </label>
            <input
              type="date"
              required
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-blue-500 text-right"
            />
          </div>
        </div>

        {/* Row 6: Notes */}
        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            ملاحظات أو دواعي الاستعمال
          </label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="مثال: الأكثر طلباً في موسم الشتاء، يحفظ في الثلاجة..."
            className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
};
