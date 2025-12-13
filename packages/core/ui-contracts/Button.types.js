/**
 * Button Component Contract
 *
 * Defines the shared API contract for Button components across web and mobile platforms.
 * Ensures consistency in prop naming, variant support, and behavior.
 */
/**
 * Variant Map Contract
 *
 * All implementations must support these variants:
 */
export const BUTTON_VARIANTS = {
    default: 'Primary button style',
    secondary: 'Secondary button style',
    destructive: 'Destructive/danger button style',
    outline: 'Outlined button style',
    ghost: 'Ghost/transparent button style',
    link: 'Link-style button',
};
/**
 * Size Map Contract
 */
export const BUTTON_SIZES = {
    default: 'Default size (h-10)',
    sm: 'Small size (h-9)',
    lg: 'Large size (h-11)',
    icon: 'Icon-only size (h-10 w-10)',
};
//# sourceMappingURL=Button.types.js.map