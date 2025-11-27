"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingSEO = MarketingSEO;
const jsx_runtime_1 = require("react/jsx-runtime");
function MarketingSEO({ name, description, url }) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name,
        description,
        brand: 'Magnus Flipper',
        url,
        offers: [{ '@type': 'Offer', availability: 'https://schema.org/InStock' }],
    };
    return ((0, jsx_runtime_1.jsx)("script", { type: "application/ld+json", suppressHydrationWarning: true, dangerouslySetInnerHTML: { __html: JSON.stringify(jsonLd) } }));
}
//# sourceMappingURL=MarketingSEO.js.map