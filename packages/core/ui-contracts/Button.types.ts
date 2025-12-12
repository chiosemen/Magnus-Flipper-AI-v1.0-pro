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
  onClick?: () => void; // Web compatibility

  /**
   * Accessibility label
   */
  'aria-label'?: string;
  accessibilityLabel?: string; // Mobile compatibility

  /**
   * Test ID for testing
   */
  'data-testid'?: string;
  testID?: string; // Mobile compatibility
}

/**
 * Variant Map Contract
 * 
 * All implementations must support these variants:
 */
export const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
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
export const BUTTON_SIZES: Record<ButtonSize, string> = {
  default: 'Default size (h-10)',
  sm: 'Small size (h-9)',
  lg: 'Large size (h-11)',
  icon: 'Icon-only size (h-10 w-10)',
};

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
  onPress?: () => void; // Mobile
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void; // Web
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void; // Web only
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void; // Web only
}
