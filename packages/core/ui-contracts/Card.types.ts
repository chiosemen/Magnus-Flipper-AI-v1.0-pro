/**
 * Card Component Contract
 * 
 * Defines the shared API contract for Card components across web and mobile platforms.
 */

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'flat';

/**
 * Base Card Props Contract
 */
export interface CardContract {
  /**
   * Card variant style
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Interactive card - adds hover effects (web) or press feedback (mobile)
   * @default false
   */
  interactive?: boolean;

  /**
   * Card content
   */
  children?: React.ReactNode;

  /**
   * Padding override
   */
  padding?: 'none' | 'sm' | 'md' | 'lg';

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
  testID?: string; // Mobile compatibility
}

/**
 * Card Sub-components Contract
 */
export interface CardHeaderContract {
  children?: React.ReactNode;
  className?: string; // Web
  style?: React.CSSProperties; // Web
  testID?: string; // Mobile
}

export interface CardTitleContract {
  children?: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'; // Web
  className?: string; // Web
  style?: React.CSSProperties; // Web
  testID?: string; // Mobile
}

export interface CardDescriptionContract {
  children?: React.ReactNode;
  className?: string; // Web
  style?: React.CSSProperties; // Web
  testID?: string; // Mobile
}

export interface CardContentContract {
  children?: React.ReactNode;
  className?: string; // Web
  style?: React.CSSProperties; // Web
  testID?: string; // Mobile
}

export interface CardFooterContract {
  children?: React.ReactNode;
  className?: string; // Web
  style?: React.CSSProperties; // Web
  testID?: string; // Mobile
}

/**
 * Variant Map Contract
 */
export const CARD_VARIANTS: Record<CardVariant, string> = {
  default: 'Default card with border',
  outlined: 'Outlined card with thicker border',
  elevated: 'Card with shadow/elevation',
  flat: 'Flat card with no border or shadow',
};
