/**
 * Input Component Contract
 *
 * Defines the shared API contract for Input components across web and mobile platforms.
 */
export type InputVariant = 'default' | 'error' | 'success';
export type InputSize = 'default' | 'sm' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
/**
 * Base Input Props Contract
 */
export interface InputContract {
    /**
     * Input variant style
     * @default 'default'
     */
    variant?: InputVariant;
    /**
     * Input size
     * @default 'default'
     */
    size?: InputSize;
    /**
     * Input type
     * @default 'text'
     */
    type?: InputType;
    /**
     * Input value (controlled)
     */
    value?: string;
    /**
     * Default value (uncontrolled)
     */
    defaultValue?: string;
    /**
     * Placeholder text
     */
    placeholder?: string;
    /**
     * Error state - shows error styling
     * @default false
     */
    error?: boolean;
    /**
     * Success state - shows success styling
     * @default false
     */
    success?: boolean;
    /**
     * Disabled state
     * @default false
     */
    disabled?: boolean;
    /**
     * Required field
     * @default false
     */
    required?: boolean;
    /**
     * Left icon element
     */
    iconLeft?: React.ReactNode;
    /**
     * Right icon element
     */
    iconRight?: React.ReactNode;
    /**
     * Change handler
     */
    onChange?: (value: string) => void;
    onChangeText?: (text: string) => void;
    /**
     * Blur handler
     */
    onBlur?: () => void;
    /**
     * Focus handler
     */
    onFocus?: () => void;
    /**
     * Submit handler (Enter key)
     */
    onSubmit?: () => void;
    /**
     * Accessibility label
     */
    'aria-label'?: string;
    accessibilityLabel?: string;
    /**
     * Accessibility hint
     */
    'aria-describedby'?: string;
    accessibilityHint?: string;
    /**
     * Additional CSS class (web)
     */
    className?: string;
    /**
     * Additional style object (mobile)
     */
    style?: React.CSSProperties | any;
    /**
     * Test ID for testing
     */
    'data-testid'?: string;
    testID?: string;
}
/**
 * Variant Map Contract
 */
export declare const INPUT_VARIANTS: Record<InputVariant, string>;
/**
 * Size Map Contract
 */
export declare const INPUT_SIZES: Record<InputSize, string>;
/**
 * Accessibility Requirements
 */
export interface InputAccessibility {
    /**
     * ARIA invalid state (web)
     */
    'aria-invalid'?: boolean;
    /**
     * ARIA required state (web)
     */
    'aria-required'?: boolean;
    /**
     * Accessibility state (mobile)
     */
    accessibilityState?: {
        disabled?: boolean;
    };
}
//# sourceMappingURL=Input.types.d.ts.map