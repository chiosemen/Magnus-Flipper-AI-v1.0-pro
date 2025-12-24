/**
 * Seed script for Operator Knowledge Base
 * Ingests phase reports and runbook templates
 */
import { ingestDocument } from '../src/ingestor';
import { readFileSync } from 'fs';
import { join } from 'path';
const ROOT_DIR = join(__dirname, '../../..');
async function seedKnowledgeBase() {
    console.log('[KB] Starting knowledge base seeding...\n');
    try {
        // 1. Phase 1 Implementation Summary
        try {
            const phase1Path = join(ROOT_DIR, 'PHASE_1_IMPLEMENTATION_SUMMARY.md');
            const phase1Content = readFileSync(phase1Path, 'utf-8');
            await ingestDocument({
                title: 'Phase 1: Pooled Ingestion Implementation',
                source: 'repo:/PHASE_1_IMPLEMENTATION_SUMMARY.md',
                content: phase1Content,
                tags: ['phase-1', 'pooling', 'architecture', 'anomaly-detection'],
                confidenceLevel: 'high',
                version: '1.0',
            });
            console.log('✅ Ingested Phase 1 summary\n');
        }
        catch (error) {
            console.warn('⚠️  Could not ingest Phase 1 summary:', error);
        }
        // 2. Phase 2 Implementation Summary (if exists)
        try {
            const phase2Path = join(ROOT_DIR, 'PHASE_2_IMPLEMENTATION_SUMMARY.md');
            const phase2Content = readFileSync(phase2Path, 'utf-8');
            await ingestDocument({
                title: 'Phase 2: Apify Integration',
                source: 'repo:/PHASE_2_IMPLEMENTATION_SUMMARY.md',
                content: phase2Content,
                tags: ['phase-2', 'apify', 'integration', 'source-pooling'],
                confidenceLevel: 'high',
                version: '1.0',
            });
            console.log('✅ Ingested Phase 2 summary\n');
        }
        catch (error) {
            console.warn('⚠️  Could not ingest Phase 2 summary (may not exist yet):', error);
        }
        // 3. Deployment Readiness Report
        try {
            const deployPath = join(ROOT_DIR, 'DEPLOYMENT_READINESS_REPORT.md');
            const deployContent = readFileSync(deployPath, 'utf-8');
            await ingestDocument({
                title: 'Deployment Readiness Report',
                source: 'repo:/DEPLOYMENT_READINESS_REPORT.md',
                content: deployContent,
                tags: ['deployment', 'configuration', 'infrastructure'],
                confidenceLevel: 'high',
                version: '1.0',
            });
            console.log('✅ Ingested Deployment Readiness Report\n');
        }
        catch (error) {
            console.warn('⚠️  Could not ingest Deployment Readiness Report:', error);
        }
        // 4. Runbooks
        const runbooksDir = join(ROOT_DIR, 'docs/runbooks');
        const runbookFiles = [
            { file: 'anomalies.md', title: 'General Anomaly Response', tags: ['anomalies', 'troubleshooting'] },
            { file: 'marketplace-degraded.md', title: 'Marketplace Degraded Handling', tags: ['degraded', 'zero-results'] },
            { file: 'source-fallback.md', title: 'Source Fallback Decision Trees', tags: ['apify', 'diy', 'fallback'] },
            { file: 'facebook-noise-filtering.md', title: 'Facebook Noise Filtering', tags: ['facebook', 'parsing', 'noise'] },
            { file: 'craigslist-selector-rehab.md', title: 'Craigslist Selector Rehabilitation', tags: ['craigslist', 'selectors', 'dom-drift'] },
        ];
        for (const runbook of runbookFiles) {
            try {
                const runbookPath = join(runbooksDir, runbook.file);
                const runbookContent = readFileSync(runbookPath, 'utf-8');
                await ingestDocument({
                    title: runbook.title,
                    source: `repo:/docs/runbooks/${runbook.file}`,
                    content: runbookContent,
                    tags: ['runbook', ...runbook.tags],
                    confidenceLevel: 'medium',
                    version: '1.0',
                });
                console.log(`✅ Ingested runbook: ${runbook.file}\n`);
            }
            catch (error) {
                console.warn(`⚠️  Could not ingest runbook ${runbook.file}:`, error);
            }
        }
        console.log('[KB] Knowledge base seeding complete!');
    }
    catch (error) {
        console.error('[KB] Error seeding knowledge base:', error);
        process.exit(1);
    }
}
// Run if called directly
if (require.main === module) {
    seedKnowledgeBase().catch(console.error);
}
export { seedKnowledgeBase };
//# sourceMappingURL=seed.js.map