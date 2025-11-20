const fs = require('fs').promises;
const path = require('path');

async function loadCookies() {
  const cookiesPath = path.join(__dirname, 'cookies.json');
  try {
    const cookiesJson = await fs.readFile(cookiesPath, 'utf8');
    const cookies = JSON.parse(cookiesJson);
    return cookies;
  } catch (error) {
    console.error('Error loading cookies:', error);
    return [];
  }
}

module.exports = { loadCookies };
