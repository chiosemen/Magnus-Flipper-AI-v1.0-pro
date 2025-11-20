const fs = require('fs').promises;
const path = require('path');

async function saveListings(listings) {
  const dataDir = path.join(__dirname, '..', 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
    const filePath = path.join(dataDir, 'listings.json');
    await fs.writeFile(filePath, JSON.stringify(listings, null, 2));
    console.log(`Saved ${listings.length} listings to ${filePath}`);
  } catch (error) {
    console.error('Error saving listings:', error);
  }
}

module.exports = { saveListings };
