/**
 * Marketplace Cookies
 * Loads cookies once per marketplace for injection into HTTP requests
 */
import { loadCookieHeader, loadCookiesForPlaywright } from './cookies.js';
// Lazy load cookies to avoid errors if files don't exist
let cookiesLoaded = false;
const cookieCache = {};
const playwrightCookieCache = {};
function loadCookies() {
    if (cookiesLoaded)
        return;
    try {
        cookieCache.vinted = loadCookieHeader('vinted.cookies.json');
        playwrightCookieCache.vinted = loadCookiesForPlaywright('vinted.cookies.json', 'vinted.com');
        console.log(`[COOKIE] Loaded Vinted cookies (${playwrightCookieCache.vinted.length})`);
    }
    catch (error) {
        console.warn(`[COOKIE] Could not load Vinted cookies: ${error.message}`);
        cookieCache.vinted = '';
        playwrightCookieCache.vinted = [];
    }
    try {
        cookieCache.facebook = loadCookieHeader('facebook.cookies.json');
        playwrightCookieCache.facebook = loadCookiesForPlaywright('facebook.cookies.json', 'facebook.com');
        console.log(`[COOKIE] Loaded Facebook cookies (${playwrightCookieCache.facebook.length})`);
    }
    catch (error) {
        console.warn(`[COOKIE] Could not load Facebook cookies: ${error.message}`);
        cookieCache.facebook = '';
        playwrightCookieCache.facebook = [];
    }
    cookiesLoaded = true;
}
export const MARKETPLACE_COOKIES = new Proxy({}, {
    get(target, prop) {
        if (!cookiesLoaded) {
            loadCookies();
        }
        return cookieCache[prop] || '';
    }
});
export const MARKETPLACE_COOKIES_PLAYWRIGHT = new Proxy({}, {
    get(target, prop) {
        if (!cookiesLoaded) {
            loadCookies();
        }
        return playwrightCookieCache[prop] || [];
    }
});
//# sourceMappingURL=marketplaceCookies.js.map