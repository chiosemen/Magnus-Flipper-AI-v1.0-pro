// UI logic for plugin configuration panel

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
    showStatus(`${msg.message}\nUpdated ${msg.updated} layers`, 'success');
  } else if (msg.type === 'error') {
    showStatus(msg.message, 'error');
  } else if (msg.type === 'api-test-success') {
    showStatus('API connection successful!', 'success');
  } else if (msg.type === 'api-test-error') {
    showStatus(`API test failed: ${msg.message}`, 'error');
  } else if (msg.type === 'config-saved') {
    showStatus('Configuration saved', 'success');
  }
};

testApiBtn.onclick = () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const env = environmentSelect.value;
  const worker = 'mf-worker-realtime'; // Can be made configurable later
  
  if (!apiUrl) {
    showStatus('Please enter an API URL', 'error');
    return;
  }
  
  parent.postMessage({ pluginMessage: { type: 'test-api', apiUrl, apiKey, env, worker } }, '*');
};

syncNowBtn.onclick = () => {
  const apiUrl = apiUrlInput.value.trim();
  const apiKey = apiKeyInput.value.trim();
  const env = environmentSelect.value;
  const worker = 'mf-worker-realtime'; // Can be made configurable later
  
  if (!apiUrl) {
    showStatus('Please enter an API URL', 'error');
    return;
  }
  
  parent.postMessage({ pluginMessage: { type: 'sync-metrics', apiUrl, apiKey, env, worker } }, '*');
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
  statusMessage.className = `status ${type}`;
  statusMessage.style.display = 'block';
  
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      statusMessage.style.display = 'none';
    }, 5000);
  }
}

// Request config on load
parent.postMessage({ pluginMessage: { type: 'load-config' } }, '*');
