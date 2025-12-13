/**
 * Button Component Contract
 *
 * Defines the shared API contract for Button components across web and mobile platforms.
 * Ensures consistency in prop naming, variant support, and behavior.
 */
export type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';
export type ButtonIntent = 'primary' | 'secondary' | 'destructive' | 'neutral';
/**
 * Base Button Props Contract
 *
 * All Button implementations (web/mobile) must support these props:
 */
export interface ButtonContract {
    /**
     * Button variant style
     * @default 'default'
     */
    variant?: ButtonVariant;
    /**
     * Button size
     * @default 'default'
     */
    size?: ButtonSize;
    /**
     * Intent/semantic meaning (may be combined with variant)
     * @default undefined
     */
    intent?: ButtonIntent;
    /**
     * Loading state - shows spinner and disables button
     * @default false
     */
    loading?: boolean;
    /**
     * Disabled state
     * @default false
     */
    disabled?: boolean;
    /**
     * Icon to display before text (or as only content if iconOnly)
     */
    icon?: React.ReactNode;
    /**
     * Icon to display after text
     */
    iconRight?: React.ReactNode;
    /**
     * If true, renders as icon-only button (requires icon prop)
     * @default false
     */
    iconOnly?: boolean;
    /**
     * Button content/children
     */
    children?: React.ReactNode;
    /**
     * Additional CSS class (web)
     */
    className?: string;
    /**
     * Additional style object (mobile)
     */
    style?: React.CSSProperties | any;
    /**
     * Click/press handler
     */
    onPress?: () => void;
    onClick?: () => void;
    /**
     * Accessibility label
     */
    'aria-label'?: string;
    accessibilityLabel?: string;
    /**
     * Test ID for testing
     */
    'data-testid'?: string;
    testID?: string;
}
/**
 * Variant Map Contract
 *
 * All implementations must support these variants:
 */
export declare const BUTTON_VARIANTS: Record<ButtonVariant, string>;
/**
 * Size Map Contract
 */
export declare const BUTTON_SIZES: Record<ButtonSize, string>;
/**
 * Accessibility Requirements
 */
export interface ButtonAccessibility {
    /**
     * ARIA role (web)
     */
    role?: 'button';
    /**
     * ARIA busy state when loading (web)
     */
    'aria-busy'?: boolean;
    /**
     * ARIA disabled state (web)
     */
    'aria-disabled'?: boolean;
    /**
     * Accessibility role (mobile)
     */
    accessibilityRole?: 'button';
    /**
     * Accessibility state (mobile)
     */
    accessibilityState?: {
        disabled?: boolean;
        busy?: boolean;
    };
}
/**
 * Event Handler Signatures
 */
export interface ButtonEventHandlers {
    onPress?: () => void;
    onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
    onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}
//# sourceMappingURL=Button.types.d.ts.map