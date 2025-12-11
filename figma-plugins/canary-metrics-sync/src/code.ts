// This code runs in the Figma plugin sandbox

figma.showUI(__html__, { width: 400, height: 500 });

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'sync-metrics') {
    await syncMetrics(msg.apiUrl, msg.apiKey, msg.env, msg.worker);
  } else if (msg.type === 'test-api') {
    await testApi(msg.apiUrl, msg.apiKey, msg.env, msg.worker);
  } else if (msg.type === 'save-config') {
    await saveConfig(msg.config);
  } else if (msg.type === 'load-config') {
    await loadConfig();
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

async function syncMetrics(apiUrl: string, apiKey: string | undefined, env: string = 'production', worker: string = 'mf-worker-realtime') {
  try {
    figma.ui.postMessage({ type: 'status', message: 'Fetching metrics...' });
    
    const metrics = await fetchMetrics(apiUrl, apiKey, env, worker);
    
    figma.ui.postMessage({ type: 'status', message: 'Updating Figma layers...' });
    
    const updated = await updateFigmaLayers(metrics);
    
    figma.ui.postMessage({
      type: 'success',
      message: `Synced metrics at ${new Date().toISOString()}`,
      updated: updated,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to sync metrics',
    });
  }
}

async function fetchMetrics(apiUrl: string, apiKey: string | undefined, env: string = 'production', worker: string = 'mf-worker-realtime'): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  
  // Use the canonical /api/canary/summary endpoint
  const url = new URL('/api/canary/summary', apiUrl);
  url.searchParams.set('env', env);
  url.searchParams.set('worker', worker);
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

async function updateFigmaLayers(metrics: any): Promise<number> {
  let updated = 0;
  
  // Find and update text layers
  const nodes = figma.currentPage.findAll();
  
  const mappings = {
    canaryTraffic: 'metric-canary-traffic',
    errorRate: 'metric-error-rate',
    latencyP95: 'metric-latency-p95',
    mlDecision: 'metric-ml-decision',
    healthScore: 'metric-health-score',
    canaryRevision: 'metric-canary-revision',
    stableRevision: 'metric-stable-revision',
    lastUpdated: 'metric-last-updated',
  };
  
  // Update canary traffic
  const trafficNode = findNodeByName(mappings.canaryTraffic);
  if (trafficNode && 'characters' in trafficNode) {
    const canary = (metrics.canary?.traffic?.canary || 0) * 100;
    const stable = (metrics.canary?.traffic?.stable || 0) * 100;
    trafficNode.characters = `${stable.toFixed(0)}% stable / ${canary.toFixed(0)}% canary`;
    updated++;
  }
  
  // Update error rate
  const errorNode = findNodeByName(mappings.errorRate);
  if (errorNode && 'characters' in errorNode) {
    const rate = (metrics.canary?.errorRate || 0) * 100;
    const count = metrics.traffic?.errorCountLast15m || 0;
    errorNode.characters = `${rate.toFixed(2)}% (${count} errors)`;
    updated++;
  }
  
  // Update latency
  const latencyNode = findNodeByName(mappings.latencyP95);
  if (latencyNode && 'characters' in latencyNode) {
    const latency = metrics.canary?.latencyP95 || 0;
    latencyNode.characters = `${latency} ms`;
    updated++;
  }
  
  // Update ML decision
  const mlNode = findNodeByName(mappings.mlDecision);
  if (mlNode && 'characters' in mlNode) {
    const decision = metrics.canary?.mlDecision?.decision || 'UNKNOWN';
    const confidence = (metrics.canary?.mlDecision?.confidence || 0) * 100;
    mlNode.characters = `${decision} (${confidence.toFixed(0)}%)`;
    updated++;
    
    // Update status color
    updateStatusFill(mlNode, decision);
  }
  
  // Update health score
  const healthNode = findNodeByName(mappings.healthScore);
  if (healthNode && 'characters' in healthNode) {
    const rate = (metrics.canary?.healthPassRate || 0) * 100;
    healthNode.characters = `${rate.toFixed(1)}% passing /health`;
    updated++;
  }
  
  // Update revisions
  const canaryRevNode = findNodeByName(mappings.canaryRevision);
  if (canaryRevNode && 'characters' in canaryRevNode) {
    canaryRevNode.characters = metrics.canary?.revision || '-';
    updated++;
  }
  
  const stableRevNode = findNodeByName(mappings.stableRevision);
  if (stableRevNode && 'characters' in stableRevNode) {
    stableRevNode.characters = metrics.stable?.revision || '-';
    updated++;
  }
  
  // Update last updated
  const lastUpdatedNode = findNodeByName(mappings.lastUpdated);
  if (lastUpdatedNode && 'characters' in lastUpdatedNode) {
    const date = new Date(metrics.timestamps?.lastAnalysisAt || Date.now());
    lastUpdatedNode.characters = date.toLocaleString();
    updated++;
  }
  
  return updated;
}

function findNodeByName(name: string): SceneNode | null {
  const nodes = figma.currentPage.findAll();
  return nodes.find((node) => node.name === name) || null;
}

function updateStatusFill(node: SceneNode, decision: string) {
  if (!('fills' in node)) return;
  
  const colors = {
    PROMOTE: { r: 0.133, g: 0.773, b: 0.369 }, // #22C55E
    ROLLBACK: { r: 0.937, g: 0.267, b: 0.267 }, // #EF4444
    DEGRADED: { r: 0.961, g: 0.620, b: 0.043 }, // #F59E0B
  };
  
  const color = colors[decision as keyof typeof colors] || colors.DEGRADED;
  
  node.fills = [{
    type: 'SOLID',
    color: color,
  }];
}

async function testApi(apiUrl: string, apiKey: string | undefined, env: string = 'production', worker: string = 'mf-worker-realtime') {
  try {
    const metrics = await fetchMetrics(apiUrl, apiKey, env, worker);
    figma.ui.postMessage({
      type: 'api-test-success',
      message: 'API connection successful',
      sample: metrics,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'api-test-error',
      message: error instanceof Error ? error.message : 'API test failed',
    });
  }
}

async function saveConfig(config: any) {
  await figma.clientStorage.setAsync('canary-metrics-config', config);
  figma.ui.postMessage({ type: 'config-saved' });
}

async function loadConfig() {
  const config = await figma.clientStorage.getAsync('canary-metrics-config');
  figma.ui.postMessage({ type: 'config-loaded', config: config || null });
}

// Load config on startup
loadConfig();
