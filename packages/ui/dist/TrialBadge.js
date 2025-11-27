"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrialBadge = TrialBadge;
const jsx_runtime_1 = require("react/jsx-runtime");
function TrialBadge({ expiresAt }) {
    return ((0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-100", children: ["Trial", expiresAt ? ` ends ${expiresAt}` : ""] }));
}
//# sourceMappingURL=TrialBadge.js.map