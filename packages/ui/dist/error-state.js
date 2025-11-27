"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorState = ErrorState;
const jsx_runtime_1 = require("react/jsx-runtime");
const card_1 = require("../../apps/web/src/components/ui/card");
const utils_1 = require("../../apps/web/src/lib/utils");
function ErrorState({ title, description, action, className }) {
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: (0, utils_1.cn)("border-rose-500/30 bg-rose-500/5", className), children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-lg text-white", children: title }), description && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-rose-100/90", children: description })] }), action && (0, jsx_runtime_1.jsx)(card_1.CardContent, { children: action })] }));
}
//# sourceMappingURL=error-state.js.map