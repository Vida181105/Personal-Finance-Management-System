# Personal Finance Management System

A comprehensive web application for managing personal finances with transaction tracking, smart categorization, analytics, and AI-powered insights.

Live Demo: https://personal-finance-management-system-haenna.vercel.app

---

## Features

### Transaction Management
- Add, edit, delete transactions manually
- Bulk import from CSV/Excel (bank statement formats)
- Auto-categorization based on keywords
- Transaction filtering by date, category, type (income/expense)
- Search transactions by description
- Pagination (10 items per page)
- Export transactions to CSV

### Analytics & Insights
- Spending by Category - Interactive pie chart
- Monthly Trends - Line chart for spending patterns
- Income vs Expense - Bar chart comparison
- Top Merchants - Breakdown of spending
- Statistical Summaries - Totals, percentages, averages
- Date Range Filtering - Analyze custom periods

### Smart Categorization
- 15+ predefined categories (Food, Transport, Entertainment, etc.)
- Auto-categorization using keyword matching
- Manual override option
- Category management interface

### Authentication & Security
- JWT-based authentication (7-day tokens)
- Secure password hashing (bcrypt)
- Protected routes with role-based access
- Session management
- CORS configured for production

### Responsive Design
- Works on desktop, tablet, and mobile
- Dark/Light theme support
- Smooth animations and transitions
- Accessibility-focused UI

---

## Tech Stack

### Frontend
- Framework: Next.js 16.1.1 (React 19.2.3)
- Language: TypeScript 5.9.3
- Styling: Tailwind CSS 3.3.0
- Charts: Recharts
- State Management: React Context API
- HTTP Client: Axios
- Deployment: Vercel

### Backend
- Framework: Express.js 4.18.2
- Language: Node.js
- Database: MongoDB (Mongoose ODM)
- Authentication: JWT (jsonwebtoken)
- API Docs: Swagger/OpenAPI
- Deployment: Render

### Database
- Primary: MongoDB Atlas (Cloud)
- Schema: Mongoose with indexes
- Collections: Users, Transactions, Categories

---

## Prerequisites

Before you begin, ensure you have:
- Node.js 18+ and npm/yarn
- MongoDB Atlas account (free tier available)
- Git for version control
- A code editor (VS Code recommended)
- Render account (for backend deployment)
- Vercel account (for frontend deployment)

---

## Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Vida181105/Personal-Finance-Management-System.git
cd Personal-Finance-Management-System
