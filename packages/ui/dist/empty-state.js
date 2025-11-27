"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmptyState = EmptyState;
const jsx_runtime_1 = require("react/jsx-runtime");
function EmptyState({ title, description }) {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-16 opacity-80", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-semibold mb-2", children: title }), description && ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 max-w-sm mx-auto", children: description }))] }));
}
//# sourceMappingURL=empty-state.js.map