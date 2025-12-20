/**
 * Cookie Loader Utility
 * Loads browser cookies from JSON files for injection into HTTP requests
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Load cookies from JSON file and return as HTTP Cookie header string
 */
export function loadCookieHeader(filename) {
    // Resolve path relative to this file's location (works in both src/ and dist/)
    // From runtime/cookies.ts -> dev/ = ../dev/
    // From dist/runtime/cookies.js -> dev/ = ../../dev/
    const fullPath = path.resolve(__dirname, '../../dev', filename);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`[COOKIE] Missing cookie file: ${filename} at ${fullPath}`);
    }
    const cookies = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`[COOKIE] Loaded ${filename} (${cookies.length} cookies)`);
    return cookies.map((c) => `${c.name}=${c.value}`).join('; ');
}
/**
 * Load cookies from JSON file and return as Playwright cookie format
 */
export function loadCookiesForPlaywright(filename, domain) {
    // Resolve path relative to this file's location (works in both src/ and dist/)
    // From runtime/cookies.ts -> dev/ = ../dev/
    // From dist/runtime/cookies.js -> dev/ = ../../dev/
    const fullPath = path.resolve(__dirname, '../../dev', filename);
    if (!fs.existsSync(fullPath)) {
        return [];
    }
    const cookies = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    console.log(`[COOKIE] Loaded ${filename} for Playwright (${cookies.length} cookies)`);
    return cookies.map((c) => ({
        name: c.name,
        value: c.value,
        domain: c.domain || domain,
        path: c.path || '/',
        expires: c.expires,
        httpOnly: c.httpOnly || false,
        secure: c.secure !== undefined ? c.secure : true,
        sameSite: c.sameSite || 'Lax',
    }));
}
//# sourceMappingURL=cookies.js.map