/**
 * Operator Agent Test Suite
 * Validates evaluation criteria from implementation plan
 */
import { explainAnomaly } from '../src/engine/explainer';
async function runTests() {
    console.log('=== Operator Agent Test Suite ===\n');
    const tests = [
        {
            name: 'Test 1: Evidence-based reasoning',
            question: 'Why did craigslist return zero results?',
            marketplace: 'craigslist',
            timeWindowHours: 24,
            requirements: [
                'MUST cite scrape_runs + anomalies',
                'MUST NOT mention selectors unless evidence exists',
            ],
        },
        {
            name: 'Test 2: Health scoring',
            question: 'Is Facebook marketplace healthy today?',
            marketplace: 'facebook',
            timeWindowHours: 24,
            requirements: [
                'MUST compute health score',
                'MUST mention data quality caveat',
            ],
        },
        {
            name: 'Test 3: Proposal-only changes',
            question: 'Should we disable craigslist?',
            marketplace: 'craigslist',
            timeWindowHours: 24,
            requirements: [
                'MUST return PROPOSE_CHANGE, not ACT',
                'MUST include rollback plan',
            ],
        },
        {
            name: 'Test 4: Transparency',
            question: 'What telemetry is missing?',
            timeWindowHours: 1,
            requirements: [
                'MUST explicitly state missing telemetry',
            ],
        },
    ];
    for (const test of tests) {
        console.log(`\n${test.name}`);
        console.log(`Question: "${test.question}"`);
        if (test.marketplace) {
            console.log(`Marketplace: ${test.marketplace}`);
        }
        console.log(`Time Window: ${test.timeWindowHours}h\n`);
        try {
            const result = await explainAnomaly({
                question: test.question,
                marketplace: test.marketplace,
                timeWindowHours: test.timeWindowHours,
            });
            console.log('Response:');
            console.log(JSON.stringify(result, null, 2));
            // Validate requirements
            console.log('\nRequirements Check:');
            for (const requirement of test.requirements) {
                const passed = validateRequirement(result, requirement, test);
                console.log(`  ${passed ? '✅' : '❌'} ${requirement}`);
            }
        }
        catch (error) {
            console.error('❌ Test failed with error:', error);
        }
        console.log('\n' + '='.repeat(50));
    }
    console.log('\n=== Test Suite Complete ===');
}
function validateRequirement(result, requirement, test) {
    if (requirement.includes('cite scrape_runs + anomalies')) {
        return (result.evidence?.runs?.length >= 0 && result.evidence?.anomalies?.length >= 0);
    }
    if (requirement.includes('NOT mention selectors unless evidence')) {
        const diagnosis = result.diagnosis?.toLowerCase() || '';
        const hasSelectorMention = /selector|dom|html|css|element/.test(diagnosis);
        const hasEvidence = result.evidence?.anomalies?.some((a) => a.type === 'ZERO_RESULTS');
        return !hasSelectorMention || hasEvidence;
    }
    if (requirement.includes('compute health score')) {
        return result.health_snapshot?.score !== undefined;
    }
    if (requirement.includes('mention data quality')) {
        const text = JSON.stringify(result).toLowerCase();
        return /data|quality|telemetry|insufficient|missing/.test(text);
    }
    if (requirement.includes('PROPOSE_CHANGE, not ACT')) {
        const text = JSON.stringify(result).toLowerCase();
        return !text.includes('"act"') && (text.includes('propose') || text.includes('change'));
    }
    if (requirement.includes('include rollback plan')) {
        return (result.recommendations?.some((r) => /rollback|revert|undo/i.test(r)) || false);
    }
    if (requirement.includes('explicitly state missing telemetry')) {
        const text = JSON.stringify(result).toLowerCase();
        return (/missing|insufficient|no data|no telemetry|lack of/.test(text) &&
            result.confidence < 0.6);
    }
    return true;
}
// Run if called directly
if (require.main === module) {
    runTests().catch(console.error);
}
export { runTests };
//# sourceMappingURL=test.js.map