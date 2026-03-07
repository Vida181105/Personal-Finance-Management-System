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
                const source = rec?.sourceAgent || rec?.source || 'unknown';
                const title = rec?.title || rec?.message || rec?.recommendation || 'Untitled recommendation';
                const detail = rec?.detail || rec?.impact || rec?.description || 'No detail provided';
                const priority = rec?.priority ?? 'n/a';
                const severity = rec?.severity ?? 'n/a';

                console.log(`\n${idx + 1}. [${source}] ${title}`);
                console.log(`   Priority: ${priority} | Severity: ${severity}`);
                console.log(`   Detail: ${detail}`);
            });
        } else {
            console.log('⚠️  No recommendations found - you may need transactions/goals in your account');
        }

        console.log('\n\n🚨 Alerts Generated:');
        console.log('═'.repeat(60));
        if (result.alerts && result.alerts.length > 0) {
            result.alerts.forEach((alert, idx) => {
                const severity = alert?.severity || 'low';
                const emoji = severity === 'critical' ? '🔴' : severity === 'high' ? '🟠' : '🟡';
                const source = alert?.sourceAgent || 'unknown';
                const title = alert?.title || alert?.message || 'Untitled alert';
                const message = alert?.message || alert?.description || 'No message provided';

                console.log(`\n${idx + 1}. ${emoji} [${source}] ${title}`);
                console.log(`   Severity: ${severity}`);
                console.log(`   Message: ${message}`);
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
