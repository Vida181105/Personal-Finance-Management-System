# Personal Finance Management System

A comprehensive web application for managing personal finances with transaction tracking, smart categorization, ML-powered analytics, and AI-driven insights.

**Live App**: https://personal-finance-management-system-haenna.vercel.app

---

## 📚 Documentation

- **[Frontend README](./frontend/README.md)** - Next.js React app architecture, setup, and components
- **[Backend README](./backend/README.md)** - Express.js API, authentication, and core services
- **[ML Service README](./ml-service/README.md)** - Python FastAPI microservice with ML models
- **[Multi-Agent System README](./backend/src/services/agents/README.md)** - Agent orchestration and architecture

---

## Features Implemented

### 💳 Transaction Management
- ✅ Add, delete transactions with real-time updates
- ✅ Bulk import from CSV (bank statement formats)
- ✅ Auto-categorization based on ML predictions
- ✅ Transaction filtering by category, date, type (income/expense)
- ✅ AI Category Check column (shows if ML agrees with manual category)
- ✅ Risk/Anomaly Detection (flags unusual spending)
- ✅ Pagination and search
- ✅ Export to CSV

### 📊 ML Analytics Dashboard
- ✅ **Spending Clusters** - KMeans pattern grouping
- ✅ **Anomaly Detection** - Isolation Forest outlier detection (0-100% risk scores)
- ✅ **Expense Forecast** - EMA time-series prediction with seasonality
- ✅ Real-time analysis with "Run Analysis" button
- ✅ ML service health status

### 💰 Budget Optimizer
- ✅ Add unlimited savings goals with priority & deadline
- ✅ Linear programming optimization for goal allocation
- ✅ Goal achievement probability forecasting
- ✅ Budget allocation pie chart
- ✅ Goal persistence with localStorage
- ✅ Monthly income auto-populated from user profile
- ✅ 3-month rolling expense average calculation

### 🤖 AI Assistant
- ✅ Chat interface for financial advice
- ✅ Context-aware responses using Groq LLaMA 3.3
- ✅ Transaction analysis and recommendations
- ✅ Lazy initialization (doesn't require API key if not used)

### 🔐 Authentication & Security
- ✅ JWT-based auth (7-day tokens)
- ✅ Secure password hashing (bcrypt)
- ✅ Protected routes with role-based access
- ✅ Session management with localStorage

### 📱 UI/UX
- ✅ Responsive design (desktop, tablet, mobile)
- ✅ Clean, modern Tailwind CSS styling
- ✅ No emojis in core UI (production-ready)
- ✅ Smooth error handling and user feedback
- ✅ Dark-mode compatible

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16.1.1 (React 19.2.3, Turbopack)
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS 3.3.0
- **Charts**: Recharts
- **HTTP**: Axios with interceptors
- **State**: React Context API + localStorage
- **Deployment**: Vercel (auto-deploys on git push)

### Backend (Node.js/Express)
- **Framework**: Express.js 4.18.2
- **Language**: Node.js (22.16.0)
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken) + bcrypt
- **API Docs**: Swagger/OpenAPI
- **Deployment**: Render
- **Port**: 8888 (configurable)

### ML Service (Python/FastAPI)
- **Framework**: FastAPI 0.115.0
- **Language**: Python 3.11
- **ML Libraries**: scikit-learn, pandas, numpy
- **Server**: Uvicorn
- **Deployment**: Render
- **Port**: 10000 (configurable)

### Database
- **Cloud**: MongoDB Atlas (free tier)
- **Collections**: Users, Transactions, Categories, AIInsights

---

## Deployment Status

✅ **All services live and connected**

| Service | URL | Platform | Status |
|---------|-----|----------|--------|
| Frontend | https://personal-finance-management-system-haenna.vercel.app | Vercel | ✅ Live |
| Backend | https://personal-finance-backend.onrender.com | Render | ✅ Live |
| ML Service | https://finance-szzs.onrender.com | Render | ✅ Live |
| Database | MongoDB Atlas | Cloud | ✅ Live |

**Note**: Render free tier spins down after 15 min of inactivity. First request after idle takes ~30s.

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11
- MongoDB (local or Atlas account)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/Vida181105/Personal-Finance-Management-System.git
cd Personal-Finance-Management-System
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/financedb
JWT_SECRET=your_secret_key_here
ML_SERVICE_URL=http://localhost:8000
GROQ_API_KEY=your_groq_key_here (optional for AI Assistant)
PORT=8888
NODE_ENV=development
EOF

