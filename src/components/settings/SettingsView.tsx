import React, { useState } from 'react';
import {
  Settings,
  Database,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle,
  Copy,
  ExternalLink,
  Shield,
  FileCode,
} from 'lucide-react';
import { usePharmacy } from '../../context/PharmacyContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetAllData,
    exportDatabaseJson,
    importDatabaseJson,
  } = usePharmacy();

  const [name, setName] = useState(settings.name);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [taxNumber, setTaxNumber] = useState(settings.tax_number || '');
  const [currency, setCurrency] = useState(settings.currency);
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.low_stock_threshold);

  // Supabase fields
  const [supabaseUrl, setSupabaseUrl] = useState(
    localStorage.getItem('pharmacy_supabase_url') || ''
  );
  const [supabaseKey, setSupabaseKey] = useState(
    localStorage.getItem('pharmacy_supabase_anon_key') || ''
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      name,
      phone,
      address,
      tax_number: taxNumber,
      currency,
      receipt_footer: receiptFooter,
      low_stock_threshold: Number(lowStockThreshold),
    });

    if (supabaseUrl) {
      localStorage.setItem('pharmacy_supabase_url', supabaseUrl);
    }
    if (supabaseKey) {
      localStorage.setItem('pharmacy_supabase_anon_key', supabaseKey);
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const json = exportDatabaseJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pharmacy_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJson(content);
        if (success) {
          alert('تم استيراد قاعدة البيانات بنجاح!');
        } else {
          alert('خطأ في صيغة الملف، يرجى التأكد من اختيار ملف JSON صالح للنظام.');
        }
      }
    };
    reader.readAsText(file);
  };

  const supabaseMigrationScript = `-- SQL MIGRATION FOR SUPABASE
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  active_ingredient VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  barcode VARCHAR(100) UNIQUE,
  selling_price NUMERIC(10,2) NOT NULL,
  purchase_price NUMERIC(10,2) NOT NULL,
  current_stock INT NOT NULL DEFAULT 0,
  min_stock_level INT NOT NULL DEFAULT 5,
  expiry_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL,
  remaining_amount NUMERIC(10,2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  entry_type VARCHAR(50) NOT NULL,
  reference_code VARCHAR(100) NOT NULL,
  debit NUMERIC(10,2) DEFAULT 0,
  credit NUMERIC(10,2) DEFAULT 0,
  balance_after NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- تم تفعيل الأمان وسياسات Row Level Security (RLS)`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseMigrationScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const isConnectedToSupabase = isSupabaseConfigured();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">إعدادات النظام وقاعدة البيانات</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            بيانات الصيدلية، الفواتير، ربط Supabase، النسخ الاحتياطي وإعادة ضبط البيانات
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>تم حفظ التعديلات بنجاح!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Pharmacy Info (Col 7) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            بيانات الهوية الرسمية للصيدلية
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                اسم الصيدلية الرسمي *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  رقم الهاتف والتواصل *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-right"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  السجل التجاري / البطاقة الضريبية
                </label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={e => setTaxNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-right"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                العنوان الكامل للصيدلية
              </label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  العملة الأساسية للنظام
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-center"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  الحد الأدنى لتنبيه نقص المخزون
                </label>
                <input
                  type="number"
                  min="1"
                  value={lowStockThreshold}
                  onChange={e => setLowStockThreshold(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-blue-500 text-center"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                رسالة وتذييل إيصال المبيعات (Receipt Footer)
              </label>
              <textarea
                rows={2}
                value={receiptFooter}
                onChange={e => setReceiptFooter(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بيانات الصيدلية</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right side: Supabase Integration & Database Maintenance (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Supabase Integration Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">قاعدة بيانات Supabase</h3>
              </div>
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                isConnectedToSupabase
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isConnectedToSupabase ? 'متصل بـ Supabase' : 'الوضع المحلي النشط'}
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              يدعم النظام التخزين المحلي الفوري فائق السرعة، ويمكنك ربطه مباشرة بحساب Supabase الخاص بك لحفظ البيانات سحابياً.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={e => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Supabase Anon Key:
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={e => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-left focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5 text-blue-600" />
                  <span>عرض كود SQL لـ Supabase</span>
                </button>
              </div>
            </div>
          </div>

          {/* Backup & Restore Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              النسخ الاحتياطي واستعادة البيانات
            </h3>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>تصدير نسخة احتياطية كاملة (JSON Backup)</span>
              </button>

              <label className="w-full py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 block text-center">
                <Upload className="w-4 h-4 text-blue-600 inline-block" />
                <span>استيراد واستعادة نسخة احتياطية</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'هل أنت متأكد من رغبتك في إعادة ضبط البيانات؟ ستتم استعادة البيانات التجريبية الشاملة للصيدلية.'
                    )
                  ) {
                    resetAllData();
                    alert('تمت استعادة البيانات التجريبية بنجاح!');
                  }
                }}
                className="w-full py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة ضبط البيانات التجريبية الأولية</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Migration Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  كود تهيئة الجداول في Supabase (SQL Script)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <p className="text-xs text-slate-500 mb-2">
                انسخ هذا الكود والصقه في نافذة <b>SQL Editor</b> بلوحة تحكم Supabase لتجهيز الجداول وسياسات الأمان RLS بنقرة واحدة:
              </p>
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto text-left leading-relaxed">
                {supabaseMigrationScript}
              </pre>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                الملف الكامل متاح أيضاً في مسار: <code className="text-blue-600">supabase/schema.sql</code>
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedSql ? 'تم النسخ للحافظة!' : 'نسخ كود SQL'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
