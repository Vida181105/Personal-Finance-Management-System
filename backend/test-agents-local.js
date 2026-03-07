/**
 * Test Agent System Locally
 * Run this to verify agents generate recommendations/alerts WITHOUT needing ML service
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { runCoordinatorCycle } = require('./src/services/agents/coordinatorAgent');

const TEST_USER_ID = 'arjun.sharma@example.com'; // Replace with your actual userId

async function testAgents() {
    console.log('🤖 Testing Agent System...\n');

    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Run agent cycle
        console.log(`Running agents for user: ${TEST_USER_ID}...`);
        const result = await runCoordinatorCycle({
            userId: TEST_USER_ID,
            goals: [],
            query: ''
        });

        console.log('\n📊 Agent Cycle Results:');
        console.log('━'.repeat(60));
        console.log(`Context Version: ${result.contextVersion}`);
        console.log(`Agents Processed: ${result.processed.length}`);

        result.processed.forEach(p => {
            const status = p.status === 'completed' ? '✅' : '❌';
            console.log(`  ${status} ${p.agent}: ${p.status}`);
        });

        console.log('\n💡 Recommendations Generated:');
        console.log('═'.repeat(60));
        if (result.prioritizedRecommendations && result.prioritizedRecommendations.length > 0) {
            result.prioritizedRecommendations.forEach((rec, idx) => {
                console.log(`\n${idx + 1}. [${rec.sourceAgent}] ${rec.title}`);
                console.log(`   Priority: ${rec.priority} | Severity: ${rec.severity}`);
                console.log(`   Detail: ${rec.detail}`);
            });
        } else {
            console.log('⚠️  No recommendations found - you may need transactions/goals in your account');
        }

        console.log('\n\n🚨 Alerts Generated:');
        console.log('═'.repeat(60));
        if (result.alerts && result.alerts.length > 0) {
            result.alerts.forEach((alert, idx) => {
                const emoji = alert.severity === 'critical' ? '🔴' : alert.severity === 'high' ? '🟠' : '🟡';
                console.log(`\n${idx + 1}. ${emoji} [${alert.sourceAgent}] ${alert.title}`);
                console.log(`   Severity: ${alert.severity}`);
                console.log(`   Message: ${alert.message}`);
            });
        } else {
            console.log('✅ No alerts - your finances look good!');
        }

        console.log('\n\n✨ Test Complete!\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

testAgents();
