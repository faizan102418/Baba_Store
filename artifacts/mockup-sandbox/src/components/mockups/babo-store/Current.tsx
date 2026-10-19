import './source/index.css';
import App from './source/App';

const demoProducts = [
  {
    id: 'demo-sugar',
    name: 'Sugar',
    nameUrdu: 'چینی عمدہ',
    costPrice: 135,
    sellingPrice: 150,
    stock: 48,
    unit: 'kg',
    barcode: '89640001001',
    category: 'Grains & Sugar',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-atta',
    name: 'Wheat Flour · 10kg',
    nameUrdu: 'گندم کا آٹا',
    costPrice: 1100,
    sellingPrice: 1220,
    stock: 18,
    unit: 'bag',
    barcode: '89640001002',
    category: 'Flour & Grains',
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-ghee',
    name: 'Cooking Ghee · 1kg',
    nameUrdu: 'بناسپتی گھی',
    costPrice: 470,
    sellingPrice: 510,
    stock: 27,
    unit: 'packet',
    barcode: '89640001003',
    category: 'Oils & Ghee',
    minStockAlert: 8,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-tea',
    name: 'Tea Danedar',
    nameUrdu: 'دانہ دار چائے',
    costPrice: 540,
    sellingPrice: 590,
    stock: 12,
    unit: 'packet',
    barcode: '89640001004',
    category: 'Tea & Coffee',
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-dal',
    name: 'Chana Dal',
    nameUrdu: 'دال چنا',
    costPrice: 220,
    sellingPrice: 260,
    stock: 35,
    unit: 'kg',
    barcode: '89640001005',
    category: 'Pulses & Dal',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo-eggs',
    name: 'Farm Eggs',
    nameUrdu: 'فارمی انڈے',
    costPrice: 270,
    sellingPrice: 300,
    stock: 4,
    unit: 'dozen',
    barcode: '89640001006',
    category: 'Dairy & Eggs',
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
];

function seedPreviewData() {
  const previews: Record<string, unknown> = {
    babo_store_products_v3: demoProducts,
    babo_store_customers_v3: [
      {
        id: 'demo-customer',
        name: 'Ahmed Khan',
        phone: '0300-1234567',
        balance: 1250,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    babo_store_sales_v3: [
      {
        id: 'demo-sale',
        invoiceNumber: 'BS-1042',
        timestamp: new Date().toISOString(),
        items: [],
        subtotal: 2450,
        discount: 0,
        total: 2450,
        costTotal: 1980,
        profit: 470,
        tendered: 2500,
        change: 50,
        paymentType: 'cash',
      },
    ],
  };

  for (const [key, value] of Object.entries(previews)) {
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

export function Current() {
  seedPreviewData();
  return <App />;
}