# Start backend
PORT=8888 npm run dev
```

Backend runs on `http://localhost:8888`

### 3. ML Service Setup
```bash
cd ml-service

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # macOS/Linux
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Start ML service
uvicorn main:app --reload --port 8000
```

ML service runs on `http://localhost:8000`

### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8888/api
EOF

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login (returns JWT)
- `GET /api/auth/me` - Get current user

### Transactions
- `GET /api/transactions` - List user transactions
- `GET /api/transactions/:id` - Get transaction details
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction
- `POST /api/transactions/import` - Bulk import CSV
- `POST /api/transactions/:userId/enrich` - Backfill ML data on existing transactions

### ML Analytics
- `POST /api/ml/cluster` - Spending clusters (KMeans)
- `POST /api/ml/anomalies` - Anomaly detection (Isolation Forest)
- `POST /api/ml/forecast` - Expense forecast (EMA)
- `GET /api/ml/health` - ML service health check

### Budget
- `POST /api/budget/optimize` - Optimize budget allocation
- `GET /api/budget/summary/:userId` - Spending summary by category

### Categories
- `GET /api/categories` - List all categories

---

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_key_min_32_chars
ML_SERVICE_URL=https://your-ml-service.onrender.com
GROQ_API_KEY=your_groq_api_key_optional
PORT=8888
NODE_ENV=production
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### ML Service (.env)
No environment variables required — pure ML computation

---

## Project Structure

```
.
├── frontend/                    # Next.js React app
│   ├── src/app/                # Page routes (App Router)
│   │   ├── dashboard/          # Main dashboard pages
│   │   │   ├── transactions/   # Transaction list & management
│   │   │   ├── budget-optimizer/ # Budget optimization
│   │   │   ├── ml-analytics/   # ML insights dashboard
│   │   │   ├── analytics/      # Basic analytics
│   │   │   └── import/         # CSV import
│   │   ├── auth/               # Login/register
│   ├── src/components/         # Reusable React components
│   ├── src/services/           # API client services
│   ├── src/context/            # React Context (Auth, Sidebar)
│   ├── src/types/              # TypeScript interfaces
│   └── tailwind.config.ts
│
├── backend/                     # Express.js Node server
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── transactionController.js
│   │   │   ├── budgetController.js
│   │   │   ├── mlController.js
│   │   │   ├── analyticsController.js
│   │   │   ├── categoryController.js
│   │   │   ├── importController.js
│   │   │   └── aiController.js (Groq chat)
│   │   ├── models/             # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Transaction.js
│   │   │   └── Category.js
│   │   ├── routes/             # Express route definitions
│   │   ├── middleware/         # Auth, error handling
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Helpers (validation, response formatting)
│   │   └── config/             # Swagger config
│   ├── server.js               # Entry point
│   └── package.json
│
├── ml-service/                 # FastAPI Python service
│   ├── main.py                 # FastAPI app + endpoints
│   ├── requirements.txt         # Python dependencies
│   ├── runtime.txt              # Python version for Render
│   └── venv/                   # Virtual environment (gitignored)
│
└── README.md
```

---

## Key Implementation Details

### ML Features
1. **Spending Clusters** - Groups similar transactions using KMeans (k=5)
2. **Anomaly Detection** - Flags unusual transactions (Isolation Forest, 10% contamination)
3. **Expense Forecast** - EMA (α=0.3) with seasonal adjustment for 3-month prediction
4. **Transaction Categorizer** - ML categorizes based on keywords, amount, type
5. **Budget Optimizer** - Linear programming allocates income to goals based on priority

### Data Flow
```
User creates transaction 
  → Backend categorizes via ML service
  → Saves with suggested_category + confidence
  → Frontend shows AI Category Check (✓ Confirmed or ⚡ Different)
  → Risk field shows anomaly_score (0-100%) with color coding

User clicks "Run Analysis" in ML Analytics
  → Backend fetches last 90 days of transactions
  → Sends to ML service for clustering, anomalies, forecast
  → Results cached in AIInsights collection (expires 24h)
  → Frontend renders charts
```

### Authentication Flow
```
User registers/logs in
  → Backend validates, creates JWT (7-day expiry)
  → Frontend stores in localStorage
  → Each API call includes Authorization: Bearer <token>
  → Middleware verifies JWT on protected routes
```

---

## License

MIT License - see LICENSE file

---
