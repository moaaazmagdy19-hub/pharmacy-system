-- ==============================================================================
-- PHARMACY MANAGEMENT SYSTEM (فارما بلس - نظام إدارة الصيدلية المتكامل)
-- PostgreSQL / Supabase Schema & Row-Level Security (RLS) Policies
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Pharmacy Settings Table
CREATE TABLE IF NOT EXISTS pharmacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL DEFAULT 'صيدلية الشفاء التخصصية',
    license_number VARCHAR(100),
    tax_number VARCHAR(100),
    phone VARCHAR(100),
    address TEXT,
    currency VARCHAR(20) DEFAULT 'ج.م',
    receipt_header TEXT,
    receipt_footer TEXT,
    low_stock_threshold INTEGER DEFAULT 5,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. Profiles / Users Table (Linked with auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'employee')),
    phone VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    notes TEXT,
    chronic_diseases TEXT, -- ✅ الأمراض المزمنة
    current_medications TEXT, -- ✅ الأدوية الحالية
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 5. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    clinic_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    active_ingredient VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(150),
    barcode VARCHAR(100) UNIQUE,
    selling_price NUMERIC(10, 2) NOT NULL CHECK (selling_price >= 0),
    purchase_price NUMERIC(10, 2) NOT NULL CHECK (purchase_price >= 0),
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_level INTEGER NOT NULL DEFAULT 5 CHECK (min_stock_level >= 0),
    expiry_date DATE NOT NULL,
    unit VARCHAR(50) DEFAULT 'علبة',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
CREATE INDEX IF NOT EXISTS idx_medicines_barcode ON medicines(barcode);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_active_ingredient ON medicines(active_ingredient);

-- 7. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
    diagnosis TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'dispensed' CHECK (status IN ('pending', 'dispensed', 'cancelled')),
    total_price NUMERIC(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 8. Prescription Items Table
CREATE TABLE IF NOT EXISTS prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    instructions TEXT,
    unit_price NUMERIC(10, 2) DEFAULT 0
);

-- 9. Sales Table (Invoices)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) NOT NULL,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL,
    remaining_amount NUMERIC(10, 2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'credit')),
    notes TEXT,
    employee_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- 10. Sale Items Table
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    medicine_id UUID REFERENCES medicines(id) ON DELETE SET NULL,
    medicine_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    barcode VARCHAR(100)
);

-- 11. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    sale_id UUID REFERENCES sales(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
    previous_balance NUMERIC(10, 2) NOT NULL,
    new_balance NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    employee_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- 12. Financial Ledger Table (Immutable Financial Movement Journal)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name VARCHAR(255) NOT NULL,
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('sale', 'payment', 'refund', 'adjustment')),
    reference_id VARCHAR(100) NOT NULL,
    reference_code VARCHAR(100) NOT NULL,
    debit NUMERIC(10, 2) DEFAULT 0,
    credit NUMERIC(10, 2) DEFAULT 0,
    balance_after NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL,
    employee_name VARCHAR(255) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ledger_customer_id ON ledger_entries(customer_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger_entries(created_at);

-- 13. Medicine Stock Movements Table
CREATE TABLE IF NOT EXISTS medicine_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medicine_id UUID NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    medicine_name VARCHAR(255) NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('sale', 'restock', 'adjustment', 'return')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reference_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    employee_name VARCHAR(255) NOT NULL
);

-- 14. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 15. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    link_tab VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ==============================================================================
ALTER TABLE pharmacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicine_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Everyone authenticated can read records
CREATE POLICY "Allow authenticated read on customers" ON customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on customers" ON customers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on medicines" ON medicines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on medicines" ON medicines FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on sales" ON sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on sales" ON sales FOR INSERT TO authenticated WITH CHECK (true);
-- Employees cannot delete sales (admin only)
CREATE POLICY "Allow admin delete on sales" ON sales FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "Allow authenticated read on payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);
-- Employees cannot delete payments (admin only)
CREATE POLICY "Allow admin delete on payments" ON payments FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "Allow authenticated read on ledger" ON ledger_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on ledger" ON ledger_entries FOR INSERT TO authenticated WITH CHECK (true);
-- Ledger entries are strictly immutable!
CREATE POLICY "Disallow delete on ledger" ON ledger_entries FOR DELETE TO authenticated USING (false);
-- ==============================================================================
-- 16. Customer Medical Alerts Table (التنبيهات الطبية)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS customer_medical_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- (حساسية، ممنوع استخدام، ملاحظة طبية)
    alert_text TEXT NOT NULL, -- (حساسية من البنسلين، ممنوع الأسبرين...)
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_alerts_customer_id ON customer_medical_alerts(customer_id);

-- تفعيل الـ RLS
ALTER TABLE customer_medical_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on alerts" ON customer_medical_alerts 
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert on alerts" ON customer_medical_alerts 
    FOR INSERT TO authenticated WITH CHECK (true);

-- يمنع الحذف إلا للأدمن
CREATE POLICY "Allow admin delete on alerts" ON customer_medical_alerts 
    FOR DELETE TO authenticated USING (is_admin());
    -- ==============================================================================
-- 17. Suppliers Table (الموردين / المخازن)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 18. Purchase Invoices Table (فواتير الشراء من الموردين)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS purchase_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(255) NOT NULL,
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (remaining_amount >= 0),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    notes TEXT,
    employee_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON purchase_invoices(supplier_id);

-- ==============================================================================
-- 19. Supplier Payments Table (مدفوعات الموردين)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS supplier_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_code VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    supplier_name VARCHAR(255) NOT NULL,
    purchase_invoice_id UUID REFERENCES purchase_invoices(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
    previous_balance NUMERIC(10, 2) NOT NULL,
    new_balance NUMERIC(10, 2) NOT NULL,
    notes TEXT,
    employee_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- RLS للجداول الجديدة
-- ==============================================================================
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on suppliers" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on suppliers" ON suppliers FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on purchase_invoices" ON purchase_invoices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on purchase_invoices" ON purchase_invoices FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow admin delete on purchase_invoices" ON purchase_invoices FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "Allow authenticated read on supplier_payments" ON supplier_payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert on supplier_payments" ON supplier_payments FOR INSERT TO authenticated WITH CHECK (true);
-- ==============================================================================
-- 20. Employees Table (الموظفين)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    monthly_salary NUMERIC(10, 2) NOT NULL CHECK (monthly_salary >= 0),
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ==============================================================================
-- 21. Attendance Table (الحضور والغياب اليومي)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    attendance_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    check_in_time TIME,
    check_out_time TIME,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);

-- ==============================================================================
-- 22. Payroll Table (المرتبات المحسوبة)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    base_salary NUMERIC(10, 2) NOT NULL,
    working_days INTEGER NOT NULL DEFAULT 0,
    absent_days INTEGER NOT NULL DEFAULT 0,
    daily_rate NUMERIC(10, 2) NOT NULL,
    deductions NUMERIC(10, 2) NOT NULL DEFAULT 0,
    additions NUMERIC(10, 2) NOT NULL DEFAULT 0,
    net_salary NUMERIC(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    UNIQUE(employee_id, month, year)
);

-- ==============================================================================
-- RLS للجداول الجديدة
-- ==============================================================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on employees" ON employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on employees" ON employees FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on attendance" ON attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on attendance" ON attendance FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on payroll" ON payroll FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert/update on payroll" ON payroll FOR ALL TO authenticated USING (true);