"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BadgeMostPopular = BadgeMostPopular;
const jsx_runtime_1 = require("react/jsx-runtime");
const badge_1 = require("../../../../../apps/web/src/components/ui/badge");
function BadgeMostPopular({ label = "Most Popular" }) {
    return ((0, jsx_runtime_1.jsx)(badge_1.Badge, { className: "bg-cyan-500 text-[10px] font-semibold uppercase tracking-wide text-slate-950", children: label }));
}
//# sourceMappingURL=BadgeMostPopular.js.map