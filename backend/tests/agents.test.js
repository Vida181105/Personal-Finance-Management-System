/**
 * Integration Tests for Agent Orchestration Endpoints
 * Tests multi-agent coordination API with authentication
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const User = require('../src/models/User');
const AgentContext = require('../src/models/AgentContext');
const Transaction = require('../src/models/Transaction');

// Test data
const testUser = {
    email: 'test.agent@example.com',
    password: 'TestPassword123',
    name: 'Test Agent User',
    monthlyIncome: 75000,
    phone: '+91-9876543210',
    profession: 'Software Engineer',
    city: 'Mumbai',
    age: 28
};

let authToken;
let userId;

describe('Agent Orchestration API Integration Tests', () => {

    beforeAll(async () => {
        // Connect to test database
        const mongoUri = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/finance-test';
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(mongoUri);
        }

        // Clean up test data
        await User.deleteMany({ email: testUser.email });
        await AgentContext.deleteMany({});
        await Transaction.deleteMany({});
    });

    afterAll(async () => {
        // Cleanup
        await User.deleteMany({ email: testUser.email });
        await AgentContext.deleteMany({ userId });
        await Transaction.deleteMany({ userId });
        await mongoose.connection.close();
    });

    describe('POST /api/auth/register - Setup test user', () => {
        it('should register a test user and return auth token', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('tokens');
            expect(response.body.data.tokens).toHaveProperty('token');

            authToken = response.body.data.tokens.token;
            userId = response.body.data.user._id;

            expect(authToken).toBeDefined();
            expect(userId).toBeDefined();
        });
    });

    describe('POST /api/agents/run', () => {

        it('should require authentication', async () => {
            await request(app)
                .post('/api/agents/run')
                .expect(401);
        });

        it('should execute agent orchestration cycle', async () => {
            // Add some sample transactions first
            const sampleTransactions = [
                {
                    userId,
                    description: 'Salary credit',
                    merchantName: 'TechCorp Inc',
                    amount: 75000,
                    type: 'Income',
                    category: 'Salary',
                    date: new Date()
                },
                {
                    userId,
                    description: 'Grocery shopping',
                    merchantName: 'BigBasket',
                    amount: 3500,
                    type: 'Expense',
                    category: 'Groceries',
                    date: new Date()
                },
                {
                    userId,
                    description: 'Restaurant bill',
                    merchantName: 'Pizza Hut',
                    amount: 1200,
                    type: 'Expense',
                    category: 'Food & Dining',
                    date: new Date()
                }
            ];

            await Transaction.insertMany(sampleTransactions);

            const response = await request(app)
                .post('/api/agents/run')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('contextVersion');
            expect(response.body.data).toHaveProperty('executedAgents');
            expect(Array.isArray(response.body.data.executedAgents)).toBe(true);
            expect(response.body.data.executedAgents.length).toBeGreaterThan(0);
        }, 30000); // 30 second timeout for agent execution
    });

    describe('GET /api/agents/context', () => {

        it('should require authentication', async () => {
            await request(app)
                .get('/api/agents/context')
                .expect(401);
        });

        it('should retrieve agent context', async () => {
            const response = await request(app)
                .get('/api/agents/context')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('userId');
            expect(response.body.data).toHaveProperty('contextVersion');
            expect(response.body.data).toHaveProperty('sharedContext');
            expect(response.body.data).toHaveProperty('agentStates');
            expect(response.body.data).toHaveProperty('recommendations');
            expect(response.body.data).toHaveProperty('alerts');
        });

        it('should have incremented context version after agent run', async () => {
            const response = await request(app)
                .get('/api/agents/context')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.data.contextVersion).toBeGreaterThan(0);
        });
    });

    describe('GET /api/agents/messages', () => {

        it('should require authentication', async () => {
            await request(app)
                .get('/api/agents/messages')
                .expect(401);
        });

        it('should retrieve recent messages with default limit', async () => {
            const response = await request(app)
                .get('/api/agents/messages')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        it('should respect custom limit parameter', async () => {
            const limit = 10;
            const response = await request(app)
                .get('/api/agents/messages')
                .query({ limit })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeLessThanOrEqual(limit);
        });

        it('should enforce maximum limit of 200', async () => {
            const response = await request(app)
                .get('/api/agents/messages')
                .query({ limit: 500 })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Should cap at 200 even if higher limit requested
            expect(response.body.data.length).toBeLessThanOrEqual(200);
        });
    });

    describe('GET /api/agents/state', () => {

        it('should require authentication', async () => {
            await request(app)
                .get('/api/agents/state')
                .expect(401);
        });

        it('should retrieve agent states', async () => {
            const response = await request(app)
                .get('/api/agents/state')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
            expect(typeof response.body.data).toBe('object');
        });

        it('should include state for executed agents', async () => {
            const response = await request(app)
                .get('/api/agents/state')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const states = response.body.data;

            // Check for expected agent keys after orchestration
            const expectedAgents = ['financial_analyzer', 'goal_optimizer', 'alert_monitor', 'insight_generator'];
            const hasAtLeastOneAgent = expectedAgents.some(agent => states.hasOwnProperty(agent));

            expect(hasAtLeastOneAgent).toBe(true);

            // If agent states exist, verify structure
            const agentKeys = Object.keys(states);
            if (agentKeys.length > 0) {
                const firstAgent = states[agentKeys[0]];
                expect(firstAgent).toHaveProperty('status');
                expect(firstAgent).toHaveProperty('lastRun');
            }
        });
    });

    describe('Agent Orchestration Workflow', () => {

        it('should complete full orchestration workflow', async () => {
            // 1. Run orchestration
            const runResponse = await request(app)
                .post('/api/agents/run')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(runResponse.body.success).toBe(true);
            const initialVersion = runResponse.body.data.contextVersion;

            // 2. Verify context was updated
            const contextResponse = await request(app)
                .get('/api/agents/context')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(contextResponse.body.data.contextVersion).toBe(initialVersion);

            // 3. Check for messages
            const messagesResponse = await request(app)
                .get('/api/agents/messages')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(messagesResponse.body.data)).toBe(true);

            // 4. Verify agent states
            const stateResponse = await request(app)
                .get('/api/agents/state')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(stateResponse.body.data).toBeDefined();
        }, 30000);
    });

    describe('Error Handling', () => {

        it('should handle invalid auth token', async () => {
            await request(app)
                .post('/api/agents/run')
                .set('Authorization', 'Bearer invalid_token_12345')
                .expect(401);
        });

        it('should handle malformed auth header', async () => {
            await request(app)
                .get('/api/agents/context')
                .set('Authorization', 'InvalidFormat')
                .expect(401);
        });

        it('should handle invalid limit parameter gracefully', async () => {
            const response = await request(app)
                .get('/api/agents/messages')
                .query({ limit: 'invalid' })
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Should use default limit
            expect(response.body.success).toBe(true);
        });
    });
});
