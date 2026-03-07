# Personal Finance Management System - Backend

Multi-agent financial intelligence platform with Redis-backed orchestration, ML-powered analytics, and coordinated AI insights.

## 🏗️ Architecture

### Multi-Agent System

The backend implements a coordinated multi-agent architecture with shared context and message-based communication:

- **Financial Analyzer Agent**: Spending pattern analysis, trend detection, anomaly identification
- **Goal Optimizer Agent**: Budget optimization, savings recommendations, milestone planning
- **Alert & Monitoring Agent**: Anomaly detection, due date monitoring, critical alerts
- **Insight Generation Agent**: Natural language insights powered by Claude API
- **Coordinator Agent**: Orchestrates all agents, manages execution flow, resolves conflicts

### Infrastructure

- **Redis Cache Layer**: Performance optimization for context and recommendations (5min TTL)
- **Redis Message Queue**: Persistent inter-agent communication with priority handling
- **MongoDB**: Shared context persistence with versioning
- **REST API**: Express.js with Swagger documentation
- **ML Service**: Python-based ML models for categorization, clustering, forecasting

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Redis 7+ (optional, will fallback to in-memory)
- Python 3.11+ (for ML service)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start Redis (optional but recommended)
redis-server

# Start server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📡 API Endpoints

### Agent Orchestration

#### `POST /api/agents/run`
Run complete multi-agent orchestration cycle.

**Response:**
```json
{
  "success": true,
  "data": {
    "contextVersion": 42,
    "executedAgents": ["financial_analyzer", "goal_optimizer", "alert_monitor", "insight_generator"],
    "newRecommendations": 5,
    "newAlerts": 2
  }
}
```

#### `GET /api/agents/context`
Retrieve latest shared agent context.

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "contextVersion": 42,
    "sharedContext": {
      "financial_analyzer": { "topCategories": [...], "trends": {...} },
      "goal_optimizer": { "recommendations": [...] },
      "alert_monitor": { "alerts": [...] },
      "insight_generator": { "summary": "..." }
    },
    "agentStates": {...},
    "recommendations": [...],
    "alerts": [...]
  }
}
```

#### `GET /api/agents/messages?limit=30`
Retrieve recent inter-agent messages.

**Query Parameters:**
- `limit` (optional): Number of messages (1-200, default: 30)

#### `GET /api/agents/state`
Retrieve per-agent execution status.

**Response:**
```json
{
  "success": true,
  "data": {
    "financial_analyzer": {
      "status": "completed",
      "lastRun": "2026-03-07T10:30:00Z"
    },
    "goal_optimizer": {...}
  }
}
```

### Authentication

#### `POST /api/auth/register`
Register new user account.

#### `POST /api/auth/login`
Login and receive JWT token.

### Transactions

#### `GET /api/transactions`
List user transactions with filtering.

#### `POST /api/transactions`
Create new transaction.

#### `PUT /api/transactions/:id`
Update transaction.

#### `DELETE /api/transactions/:id`
Delete transaction.

### Categories

#### `GET /api/categories`
List transaction categories.

#### `POST /api/categories`
Create custom category.

### Budget & Analytics

#### `GET /api/budget/optimize`
Get ML-powered budget recommendations.

#### `GET /api/analytics/monthly/:userId`
Monthly spending analysis.

#### `GET /api/analytics/category/:userId`
Category-wise breakdown.

### ML & AI

#### `POST /api/ml/cluster`
Transaction clustering analysis.

#### `POST /api/ml/forecast`
Spending forecast predictions.

#### `POST /api/ml/anomalies`
Detect unusual transactions.

#### `POST /api/ai/chat`
Natural language financial assistant.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `MONGO_URI` | MongoDB connection string | localhost:27017 | Yes |
| `REDIS_HOST` | Redis host | localhost | No |
| `REDIS_PORT` | Redis port | 6379 | No |
| `REDIS_PASSWORD` | Redis password | - | No |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `ML_SERVICE_URL` | ML service endpoint | http://localhost:8000 | Yes |
| `ANTHROPIC_API_KEY` | Claude API key | - | No |
| `GEMINI_API_KEY` | Gemini API key | - | No |

### Redis Configuration

Redis is **optional** but recommended for production:

**With Redis:**
- Persistent message queue across server restarts
- Distributed caching for horizontal scaling
- Better performance under high load

**Without Redis:**
- Automatic fallback to in-memory queue
- In-memory caching only
- Single-instance deployment

To disable Redis: Simply omit Redis environment variables or ensure Redis is not running.

## 🧪 Testing

### Test Structure

```
tests/
└── agents.test.js       # Agent orchestration integration tests
```

### Running Tests

```bash
# All tests with coverage
npm run test:coverage

