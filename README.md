# 🏪 Babo Store — Kiryana POS & Dukan Khata System
### بابو کریانہ سٹور — پوائنٹ آف سیل اور دکان کھاتہ

A production-ready, hyper-simplified Point-of-Sale (POS), Customer & Supplier Khata (Credit Ledger), and Double-Entry Chart of Accounts system built specifically for retail grocery and Kiryana shops. Designed for instant 2-click checkouts, high-contrast bilingual (English & Urdu) operation, and 100% offline-first capability.

[![React 19](https://img.shields.io/badge/React-19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline--First-emerald.svg)](https://web.dev/progressive-web-apps/)

---

## 🚀 Deployment Status: **100% READY TO DEPLOY**

The codebase is fully compiled, type-checked, and production-tested:
- ✅ **Build Test**: `npm run build` compiles in ~1 second into a minified `/dist` bundle.
- ✅ **Type Safety**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- ✅ **Offline-First PWA**: Pre-configured Service Worker (`vite-plugin-pwa`) and Web App Manifest allow running with zero internet connection on any laptop, tablet, or phone.
- ✅ **Database**: Uses browser-native persistent storage (IndexedDB / LocalStorage) with zero database server installation needed.

---

## ✨ Core Features

### 1. 🛒 Rapid Kiryana POS (کاؤنٹر سیلز)
- **2-Click Checkout**: Instant toggle between **Cash (نقد)** and **Khata Credit (ادھار)**.
- **Bilingual Search**: Search products in English, Urdu, or by barcode scanner.
- **Daily Sales Insights**: Real-time counter at top showing today's Cash, Credit, and Gross Profit.
- **Thermal Receipt & WhatsApp**: Generate 58mm/80mm thermal receipts or send instant itemized WhatsApp receipts to customer phone numbers.
- **Audio Feedback**: Authentic cash register and barcode scanner sound effects using Web Audio API.

### 2. 📦 Inventory & Dynamic Market Procurement (اسٹاک مینجمنٹ)
- **10-Second Quick Add**: Rapidly create new inventory items with cost, sale price, unit (`kg`, `packet`, `piece`, `liter`, `bag`, `dozen`), and low-stock alerts.
- **Market Stock Purchases**: Cashiers buying stock in bulk from market dealers can record purchases as:
  - **Paid in Cash**: Deducts immediately from Cash Drawer (`10100`).
  - **Credit / Pay Later**: Automatically logged into Supplier Accounts Payable (`20100`).
  - **Dynamic Cost Updates**: Automatically updates weighted wholesale cost and retail prices.

### 3. 📒 Dual Khata System (گاہک اور سپلائر کھاتہ)
- **Customer Khata (10200 Accounts Receivable)**:
  - Track customer balances, issue credit sales, and record cash recoveries.
  - Automatic balance recalculation upon ledger entry deletion.
- **Wholesale Supplier Khata (20100 Accounts Payable)**:
  - Manage wholesale agencies and mandi dealers.
  - Track stock bought on credit vs. bill payments made.

### 4. 📈 Investor & Financial Reporting (انویسٹر موڈ و چارٹ آف اکاؤنٹس)
- **PIN Protected**: Secured with a 4-digit PIN (default: `1234`).
- **5-Tier Chart of Accounts**:
  - `10000` **Assets (اثاثہ جات)**: Cash Drawer (`10100`), Customer Receivables (`10200`), Stock Inventory (`10300`), Bank (`10400`).
  - `20000` **Liabilities (واجبات)**: Supplier Payables (`20100`), Short-term Debt (`20200`).
  - `30000` **Equity (سرمایہ)**: Investor Capital (`30100`), Cashier Capital (`30200`), Retained Earnings (`30300`).
  - `40000` **Revenue (آمدنی)**: Retail Sales (`40100`).
  - `50000` **Expenses & COGS (اخراجات و مال لاگت)**: COGS (`50100`), Rent (`50200`), Electricity (`50300`), Wages (`50400`), Freight (`50500`), Refreshment (`50700`).
- **Balance Sheet Check**: Verifies that $\text{Assets} = \text{Liabilities} + \text{Equity}$.
- **Sales History & Date-Range Filter**: Filter sales by Today, Yesterday, This Week, This Month, Last Month, or Custom Calendar Dates.
- **Visual Revenue Trends**: Bar chart visualizing daily sales volume and profit trends.

### 5. 📊 Excel & Data Security (ڈیٹا بیک اپ)
- **Excel CSV Export**: Download Inventory, Sales, and Khata Transactions as CSV spreadsheets with **UTF-8 BOM** for flawless Urdu character display in Microsoft Excel.
- **JSON System Backup**: 1-click full backup file download for easy migration across laptops.
- **One-Click Restore**: Upload previous backup files to restore entire store state in seconds.

---

## 🛠️ Tech Stack

| Technology | Purpose |
| :--- | :--- |
| **React 19** | Modern functional UI with React Hooks |
| **TypeScript** | Strict compile-time typing and accounting models |
| **Tailwind CSS v4** | Clean, high-contrast, zero-pill styling |
| **Vite 8** | Ultra-fast build tool and bundler |
| **Vite PWA** | Workbox service worker caching for 100% offline usage |
| **Lucide Icons** | Accessible iconography |
| **Web Audio API** | Zero-latency custom synthesizer sounds |

---

## 📁 Project Structure

```text
Baba_Store/
├── index.html                   # HTML entry point with PWA meta & fonts
├── metadata.json                # Project branding metadata
├── package.json                 # Dependencies & build scripts
├── tsconfig.json                # TypeScript strict configuration
├── vite.config.ts               # Vite configuration with Tailwind & VitePWA
├── public/
│   └── icon.svg                 # PWA App Icon (512x512)
└── src/
    ├── main.tsx                 # React app bootstrap
    ├── App.tsx                  # Root state orchestration & navigation
    ├── index.css                # Tailwind CSS v4 styling & custom fonts
    ├── components/
    │   ├── AccountChartComponent.tsx # 5-Tier Chart of Accounts display
    │   ├── FastAPIDeploymentModal.tsx# Optional backend deployment guide
    │   ├── InventoryScreen.tsx       # Stock list, search & stock adjustments
    │   ├── InvestorScreen.tsx        # Financial reports, trends & supplier khata
    │   ├── KhataScreen.tsx           # Customer credit management & ledger
    │   ├── MarketPurchaseModal.tsx   # Bulk stock acquisition modal
    │   ├── Navbar.tsx                # Top navigation & quick actions
    │   ├── POSScreen.tsx             # Counter checkout & barcode register
    │   ├── PWAInstallButton.tsx      # Desktop/mobile install prompt
    │   ├── QuickAddProductModal.tsx  # 10-second product entry modal
    │   ├── ReceiptModal.tsx          # Thermal receipt print & WhatsApp modal
    │   └── SettingsModal.tsx         # Store profile, CSV export & backup
    ├── types/
    │   └── index.ts                  # Type definitions (Product, Sale, Customer, etc.)
    └── utils/
        ├── accounting.ts             # Double-entry balance calculation engine
        ├── audio.ts                  # Web Audio chimes (cash register, scanner)
        ├── csvExport.ts              # Excel CSV export with UTF-8 BOM
        ├── mockData.ts               # Initial store constants
        └── storage.ts                # LocalStorage & IndexedDB persistent layer
```

---

## 📦 How to Deploy

### Option 1: Cloud Deployment (Vercel, Netlify, Cloudflare Pages)

#### Deploy to Vercel (Recommended):
1. Push this repository to GitHub: `https://github.com/faizan102418/Baba_Store.git`.
2. Log into [vercel.com](https://vercel.com) and click **Add New Project**.
3. Import your `Baba_Store` repository.
4. Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your app will be live with a secure HTTPS URL in under 1 minute.

#### Deploy to Netlify:
1. Connect repository on [netlify.com](https://netlify.com).
2. Set Build Command: `npm run build`.
3. Set Publish Directory: `dist`.
4. Deploy!

---

### Option 2: Deploy on Shop Laptop (100% Offline Counter Use)

No database server or internet connection is required on the counter laptop.

#### Step 1: Install Dependencies & Build
```bash
# Clone the repository
git clone https://github.com/faizan102418/Baba_Store.git
cd Baba_Store

# Install packages
npm install

# Build production bundle
npm run build
```

#### Step 2: Serve Locally
You can serve the production build offline on the counter laptop using any static server:
```bash
# Using npx serve
npx serve -s dist -l 3000
```
Open Chrome or Edge at `http://localhost:3000`.

#### Step 3: Install as Desktop App
1. In Google Chrome or Microsoft Edge, look at the right side of the address bar.
2. Click the **Install App (Babo Store)** button.
3. The app opens in its own window and is pinned to the Windows Taskbar/Desktop.
4. It will now open and run **completely offline without internet**.

---

### Option 3: Docker Deployment

Create a `Dockerfile` for containerized environments:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:
```bash
docker build -t babo-store .
docker run -d -p 80:80 --name babo-store-app babo-store
```

---

## 🔐 Default Credentials & Initial Setup

* **Default Shop Name**: Babo Store (`بابو کریانہ سٹور`)
* **Default Investor PIN**: `1234`
* **Default Currency**: `Rs` (Pakistani Rupee)
* **Initial State**: Pristine empty state (zero dummy records) ready for real inventory entry. Click **Settings** to customize shop name, address, and starting cash in drawer.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
