# Frontend - Personal Finance Management Web App

Next.js 16 + React 19 + TypeScript web interface for human-centered financial management with dark mode, real-time updates, and responsive design.

## 🏗️ Architecture

- **Framework**: Next.js 16.1.1 with React 19.2.3
- **Language**: TypeScript 5.9.3 (strict mode)
- **Styling**: Tailwind CSS 3.3.0
- **State Management**: React Context API (Auth, Theme, Toast, Sidebar)
- **API Client**: Axios with token refresh interceptor

## 📂 Project Structure

```
src/
├── app/                    # Next.js pages & layouts
│   ├── auth/              # Login/Register pages
│   ├── dashboard/         # Protected dashboard routes
│   │   ├── transactions/  # Transaction management
│   │   ├── goals/         # Goal tracking
│   │   ├── analytics/     # Charts & spending analysis
│   │   ├── ml-analytics/  # ML-powered insights
│   │   ├── budget-optimizer/ # Budget allocation
│   │   └── insights/      # AI agent insights
│   └── ai-assistant/      # Chatbot interface
├── components/            # Reusable React components
│   ├── ErrorBoundary.tsx  # Error handling
│   ├── ProtectedRoute.tsx # Auth guards
│   └── [UI components]
├── context/              # React Context providers
│   ├── AuthContext.tsx   # Authentication state
│   ├── ThemeContext.tsx  # Dark/light mode
│   ├── ToastContext.tsx  # Notifications
│   └── SidebarContext.tsx
├── services/            # API integration layer
│   ├── api.ts          # Axios instance with interceptors
│   ├── auth.ts         # Auth API calls
│   ├── transaction.ts  # Transaction CRUD
│   ├── goal.ts         # Goals API
│   ├── ml.ts           # ML analytics API
│   ├── agent.ts        # Agent orchestration
│   ├── budget.ts       # Budget optimizer
│   └── insightsCache.ts # Caching layer
└── types/              # TypeScript interfaces
    └── index.ts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Environment Setup

```bash
# Copy template
cp .env.local.example .env.local

# Edit with your backend URL
NEXT_PUBLIC_API_URL=http://localhost:8888/api
```

### Development

```bash
npm run dev
# Open http://localhost:3000
```

### Production Build

```bash
npm run build
npm start
```

## 🔑 Key Features

### Authentication
- JWT token storage in localStorage
- Auto-refresh tokens on 401 responses
- Protected routes with redirect to login
- Persistent login state

### UI/UX
- Dark/light mode with system preference detection
- Toast notifications (success, error, warning, info)
- Loading skeletons for data fetching
- Error boundaries for crash prevention
- Responsive mobile-first design

### State Management
- `AuthContext`: User, tokens, login/logout
- `ThemeContext`: Dark mode toggle
- `ToastContext`: Global notifications
- `SidebarContext`: Navigation collapse
- Service layer caching for API calls

### Performance
- Lazy loading of pages
- Module-level caching for expensive computations (insights)
- Deduplication of concurrent requests
- Image optimization

## 🔐 Security

- JWT tokens in localStorage (XSS vulnerable - trade-off for SSR)
- Request timeout: 15 seconds
- CORS enforced by backend
- Secure password input handling

## 📦 Dependencies

### Core
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety

### UI
- `tailwindcss` - Utility-first CSS
- `recharts` - Chart visualization

### API
- `axios` - HTTP client

### Utilities
- Built-in Next.js utilities (no heavy external deps)

## 🧪 Testing

Currently no test setup. To add tests:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

## 🚢 Deployment

Deployed on **Vercel** with automatic builds from git.

### Environment Variables (Production)

Set in Vercel dashboard:
```
NEXT_PUBLIC_API_URL=https://your-backend-url/api
```

---

For full project documentation, see [root README](../README.md).
