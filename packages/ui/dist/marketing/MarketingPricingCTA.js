"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarketingPricingCTA = MarketingPricingCTA;
const jsx_runtime_1 = require("react/jsx-runtime");
function MarketingPricingCTA({ title, description, primaryAction, secondaryAction, }) {
    return ((0, jsx_runtime_1.jsx)("section", { className: "rounded-3xl border border-white/10 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 p-6 text-white shadow-2xl sm:p-10", children: (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-semibold sm:text-3xl", children: title }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-white/80 sm:text-base", children: description })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-wrap items-center gap-3", children: [primaryAction, secondaryAction] })] }) }));
}
//# sourceMappingURL=MarketingPricingCTA.js.map