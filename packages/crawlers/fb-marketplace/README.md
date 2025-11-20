# Facebook Marketplace Crawler

This is a web crawler for Facebook Marketplace, built with Playwright.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Install Playwright browsers:
    ```bash
    npx playwright install
    ```

## Usage

1.  **Get your Facebook cookies:**
    *   Log in to Facebook in your browser.
    *   Open the developer tools (usually F12 or Ctrl+Shift+I).
    *   Go to the "Network" tab.
    *   Filter for requests to `facebook.com`.
    *   Find a request and look for the `Cookie` header in the request headers.
    *   Copy the entire cookie string.
2.  **Update the `cookies.json` file:**
    *   Open the `src/cookies.json` file.
    *   Replace the placeholder values with your actual cookies. Make sure to keep the same format (name, value, domain, path).
3.  **Run the crawler:**
    ```bash
    node src/crawler.js
    ```

## How it works

The crawler uses Playwright with the `puppeteer-extra-plugin-stealth` to avoid being detected as a bot. It loads your Facebook session cookies to authenticate with Facebook and then navigates to the Marketplace to scrape the listings.

The scraped data is saved to a file in the `data` directory.
