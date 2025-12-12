/**
 * Layout Component Contracts
 * 
 * Defines shared API contracts for layout components across web and mobile platforms.
 * Note: Mobile uses Expo Router tabs, web uses custom AppShell/Sidebar.
 */

/**
 * AppShell Contract (Web)
 * 
 * Web-specific layout wrapper. Mobile uses Expo Router Stack/Tabs instead.
 */
export interface AppShellContract {
  children: React.ReactNode;
}

/**
 * PageHeader Contract
 * 
 * Shared header component contract (web implementation exists, mobile uses native headers)
 */
export interface PageHeaderContract {
  /**
   * Page title
   */
  title: string;

  /**
   * Optional subtitle
   */
  subtitle?: string;

  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: Array<{
    label: string;
    href?: string;
    onPress?: () => void; // Mobile compatibility
  }>;

  /**
   * Action buttons/elements
   */
  actions?: React.ReactNode;

  /**
   * Show back button (mobile)
   */
  showBack?: boolean;

  /**
   * Back button handler (mobile)
   */
  onBack?: () => void;
}

/**
 * Navigation Contract
 * 
 * Web uses Sidebar, Mobile uses Tab Bar
 */
export interface NavigationContract {
  /**
   * Navigation items
   */
  items: Array<{
    label: string;
    href: string;
    icon?: string | React.ReactNode;
    badge?: number;
    locked?: boolean;
    tier?: 'free' | 'pro' | 'agency' | 'admin';
  }>;

  /**
   * Active route
   */
  activeRoute?: string;

  /**
   * Navigation change handler
   */
  onNavigate?: (href: string) => void;
}

/**
 * Sidebar Contract (Web Only)
 */
export interface SidebarContract {
  /**
   * Navigation items
   */
  items: Array<{
    label: string;
    href: string;
    icon: string;
    locked?: boolean;
    tier?: 'free' | 'pro' | 'agency' | 'admin';
  }>;

  /**
   * Current user tier
   */
  userTier?: 'free' | 'pro' | 'agency' | 'admin';

  /**
   * Upgrade handler
   */
  onUpgrade?: () => void;
}

/**
 * TopNav Contract (Web Only)
 */
export interface TopNavContract {
  /**
   * Title text
   */
  title?: string;

  /**
   * Notification count
   */
  notificationCount?: number;

  /**
   * Notification click handler
   */
  onNotificationsClick?: () => void;

  /**
   * User avatar click handler
   */
  onAvatarClick?: () => void;
}
