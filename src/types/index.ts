export type PaymentStatus = 'paid' | 'partial' | 'unpaid';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'credit';
export type LedgerEntryType = 'sale' | 'payment' | 'refund' | 'adjustment';
export type StockMovementType = 'sale' | 'restock' | 'adjustment' | 'return';
export type UserRole = 'admin' | 'employee';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  chronic_diseases?: string;
  current_medications?: string;
  created_at: string;
  updated_at?: string;
  current_balance: number;
  total_purchased: number;
  total_paid: number;
}

export interface Doctor {
  id: string;
  code: string;
  name: string;
  specialty: string;
  phone: string;
  clinic_address?: string;
  notes?: string;
  created_at: string;
}

export interface Medicine {
  id: string;
  code: string;
  name: string;
  active_ingredient: string;
  category: string;
  manufacturer: string;
  barcode: string;
  selling_price: number;
  purchase_price: number;
  current_stock: number;
  min_stock_level: number;
  expiry_date: string;
  unit: string;
  notes?: string;
  created_at: string;
}

export interface PrescriptionItem {
  id: string;
  medicine_id?: string;
  medicine_name: string;
  dosage: string;
  quantity: number;
  instructions?: string;
  unit_price?: number;
}

export interface Prescription {
  id: string;
  code: string;
  customer_id: string;
  doctor_id: string;
  prescription_date: string;
  diagnosis?: string;
  status: 'pending' | 'dispensed' | 'cancelled';
  items: PrescriptionItem[];
  total_price: number;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  barcode?: string;
}

export interface Sale {
  id: string;
  invoice_number: string;
  customer_id?: string;
  customer_name: string;
  doctor_id?: string;
  prescription_id?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  notes?: string;
  employee_name: string;
  created_at: string;
}

export interface Payment {
  id: string;
  payment_code: string;
  customer_id: string;
  customer_name: string;
  sale_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  previous_balance: number;
  new_balance: number;
  notes?: string;
  employee_name: string;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  created_at: string;
  customer_id: string;
  customer_name: string;
  entry_type: LedgerEntryType;
  reference_id: string;
  reference_code: string;
  debit: number;
  credit: number;
  balance_after: number;
  description: string;
  employee_name: string;
}

export interface StockMovement {
  id: string;
  medicine_id: string;
  medicine_name: string;
  movement_type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  notes?: string;
  created_at: string;
  employee_name: string;
}

export interface AuditLog {
  id: string;
  user_name: string;
  action: string;
  entity: string;
  entity_id: string;
  details: string;
  old_value?: string;
  new_value?: string;
  timestamp: string;
}

export interface SystemNotification {
  id: string;
  type: 'low_stock' | 'expiring_medicine' | 'high_debt' | 'sale';
  title: string;
  message: string;
  severity: 'warning' | 'danger' | 'info' | 'success';
  is_read: boolean;
  link_tab?: string;
  created_at: string;
}

export interface PharmacySettings {
  name: string;
  license_number: string;
  tax_number: string;
  phone: string;
  address: string;
  currency: string;
  receipt_header: string;
  receipt_footer: string;
  low_stock_threshold: number;
  supabase_url?: string;
  supabase_anon_key?: string;
}

// ==============================================================================
// Medical Alerts (التنبيهات الطبية)
// ==============================================================================
export type MedicalAlertType = 'allergy' | 'contraindication' | 'medical_note' | 'injection_note' | 'other';

export interface CustomerMedicalAlert {
  id: string;
  customer_id: string;
  alert_type: MedicalAlertType;
  alert_text: string;
  created_by: string;
  created_at: string;
}

export interface CustomerMedicineHistoryItem {
  medicineId: string;
  medicineName: string;
  activeIngredient?: string;
  totalQuantity: number;
  lastDispensedDate: string;
  doctorName?: string;
  prescriptionCode?: string;
}

// ==============================================================================
// ✅ Suppliers & Purchase Invoices (الموردين وفواتير الشراء)
// ==============================================================================
export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  created_at: string;
  // Computed dynamically:
  current_balance?: number;
  total_purchased?: number;
  total_paid?: number;
}

export interface PurchaseInvoice {
  id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name: string;
  invoice_date: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  payment_status: PaymentStatus;
  notes?: string;
  employee_name: string;
  created_at: string;
}

export interface SupplierPayment {
  id: string;
  payment_code: string;
  supplier_id: string;
  supplier_name: string;
  purchase_invoice_id?: string;
  amount: number;
  payment_method: PaymentMethod;
  previous_balance: number;
  new_balance: number;
  notes?: string;
  employee_name: string;
  created_at: string;
}
// ==============================================================================
// ✅ Employees & Attendance (الموظفين والحضور)
// ==============================================================================
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface Employee {
  id: string;
  name: string;
  job_title: string;
  phone?: string;
  monthly_salary: number;
  hire_date: string;
  is_active: boolean;
  notes?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  employee_name: string;
  attendance_date: string;
  status: AttendanceStatus;
  check_in_time?: string;
  check_out_time?: string;
  notes?: string;
  created_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  employee_name: string;
  month: number; // 1-12
  year: number;
  base_salary: number;
  working_days: number;
  absent_days: number;
  daily_rate: number;
  deductions: number;
  additions: number;
  net_salary: number;
  is_paid: boolean;
  paid_at?: string;
  notes?: string;
  created_at: string;
}