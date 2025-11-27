"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureRow = FeatureRow;
const jsx_runtime_1 = require("react/jsx-runtime");
function FeatureRow({ text }) {
    return ((0, jsx_runtime_1.jsxs)("li", { className: "flex items-start gap-2 text-sm text-slate-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400/80" }), (0, jsx_runtime_1.jsx)("span", { children: text })] }));
}
//# sourceMappingURL=FeatureRow.js.map