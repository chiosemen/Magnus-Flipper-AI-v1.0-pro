/**
 * Jest setup for Magnus Flipper Mobile
 * 
 * This file runs before each test file.
 * It sets up mocks for React Native APIs and Expo modules.
 */

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

// Mock expo-linking
jest.mock('expo-linking', () => ({
  openURL: jest.fn(() => Promise.resolve(true)),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
}));

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [], error: null })),
      insert: jest.fn(() => ({ data: null, error: null })),
      update: jest.fn(() => ({ data: null, error: null })),
      delete: jest.fn(() => ({ data: null, error: null })),
    })),
  })),
}));

// Silence console warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Animated') || 
     args[0].includes('useNativeDriver') ||
     args[0].includes('componentWillReceiveProps') ||
     args[0].includes('componentWillMount'))
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

// Global fetch mock (can be overridden per test)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
);

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
