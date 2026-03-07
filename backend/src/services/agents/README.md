# Multi-Agent Orchestration System

Coordinated intelligent agents for comprehensive financial analysis with shared context, message-based communication, and autonomous decision-making.

## 🤖 Agents Overview

### 1. **Financial Analyzer Agent**
Analyzes spending patterns and transaction history to identify trends and opportunities.

- **Responsibility**: Deep financial analysis
- **Execution Time**: 2-3 seconds
- **Inputs**: User transactions (90 days lookback)
- **Outputs**:
  - Top spending categories with month-over-month trends
  - Spending patterns and recurring transactions
  - Anomaly insights and unusual spending
  - Category recommendations

**File**: `financialAnalyzerAgent.js`

### 2. **Goal Optimizer Agent**
Optimizes budget allocation across user goals using linear programming.

- **Responsibility**: Budget optimization and goal planning
- **Execution Time**: 1-2 seconds
- **Inputs**: User goals, monthly income, expense history
- **Outputs**:
  - Recommended monthly allocation per goal
  - Probability of achieving each goal
  - Milestone recommendations
  - Savings optimization suggestions

**File**: `goalOptimizerAgent.js`

### 3. **Alert Monitor Agent**
Detects anomalies, monitors budgets, and identifies critical issues requiring immediate attention.

- **Responsibility**: Real-time monitoring and alerting
- **Execution Time**: 1-2 seconds
- **Inputs**: Recent transactions, historical baselines, budget limits
- **Outputs**:
  - Anomaly-based alerts (critical/high/medium severity)
  - Budget threshold warnings
  - Recurring bill forecasts
  - Overdue notifications

**Alert Severity Levels**:
- 🔴 **Critical** (anomaly score >= 0.8)
- 🟠 **High** (anomaly score >= 0.5)
- 🟡 **Medium** (anomaly score < 0.5)

**File**: `alertMonitoringAgent.js`

### 4. **Insight Generation Agent**
Synthesizes findings from all agents into coherent, actionable insights using Claude API.

- **Responsibility**: Natural language insights and recommendations
- **Execution Time**: 2-3 seconds
- **Inputs**: Financial analysis, goal status, alerts, recommendations
- **Outputs**:
  - Personalized narrative insights
  - Prioritized action items
  - Behavioral recommendations
  - Celebration messages for achievements

**Fallback**: Rule-based narratives if Claude API unavailable

**File**: `insightGenerationAgent.js`

### 5. **Coordinator Agent**
Orchestrates all agents, manages execution flow, and resolves conflicts.

- **Responsibility**: Agent orchestration and result aggregation
- **Execution Time**: 8-15 seconds total
- **Execution Model**: Parallel (all agents run simultaneously)
- **Conflict Resolution**: Priority scoring system for recommendations
- **Outputs**:
  - Consolidated agent context (versioned)
  - Merged recommendations with scores
  - Aggregated alerts
  - Agent execution status

**File**: `coordinatorAgent.js`

## 🔄 Execution Flow

```
User Request → Coordinator Agent
  ├─ Financial Analyzer (parallel)
  ├─ Goal Optimizer (parallel)
  ├─ Alert Monitor (parallel)
  └─ Insight Generator (parallel)
      ↓
  Aggregate Results
      ↓
  Store Context (MongoDB + Redis Cache)
      ↓
  Return to Frontend
```

## 📊 Shared Context

All agents share a versioned context object stored in MongoDB and cached in Redis:

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "contextVersion": 42,
  "timestamp": "2024-03-07T10:30:00Z",
  "sharedContext": {
    "financial_analyzer": { "topCategories": [...], "trends": {...} },
    "goal_optimizer": { "recommendations": [...] },
    "alert_monitor": { "alerts": [...] },
    "insight_generator": { "summary": "..." }
  },
  "agentStates": {
    "financial_analyzer": "completed",
    "goal_optimizer": "idle",
    "alert_monitor": "running",
    "insight_generator": "pending"
  }
}
```

## 💬 Message Protocol

Agents communicate via Redis-backed message queue with priority handling:

```typescript
interface Message {
  id: string;                    // UUID
  type: 'TASK' | 'FINDINGS' | 'ALERT' | 'RECOMMENDATION' | 'ESCALATION' | 'REPORT'
  sender: AgentType;
  recipient: AgentType | 'coordinator'
  payload: object;
  priority: 1-10;               // Higher = more urgent
  timestamp: Date;
  status: 'queued' | 'delivered' | 'processed'
}
```

## 🔌 API Integration

### `POST /api/agents/run`
Trigger multi-agent orchestration cycle.

```bash
curl -X POST http://localhost:8888/api/agents/run \
  -H "Authorization: Bearer $TOKEN"
```

**Response**: `200 OK`
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

### `GET /api/agents/context`
Retrieve latest shared context.

```bash
curl http://localhost:8888/api/agents/context \
  -H "Authorization: Bearer $TOKEN"
```

### `GET /api/agents/messages`
Get recent messages between agents.

```bash
curl http://localhost:8888/api/agents/messages \
  -H "Authorization: Bearer $TOKEN"
```

## 🛠️ Configuration

All agents are configured via environment variables:

```bash
# ML Service URL for clustering, anomalies, forecasting
ML_SERVICE_URL=http://localhost:10000

# Claude API for insight generation (optional)
ANTHROPIC_API_KEY=sk-...

# Redis for caching and message queue
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## ⚙️ Advanced Features

### Error Handling
- Individual agent failures don't crash coordinator
- Graceful degradation with fallback narratives
- Non-blocking ML service integration
- Timeout protection (10 second default per agent)

### Performance Optimization
- Redis caching (5 minute TTL for context)
- Parallel agent execution (not sequential)
- Lean database queries with selected fields
- In-memory message queue fallback if Redis unavailable

### Extensibility
To add a new agent:

1. Create `backend/src/services/agents/yourAgent.js`
2. Implement async function with try/catch
3. Register in `coordinatorAgent.js` execution list
4. Update context schema in MongoDB model
5. Add type hint in message protocol

Example:

```javascript
async function yourAgent(userId, sharedContext) {
  try {
    const result = await doAnalysis(userId);
    return {
      status: 'completed',
      data: result,
      timestamp: new Date()
    };
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
      timestamp: new Date()
    };
  }
}
```

## 📈 Monitoring

Agent execution is monitored via:
- Message queue status (Redis)
- Context version increments
- Agent state tracking in MongoDB
- Error logging with timestamps

## 🚢 Deployment

Agents run as part of the main Node.js application:

```bash
npm start  # Starts both API and agents
```

No separate agent processes needed - everything is async and event-driven.

---

For more details on individual agents, see their source files in this directory.

For overall backend documentation, see [backend README](../../../README.md).
