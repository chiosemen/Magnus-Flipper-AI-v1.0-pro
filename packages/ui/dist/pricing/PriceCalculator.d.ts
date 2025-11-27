type PlanId = "STARTER" | "BASIC" | "PREMIUM" | "ULTRA";
interface PriceCalculatorProps {
    onPlanSuggested?: (planId: PlanId) => void;
}
export declare function PriceCalculator({ onPlanSuggested }: PriceCalculatorProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PriceCalculator.d.ts.map