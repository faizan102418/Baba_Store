import React, { useState } from 'react';
import { X, Code2, Server, Terminal, ShieldCheck, Copy, Check, FileUp, Cpu, Database } from 'lucide-react';

interface FastAPIDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FastAPIDeploymentModal: React.FC<FastAPIDeploymentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'structure' | 'docker' | 'cicd' | 'fileupload'>('structure');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const projectStructureCode = `# RECOMMENDED FASTAPI PROJECT STRUCTURE (ZERO EXISTING DATA)
mama_g_pos/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI app factory, CORS, routers
│   │   ├── config.py                # Pydantic BaseSettings (DB_URL, PIN, JWT)
│   │   ├── database.py              # SQLAlchemy engine & SessionLocal (SQLite/Postgres)
│   │   ├── models/                  # SQLAlchemy ORM Models
│   │   │   ├── __init__.py
│   │   │   ├── product.py           # id, name, name_urdu, cost_price, selling_price, stock
│   │   │   ├── sale.py              # id, invoice_no, total, profit, tendered, payment_type
│   │   │   ├── customer.py          # id, name, phone, balance
│   │   │   └── transaction.py       # id, customer_id, type (credit/payment), amount
│   │   ├── schemas/                 # Pydantic v2 Request/Response Schemas
│   │   │   ├── product.py
│   │   │   ├── sale.py
│   │   │   └── customer.py
│   │   ├── routers/                 # API Route Endpoints
│   │   │   ├── products.py          # GET /api/products, POST /api/products, PATCH /api/products/{id}
│   │   │   ├── pos.py               # POST /api/checkout (Atomic stock decrement + sale record)
│   │   │   ├── khata.py             # GET /api/customers, POST /api/khata/transaction
│   │   │   ├── reports.py           # GET /api/reports/daily, GET /api/reports/investor
│   │   │   └── upload.py            # POST /api/upload/csv-products, POST /api/upload/logo
│   │   └── utils/
│   │       ├── backup.py            # Automated SQLite/Postgres dump to Google Drive/Local
│   │       └── thermal_printer.py   # Raw ESC/POS socket connection for receipt printers
│   ├── tests/
│   │   ├── test_pos.py
│   │   └── test_khata.py
│   ├── requirements.txt             # fastapi, uvicorn, sqlalchemy, pydantic-settings, python-multipart
│   └── Dockerfile
├── frontend/                        # Vite + React + Tailwind (Current Frontend)
│   ├── src/
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml`;

  const dockerfileCode = `# ==========================================
# 1. backend/Dockerfile (FastAPI + Python 3.11)
# ==========================================
FROM python:3.11-slim as backend

WORKDIR /app

# Prevent Python from writing .pyc and buffering stdout
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies for SQLite / Postgres
RUN apt-get update && apt-get install -y --no-install-recommends \\
    curl \\
    libpq-dev \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run uvicorn on port 8000
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# ==========================================
# 2. docker-compose.yml (One-Command Production)
# ==========================================
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: mama_g_backend
    restart: always
    environment:
      - DATABASE_URL=sqlite:////data/pos.db
      - INVESTOR_PIN=1234
      - SHOP_NAME="Mama G Kiryana Store"
    volumes:
      - pos_data:/data
    ports:
      - "8000:8000"

  frontend:
    build: ./frontend
    container_name: mama_g_frontend
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pos_data:`;

  const cicdCode = `# .github/workflows/deploy.yml
name: Mama G POS CI/CD Pipeline

on:
  push:
    branches: [ "main" ]

jobs:
  test_and_deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install Dependencies
        run: |
          cd backend
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest httpx

      - name: Run Backend Pytest Suite
        run: |
          cd backend
          pytest tests/

      - name: Deploy to Production VPS via SSH
        if: success()
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: \${{ secrets.VPS_HOST }}
          username: \${{ secrets.VPS_USER }}
          key: \${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/mama-g-pos
            git pull origin main
            docker compose down
            docker compose up --build -d
            echo "🚀 Mama G POS successfully deployed and running!"`;

  const fileUploadCode = `# backend/app/routers/upload.py
from fastapi import APIRouter, UploadFile, File, HTTPException, status
import csv
import io
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/upload", tags=["Upload & Processing"])

class ProductBulkRow(BaseModel):
    name: str
    cost_price: float
    selling_price: float
    stock: float
    unit: str

@router.post("/csv-products", summary="1-Click Bulk Product Import via CSV")
async def bulk_upload_products(file: UploadFile = File(...)):
    """
    Accepts CSV format: Name,CostPrice,SellingPrice,Stock,Unit
    Streams directly in memory without saving to temp disk!
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="File must be a valid .csv file"
        )
    
    content = await file.read()
    decoded = content.decode("utf-8-sig") # Handles Excel BOM UTF-8
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported_count = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        try:
            name = row.get("Name") or row.get("name")
            cost = float(row.get("CostPrice") or row.get("cost_price") or 0)
            selling = float(row.get("SellingPrice") or row.get("selling_price") or 0)
            stock = float(row.get("Stock") or row.get("stock") or 0)
            unit = row.get("Unit") or row.get("unit") or "kg"

            if not name or selling <= 0:
                errors.append(f"Row {row_num}: Missing name or valid selling price")
                continue

            # DB insertion logic here...
            imported_count += 1
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")

    return {
        "status": "success",
        "imported_count": imported_count,
        "failed_rows": len(errors),
        "errors": errors[:5]
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-4xl bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl font-mono text-xl">🐍</span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                FastAPI + Docker + CI/CD Architecture
              </h2>
              <p className="text-xs text-slate-400">Complete production guide for your uncle's Kiryana Shop</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('structure')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'structure'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>1. FastAPI Project Structure</span>
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'docker'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>2. Docker & Compose</span>
          </button>
          <button
            onClick={() => setActiveTab('cicd')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'cicd'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>3. CI/CD Pipeline</span>
          </button>
          <button
            onClick={() => setActiveTab('fileupload')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 ${
              activeTab === 'fileupload'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileUp className="w-4 h-4" />
            <span>4. CSV File Upload API</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed space-y-4">
          {activeTab === 'structure' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-bold">Directory Tree (Clean separation of concerns):</span>
                <button
                  onClick={() => copyToClipboard(projectStructureCode, 'struct')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'struct' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'struct' ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-slate-300 overflow-x-auto whitespace-pre">
                {projectStructureCode}
              </pre>

              <div className="mt-4 p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs">
                <strong>Why this is best for Uncle's shop:</strong> Zero data migration headache! Start with SQLite (stored in a single file <code>/data/pos.db</code>). When Uncle adds a 2nd branch later, change one line in <code>config.py</code> to PostgreSQL with zero code rewrites.
              </div>
            </div>
          )}

          {activeTab === 'docker' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-bold">FastAPI Dockerfile + Docker Compose:</span>
                <button
                  onClick={() => copyToClipboard(dockerfileCode, 'docker')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'docker' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'docker' ? 'Copied!' : 'Copy Dockerfile'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-amber-200/90 overflow-x-auto whitespace-pre">
                {dockerfileCode}
              </pre>
            </div>
          )}

          {activeTab === 'cicd' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-bold">GitHub Actions Auto-Deploy to VPS ($5/mo server):</span>
                <button
                  onClick={() => copyToClipboard(cicdCode, 'cicd')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'cicd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'cicd' ? 'Copied!' : 'Copy Workflow'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-blue-200/90 overflow-x-auto whitespace-pre">
                {cicdCode}
              </pre>
            </div>
          )}

          {activeTab === 'fileupload' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-bold">Production Fast In-Memory CSV Upload Endpoint:</span>
                <button
                  onClick={() => copyToClipboard(fileUploadCode, 'upload')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                >
                  {copiedKey === 'upload' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'upload' ? 'Copied!' : 'Copy Endpoint'}</span>
                </button>
              </div>
              <pre className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-purple-200/90 overflow-x-auto whitespace-pre">
                {fileUploadCode}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Target Architecture: Python 3.11 + FastAPI + SQLite/Postgres</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
