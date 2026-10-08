import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Customer,
  Doctor,
  Medicine,
  Prescription,
  Sale,
  Payment,
  LedgerEntry,
  StockMovement,
  AuditLog,
  SystemNotification,
  PharmacySettings,
  UserProfile,
  UserRole,
  CustomerMedicalAlert,
  CustomerMedicineHistoryItem,
  Supplier,
  PurchaseInvoice,
  SupplierPayment,
  Employee,
  Attendance,
  Payroll,
} from '../types';
import {
  initialCustomers,
  initialDoctors,
  initialMedicines,
  initialPrescriptions,
  initialSales,
  initialPayments,
  initialLedgerEntries,
  initialStockMovements,
  initialAuditLogs,
  initialNotifications,
  initialSettings,
} from '../data/seedData';
import { generateCode, getDaysUntilExpiry } from '../lib/formatters';
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';

// ============================================================
// Helper: تشيل حقل id من البيانات قبل الإرسال لـ Supabase
// (لأن Supabase بيعمل uuid تلقائي، والكود بيعمل id يدوي)
// ============================================================
function cleanForSupabase<T extends Record<string, any>>(obj: T): Omit<T, 'id'> {
  const { id, ...rest } = obj;
  return rest as Omit<T, 'id'>;
}

interface PharmacyContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  switchRole: (role: UserRole) => void;
  settings: PharmacySettings;
  updateSettings: (settings: Partial<PharmacySettings>) => void;

  customers: Customer[];
  doctors: Doctor[];
  medicines: Medicine[];
  prescriptions: Prescription[];
  sales: Sale[];
  payments: Payment[];
  ledgerEntries: LedgerEntry[];
  stockMovements: StockMovement[];
  auditLogs: AuditLog[];
  notifications: SystemNotification[];
  customerMedicalAlerts: CustomerMedicalAlert[];
  suppliers: Supplier[];
  purchaseInvoices: PurchaseInvoice[];
  supplierPayments: SupplierPayment[];
  employees: Employee[];
  attendance: Attendance[];
  payroll: Payroll[];

  addCustomer: (data: Omit<Customer, 'id' | 'code' | 'created_at' | 'current_balance' | 'total_purchased' | 'total_paid'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;

  addDoctor: (data: Omit<Doctor, 'id' | 'code' | 'created_at'>) => Doctor;
  updateDoctor: (id: string, data: Partial<Doctor>) => void;

  addMedicine: (data: Omit<Medicine, 'id' | 'code' | 'created_at'>) => Medicine;
  updateMedicine: (id: string, data: Partial<Medicine>) => void;
  adjustStock: (medicineId: string, quantityChange: number, reason: string) => void;
  deleteMedicine: (id: string) => void;

  addMedicalAlert: (data: Omit<CustomerMedicalAlert, 'id' | 'created_at'>) => CustomerMedicalAlert;
  deleteMedicalAlert: (id: string) => void;
  getCustomerMedicalAlerts: (customerId: string) => CustomerMedicalAlert[];

  addSupplier: (data: Omit<Supplier, 'id' | 'created_at'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addPurchaseInvoice: (data: Omit<PurchaseInvoice, 'id' | 'created_at'>) => PurchaseInvoice;
  recordSupplierPayment: (data: {
    supplierId: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    purchaseInvoiceId?: string;
    notes?: string;
  }) => SupplierPayment;
  getSupplierBalance: (supplierId: string) => number;

  addEmployee: (data: Omit<Employee, 'id' | 'created_at'>) => Employee;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  markAttendance: (data: Omit<Attendance, 'id' | 'created_at'>) => Attendance;
  getAttendanceByDate: (date: string) => Attendance[];
  getEmployeeAttendance: (employeeId: string, month: number, year: number) => Attendance[];
  calculatePayroll: (employeeId: string, month: number, year: number) => Payroll;
  savePayroll: (data: Omit<Payroll, 'id' | 'created_at'>) => Payroll;
  getPayroll: (employeeId: string, month: number, year: number) => Payroll | null;

  addPrescription: (data: Omit<Prescription, 'id' | 'code' | 'created_at'>) => Prescription;
  updatePrescriptionStatus: (id: string, status: 'pending' | 'dispensed' | 'cancelled') => void;

  createSale: (saleData: {
    customerId?: string;
    customerName: string;
    doctorId?: string;
    prescriptionId?: string;
    items: {
      medicineId: string;
      medicineName: string;
      quantity: number;
      unitPrice: number;
      barcode?: string;
    }[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit';
    notes?: string;
  }) => Sale;

  recordPayment: (paymentData: {
    customerId: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
  }) => Payment;

  getCustomerBalance: (customerId: string) => number;
  getCustomerMedicineHistory: (customerId: string) => CustomerMedicineHistoryItem[];

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetAllData: () => void;
  exportDatabaseJson: () => string;
  importDatabaseJson: (jsonString: string) => boolean;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('pharmacy_active_user');
    return saved
      ? JSON.parse(saved)
      : { id: 'usr-1', name: 'د. أحمد (مدير الصيدلية)', role: 'admin', phone: '01001234567' };
  });

  const [settings, setSettings] = useState<PharmacySettings>(() => {
    const saved = localStorage.getItem('pharmacy_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('pharmacy_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [doctors, setDoctors] = useState<Doctor[]>(() => {
    const saved = localStorage.getItem('pharmacy_doctors');
    return saved ? JSON.parse(saved) : initialDoctors;
  });

  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('pharmacy_medicines');
    return saved ? JSON.parse(saved) : initialMedicines;
  });

  const [prescriptions, setPrescriptions] = useState<Prescription[]>(() => {
    const saved = localStorage.getItem('pharmacy_prescriptions');
    return saved ? JSON.parse(saved) : initialPrescriptions;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('pharmacy_sales');
    return saved ? JSON.parse(saved) : initialSales;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('pharmacy_payments');
    return saved ? JSON.parse(saved) : initialPayments;
  });

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('pharmacy_ledger');
    return saved ? JSON.parse(saved) : initialLedgerEntries;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem('pharmacy_stock_movements');
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('pharmacy_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('pharmacy_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [customerMedicalAlerts, setCustomerMedicalAlerts] = useState<CustomerMedicalAlert[]>(() => {
    const saved = localStorage.getItem('pharmacy_medical_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('pharmacy_suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('pharmacy_purchase_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => {
    const saved = localStorage.getItem('pharmacy_supplier_payments');
    return saved ? JSON.parse(saved) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('pharmacy_employees');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const saved = localStorage.getItem('pharmacy_attendance');
    return saved ? JSON.parse(saved) : [];
  });

  const [payroll, setPayroll] = useState<Payroll[]>(() => {
    const saved = localStorage.getItem('pharmacy_payroll');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync to LocalStorage
  useEffect(() => { localStorage.setItem('pharmacy_active_user', JSON.stringify(currentUser)); }, [currentUser]);
  useEffect(() => { localStorage.setItem('pharmacy_settings', JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem('pharmacy_customers', JSON.stringify(customers)); }, [customers]);
  useEffect(() => { localStorage.setItem('pharmacy_doctors', JSON.stringify(doctors)); }, [doctors]);
  useEffect(() => { localStorage.setItem('pharmacy_medicines', JSON.stringify(medicines)); }, [medicines]);
  useEffect(() => { localStorage.setItem('pharmacy_prescriptions', JSON.stringify(prescriptions)); }, [prescriptions]);
  useEffect(() => { localStorage.setItem('pharmacy_sales', JSON.stringify(sales)); }, [sales]);
  useEffect(() => { localStorage.setItem('pharmacy_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('pharmacy_ledger', JSON.stringify(ledgerEntries)); }, [ledgerEntries]);
  useEffect(() => { localStorage.setItem('pharmacy_stock_movements', JSON.stringify(stockMovements)); }, [stockMovements]);
  useEffect(() => { localStorage.setItem('pharmacy_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('pharmacy_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('pharmacy_medical_alerts', JSON.stringify(customerMedicalAlerts)); }, [customerMedicalAlerts]);
  useEffect(() => { localStorage.setItem('pharmacy_suppliers', JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem('pharmacy_purchase_invoices', JSON.stringify(purchaseInvoices)); }, [purchaseInvoices]);
  useEffect(() => { localStorage.setItem('pharmacy_supplier_payments', JSON.stringify(supplierPayments)); }, [supplierPayments]);
  useEffect(() => { localStorage.setItem('pharmacy_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('pharmacy_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('pharmacy_payroll', JSON.stringify(payroll)); }, [payroll]);

  // Fetch from Supabase on load
  useEffect(() => {
    async function loadFromSupabase() {
      const supabase = getSupabaseClient();
      if (!supabase || !isSupabaseConfigured()) {
        console.warn('Supabase not configured - using local data');
        return;
      }

      try {
        const { data: customersData } = await supabase.from('customers').select('*');
        if (customersData && customersData.length > 0) setCustomers(customersData as Customer[]);

        const { data: suppliersData } = await supabase.from('suppliers').select('*');
        if (suppliersData && suppliersData.length > 0) setSuppliers(suppliersData as Supplier[]);

        const { data: purchaseData } = await supabase.from('purchase_invoices').select('*');
        if (purchaseData && purchaseData.length > 0) setPurchaseInvoices(purchaseData as PurchaseInvoice[]);

        const { data: supplierPaysData } = await supabase.from('supplier_payments').select('*');
        if (supplierPaysData && supplierPaysData.length > 0) setSupplierPayments(supplierPaysData as SupplierPayment[]);

        const { data: employeesData } = await supabase.from('employees').select('*');
        if (employeesData && employeesData.length > 0) setEmployees(employeesData as Employee[]);

        const { data: attendanceData } = await supabase.from('attendance').select('*');
        if (attendanceData && attendanceData.length > 0) setAttendance(attendanceData as Attendance[]);

        const { data: payrollData } = await supabase.from('payroll').select('*');
        if (payrollData && payrollData.length > 0) setPayroll(payrollData as Payroll[]);

        const { data: alertsData } = await supabase.from('customer_medical_alerts').select('*');
        if (alertsData && alertsData.length > 0) setCustomerMedicalAlerts(alertsData as CustomerMedicalAlert[]);

        console.log('Data loaded from Supabase');
      } catch (error) {
        console.error('Failed to load from Supabase:', error);
      }
    }

    loadFromSupabase();
  }, []);

  // Check inventory stock and expiry on load
  useEffect(() => {
    medicines.forEach(med => {
      if (med.current_stock <= med.min_stock_level) {
        const notifExists = notifications.some(n => n.type === 'low_stock' && n.message.includes(med.name));
        if (!notifExists) {
          addNotification({
            type: 'low_stock',
            title: 'نقص حاد في المخزون',
            message: `دواء ${med.name} وصل إلى ${med.current_stock} فقط (الحد الأدنى ${med.min_stock_level})`,
            severity: 'danger',
            link_tab: 'medicines'
          });
        }
      }
      const days = getDaysUntilExpiry(med.expiry_date);
      if (days <= 60 && days > 0) {
        const notifExists = notifications.some(n => n.type === 'expiring_medicine' && n.message.includes(med.name));
        if (!notifExists) {
          addNotification({
            type: 'expiring_medicine',
            title: 'تنبيه قرب انتهاء الصلاحية',
            message: `دواء ${med.name} سينتهي خلال ${days} يوماً (${med.expiry_date})`,
            severity: 'warning',
            link_tab: 'medicines'
          });
        }
      }
    });
  }, [medicines]);

  const addNotification = (n: Omit<SystemNotification, 'id' | 'created_at' | 'is_read'>) => {
    const newNotif: SystemNotification = {
      ...n,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
      is_read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const logAudit = (action: string, entity: string, entityId: string, details: string, oldValue?: string, newValue?: string) => {
    const newLog: AuditLog = {
      id: `aud-${Date.now()}`,
      user_name: currentUser.name,
      action,
      entity,
      entity_id: entityId,
      details,
      old_value: oldValue,
      new_value: newValue,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const switchRole = (role: UserRole) => {
    if (role === 'admin') {
      setCurrentUser({ id: 'usr-1', name: 'د. أحمد (مدير الصيدلية)', role: 'admin', phone: '01001234567', email: 'admin@alshifa-pharma.com' });
    } else {
      setCurrentUser({ id: 'usr-2', name: 'د. مروة (صيدلي مناوب)', role: 'employee', phone: '01112233445', email: 'pharmacist@alshifa-pharma.com' });
    }
  };

  const updateSettings = (newSettings: Partial<PharmacySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    logAudit('تحديث إعدادات الصيدلية', 'Settings', 'global', 'تم تعديل بيانات وإعدادات النظام');
  };

  // Medical Alerts
  const addMedicalAlert = (data: Omit<CustomerMedicalAlert, 'id' | 'created_at'>): CustomerMedicalAlert => {
    const newAlert: CustomerMedicalAlert = { ...data, id: `alert-${Date.now()}`, created_at: new Date().toISOString() };
    setCustomerMedicalAlerts(prev => [newAlert, ...prev]);
    logAudit('إضافة تنبيه طبي', 'Customers', data.customer_id, `تمت إضافة ${data.alert_type}: ${data.alert_text}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('customer_medical_alerts').insert(cleanForSupabase(newAlert)).then(({ error }) => {
        if (error) console.error('Failed to save alert:', error);
      });
    }
    return newAlert;
  };

  const deleteMedicalAlert = (id: string) => {
    const alert = customerMedicalAlerts.find(a => a.id === id);
    if (alert) {
      setCustomerMedicalAlerts(prev => prev.filter(a => a.id !== id));
      logAudit('حذف تنبيه طبي', 'Customers', alert.customer_id, `تم حذف التنبيه: ${alert.alert_text}`);

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('customer_medical_alerts').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Failed to delete alert:', error);
        });
      }
    }
  };

  const getCustomerMedicalAlerts = (customerId: string): CustomerMedicalAlert[] => {
    return customerMedicalAlerts.filter(a => a.customer_id === customerId);
  };

  // Suppliers
  const addSupplier = (data: Omit<Supplier, 'id' | 'created_at'>): Supplier => {
    const newSupplier: Supplier = { ...data, id: `sup-${Date.now()}`, created_at: new Date().toISOString() };
    setSuppliers(prev => [newSupplier, ...prev]);
    logAudit('إضافة مورد جديد', 'Suppliers', newSupplier.id, `تمت إضافة المورد ${data.name}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('suppliers').insert(cleanForSupabase(newSupplier)).then(({ error }) => {
        if (error) console.error('Failed to save supplier:', error);
      });
    }
    return newSupplier;
  };

  const updateSupplier = (id: string, data: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...data } : s)));
    logAudit('تعديل بيانات مورد', 'Suppliers', id, `تم تحديث بيانات المورد`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('suppliers').update(data).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update supplier:', error);
      });
    }
  };

  const deleteSupplier = (id: string) => {
    const sup = suppliers.find(s => s.id === id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    logAudit('حذف مورد', 'Suppliers', id, `تم حذف المورد ${sup?.name || id}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('suppliers').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to delete supplier:', error);
      });
    }
  };

  const addPurchaseInvoice = (data: Omit<PurchaseInvoice, 'id' | 'created_at'>): PurchaseInvoice => {
    const newInvoice: PurchaseInvoice = { ...data, id: `pur-${Date.now()}`, created_at: new Date().toISOString() };
    setPurchaseInvoices(prev => [newInvoice, ...prev]);
    logAudit('إضافة فاتورة شراء', 'PurchaseInvoices', newInvoice.id, `فاتورة من ${data.supplier_name} بإجمالي ${data.total_amount} ج.م`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('purchase_invoices').insert(cleanForSupabase(newInvoice)).then(({ error }) => {
        if (error) console.error('Failed to save purchase invoice:', error);
      });
    }
    return newInvoice;
  };

  const recordSupplierPayment = (paymentData: {
    supplierId: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    purchaseInvoiceId?: string;
    notes?: string;
  }): SupplierPayment => {
    const supplier = suppliers.find(s => s.id === paymentData.supplierId);
    const prevBalance = getSupplierBalance(paymentData.supplierId);
    const newBalance = Math.max(0, prevBalance - paymentData.amount);

    const newPayment: SupplierPayment = {
      id: `suppay-${Date.now()}`,
      payment_code: generateCode('SUPPAY', supplierPayments.length),
      supplier_id: paymentData.supplierId,
      supplier_name: supplier?.name || 'مورد',
      purchase_invoice_id: paymentData.purchaseInvoiceId,
      amount: paymentData.amount,
      payment_method: paymentData.paymentMethod,
      previous_balance: prevBalance,
      new_balance: newBalance,
      notes: paymentData.notes,
      employee_name: currentUser.name,
      created_at: new Date().toISOString(),
    };

    setSupplierPayments(prev => [newPayment, ...prev]);

    if (paymentData.purchaseInvoiceId) {
      setPurchaseInvoices(prev =>
        prev.map(inv => {
          if (inv.id === paymentData.purchaseInvoiceId) {
            const newPaid = inv.paid_amount + paymentData.amount;
            const newRemaining = Math.max(0, inv.total_amount - newPaid);
            let status: 'paid' | 'partial' | 'unpaid' = 'paid';
            if (newPaid <= 0) status = 'unpaid';
            else if (newRemaining > 0) status = 'partial';
            return { ...inv, paid_amount: newPaid, remaining_amount: newRemaining, payment_status: status };
          }
          return inv;
        })
      );
    }

    logAudit('تسجيل دفعة مورد', 'SupplierPayments', newPayment.payment_code, `سداد ${paymentData.amount} ج.م للمورد ${supplier?.name}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('supplier_payments').insert(cleanForSupabase(newPayment)).then(({ error }) => {
        if (error) console.error('Failed to save supplier payment:', error);
      });
    }
    return newPayment;
  };

  const getSupplierBalance = (supplierId: string): number => {
    const invoices = purchaseInvoices.filter(inv => inv.supplier_id === supplierId);
    const payments = supplierPayments.filter(p => p.supplier_id === supplierId);
    const totalInvoices = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, totalInvoices - totalPaid);
  };

  // Employees
  const addEmployee = (data: Omit<Employee, 'id' | 'created_at'>): Employee => {
    const newEmployee: Employee = { ...data, id: `emp-${Date.now()}`, created_at: new Date().toISOString() };
    setEmployees(prev => [newEmployee, ...prev]);
    logAudit('إضافة موظف جديد', 'Employees', newEmployee.id, `تمت إضافة ${data.name} بوظيفة ${data.job_title}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('employees').insert(cleanForSupabase(newEmployee)).then(({ error }) => {
        if (error) console.error('Failed to save employee:', error);
      });
    }
    return newEmployee;
  };

  const updateEmployee = (id: string, data: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => (e.id === id ? { ...e, ...data } : e)));
    logAudit('تعديل بيانات موظف', 'Employees', id, `تم تحديث بيانات الموظف`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('employees').update(data).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update employee:', error);
      });
    }
  };

  const deleteEmployee = (id: string) => {
    const emp = employees.find(e => e.id === id);
    setEmployees(prev => prev.filter(e => e.id !== id));
    logAudit('حذف موظف', 'Employees', id, `تم حذف الموظف ${emp?.name || id}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('employees').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to delete employee:', error);
      });
    }
  };

  const markAttendance = (data: Omit<Attendance, 'id' | 'created_at'>): Attendance => {
    const existing = attendance.find(a => a.employee_id === data.employee_id && a.attendance_date === data.attendance_date);

    if (existing) {
      setAttendance(prev => prev.map(a => (a.id === existing.id ? { ...a, ...data } : a)));
      logAudit('تعديل حضور موظف', 'Attendance', existing.id, `${data.employee_name}: ${data.status}`);

      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('attendance').update(data).eq('id', existing.id).then(({ error }) => {
          if (error) console.error('Failed to update attendance:', error);
        });
      }
      return { ...existing, ...data };
    }

    const newAttendance: Attendance = { ...data, id: `att-${Date.now()}`, created_at: new Date().toISOString() };
    setAttendance(prev => [newAttendance, ...prev]);
    logAudit('تسجيل حضور موظف', 'Attendance', newAttendance.id, `${data.employee_name}: ${data.status}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('attendance').insert(cleanForSupabase(newAttendance)).then(({ error }) => {
        if (error) console.error('Failed to save attendance:', error);
      });
    }
    return newAttendance;
  };

  const getAttendanceByDate = (date: string): Attendance[] => {
    return attendance.filter(a => a.attendance_date === date);
  };

  const getEmployeeAttendance = (employeeId: string, month: number, year: number): Attendance[] => {
    return attendance.filter(a => {
      const d = new Date(a.attendance_date);
      return a.employee_id === employeeId && d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  };

  const calculatePayroll = (employeeId: string, month: number, year: number): Payroll => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) throw new Error('الموظف غير موجود');

    const empAttendance = getEmployeeAttendance(employeeId, month, year);
    const workingDays = empAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentDays = empAttendance.filter(a => a.status === 'absent').length;

    const dailyRate = employee.monthly_salary / 30;
    const deductions = dailyRate * absentDays;
    const netSalary = Math.max(0, employee.monthly_salary - deductions);

    const existing = payroll.find(p => p.employee_id === employeeId && p.month === month && p.year === year);

    if (existing) {
      return { ...existing, base_salary: employee.monthly_salary, working_days: workingDays, absent_days: absentDays, daily_rate: dailyRate, deductions, net_salary: netSalary };
    }

    return {
      id: `pr-${Date.now()}`,
      employee_id: employeeId,
      employee_name: employee.name,
      month, year,
      base_salary: employee.monthly_salary,
      working_days: workingDays,
      absent_days: absentDays,
      daily_rate: dailyRate,
      deductions,
      additions: 0,
      net_salary: netSalary,
      is_paid: false,
      created_at: new Date().toISOString(),
    };
  };

  const savePayroll = (data: Omit<Payroll, 'id' | 'created_at'>): Payroll => {
    const newPayroll: Payroll = { ...data, id: `pr-${Date.now()}`, created_at: new Date().toISOString() };
    setPayroll(prev => [newPayroll, ...prev]);
    logAudit('حفظ مرتب شهري', 'Payroll', newPayroll.id, `تم حفظ مرتب ${data.employee_name} لشهر ${data.month}/${data.year}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('payroll').insert(cleanForSupabase(newPayroll)).then(({ error }) => {
        if (error) console.error('Failed to save payroll:', error);
      });
    }
    return newPayroll;
  };

  const getPayroll = (employeeId: string, month: number, year: number): Payroll | null => {
    return payroll.find(p => p.employee_id === employeeId && p.month === month && p.year === year) || null;
  };

  const getCustomerBalance = (customerId: string): number => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.current_balance : 0;
  };

  const getCustomerMedicineHistory = (customerId: string): CustomerMedicineHistoryItem[] => {
    const customerSales = sales.filter(s => s.customer_id === customerId);
    const medMap: { [medName: string]: CustomerMedicineHistoryItem } = {};

    customerSales.forEach(sale => {
      const doctor = doctors.find(d => d.id === sale.doctor_id);
      const prescription = prescriptions.find(p => p.id === sale.prescription_id);

      sale.items.forEach(item => {
        const medInfo = medicines.find(m => m.id === item.medicine_id);
        if (!medMap[item.medicine_name]) {
          medMap[item.medicine_name] = {
            medicineId: item.medicine_id,
            medicineName: item.medicine_name,
            activeIngredient: medInfo?.active_ingredient,
            totalQuantity: item.quantity,
            lastDispensedDate: sale.created_at,
            doctorName: doctor?.name,
            prescriptionCode: prescription?.code,
          };
        } else {
          medMap[item.medicine_name].totalQuantity += item.quantity;
          if (new Date(sale.created_at) > new Date(medMap[item.medicine_name].lastDispensedDate)) {
            medMap[item.medicine_name].lastDispensedDate = sale.created_at;
            if (doctor) medMap[item.medicine_name].doctorName = doctor.name;
            if (prescription) medMap[item.medicine_name].prescriptionCode = prescription.code;
          }
        }
      });
    });

    return Object.values(medMap).sort((a, b) => new Date(b.lastDispensedDate).getTime() - new Date(a.lastDispensedDate).getTime());
  };

  // Customers
  const addCustomer = (data: Omit<Customer, 'id' | 'code' | 'created_at' | 'current_balance' | 'total_purchased' | 'total_paid'>): Customer => {
    const id = `cust-${Date.now()}`;
    const code = generateCode('CUST', customers.length);
    const newCustomer: Customer = {
      ...data, id, code,
      created_at: new Date().toISOString(),
      current_balance: 0,
      total_purchased: 0,
      total_paid: 0,
    };
    setCustomers(prev => [newCustomer, ...prev]);
    logAudit('إضافة عميل جديد', 'Customers', id, `تمت إضافة العميل ${data.name} هاتف: ${data.phone}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('customers').insert(cleanForSupabase(newCustomer)).then(({ error }) => {
        if (error) console.error('Failed to save customer:', error);
      });
    }
    return newCustomer;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    const updatedData = { ...data, updated_at: new Date().toISOString() };
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...updatedData } : c)));
    logAudit('تعديل بيانات عميل', 'Customers', id, `تم تحديث بيانات العميل`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('customers').update(updatedData).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update customer:', error);
      });
    }
  };

  const addDoctor = (data: Omit<Doctor, 'id' | 'code' | 'created_at'>): Doctor => {
    const id = `doc-${Date.now()}`;
    const code = generateCode('DOC', doctors.length);
    const newDoctor: Doctor = { ...data, id, code, created_at: new Date().toISOString() };
    setDoctors(prev => [newDoctor, ...prev]);
    logAudit('إضافة طبيب جديد', 'Doctors', id, `تمت إضافة الطبيب ${data.name}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('doctors').insert(cleanForSupabase(newDoctor)).then(({ error }) => {
        if (error) console.error('Failed to save doctor:', error);
      });
    }
    return newDoctor;
  };

  const updateDoctor = (id: string, data: Partial<Doctor>) => {
    setDoctors(prev => prev.map(d => (d.id === id ? { ...d, ...data } : d)));
    logAudit('تعديل بيانات طبيب', 'Doctors', id, `تم تحديث بيانات الطبيب`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('doctors').update(data).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update doctor:', error);
      });
    }
  };

  const addMedicine = (data: Omit<Medicine, 'id' | 'code' | 'created_at'>): Medicine => {
    const id = `med-${Date.now()}`;
    const code = generateCode('MED', medicines.length);
    const newMedicine: Medicine = { ...data, id, code, created_at: new Date().toISOString() };
    setMedicines(prev => [newMedicine, ...prev]);
    logAudit('إضافة دواء جديد للمخزون', 'Medicines', id, `تمت إضافة ${data.name}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('medicines').insert(cleanForSupabase(newMedicine)).then(({ error }) => {
        if (error) console.error('Failed to save medicine:', error);
      });
    }
    return newMedicine;
  };

  const updateMedicine = (id: string, data: Partial<Medicine>) => {
    const existing = medicines.find(m => m.id === id);
    const oldPrice = existing ? `${existing.selling_price} ج.م` : '';
    const newPrice = data.selling_price ? `${data.selling_price} ج.م` : '';

    setMedicines(prev => prev.map(m => (m.id === id ? { ...m, ...data } : m)));
    logAudit('تعديل بيانات دواء', 'Medicines', id, `تم تحديث بيانات دواء ${existing?.name || ''}`, oldPrice, newPrice);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('medicines').update(data).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update medicine:', error);
      });
    }
  };

  const adjustStock = (medicineId: string, quantityChange: number, reason: string) => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return;

    const previousStock = med.current_stock;
    const newStock = Math.max(0, previousStock + quantityChange);

    setMedicines(prev => prev.map(m => (m.id === medicineId ? { ...m, current_stock: newStock } : m)));

    const movement: StockMovement = {
      id: `sm-${Date.now()}`,
      medicine_id: medicineId,
      medicine_name: med.name,
      movement_type: 'adjustment',
      quantity: quantityChange,
      previous_stock: previousStock,
      new_stock: newStock,
      reference_id: `ADJ-${Date.now().toString().slice(-4)}`,
      notes: reason,
      created_at: new Date().toISOString(),
      employee_name: currentUser.name,
    };
    setStockMovements(prev => [movement, ...prev]);

    logAudit('تسوية مخزون دواء', 'Medicines', medicineId, `تعديل رصيد ${med.name} بمقدار ${quantityChange}`, `${previousStock}`, `${newStock}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('medicines').update({ current_stock: newStock }).eq('id', medicineId).then(({ error }) => {
        if (error) console.error('Failed to update stock:', error);
      });
    }
  };

  const deleteMedicine = (id: string) => {
    const med = medicines.find(m => m.id === id);
    setMedicines(prev => prev.filter(m => m.id !== id));
    logAudit('حذف دواء من المخزن', 'Medicines', id, `تم حذف دواء ${med?.name || id}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('medicines').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to delete medicine:', error);
      });
    }
  };

  const addPrescription = (data: Omit<Prescription, 'id' | 'code' | 'created_at'>): Prescription => {
    const id = `rx-${Date.now()}`;
    const code = generateCode('RX', prescriptions.length);
    const newPrescription: Prescription = { ...data, id, code, created_at: new Date().toISOString() };
    setPrescriptions(prev => [newPrescription, ...prev]);
    logAudit('إنشاء روشتة طبية', 'Prescriptions', id, `تسجيل روشتة برقم ${code}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('prescriptions').insert(cleanForSupabase(newPrescription)).then(({ error }) => {
        if (error) console.error('Failed to save prescription:', error);
      });
    }
    return newPrescription;
  };

  const updatePrescriptionStatus = (id: string, status: 'pending' | 'dispensed' | 'cancelled') => {
    setPrescriptions(prev => prev.map(p => (p.id === id ? { ...p, status } : p)));
    logAudit('تحديث حالة روشتة', 'Prescriptions', id, `تغيير حالة الروشتة إلى: ${status}`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('prescriptions').update({ status }).eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to update prescription status:', error);
      });
    }
  };

  const createSale = (saleData: {
    customerId?: string;
    customerName: string;
    doctorId?: string;
    prescriptionId?: string;
    items: {
      medicineId: string;
      medicineName: string;
      quantity: number;
      unitPrice: number;
      barcode?: string;
    }[];
    subtotal: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'credit';
    notes?: string;
  }): Sale => {
    const saleId = `sale-${Date.now()}`;
    const invoiceNumber = generateCode('INV', sales.length);
    const remainingAmount = Math.max(0, saleData.totalAmount - saleData.paidAmount);

    let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'paid';
    if (saleData.paidAmount <= 0) paymentStatus = 'unpaid';
    else if (remainingAmount > 0) paymentStatus = 'partial';

    const saleItems = saleData.items.map((item, idx) => ({
      id: `si-${Date.now()}-${idx}`,
      medicine_id: item.medicineId,
      medicine_name: item.medicineName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.quantity * item.unitPrice,
      barcode: item.barcode,
    }));

    const newSale: Sale = {
      id: saleId,
      invoice_number: invoiceNumber,
      customer_id: saleData.customerId,
      customer_name: saleData.customerName,
      doctor_id: saleData.doctorId,
      prescription_id: saleData.prescriptionId,
      items: saleItems,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total_amount: saleData.totalAmount,
      paid_amount: saleData.paidAmount,
      remaining_amount: remainingAmount,
      payment_status: paymentStatus,
      payment_method: saleData.paymentMethod,
      notes: saleData.notes,
      employee_name: currentUser.name,
      created_at: new Date().toISOString(),
    };

    setSales(prev => [newSale, ...prev]);

    const supabase = getSupabaseClient();
    if (supabase) {
      const { items, ...saleWithoutItems } = newSale;
      supabase.from('sales').insert(cleanForSupabase(saleWithoutItems as any)).then(({ error }) => {
        if (error) console.error('Failed to save sale:', error);
      });
    }

    const newStockMovements: StockMovement[] = [];
    setMedicines(prevMeds =>
      prevMeds.map(med => {
        const itemSold = saleData.items.find(i => i.medicineId === med.id);
        if (itemSold) {
          const previousStock = med.current_stock;
          const newStock = Math.max(0, previousStock - itemSold.quantity);

          newStockMovements.push({
            id: `sm-${Date.now()}-${med.id}`,
            medicine_id: med.id,
            medicine_name: med.name,
            movement_type: 'sale',
            quantity: -itemSold.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_id: invoiceNumber,
            notes: `صرف في فاتورة ${invoiceNumber}`,
            created_at: new Date().toISOString(),
            employee_name: currentUser.name,
          });

          if (newStock <= med.min_stock_level) {
            addNotification({
              type: 'low_stock',
              title: 'تنبيه نقص في المخزون',
              message: `دواء ${med.name} متبقي منه ${newStock} عبوات فقط`,
              severity: 'danger',
              link_tab: 'medicines'
            });
          }
          return { ...med, current_stock: newStock };
        }
        return med;
      })
    );

    if (newStockMovements.length > 0) setStockMovements(prev => [...newStockMovements, ...prev]);

    if (saleData.customerId) {
      const customer = customers.find(c => c.id === saleData.customerId);
      const prevBal = customer?.current_balance || 0;
      const newBal = prevBal + remainingAmount;

      setCustomers(prev =>
        prev.map(c =>
          c.id === saleData.customerId
            ? { ...c, current_balance: newBal, total_purchased: (c.total_purchased || 0) + saleData.totalAmount, total_paid: (c.total_paid || 0) + saleData.paidAmount }
            : c
        )
      );

      if (supabase && customer) {
        supabase.from('customers').update({
          current_balance: newBal,
          total_purchased: (customer.total_purchased || 0) + saleData.totalAmount,
          total_paid: (customer.total_paid || 0) + saleData.paidAmount,
        }).eq('id', saleData.customerId).then(({ error }) => {
          if (error) console.error('Failed to update customer balance:', error);
        });
      }

      const ledgerEntry: LedgerEntry = {
        id: `led-${Date.now()}`,
        created_at: new Date().toISOString(),
        customer_id: saleData.customerId,
        customer_name: saleData.customerName,
        entry_type: 'sale',
        reference_id: saleId,
        reference_code: invoiceNumber,
        debit: saleData.totalAmount,
        credit: saleData.paidAmount,
        balance_after: newBal,
        description: `فاتورة بيع ${invoiceNumber}`,
        employee_name: currentUser.name,
      };
      setLedgerEntries(prev => [ledgerEntry, ...prev]);

      if (supabase) {
        supabase.from('ledger_entries').insert(cleanForSupabase(ledgerEntry)).then(({ error }) => {
          if (error) console.error('Failed to save ledger entry:', error);
        });
      }

      if (saleData.paidAmount > 0) {
        const paymentCode = generateCode('PAY', payments.length);
        const paymentRecord: Payment = {
          id: `pay-${Date.now()}`,
          payment_code: paymentCode,
          customer_id: saleData.customerId,
          customer_name: saleData.customerName,
          sale_id: saleId,
          amount: saleData.paidAmount,
          payment_method: saleData.paymentMethod === 'credit' ? 'cash' : saleData.paymentMethod,
          previous_balance: prevBal + saleData.totalAmount,
          new_balance: newBal,
          notes: `سداد مباشر مع فاتورة ${invoiceNumber}`,
          employee_name: currentUser.name,
          created_at: new Date().toISOString(),
        };
        setPayments(prev => [paymentRecord, ...prev]);

        if (supabase) {
          supabase.from('payments').insert(cleanForSupabase(paymentRecord)).then(({ error }) => {
            if (error) console.error('Failed to save payment:', error);
          });
        }
      }
    }

    if (saleData.prescriptionId) {
      updatePrescriptionStatus(saleData.prescriptionId, 'dispensed');
    }

    logAudit('إنشاء فاتورة بيع', 'Sales', invoiceNumber, `فاتورة ${invoiceNumber} بإجمالي ${saleData.totalAmount} ج.م`);

    return newSale;
  };

  const recordPayment = (paymentData: {
    customerId: string;
    amount: number;
    paymentMethod: 'cash' | 'card' | 'bank_transfer';
    notes?: string;
  }): Payment => {
    const customer = customers.find(c => c.id === paymentData.customerId);
    const prevBalance = customer ? customer.current_balance : 0;
    const newBalance = Math.max(0, prevBalance - paymentData.amount);

    const paymentId = `pay-${Date.now()}`;
    const paymentCode = generateCode('PAY', payments.length);

    const newPayment: Payment = {
      id: paymentId,
      payment_code: paymentCode,
      customer_id: paymentData.customerId,
      customer_name: customer?.name || 'عميل',
      amount: paymentData.amount,
      payment_method: paymentData.paymentMethod,
      previous_balance: prevBalance,
      new_balance: newBalance,
      notes: paymentData.notes,
      employee_name: currentUser.name,
      created_at: new Date().toISOString(),
    };

    setPayments(prev => [newPayment, ...prev]);

    setCustomers(prev =>
      prev.map(c =>
        c.id === paymentData.customerId
          ? { ...c, current_balance: newBalance, total_paid: (c.total_paid || 0) + paymentData.amount }
          : c
      )
    );

    const ledgerEntry: LedgerEntry = {
      id: `led-${Date.now()}`,
      created_at: new Date().toISOString(),
      customer_id: paymentData.customerId,
      customer_name: customer?.name || 'عميل',
      entry_type: 'payment',
      reference_id: paymentId,
      reference_code: paymentCode,
      debit: 0,
      credit: paymentData.amount,
      balance_after: newBalance,
      description: `سند تحصيل ${paymentCode}`,
      employee_name: currentUser.name,
    };
    setLedgerEntries(prev => [ledgerEntry, ...prev]);

    logAudit('تسجيل دفعة سداد دين', 'Payments', paymentCode, `سداد ${paymentData.amount} ج.م`);

    const supabase = getSupabaseClient();
    if (supabase) {
      supabase.from('payments').insert(cleanForSupabase(newPayment)).then(({ error }) => {
        if (error) console.error('Failed to save payment:', error);
      });

      supabase.from('ledger_entries').insert(cleanForSupabase(ledgerEntry)).then(({ error }) => {
        if (error) console.error('Failed to save ledger entry:', error);
      });

      if (customer) {
        supabase.from('customers').update({
          current_balance: newBalance,
          total_paid: (customer.total_paid || 0) + paymentData.amount,
        }).eq('id', paymentData.customerId).then(({ error }) => {
          if (error) console.error('Failed to update customer:', error);
        });
      }
    }

    return newPayment;
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const resetAllData = () => {
    setSettings(initialSettings);
    setCustomers(initialCustomers);
    setDoctors(initialDoctors);
    setMedicines(initialMedicines);
    setPrescriptions(initialPrescriptions);
    setSales(initialSales);
    setPayments(initialPayments);
    setLedgerEntries(initialLedgerEntries);
    setStockMovements(initialStockMovements);
    setAuditLogs(initialAuditLogs);
    setNotifications(initialNotifications);
    setCustomerMedicalAlerts([]);
    setSuppliers([]);
    setPurchaseInvoices([]);
    setSupplierPayments([]);
    setEmployees([]);
    setAttendance([]);
    setPayroll([]);

    localStorage.removeItem('pharmacy_settings');
    localStorage.removeItem('pharmacy_customers');
    localStorage.removeItem('pharmacy_doctors');
    localStorage.removeItem('pharmacy_medicines');
    localStorage.removeItem('pharmacy_prescriptions');
    localStorage.removeItem('pharmacy_sales');
    localStorage.removeItem('pharmacy_payments');
    localStorage.removeItem('pharmacy_ledger');
    localStorage.removeItem('pharmacy_stock_movements');
    localStorage.removeItem('pharmacy_audit_logs');
    localStorage.removeItem('pharmacy_notifications');
    localStorage.removeItem('pharmacy_medical_alerts');
    localStorage.removeItem('pharmacy_suppliers');
    localStorage.removeItem('pharmacy_purchase_invoices');
    localStorage.removeItem('pharmacy_supplier_payments');
    localStorage.removeItem('pharmacy_employees');
    localStorage.removeItem('pharmacy_attendance');
    localStorage.removeItem('pharmacy_payroll');

    logAudit('إعادة تعيين البيانات', 'System', 'all', 'تمت استعادة البيانات التجريبية الأولية بنجاح');
  };

  const exportDatabaseJson = () => {
    const data = {
      settings, customers, doctors, medicines, prescriptions, sales, payments,
      ledgerEntries, stockMovements, auditLogs, notifications, customerMedicalAlerts,
      suppliers, purchaseInvoices, supplierPayments, employees, attendance, payroll,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.customers && data.medicines && data.sales) {
        if (data.settings) setSettings(data.settings);
        setCustomers(data.customers);
        setDoctors(data.doctors || []);
        setMedicines(data.medicines);
        setPrescriptions(data.prescriptions || []);
        setSales(data.sales);
        setPayments(data.payments || []);
        setLedgerEntries(data.ledgerEntries || []);
        setStockMovements(data.stockMovements || []);
        setAuditLogs(data.auditLogs || []);
        setNotifications(data.notifications || []);
        setCustomerMedicalAlerts(data.customerMedicalAlerts || []);
        setSuppliers(data.suppliers || []);
        setPurchaseInvoices(data.purchaseInvoices || []);
        setSupplierPayments(data.supplierPayments || []);
        setEmployees(data.employees || []);
        setAttendance(data.attendance || []);
        setPayroll(data.payroll || []);
        logAudit('استيراد قاعدة بيانات', 'System', 'backup', 'تم استيراد نسخة احتياطية بنجاح');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <PharmacyContext.Provider
      value={{
        currentUser, setCurrentUser, switchRole, settings, updateSettings,
        customers, doctors, medicines, prescriptions, sales, payments,
        ledgerEntries, stockMovements, auditLogs, notifications, customerMedicalAlerts,
        suppliers, purchaseInvoices, supplierPayments, employees, attendance, payroll,
        addCustomer, updateCustomer, addDoctor, updateDoctor, addMedicine, updateMedicine,
        adjustStock, deleteMedicine, addMedicalAlert, deleteMedicalAlert, getCustomerMedicalAlerts,
        addSupplier, updateSupplier, deleteSupplier, addPurchaseInvoice, recordSupplierPayment, getSupplierBalance,
        addEmployee, updateEmployee, deleteEmployee, markAttendance, getAttendanceByDate,
        getEmployeeAttendance, calculatePayroll, savePayroll, getPayroll,
        addPrescription, updatePrescriptionStatus, createSale, recordPayment,
        getCustomerBalance, getCustomerMedicineHistory,
        markNotificationRead, markAllNotificationsRead, resetAllData,
        exportDatabaseJson, importDatabaseJson,
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};