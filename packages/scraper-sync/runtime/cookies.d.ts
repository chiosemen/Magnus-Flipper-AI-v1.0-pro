/**
 * Cookie Loader Utility
 * Loads browser cookies from JSON files for injection into HTTP requests
 */
export interface CookieData {
    name: string;
    value: string;
    domain?: string;
    path?: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
}
/**
 * Load cookies from JSON file and return as HTTP Cookie header string
 */
export declare function loadCookieHeader(filename: string): string;
/**
 * Load cookies from JSON file and return as Playwright cookie format
 */
export declare function loadCookiesForPlaywright(filename: string, domain: string): CookieData[];
//# sourceMappingURL=cookies.d.ts.map