"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingTierCard = PricingTierCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const card_1 = require("../../../../../apps/web/src/components/ui/card");
const button_1 = require("../../../../../apps/web/src/components/ui/button");
const BadgeMostPopular_1 = require("./BadgeMostPopular");
const FeatureRow_1 = require("./FeatureRow");
function PricingTierCard({ name, headline, price, period = "mo", features, isMostPopular, ctaLabel, onSelect, footerNote, }) {
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: `flex h-full flex-col border-slate-800 bg-slate-950/85 ${isMostPopular ? "ring-2 ring-cyan-400/70 shadow-xl shadow-cyan-900/40" : "shadow-md shadow-black/30"}`, children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-xl", children: name }), isMostPopular && (0, jsx_runtime_1.jsx)(BadgeMostPopular_1.BadgeMostPopular, {})] }), headline && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-300", children: headline }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-baseline gap-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-3xl font-bold", children: price }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-slate-400", children: ["/ ", period] })] })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "flex flex-1 flex-col space-y-4 text-sm", children: [(0, jsx_runtime_1.jsx)("ul", { className: "space-y-2 text-slate-200", children: features.map((item) => ((0, jsx_runtime_1.jsx)(FeatureRow_1.FeatureRow, { text: item }, item))) }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-auto space-y-2", children: [(0, jsx_runtime_1.jsx)(button_1.Button, { className: "w-full rounded-full", onClick: onSelect, children: ctaLabel }), footerNote && (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-slate-400", children: footerNote })] })] })] }));
}
//# sourceMappingURL=PricingTierCard.js.map