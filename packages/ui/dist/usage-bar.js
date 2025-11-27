"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageBar = UsageBar;
const jsx_runtime_1 = require("react/jsx-runtime");
function UsageBar({ value }) {
    const pct = Math.min(100, Math.max(0, value));
    return ((0, jsx_runtime_1.jsx)("div", { className: "w-full", children: (0, jsx_runtime_1.jsx)("div", { className: "h-2 w-full bg-gray-200 rounded-full overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "h-full bg-gradient-to-r from-indigo-600 to-cyan-500", style: { width: pct + "%" } }) }) }));
}
//# sourceMappingURL=usage-bar.js.map