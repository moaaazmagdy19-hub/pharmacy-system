import React, { useState, useEffect } from 'react';
import { PharmacyProvider, usePharmacy } from './context/PharmacyContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { LoginPage } from './components/auth/LoginPage';

// Views
import { Dashboard } from './components/dashboard/Dashboard';
import { QuickSale } from './components/pos/QuickSale';
import { PosCheckout } from './components/pos/PosCheckout';
import { CustomerList } from './components/customers/CustomerList';
import { CustomerProfile } from './components/customers/CustomerProfile';
import { MedicineList } from './components/medicines/MedicineList';
import { PrescriptionList } from './components/prescriptions/PrescriptionList';
import { DoctorList } from './components/doctors/DoctorList';
import { SalesList } from './components/sales/SalesList';
import { PaymentList } from './components/payments/PaymentList';
import { DebtManagement } from './components/debts/DebtManagement';
import { FinancialLedger } from './components/ledger/FinancialLedger';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogView } from './components/audit/AuditLogView';
import { SettingsView } from './components/settings/SettingsView';
import { SupplierList } from './components/suppliers/SupplierList';
import { SupplierProfile } from './components/suppliers/SupplierProfile';
import { AttendanceView } from './components/attendance/AttendanceView';

// Modals
import { CustomerFormModal } from './components/customers/CustomerFormModal';
import { MedicineFormModal } from './components/medicines/MedicineFormModal';
import { PrescriptionModal } from './components/prescriptions/PrescriptionModal';
import { DoctorModal } from './components/doctors/DoctorModal';
import { RecordPaymentModal } from './components/payments/RecordPaymentModal';

import { Customer, Medicine, Doctor, Prescription } from './types';

