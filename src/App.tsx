import React, { useState, useEffect, useMemo } from 'react';
import { Product, Customer, Supplier, SupplierTransaction, Sale, KhataTransaction, Expense, ShopSettings } from './types';
import { calculateCashDrawerBreakdown } from './utils/accounting';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_TRANSACTIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_SALES,
  INITIAL_EXPENSES,
  INITIAL_SETTINGS,
  STARTER_KIRYANA_PRESETS,
  STORAGE_KEYS,
  loadFromStorage,
  saveToStorage,
} from './utils/storage';
import { sounds } from './utils/audio';
import { Navbar } from './components/Navbar';
import { POSScreen } from './components/POSScreen';
import { InventoryScreen } from './components/InventoryScreen';
import { KhataScreen } from './components/KhataScreen';
import { InvestorScreen } from './components/InvestorScreen';
import { QuickAddProductModal } from './components/QuickAddProductModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { MarketPurchaseModal } from './components/MarketPurchaseModal';

export default function App() {
  // Fresh Data States with LocalStorage Persistence
  const [products, setProducts] = useState<Product[]>(() =>
    loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS)
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    loadFromStorage(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS)
  );

  const [supplierTransactions, setSupplierTransactions] = useState<SupplierTransaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.SUPPLIER_TRANSACTIONS, INITIAL_SUPPLIER_TRANSACTIONS)
  );

  const [transactions, setTransactions] = useState<KhataTransaction[]>(() =>
    loadFromStorage(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS)
  );

  const [sales, setSales] = useState<Sale[]>(() =>
    loadFromStorage(STORAGE_KEYS.SALES, INITIAL_SALES)
  );

  const [expenses, setExpenses] = useState<Expense[]>(() =>
    loadFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES)
  );

  const [settings, setSettings] = useState<ShopSettings>(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS)
  );

  // Live real-time physical Cash in Drawer calculation (Accounting Engine)
  const cashBreakdown = useMemo(() => {
    return calculateCashDrawerBreakdown(settings, sales, expenses, transactions, supplierTransactions);
  }, [settings, sales, expenses, transactions, supplierTransactions]);

  // Active Screen: 'pos' | 'inventory' | 'khata' | 'investor'
  const [currentTab, setCurrentTab] = useState<'pos' | 'inventory' | 'khata' | 'investor'>('pos');

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMarketPurchaseOpen, setIsMarketPurchaseOpen] = useState(false);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);

  // Save to LocalStorage on updates
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.PRODUCTS, products);
  }, [products]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customers);
  }, [customers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SUPPLIERS, suppliers);
  }, [suppliers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SUPPLIER_TRANSACTIONS, supplierTransactions);
  }, [supplierTransactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SALES, sales);
  }, [sales]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Global Keyboard Shortcuts (F1: POS, F2: Stock, F3: Khata)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentTab('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setCurrentTab('khata');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Add Product Handler
  const handleAddProduct = (newProd: Omit<Product, 'id' | 'updatedAt'>) => {
    const product: Product = {
      ...newProd,
      id: `prod-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setProducts((prev) => [product, ...prev]);
  };

  // 2. Load Kiryana Staples Preset Helper (Optional 1-Click for Uncle)
  const handleLoadStaples = () => {
    const newItems: Product[] = STARTER_KIRYANA_PRESETS.map((item, idx) => ({
      ...item,
      id: `prod-staple-${Date.now()}-${idx}`,
      updatedAt: new Date().toISOString(),
    }));
    setProducts((prev) => [...prev, ...newItems]);
    sounds.playCashRegister();
  };

  // 3. Update Product Handler
  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  // 4. Delete Product Handler
  const handleDeleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // 5. Complete Sale Handler
  const handleCompleteSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'timestamp'>) => {
    const invoiceNum = `BS-${1000 + sales.length + 1}`;
    const newSale: Sale = {
      ...saleData,
      id: `sale-${Date.now()}`,
      invoiceNumber: invoiceNum,
      timestamp: new Date().toISOString(),
    };

    // Decrement stock for all sold items (COGS & Inventory Asset)
    setProducts((prev) =>
      prev.map((p) => {
        const soldItem = saleData.items.find((item) => item.productId === p.id);
        if (soldItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - soldItem.quantity),
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    // If placed on Khata (Credit), update customer debt (Accounts Receivable 10200)
    if (saleData.paymentType === 'credit' && saleData.customerId) {
      const cust = customers.find((c) => c.id === saleData.customerId);
      const newBal = (cust?.balance || 0) + saleData.total;

      setCustomers((prev) =>
        prev.map((c) => (c.id === saleData.customerId ? { ...c, balance: newBal, updatedAt: new Date().toISOString() } : c))
      );

      const newTxn: KhataTransaction = {
        id: `txn-${Date.now()}`,
        customerId: saleData.customerId,
        type: 'credit',
        amount: saleData.total,
        balanceAfter: newBal,
        timestamp: new Date().toISOString(),
        note: `Bill #${invoiceNum}`,
        saleId: newSale.id,
      };

      setTransactions((prev) => [newTxn, ...prev]);
    }

    setSales((prev) => [newSale, ...prev]);
    sounds.playCashRegister();
    setActiveReceiptSale(newSale);
  };

  // 6. Add Customer Handler (Accounts Receivable 10200)
  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const custId = `cust-${Date.now()}`;
    const newCustomer: Customer = {
      ...custData,
      id: custId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCustomers((prev) => [newCustomer, ...prev]);

    if (custData.balance > 0) {
      const initTxn: KhataTransaction = {
        id: `txn-${Date.now()}`,
        customerId: custId,
        type: 'credit',
        amount: custData.balance,
        balanceAfter: custData.balance,
        timestamp: new Date().toISOString(),
        note: 'Initial balance brought forward (سابقہ پرانا ادھار)',
      };
      setTransactions((prev) => [initTxn, ...prev]);
    }
  };

  // 7. Add customer khata transaction (credit or payment)
  const handleAddTransaction = (
    customerId: string,
    type: 'credit' | 'payment',
    amount: number,
    note?: string
  ) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;

    const delta = type === 'credit' ? amount : -amount;
    const balanceAfter = Math.max(0, customer.balance + delta);

    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, balance: balanceAfter, updatedAt: new Date().toISOString() } : c))
    );

    const newTxn: KhataTransaction = {
      id: `txn-${Date.now()}`,
      customerId,
      type,
      amount,
      balanceAfter,
      timestamp: new Date().toISOString(),
      note,
    };

    setTransactions((prev) => [newTxn, ...prev]);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setTransactions((prev) => prev.filter((t) => t.customerId !== id));
  };

  const handleDeleteTransaction = (id: string) => {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return;
    const revertAmount = txn.type === 'credit' ? -txn.amount : txn.amount;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === txn.customerId
          ? { ...c, balance: Math.max(0, c.balance + revertAmount), updatedAt: new Date().toISOString() }
          : c
      )
    );
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 8. Supplier Management Handlers (Accounts Payable 20100)
  const handleAddSupplier = (suppData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
    const suppId = `supp-${Date.now()}`;
    const newSupplier: Supplier = {
      ...suppData,
      id: suppId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSuppliers((prev) => [newSupplier, ...prev]);

    if (suppData.balance > 0) {
      const initTxn: SupplierTransaction = {
        id: `stxn-${Date.now()}`,
        supplierId: suppId,
        type: 'purchase_credit',
        amount: suppData.balance,
        balanceAfter: suppData.balance,
        timestamp: new Date().toISOString(),
        note: 'Previous debt brought forward (سابقہ واجب الادا ادھار)',
      };
      setSupplierTransactions((prev) => [initTxn, ...prev]);
    }
  };

  const handleAddSupplierTransaction = (
    supplierId: string,
    type: 'purchase_credit' | 'payment_made',
    amount: number,
    note?: string
  ) => {
    const supp = suppliers.find((s) => s.id === supplierId);
    if (!supp) return;

    const delta = type === 'purchase_credit' ? amount : -amount;
    const balanceAfter = Math.max(0, supp.balance + delta);

    setSuppliers((prev) =>
      prev.map((s) => (s.id === supplierId ? { ...s, balance: balanceAfter, updatedAt: new Date().toISOString() } : s))
    );

    const newTxn: SupplierTransaction = {
      id: `stxn-${Date.now()}`,
      supplierId,
      type,
      amount,
      balanceAfter,
      timestamp: new Date().toISOString(),
      note,
    };

    setSupplierTransactions((prev) => [newTxn, ...prev]);
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    setSupplierTransactions((prev) => prev.filter((t) => t.supplierId !== id));
  };

  const handleDeleteSupplierTransaction = (id: string) => {
    const stxn = supplierTransactions.find((t) => t.id === id);
    if (!stxn) return;
    const revertAmount = stxn.type === 'purchase_credit' ? -stxn.amount : stxn.amount;
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === stxn.supplierId
          ? { ...s, balance: Math.max(0, s.balance + revertAmount), updatedAt: new Date().toISOString() }
          : s
      )
    );
    setSupplierTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 9. Market Stock Purchase Handler (Cashier buys stock, pays later on credit or cash)
  const handleRecordMarketPurchase = (data: {
    supplierId?: string;
    newSupplierName?: string;
    newSupplierPhone?: string;
    totalBill: number;
    paidCashNow: number;
    unpaidCredit: number;
    note: string;
    purchaseHead?: 'asset_products' | 'asset_equipment' | 'expense_supplies';
    assetEquipmentName?: string;
    expenseItemName?: string;
    addedStockProduct?: {
      productId?: string;
      newProductName?: string;
      newProductNameUrdu?: string;
      qtyToAdd: number;
      unit?: any;
      dynamicCostPrice?: number;
      newSellingPrice?: number;
    };
  }) => {
    let targetSupplierId = data.supplierId;

    if (!targetSupplierId && data.newSupplierName) {
      targetSupplierId = `supp-${Date.now()}`;
      const newSupplier: Supplier = {
        id: targetSupplierId,
        name: data.newSupplierName,
        phone: data.newSupplierPhone || '0300-0000000',
        balance: data.unpaidCredit,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setSuppliers((prev) => [newSupplier, ...prev]);
    } else if (targetSupplierId && data.unpaidCredit > 0) {
      setSuppliers((prev) =>
        prev.map((s) =>
          s.id === targetSupplierId
            ? { ...s, balance: s.balance + data.unpaidCredit, updatedAt: new Date().toISOString() }
            : s
        )
      );
    }

    if (targetSupplierId) {
      if (data.unpaidCredit > 0) {
        const txnCredit: SupplierTransaction = {
          id: `stxn-${Date.now()}`,
          supplierId: targetSupplierId,
          type: 'purchase_credit',
          amount: data.unpaidCredit,
          balanceAfter: 0,
          timestamp: new Date().toISOString(),
          note: data.note,
        };
        setSupplierTransactions((prev) => [txnCredit, ...prev]);
      }
      if (data.purchaseHead !== 'expense_supplies' && data.paidCashNow > 0) {
        const txnCash: SupplierTransaction = {
          id: `stxn-${Date.now() + 1}`,
          supplierId: targetSupplierId,
          type: 'payment_made',
          amount: data.paidCashNow,
          balanceAfter: 0,
          timestamp: new Date().toISOString(),
          note: `Cash paid on delivery (${data.note})`,
        };
        setSupplierTransactions((prev) => [txnCash, ...prev]);
      }
    }

    // Auto-increase existing product stock or create new product with dynamic pricing
    if (data.addedStockProduct) {
      const { productId, newProductName, newProductNameUrdu, qtyToAdd, unit, dynamicCostPrice, newSellingPrice } = data.addedStockProduct;
      
      if (productId) {
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id !== productId) return p;
            return {
              ...p,
              stock: p.stock + qtyToAdd,
              costPrice: dynamicCostPrice && dynamicCostPrice > 0 ? dynamicCostPrice : p.costPrice,
              sellingPrice: newSellingPrice && newSellingPrice > 0 ? newSellingPrice : p.sellingPrice,
              updatedAt: new Date().toISOString(),
            };
          })
        );
      } else if (newProductName && qtyToAdd > 0) {
        const newProduct: Product = {
          id: `prod-${Date.now()}`,
          name: newProductName,
          nameUrdu: newProductNameUrdu,
          costPrice: dynamicCostPrice || 0,
          sellingPrice: newSellingPrice || 0,
          stock: qtyToAdd,
          unit: unit || 'packet',
          category: 'General',
          minStockAlert: 5,
          updatedAt: new Date().toISOString(),
        };
        setProducts((prev) => [newProduct, ...prev]);
      }
    }

    // If purchase head is store supplies / consumables, log as operational expense (50700)
    // Only log the actual cash paid now to prevent double-counting or fictitious expense before payment
    if (data.purchaseHead === 'expense_supplies' && data.paidCashNow > 0) {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        title: data.expenseItemName || data.note || 'Shop Consumables & Supplies',
        amount: data.paidCashNow,
        category: 'other',
        accountCode: '50700',
        timestamp: new Date().toISOString(),
        note: `Purchased from ${data.newSupplierName || 'Wholesale Market'}`,
      };
      setExpenses((prev) => [newExp, ...prev]);
    }
  };

  // 10. Add Expense Handler (50000 Expenses)
  const handleAddExpense = (expData: Omit<Expense, 'id' | 'timestamp'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setExpenses((prev) => [newExp, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  // 11. Clear All Data to Fresh Start
  const handleClearAllData = () => {
    setProducts([]);
    setCustomers([]);
    setSuppliers([]);
    setSupplierTransactions([]);
    setTransactions([]);
    setSales([]);
    setExpenses([]);
    setSettings(INITIAL_SETTINGS);
    sounds.playCashRegister();
  };

  // 12. Restore Full Data from Backup
  const handleRestoreData = (backup: {
    products: Product[];
    customers: Customer[];
    suppliers?: Supplier[];
    supplierTransactions?: SupplierTransaction[];
    sales: Sale[];
    expenses: Expense[];
    transactions: KhataTransaction[];
    settings: ShopSettings;
  }) => {
    if (backup.products) setProducts(backup.products);
    if (backup.customers) setCustomers(backup.customers);
    if (backup.suppliers) setSuppliers(backup.suppliers);
    if (backup.supplierTransactions) setSupplierTransactions(backup.supplierTransactions);
    if (backup.sales) setSales(backup.sales);
    if (backup.expenses) setExpenses(backup.expenses);
    if (backup.transactions) setTransactions(backup.transactions);
    if (backup.settings) setSettings(backup.settings);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onOpenMarketPurchase={() => setIsMarketPurchaseOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        cashDrawer={cashBreakdown.netCashDrawer}
      />

      {/* Main Body Screen */}
      <main className="flex-1">
        {currentTab === 'pos' && (
          <POSScreen
            products={products}
            customers={customers}
            sales={sales}
            expenses={expenses}
            transactions={transactions}
            supplierTransactions={supplierTransactions}
            settings={settings}
            onCompleteSale={handleCompleteSale}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onOpenMarketPurchase={() => setIsMarketPurchaseOpen(true)}
            onLoadStaples={handleLoadStaples}
            currency={settings.currency}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryScreen
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onOpenMarketPurchase={() => setIsMarketPurchaseOpen(true)}
            onLoadStaples={handleLoadStaples}
            currency={settings.currency}
          />
        )}

        {currentTab === 'khata' && (
          <KhataScreen
            customers={customers}
            transactions={transactions}
            suppliers={suppliers}
            supplierTransactions={supplierTransactions}
            sales={sales}
            expenses={expenses}
            onAddCustomer={handleAddCustomer}
            onAddTransaction={handleAddTransaction}
            onDeleteCustomer={handleDeleteCustomer}
            onDeleteTransaction={handleDeleteTransaction}
            onAddSupplier={handleAddSupplier}
            onAddSupplierTransaction={handleAddSupplierTransaction}
            onDeleteSupplier={handleDeleteSupplier}
            onDeleteSupplierTransaction={handleDeleteSupplierTransaction}
            onOpenMarketPurchase={() => setIsMarketPurchaseOpen(true)}
            settings={settings}
          />
        )}

        {currentTab === 'investor' && (
          <InvestorScreen
            sales={sales}
            expenses={expenses}
            products={products}
            customers={customers}
            suppliers={suppliers}
            supplierTransactions={supplierTransactions}
            transactions={transactions}
            settings={settings}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            onAddSupplier={handleAddSupplier}
            onAddSupplierTransaction={handleAddSupplierTransaction}
            onDeleteSupplier={handleDeleteSupplier}
            onDeleteSupplierTransaction={handleDeleteSupplierTransaction}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      {/* 10-Second Quick Add Product Modal */}
      <QuickAddProductModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddProduct={handleAddProduct}
      />

      {/* Market Stock Purchase Modal (Pay Later on Credit vs Pay Cash) */}
      <MarketPurchaseModal
        isOpen={isMarketPurchaseOpen}
        onClose={() => setIsMarketPurchaseOpen(false)}
        suppliers={suppliers}
        products={products}
        onRecordPurchase={handleRecordMarketPurchase}
        currency={settings.currency}
        cashDrawer={cashBreakdown.netCashDrawer}
      />

      {/* Thermal Receipt Print & WhatsApp Modal */}
      <ReceiptModal
        isOpen={!!activeReceiptSale}
        onClose={() => setActiveReceiptSale(null)}
        sale={activeReceiptSale}
        settings={settings}
      />

      {/* Shop Settings & Backup Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={setSettings}
        allData={{ products, customers, suppliers, supplierTransactions, sales, expenses, transactions }}
        onRestoreData={handleRestoreData}
        onResetToDemo={handleClearAllData}
      />
    </div>
  );
}
