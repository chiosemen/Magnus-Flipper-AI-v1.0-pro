interface PricingTierCardProps {
    name: string;
    headline?: string;
    price: string;
    period?: string;
    features: string[];
    isMostPopular?: boolean;
    ctaLabel: string;
    onSelect?: () => void;
    footerNote?: string;
}
export declare function PricingTierCard({ name, headline, price, period, features, isMostPopular, ctaLabel, onSelect, footerNote, }: PricingTierCardProps): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=PricingTierCard.d.ts.map