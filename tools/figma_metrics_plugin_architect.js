#!/usr/bin/env node

/**
 * Figma Metrics Plugin Architect
 * 
 * Scaffolds a production-grade Figma plugin that auto-imports
 * live canary metrics into Figma for the Enterprise Canary Dashboard.
 */

const fs = require('fs');
const path = require('path');

const PLUGIN_DIR = path.resolve('figma-plugins/canary-metrics-sync');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created: ${filePath}`);
}

// Create directory structure
ensureDir(PLUGIN_DIR);
ensureDir(path.join(PLUGIN_DIR, 'src'));
ensureDir(path.join(PLUGIN_DIR, 'dist'));

// 1. manifest.json
writeFile(
  path.join(PLUGIN_DIR, 'manifest.json'),
  JSON.stringify({
    name: 'Canary Metrics Sync',
    id: 'canary-metrics-sync',
    api: '1.0.0',
    main: 'code.js',
    ui: 'ui.html',
    editorType: ['figma'],
    networkAccess: {
      allowedDomains: ['*'],
    },
    permissions: ['currentuser'],
  }, null, 2)
);

// 2. package.json
writeFile(
  path.join(PLUGIN_DIR, 'package.json'),
  JSON.stringify({
    name: 'canary-metrics-sync',
    version: '1.0.0',
    description: 'Figma plugin to sync live canary metrics from API',
    main: 'code.js',
    scripts: {
      build: 'tsc',
      watch: 'tsc --watch',
      dev: 'tsc --watch',
    },
    devDependencies: {
      '@figma/plugin-typings': '^1.0.0',
      'typescript': '^5.6.3',
    },
  }, null, 2)
);

// 3. tsconfig.json
writeFile(
  path.join(PLUGIN_DIR, 'tsconfig.json'),
  JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ES2020',
      lib: ['ES2020'],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      moduleResolution: 'node',
      typeRoots: ['./node_modules/@types', './node_modules/@figma'],
    },
    include: ['src/**/*'],
  }, null, 2)
);

// 4. src/code.ts
writeFile(
  path.join(PLUGIN_DIR, 'src/code.ts'),
  `// This code runs in the Figma plugin sandbox

figma.showUI(__html__, { width: 400, height: 500 });

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'sync-metrics') {
    await syncMetrics(msg.apiUrl, msg.apiKey);
  } else if (msg.type === 'test-api') {
    await testApi(msg.apiUrl, msg.apiKey);
  } else if (msg.type === 'save-config') {
    await saveConfig(msg.config);
  } else if (msg.type === 'load-config') {
    await loadConfig();
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};

