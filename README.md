# Production Planning Engine

A smart production planning web application for manufacturing: upload sales orders from Excel, consolidate by product and color, generate daily production schedules, calculate raw material needs, and manage machine capacity.

## Tech Stack

- **Frontend:** Next.js 14 (React), TypeScript, minimal UI (Red / Black / Navy theme)
- **Backend:** Python FastAPI
- **Database:** PostgreSQL

## Features

1. **Upload Sales Orders via Excel** — Columns: Order ID, Product Name, Quantity, Color, Delivery Date  
2. **Order Consolidation** — Group by Product + Color, sum quantities into batches  
3. **Production Planning** — Prioritize by delivery date, generate daily schedule, assign machines  
4. **Raw Material Calculator** — Define RM per product, view total RM per batch  
5. **Dashboard** — Today’s plan, pending/completed orders, delay alerts  
6. **Machine Scheduling** — Set capacity per day; plan allocates by capacity  

## Quick Start

### 1. PostgreSQL

Create a database:

```bash
createdb production_planning
```

Default connection: `postgresql://postgres:postgres@localhost:5432/production_planning`  
Override with a `.env` in `backend/`:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/production_planning
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate   # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python -m app.database  # optional: ensure tables exist via main startup
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Tables are created on first API startup. API docs: http://localhost:8000/docs  

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 . The app proxies `/api/*` to the backend (port 8000).

### 4. Excel Upload

Use an Excel (`.xlsx`, `.xls`) or CSV file with these **exact column names**:

| Order ID | Product Name | Quantity | Color | Delivery Date |
|----------|--------------|----------|-------|---------------|
| ORD001   | T-Shirt      | 100      | Red   | 2025-03-15    |
| ORD002   | T-Shirt      | 50       | Red   | 2025-03-16    |

A sample template is provided: `sample_orders_template.csv` (open in Excel and save as .xlsx if you prefer).

Then: **Sales Orders** → Upload Excel → **Consolidation** → Run Consolidation → **Production Plan** → Generate Plan.  
Add **Machines** (name + capacity/day) and **Raw Materials** / **Products** (with RM per product) as needed.

## Project Structure

```
production plan engin/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routes/       # orders, consolidation, production, raw_materials, machines, dashboard
│   │   └── services/    # consolidation, production_planning, raw_material_calc
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── app/              # Dashboard, Orders, Consolidation, Production, Raw Materials, Machines
│   ├── components/       # Sidebar
│   ├── lib/              # api.ts
│   └── package.json
└── README.md
```

## Future AI Features (placeholders)

- Suggest optimal production plan  
- Predict delays from historical data  

These are noted in the UI and can be implemented later.
