"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceCalculator = PriceCalculator;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const card_1 = require("../../../../../apps/web/src/components/ui/card");
const label_1 = require("../../../../../apps/web/src/components/ui/label");
const button_1 = require("../../../../../apps/web/src/components/ui/button");
const input_1 = require("../../../../../apps/web/src/components/ui/input");
const switch_1 = require("../../../../../apps/web/src/components/ui/switch");
const MARKETPLACES = ["Facebook Marketplace", "Craigslist", "Gumtree", "OfferUp", "Kijiji", "eBay"];
function PriceCalculator({ onPlanSuggested }) {
    const [selectedMarkets, setSelectedMarkets] = (0, react_1.useState)(["Facebook Marketplace", "Craigslist"]);
    const [keywordCount, setKeywordCount] = (0, react_1.useState)(3);
    const [instant, setInstant] = (0, react_1.useState)(true);
    const [coverage, setCoverage] = (0, react_1.useState)("regional");
    const recommended = (0, react_1.useMemo)(() => {
        let plan = "STARTER";
        if (keywordCount <= 2 && !instant)
            plan = "STARTER";
        else if (keywordCount <= 5)
            plan = "BASIC";
        else if (keywordCount <= 8)
            plan = "PREMIUM";
        else
            plan = "ULTRA";
        if (instant && plan !== "ULTRA")
            plan = "PREMIUM";
        if (selectedMarkets.length > 3)
            plan = "ULTRA";
        if (onPlanSuggested)
            onPlanSuggested(plan);
        return plan;
    }, [keywordCount, instant, selectedMarkets.length, onPlanSuggested]);
    const coverageLabel = coverage === "local" ? "Local radius" : coverage === "regional" ? "Regional coverage" : "Nationwide sweep";
    return ((0, jsx_runtime_1.jsxs)(card_1.Card, { className: "border-slate-800 bg-slate-950/80", children: [(0, jsx_runtime_1.jsxs)(card_1.CardHeader, { children: [(0, jsx_runtime_1.jsx)(card_1.CardTitle, { className: "text-lg", children: "Pricing calculator" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-300", children: "Tune how aggressively you want to scan; we\u2019ll suggest a plan." })] }), (0, jsx_runtime_1.jsxs)(card_1.CardContent, { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Marketplaces" }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-2", children: MARKETPLACES.map((mkt) => {
                                    const active = selectedMarkets.includes(mkt);
                                    return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setSelectedMarkets((prev) => prev.includes(mkt) ? prev.filter((x) => x !== mkt) : [...prev, mkt]), className: `rounded-full border px-3 py-1 text-xs transition ${active
                                            ? "border-cyan-400 bg-cyan-500/10 text-cyan-200"
                                            : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500"}`, children: mkt }, mkt));
                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-2", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Keywords to track" }), (0, jsx_runtime_1.jsx)(input_1.Input, { type: "number", min: 1, max: 12, value: keywordCount, onChange: (e) => setKeywordCount(Math.max(1, Math.min(12, Number(e.target.value)))) }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-slate-400", children: "Each saved search can include multiple keywords; add more for broader coverage." })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-4 py-3", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-slate-100", children: "Instant alerts" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-slate-400", children: "Faster scans suggest higher tiers." })] }), (0, jsx_runtime_1.jsx)(switch_1.Switch, { checked: instant, onCheckedChange: setInstant })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsx)(label_1.Label, { className: "text-xs uppercase tracking-wide text-slate-400", children: "Coverage window" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-3 gap-2 text-xs", children: ["local", "regional", "national"].map((scope) => {
                                    const active = coverage === scope;
                                    return ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setCoverage(scope), className: `rounded-lg border px-3 py-2 ${active
                                            ? "border-cyan-400 bg-cyan-500/10 text-cyan-100"
                                            : "border-slate-700 bg-slate-900/60 text-slate-200"}`, children: scope === "local" ? "Local" : scope === "regional" ? "Regional" : "National" }, scope));
                                }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-[11px] text-slate-400", children: coverageLabel })] }), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs uppercase tracking-wide text-cyan-300", children: "Recommended plan" }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold text-slate-50", children: recommended }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-slate-200", children: ["Based on ", selectedMarkets.length, " marketplaces, ", keywordCount, " keywords,", " ", instant ? "instant" : "standard", " alerts, ", coverageLabel.toLowerCase(), "."] }), (0, jsx_runtime_1.jsx)(button_1.Button, { className: "mt-3 rounded-full text-sm font-semibold", onClick: () => onPlanSuggested?.(recommended), children: "Start 7-day free trial" })] })] })] }));
}
//# sourceMappingURL=PriceCalculator.js.map