async function syncMetrics(apiUrl: string, apiKey?: string) {
  try {
    figma.ui.postMessage({ type: 'status', message: 'Fetching metrics...' });
    
    const metrics = await fetchMetrics(apiUrl, apiKey);
    
    figma.ui.postMessage({ type: 'status', message: 'Updating Figma layers...' });
    
    const updated = await updateFigmaLayers(metrics);
    
    figma.ui.postMessage({
      type: 'success',
      message: \`Synced metrics at \${new Date().toISOString()}\`,
      updated: updated,
    });
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Failed to sync metrics',
    });
  }
}

async function fetchMetrics(apiUrl: string, apiKey?: string): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (apiKey) {
    headers['Authorization'] = \`Bearer \${apiKey}\`;
  }
  
  const response = await fetch(\`\${apiUrl}/v1/canary/summary\`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    throw new Error(\`API error: \${response.status} \${response.statusText}\`);
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
    trafficNode.characters = \`\${stable.toFixed(0)}% stable / \${canary.toFixed(0)}% canary\`;
    updated++;
  }
  
  // Update error rate
  const errorNode = findNodeByName(mappings.errorRate);
  if (errorNode && 'characters' in errorNode) {
    const rate = (metrics.canary?.errorRate || 0) * 100;
    const count = metrics.canary?.errorCount || 0;
    errorNode.characters = \`\${rate.toFixed(2)}% (\${count} errors)\`;
    updated++;
  }
  
  // Update latency
  const latencyNode = findNodeByName(mappings.latencyP95);
  if (latencyNode && 'characters' in latencyNode) {
    const latency = metrics.canary?.latencyP95 || 0;
    latencyNode.characters = \`\${latency} ms\`;
    updated++;
  }
  
  // Update ML decision
  const mlNode = findNodeByName(mappings.mlDecision);
  if (mlNode && 'characters' in mlNode) {
    const decision = metrics.canary?.mlDecision?.decision || 'UNKNOWN';
    const confidence = (metrics.canary?.mlDecision?.confidence || 0) * 100;
    mlNode.characters = \`\${decision} (\${confidence.toFixed(0)}%)\`;
    updated++;
    
    // Update status color
    updateStatusFill(mlNode, decision);
  }
  
  // Update health score
  const healthNode = findNodeByName(mappings.healthScore);
  if (healthNode && 'characters' in healthNode) {
    const rate = (metrics.canary?.healthPassRate || 0) * 100;
    healthNode.characters = \`\${rate.toFixed(1)}% passing /health\`;
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
    const date = new Date(metrics.lastUpdatedAt || Date.now());
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

async function testApi(apiUrl: string, apiKey?: string) {
  try {
    const metrics = await fetchMetrics(apiUrl, apiKey);
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
`
);

// 5. src/ui.html
writeFile(
  path.join(PLUGIN_DIR, 'src/ui.html'),
  `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 16px;
      margin: 0;
      background: #ffffff;
      color: #1f2328;
    }
    .section {
      margin-bottom: 24px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #656d76;
    }
    input, select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d9e0;
      border-radius: 6px;
      font-size: 14px;
      box-sizing: border-box;
    }
    button {
      width: 100%;
      padding: 10px;
      background: #0969da;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      margin-top: 8px;
    }
    button:hover {
      background: #0860ca;
    }
    button.secondary {
      background: #f6f8fa;
      color: #1f2328;
      border: 1px solid #d1d9e0;
    }
    button.secondary:hover {
      background: #e7ebf0;
    }
    .status {
      padding: 12px;
      border-radius: 6px;
      margin-top: 12px;
      font-size: 13px;
    }
    .status.success {
      background: #dafbe1;
      color: #1a7f37;
    }
    .status.error {
      background: #ffebe9;
      color: #cf222e;
    }
    .status.info {
      background: #ddf4ff;
      color: #0969da;
    }
    #statusMessage {
      display: none;
    }
  </style>
</head>
<body>
  <h2 style="margin-top: 0; font-size: 18px;">Canary Metrics Sync</h2>
  
  <div class="section">
    <label>Base API URL</label>
    <input type="text" id="apiUrl" placeholder="https://api.example.com/canary" />
  </div>
  
  <div class="section">
    <label>API Key (Optional)</label>
    <input type="password" id="apiKey" placeholder="Bearer token" />
  </div>
  
  <div class="section">
    <label>Environment</label>
    <select id="environment">
      <option value="production">Production</option>
      <option value="staging">Staging</option>
      <option value="local">Local</option>
    </select>
  </div>
  
  <button id="testApi" class="secondary">Test API Connection</button>
  <button id="syncNow">Sync Metrics Now</button>
  <button id="saveConfig" class="secondary">Save Configuration</button>
  
  <div id="statusMessage" class="status"></div>
  
  <script src="ui.js"></script>
</body>
</html>
`
);

// 6. src/ui.tsx (compiled to ui.js)
writeFile(
  path.join(PLUGIN_DIR, 'src/ui.ts'),
  `// UI logic for plugin configuration panel

const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
const apiKeyInput = document.getElementById('apiKey') as HTMLInputElement;
const environmentSelect = document.getElementById('environment') as HTMLSelectElement;
const testApiBtn = document.getElementById('testApi') as HTMLButtonElement;
const syncNowBtn = document.getElementById('syncNow') as HTMLButtonElement;
const saveConfigBtn = document.getElementById('saveConfig') as HTMLButtonElement;
const statusMessage = document.getElementById('statusMessage') as HTMLDivElement;

// Load config on startup
window.onmessage = (event) => {
  const msg = event.data.pluginMessage;
  
  if (msg.type === 'config-loaded') {
    if (msg.config) {
      apiUrlInput.value = msg.config.apiUrl || '';
      apiKeyInput.value = msg.config.apiKey || '';
      environmentSelect.value = msg.config.environment || 'production';
    }
  } else if (msg.type === 'status') {
    showStatus(msg.message, 'info');
  } else if (msg.type === 'success') {
    showStatus(\`\${msg.message}\\nUpdated \${msg.updated} layers\`, 'success');
  } else if (msg.type === 'error') {
    showStatus(msg.message, 'error');
  } else if (msg.type === 'api-test-success') {
    showStatus('API connection successful!', 'success');
  } else if (msg.type === 'api-test-error') {
    showStatus(\`API test failed: \${msg.message}\`, 'error');
  } else if (msg.type === 'config-saved') {
    showStatus('Configuration saved', 'success');
  }
};

testApiBtn.onclick = () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiUrl) {
    showStatus('Please enter an API URL', 'error');
    return;
  }
  
  parent.postMessage({ pluginMessage: { type: 'test-api', apiUrl, apiKey } }, '*');
};

syncNowBtn.onclick = () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiUrl) {
    showStatus('Please enter an API URL', 'error');
    return;
  }
  
  parent.postMessage({ pluginMessage: { type: 'sync-metrics', apiUrl, apiKey } }, '*');
};

saveConfigBtn.onclick = () => {
  const config = {
    apiUrl: apiUrlInput.value.trim(),
    apiKey: apiKeyInput.value.trim(),
    environment: environmentSelect.value,
  };
  
  parent.postMessage({ pluginMessage: { type: 'save-config', config } }, '*');
};

function showStatus(message: string, type: 'success' | 'error' | 'info') {
  statusMessage.textContent = message;
  statusMessage.className = \`status \${type}\`;
  statusMessage.style.display = 'block';
  
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
}

// Request config on load
parent.postMessage({ pluginMessage: { type: 'load-config' } }, '*');
`
);

// 7. README.md
writeFile(
  path.join(PLUGIN_DIR, 'README.md'),
  `# Canary Metrics Sync - Figma Plugin

A Figma plugin that automatically syncs live canary deployment metrics from your API into Figma frames and components.

## Features

- 🔄 Sync canary metrics from HTTP API
- 🎨 Auto-update text layers and status colors
- 🔐 Secure API key storage
- ⚡ One-click sync
- 🧪 API connection testing

## Installation (Development)

1. **Build the plugin:**
   \`\`\`bash
   cd figma-plugins/canary-metrics-sync
   npm install
   npm run build
   \`\`\`

2. **Load in Figma:**
   - Open Figma Desktop app
   - Go to \`Plugins → Development → Import plugin from manifest...\`
   - Select \`figma-plugins/canary-metrics-sync/manifest.json\`
   - The plugin will appear in \`Plugins → Development → Canary Metrics Sync\`

## Configuration

1. **Run the plugin** in Figma
2. **Enter your API URL:**
   - Production: \`https://api.example.com/canary\`
   - Local: \`http://localhost:3000/api/canary\`
3. **Optional:** Add API key/token for authentication
4. **Click "Save Configuration"**

## Layer Naming Convention

The plugin looks for specific layer names in your Figma file. Name your text layers as follows:

- \`metric-canary-traffic\` - Traffic split (e.g., "90% stable / 10% canary")
- \`metric-error-rate\` - Error rate (e.g., "0.23% (12 errors)")
- \`metric-latency-p95\` - P95 latency (e.g., "427 ms")
- \`metric-ml-decision\` - ML decision (e.g., "PROMOTE (91%)")
- \`metric-health-score\` - Health pass rate (e.g., "99.3% passing /health")
- \`metric-canary-revision\` - Canary revision name
- \`metric-stable-revision\` - Stable revision name
- \`metric-last-updated\` - Last update timestamp

## API Format

The plugin expects an API endpoint at \`{baseUrl}/v1/canary/summary\` that returns:

\`\`\`json
{
  "env": "production",
  "canary": {
    "revision": "mf-worker-realtime@2025-12-09-01",
    "traffic": {
      "canary": 0.1,
      "stable": 0.9
    },
    "errorRate": 0.0023,
    "errorCount": 12,
    "latencyP95": 427,
    "healthPassRate": 0.993,
    "mlDecision": {
      "decision": "PROMOTE",
      "confidence": 0.91,
      "anomalies": []
    }
  },
  "stable": {
    "revision": "mf-worker-realtime@2025-12-08-05"
  },
  "lastUpdatedAt": "2025-12-09T18:00:00Z"
}
\`\`\`

## Usage

1. **Open your Enterprise Canary Dashboard Figma file**
2. **Run the plugin:** \`Plugins → Development → Canary Metrics Sync\`
3. **Click "Sync Metrics Now"**
4. The plugin will:
   - Fetch latest metrics from your API
   - Update all matching text layers
   - Apply status colors to ML decision badges
   - Show a success message with update count

## Security

- API keys are stored locally in Figma's \`clientStorage\`
- Never commit real API keys to git
- Use environment variables or Figma secrets for production

## Troubleshooting

**"No layers updated"**
- Check that your text layers are named correctly (see Layer Naming Convention)
- Ensure layers are on the current page

**"API error: 404"**
- Verify your API URL is correct
- Check that the endpoint \`/v1/canary/summary\` exists

**"API error: 401"**
- Add your API key in the plugin configuration
- Verify the token has correct permissions

## Development

\`\`\`bash
# Watch mode (auto-rebuild on changes)
npm run watch

# Build once
npm run build
\`\`\`

After building, reload the plugin in Figma to see changes.

## License

Private - Magnus Flipper AI
`
);

// 8. .gitignore
writeFile(
  path.join(PLUGIN_DIR, '.gitignore'),
  `node_modules/
dist/
*.log
.DS_Store
`
);

console.log('\n✅ Figma Metrics Plugin scaffolded successfully!');
console.log(`\n📁 Location: ${PLUGIN_DIR}`);
console.log('\n📋 Next steps:');
console.log('  1. cd figma-plugins/canary-metrics-sync');
console.log('  2. npm install');
console.log('  3. npm run build');
console.log('  4. Load in Figma: Plugins → Development → Import plugin from manifest');