# Specific test suite
npm test -- agents.test

# Watch mode for development
npm run test:watch
```

### Test Database

Tests use separate MongoDB instance (`MONGO_URI_TEST`). Ensure it's configured in `.env`:

```bash
MONGO_URI_TEST=mongodb://localhost:27017/finance-test
```

## 📊 Agent Architecture Details

### Shared Context Model

```javascript
{
  userId: ObjectId,
  contextVersion: Number,        // Increments on every update
  sharedContext: {
    [agentKey]: {
      // Agent-specific data
      updatedAt: Date
    }
  },
  agentStates: {
    [agentKey]: {
      status: 'idle|running|completed|failed',
      lastRun: Date,
      error: String
    }
  },
  messages: [Message],           // Inter-agent communication
  recommendations: [Recommendation],
  alerts: [Alert],
  interactions: [Interaction]    // User interactions log
}
```

### Message Protocol

```javascript
{
  id: UUID,
  type: 'TASK|FINDINGS|ALERT|RECOMMENDATION|ESCALATION|REPORT',
  from: 'agent_name',
  to: 'agent_name|coordinator|*',
  priority: Number,              // Higher = more urgent
  payload: Object,
  createdAt: Date
}
```

### Cache Strategy

| Resource | TTL | Key Pattern | Invalidation |
|----------|-----|-------------|--------------|
| Context | 5min | `agent:context:{userId}` | On context update |
| Messages | 3min | `agent:messages:{userId}:{limit}` | On new messages |
| Queue | 24h | `agent:queue:{userId}` | Auto-expire |

## 🔒 Security

- JWT-based authentication on all agent endpoints
- Token validation via `authMiddleware`
- User-scoped data isolation
- Sensitive keys in environment variables only

## 📈 Performance

### Optimization Features

1. **Redis Caching**: Reduces DB queries by ~70%
2. **Priority Queue**: Critical alerts processed first
3. **Batch Operations**: Efficient multi-agent updates
4. **Context Versioning**: Optimistic concurrency control
5. **Array Capping**: Prevents unbounded context growth

### Monitoring

Monitor agent performance via:

```bash
# Agent execution states
GET /api/agents/state

# Queue depth
Redis: ZCARD agent:queue:{userId}

# Cache hit rate
Redis: INFO stats
```

## 🛠️ Development

### Adding a New Agent

1. Create agent file in `src/services/agents/`
2. Implement `execute(userId, context)` method
3. Register in `coordinatorAgent.js`
4. Add test cases in `tests/agents.test.js`

Example:

```javascript
// src/services/agents/myNewAgent.js
async function execute(userId, context) {
    try {
        // Your agent logic
        const results = await analyzeData(userId);
        
        return {
            agentContextPatch: { myData: results },
            messages: [],
            recommendations: [],
            alerts: [],
            statePatch: { status: 'completed' }
        };
    } catch (error) {
        return {
            statePatch: { 
                status: 'failed', 
                error: error.message 
            }
        };
    }
}

module.exports = { execute };
```

### Code Structure

```
backend/
├── src/
│   ├── config/           # Configuration (DB, Redis, Swagger)
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, error handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API routes
│   ├── services/
│   │   ├── agents/       # Multi-agent system
│   │   └── analyticsService.js
│   ├── utils/            # Helpers
│   └── docs/             # Swagger documentation
├── tests/                # Integration tests
├── app.js                # Express app setup
├── server.js             # HTTP server
└── package.json
```

## 📝 API Documentation

Interactive Swagger UI available at:
```
http://localhost:5000/api-docs
```

## 🐛 Troubleshooting

### Redis Connection Failed

**Symptom:** `Redis connection error` in logs  
**Solution:** System automatically falls back to in-memory mode. For production, ensure Redis is running:

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### Agent Execution Timeout

**Symptom:** 500 error on `/api/agents/run`  
**Solution:** Check ML service availability at `ML_SERVICE_URL`. Agents fail gracefully if ML unavailable.

### Test Database Conflicts

**Symptom:** Jest tests fail with duplicate key errors  
**Solution:** Ensure test DB is separate:

```bash
# Clean test database
mongo finance-test --eval "db.dropDatabase()"
```

## 📄 License

ISC

## 👥 Contributors

Built for Personal Finance Management System - SWE Project Spring 2026
