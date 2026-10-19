export type UnitType = 'kg' | 'packet' | 'piece' | 'liter' | 'gram' | 'dozen' | 'bag';

export interface Product {
  id: string;
  name: string;
  nameUrdu?: string;
  costPrice: number;    // خرید قیمت
  sellingPrice: number; // فروخت قیمت
  stock: number;        // موجودہ اسٹاک
  unit: UnitType;
  barcode?: string;
  category: string;
  minStockAlert: number;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  nameUrdu?: string;
  quantity: number;
  unit: UnitType;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  timestamp: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  costTotal: number;
  profit: number;
  tendered: number;
  change: number;
  paymentType: 'cash' | 'credit';
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  balance: number; // Positive = customer owes shop (Accounts Receivable)
  createdAt: string;
  updatedAt: string;
}

export type KhataType = 'credit' | 'payment'; // credit = ادھار دیا, payment = وصولی کی

export interface KhataTransaction {
  id: string;
  customerId: string;
  type: KhataType;
  amount: number;
  balanceAfter: number;
  timestamp: string;
  note?: string;
  saleId?: string;
}

// Supplier (Wholesaler / Market Dealer) - Accounts Payable (20100)
export interface Supplier {
  id: string;
  name: string;
  nameUrdu?: string;
  phone: string;
  address?: string;
  balance: number; // Positive = shop owes money to supplier (Accounts Payable)
  createdAt: string;
  updatedAt: string;
}

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: 'purchase_credit' | 'payment_made'; // purchase_credit = خریدا (بڑھ گیا), payment_made = ادا کیا (کم ہو گیا)
  amount: number;
  balanceAfter: number;
  timestamp: string;
  note?: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'rent' | 'electricity' | 'salary' | 'refreshment' | 'transport' | 'other';
  accountCode?: string; // 50200, 50300, etc.
  timestamp: string;
  note?: string;
}

export interface ShopSettings {
  shopName: string;
  shopNameUrdu: string;
  ownerName: string;
  phone: string;
  address: string;
  currency: string;
  investorPin: string;
  initialCashInDrawer: number;
  dailyTarget: number;
  investorSharePercent: number;
  investorCapital: number;   // Account 30100
  cashierCapital: number;    // Account 30200
  bankBalance: number;       // Account 10400
}

// Standard Chart of Accounts (COA) Structure
export type AccountGroupCode = '10000' | '20000' | '30000' | '40000' | '50000';

export interface AccountGroup {
  code: AccountGroupCode;
  name: string;
  nameUrdu: string;
  type: 'debit' | 'credit'; // normal balance
}

export interface AccountItem {
  code: string;
  groupCode: AccountGroupCode;
  name: string;
  nameUrdu: string;
  description: string;
  isSystem: boolean; // Auto-calculated from live shop operational state
}

export interface ManualJournalEntry {
  id: string;
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  reference?: string;
}