const MainApp: React.FC = () => {
  const {
    addCustomer,
    updateCustomer,
    addMedicine,
    updateMedicine,
    addDoctor,
    updateDoctor,
    medicines,
  } = usePharmacy();

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [viewCustomerId, setViewCustomerId] = useState<string | null>(null);
  const [viewSupplierId, setViewSupplierId] = useState<string | null>(null);

  // Preloaded data for POS
  const [posCustomerId, setPosCustomerId] = useState<string | undefined>(undefined);
  const [pendingCartItem, setPendingCartItem] = useState<{ customerId: string; medicineId: string } | null>(null);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [isMedicineModalOpen, setIsMedicineModalOpen] = useState(false);
  const [medicineToEdit, setMedicineToEdit] = useState<Medicine | null>(null);

  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [doctorToEdit, setDoctorToEdit] = useState<Doctor | null>(null);

  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string | undefined>(undefined);

  // Global keyboard shortcut: Ctrl+K or Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Action handlers
  const handleOpenNewSale = (customerId?: string) => {
    setPosCustomerId(customerId);
    setActiveTab('pos');
    setViewCustomerId(null);
  };

  const handleOpenRecordPayment = (customerId?: string) => {
    setPaymentCustomerId(customerId);
    setIsPaymentModalOpen(true);
  };

  const handleSelectCustomer = (customerId: string) => {
    setViewCustomerId(customerId);
    setActiveTab('customers');
  };

  const handleDispensePrescription = (prescription: Prescription) => {
    setPosCustomerId(prescription.customer_id);
    setActiveTab('pos');
  };

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    if (tab !== 'customers') {
      setViewCustomerId(null);
    }
    if (tab !== 'suppliers') {
      setViewSupplierId(null);
    }
    setIsMobileMenuOpen(false);
  };

  const handleAddMedicineToCart = (customerId: string, medicineId: string) => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) {
      alert('الدواء غير موجود في المخزون!');
      return;
    }

    setPosCustomerId(customerId);
    setPendingCartItem({ customerId, medicineId });
    setActiveTab('pos');
    setViewCustomerId(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-100 selection:text-blue-900">
      <Header
        onOpenGlobalSearch={() => setIsSearchOpen(true)}
        onOpenNewSale={() => handleOpenNewSale()}
        onOpenNewCustomer={() => {
          setCustomerToEdit(null);
          setIsCustomerModalOpen(true);
        }}
        onOpenNewMedicine={() => {
          setMedicineToEdit(null);
          setIsMedicineModalOpen(true);
        }}
        onOpenNewPrescription={() => setIsPrescriptionModalOpen(true)}
        onOpenRecordPayment={() => handleOpenRecordPayment()}
        onNavigateTab={handleSelectTab}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigateTab={handleSelectTab} />
          )}

          {activeTab === 'quick-sale' && (
            <QuickSale onBack={() => setActiveTab('dashboard')} />
          )}

          {activeTab === 'pos' && (
            <PosCheckout
              initialCustomerId={posCustomerId}
              pendingCartItem={pendingCartItem}
              onClearPendingCartItem={() => setPendingCartItem(null)}
              onOpenNewCustomerModal={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              onNavigateToCustomerProfile={handleSelectCustomer}
            />
          )}

          {activeTab === 'customers' && (
            viewCustomerId ? (
              <CustomerProfile
                customerId={viewCustomerId}
                onBack={() => setViewCustomerId(null)}
                onOpenNewSaleForCustomer={(cId) => handleOpenNewSale(cId)}
                onOpenRecordPayment={(cId) => handleOpenRecordPayment(cId)}
                onEditCustomer={(customer) => {
                  setCustomerToEdit(customer);
                  setIsCustomerModalOpen(true);
                }}
                onAddMedicineToCart={handleAddMedicineToCart}
              />
            ) : (
              <CustomerList
                onSelectCustomer={handleSelectCustomer}
                onOpenNewCustomer={() => {
                  setCustomerToEdit(null);
                  setIsCustomerModalOpen(true);
                }}
                onOpenNewSale={(cId) => handleOpenNewSale(cId)}
                onOpenRecordPayment={(cId) => handleOpenRecordPayment(cId)}
              />
            )
          )}

          {activeTab === 'new-customer' && (
            <CustomerList
              onSelectCustomer={handleSelectCustomer}
              onOpenNewCustomer={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenNewSale={(cId) => handleOpenNewSale(cId)}
              onOpenRecordPayment={(cId) => handleOpenRecordPayment(cId)}
            />
          )}

          {activeTab === 'medicines' && (
            <MedicineList
              onOpenNewMedicine={() => {
                setMedicineToEdit(null);
                setIsMedicineModalOpen(true);
              }}
              onEditMedicine={(med) => {
                setMedicineToEdit(med);
                setIsMedicineModalOpen(true);
              }}
            />
          )}

          {activeTab === 'prescriptions' && (
            <PrescriptionList
              onOpenNewPrescription={() => setIsPrescriptionModalOpen(true)}
              onDispensePrescription={handleDispensePrescription}
            />
          )}

          {activeTab === 'doctors' && (
            <DoctorList
              onOpenNewDoctor={() => {
                setDoctorToEdit(null);
                setIsDoctorModalOpen(true);
              }}
              onEditDoctor={(doc) => {
                setDoctorToEdit(doc);
                setIsDoctorModalOpen(true);
              }}
            />
          )}

          {activeTab === 'sales' && (
            <SalesList onOpenNewSale={() => handleOpenNewSale()} />
          )}

          {activeTab === 'payments' && (
            <PaymentList
              onOpenRecordPayment={() => handleOpenRecordPayment()}
              onSelectCustomer={handleSelectCustomer}
            />
          )}

          {activeTab === 'debts' && (
            <DebtManagement
              onSelectCustomer={handleSelectCustomer}
              onOpenRecordPayment={(cId) => handleOpenRecordPayment(cId)}
            />
          )}

          {activeTab === 'suppliers' && (
            viewSupplierId ? (
              <SupplierProfile
                supplierId={viewSupplierId}
                onBack={() => setViewSupplierId(null)}
              />
            ) : (
              <SupplierList onSelectSupplier={(id) => setViewSupplierId(id)} />
            )
          )}

          {activeTab === 'attendance' && (
            <AttendanceView />
          )}

          {activeTab === 'ledger' && (
            <FinancialLedger onSelectCustomer={handleSelectCustomer} />
          )}

          {activeTab === 'reports' && (
            <ReportsView />
          )}

          {activeTab === 'audit' && (
            <AuditLogView />
          )}

          {activeTab === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectCustomer={handleSelectCustomer}
        onSelectMedicine={() => {
          setActiveTab('medicines');
        }}
        onSelectPrescription={() => {
          setActiveTab('prescriptions');
        }}
        onSelectDoctor={() => {
          setActiveTab('doctors');
        }}
        onNavigateTab={handleSelectTab}
      />

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        onSubmit={(data) => {
          if (customerToEdit) {
            updateCustomer(customerToEdit.id, data);
          } else {
            addCustomer(data);
          }
        }}
      />

      <MedicineFormModal
        isOpen={isMedicineModalOpen}
        onClose={() => {
          setIsMedicineModalOpen(false);
          setMedicineToEdit(null);
        }}
        medicineToEdit={medicineToEdit}
        onSubmit={(data) => {
          if (medicineToEdit) {
            updateMedicine(medicineToEdit.id, data);
          } else {
            addMedicine(data);
          }
        }}
      />

      <DoctorModal
        isOpen={isDoctorModalOpen}
        onClose={() => {
          setIsDoctorModalOpen(false);
          setDoctorToEdit(null);
        }}
        doctorToEdit={doctorToEdit}
        onSubmit={(data) => {
          if (doctorToEdit) {
            updateDoctor(doctorToEdit.id, data);
          } else {
            addDoctor(data);
          }
        }}
      />

      <PrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentCustomerId(undefined);
        }}
        initialCustomerId={paymentCustomerId}
      />
    </div>
  );
};

// ✅ التحقق من تسجيل الدخول
const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('pharmacy_auth') === 'true';
  });

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <PharmacyProvider>
      <MainApp />
    </PharmacyProvider>
  );
};

export default App;