function randomDelay(min, max) {
  return new Promise(resolve => {
    setTimeout(resolve, Math.random() * (max - min) + min);
  });
}

async function humanScroll(page) {
  let totalHeight = await page.evaluate(() => document.body.scrollHeight);
  let currentPosition = 0;
  while (currentPosition < totalHeight) {
    const scrollDistance = Math.floor(Math.random() * 400) + 200;
    await page.evaluate(distance => {
      window.scrollBy(0, distance);
    }, scrollDistance);
    await randomDelay(200, 600);
    currentPosition += scrollDistance;
    totalHeight = await page.evaluate(() => document.body.scrollHeight);
  }
}

module.exports = { randomDelay, humanScroll };
