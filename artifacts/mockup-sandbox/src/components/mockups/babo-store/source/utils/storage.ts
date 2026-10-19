import { Product, Customer, Supplier, SupplierTransaction, KhataTransaction, Sale, Expense, ShopSettings } from '../types';

// Empty fresh start data (zero dummy data)
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_CUSTOMERS: Customer[] = [];
export const INITIAL_SUPPLIERS: Supplier[] = [];
export const INITIAL_SUPPLIER_TRANSACTIONS: SupplierTransaction[] = [];
export const INITIAL_TRANSACTIONS: KhataTransaction[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_EXPENSES: Expense[] = [];

// Optional quick staples that the user can import in 1 click if desired
export const STARTER_KIRYANA_PRESETS: Omit<Product, 'id' | 'updatedAt'>[] = [
  {
    name: 'Sugar (چینی)',
    nameUrdu: 'چینی عمدہ',
    costPrice: 135,
    sellingPrice: 150,
    stock: 50,
    unit: 'kg',
    barcode: '89640001001',
    category: 'Grains & Sugar',
    minStockAlert: 10,
  },
  {
    name: 'Wheat Flour / Atta 10kg (آٹا ۱۰ کلو)',
    nameUrdu: 'گندم کا آٹا ۱۰ کلو تھیلا',
    costPrice: 1100,
    sellingPrice: 1220,
    stock: 20,
    unit: 'bag',
    barcode: '89640001002',
    category: 'Flour & Grains',
    minStockAlert: 5,
  },
  {
    name: 'Cooking Ghee 1kg (گھی پاؤچ)',
    nameUrdu: 'بناسپتی گھی ۱ کلو پاؤچ',
    costPrice: 470,
    sellingPrice: 510,
    stock: 30,
    unit: 'packet',
    barcode: '89640001003',
    category: 'Oils & Ghee',
    minStockAlert: 8,
  },
  {
    name: 'Tea Danedar (دانہ دار چائے)',
    nameUrdu: 'تپال دانہ دار چائے',
    costPrice: 540,
    sellingPrice: 590,
    stock: 20,
    unit: 'packet',
    barcode: '89640001004',
    category: 'Tea & Coffee',
    minStockAlert: 5,
  },
  {
    name: 'Dal Chana (دال چنا)',
    nameUrdu: 'دال چنا سپیشل',
    costPrice: 220,
    sellingPrice: 260,
    stock: 35,
    unit: 'kg',
    barcode: '89640001005',
    category: 'Pulses & Dal',
    minStockAlert: 10,
  },
  {
    name: 'Farm Eggs (انڈے درجن)',
    nameUrdu: 'فارمی انڈے درجن',
    costPrice: 270,
    sellingPrice: 300,
    stock: 15,
    unit: 'dozen',
    barcode: '89640001006',
    category: 'Dairy & Eggs',
    minStockAlert: 5,
  }
];

export const INITIAL_SETTINGS: ShopSettings = {
  shopName: 'Babo Store',
  shopNameUrdu: 'بابو کریانہ سٹور',
  ownerName: 'Babo & Family',
  phone: '0300-1234567',
  address: 'Main Bazaar',
  currency: 'Rs',
  investorPin: '1234',
  initialCashInDrawer: 5000,
  dailyTarget: 30000,
  investorSharePercent: 50,
  investorCapital: 100000, // 30100 Initial capital
  cashierCapital: 20000,   // 30200
  bankBalance: 0,          // 10400
};

// Storage keys for Babo Store
export const STORAGE_KEYS = {
  PRODUCTS: 'babo_store_products_v3',
  CUSTOMERS: 'babo_store_customers_v3',
  SUPPLIERS: 'babo_store_suppliers_v3',
  SUPPLIER_TRANSACTIONS: 'babo_store_supplier_txns_v3',
  TRANSACTIONS: 'babo_store_transactions_v3',
  SALES: 'babo_store_sales_v3',
  EXPENSES: 'babo_store_expenses_v3',
  SETTINGS: 'babo_store_settings_v3',
};

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed reading ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed writing ${key} to localStorage:`, err);
  }
}
