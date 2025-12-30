/**
 * Mock for React Native
 * 
 * This mock provides the minimum required React Native components
 * for testing without requiring the full RN setup.
 */

const React = require('react');

// Mock View component
const View = ({ children, style, ...props }) => {
  return React.createElement('View', { style, ...props }, children);
};

// Mock Text component
const Text = ({ children, style, ...props }) => {
  return React.createElement('Text', { style, ...props }, children);
};

// Mock TextInput component
const TextInput = ({ value, onChangeText, placeholder, style, ...props }) => {
  return React.createElement('TextInput', {
    value,
    onChange: (e) => onChangeText?.(e.target?.value || ''),
    placeholder,
    style,
    ...props,
  });
};

// Mock Pressable component
const Pressable = ({ children, onPress, style, disabled, ...props }) => {
  return React.createElement(
    'Pressable',
    {
      onClick: disabled ? undefined : onPress,
      style,
      disabled,
      ...props,
    },
    typeof children === 'function' ? children({ pressed: false }) : children
  );
};

// Mock TouchableOpacity component
const TouchableOpacity = ({ children, onPress, style, disabled, ...props }) => {
  return React.createElement(
    'TouchableOpacity',
    {
      onClick: disabled ? undefined : onPress,
      style,
      disabled,
      ...props,
    },
    children
  );
};

// Mock ScrollView component
const ScrollView = ({ children, style, contentContainerStyle, ...props }) => {
  return React.createElement(
    'ScrollView',
    { style, contentContainerStyle, ...props },
    children
  );
};

// Mock Image component
const Image = ({ source, style, ...props }) => {
  return React.createElement('Image', { src: source?.uri, style, ...props });
};

// Mock ActivityIndicator component
const ActivityIndicator = ({ color, size, ...props }) => {
  return React.createElement('ActivityIndicator', { color, size, ...props });
};

// Mock RefreshControl component
const RefreshControl = ({ refreshing, onRefresh, ...props }) => {
  return React.createElement('RefreshControl', { refreshing, onRefresh, ...props });
};

// Mock StyleSheet - must be a function that returns styles
const StyleSheet = {
  create: jest.fn((styles) => styles),
  flatten: jest.fn((style) => {
    if (Array.isArray(style)) {
      return Object.assign({}, ...style.filter(Boolean));
    }
    return style || {};
  }),
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  absoluteFillObject: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  hairlineWidth: 1,
  compose: jest.fn((style1, style2) => [style1, style2]),
};

// Mock Platform
const Platform = {
  OS: 'ios',
  Version: '14.0',
  select: (obj) => obj.ios || obj.default,
  isPad: false,
  isTVOS: false,
};

// Mock Dimensions
const Dimensions = {
  get: (dim) => {
    if (dim === 'window' || dim === 'screen') {
      return { width: 375, height: 812, scale: 2, fontScale: 1 };
    }
    return { width: 0, height: 0, scale: 1, fontScale: 1 };
  },
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
};

// Mock Alert
const Alert = {
  alert: jest.fn(),
};

// Mock Linking
const Linking = {
  openURL: jest.fn(() => Promise.resolve(true)),
  canOpenURL: jest.fn(() => Promise.resolve(true)),
  addEventListener: () => ({ remove: () => {} }),
  removeEventListener: () => {},
  getInitialURL: () => Promise.resolve(null),
};

// Mock Animated
const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  Value: jest.fn(() => ({
    setValue: jest.fn(),
    interpolate: jest.fn(() => ({ __getValue: () => 0 })),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    removeAllListeners: jest.fn(),
    stopAnimation: jest.fn(),
    resetAnimation: jest.fn(),
    __getValue: () => 0,
  })),
  timing: jest.fn(() => ({
    start: jest.fn((cb) => cb?.({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  spring: jest.fn(() => ({
    start: jest.fn((cb) => cb?.({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  parallel: jest.fn(() => ({
    start: jest.fn((cb) => cb?.({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  sequence: jest.fn(() => ({
    start: jest.fn((cb) => cb?.({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  loop: jest.fn(() => ({
    start: jest.fn((cb) => cb?.({ finished: true })),
    stop: jest.fn(),
    reset: jest.fn(),
  })),
  event: jest.fn(() => jest.fn()),
  createAnimatedComponent: (Component) => Component,
};

// Mock useColorScheme
const useColorScheme = () => 'light';

// Mock NativeModules
const NativeModules = {
  SettingsManager: { settings: {} },
  StatusBarManager: { HEIGHT: 44 },
};

module.exports = {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
  Dimensions,
  Alert,
  Linking,
  Animated,
  useColorScheme,
  NativeModules,
  // Re-export default
  default: {
    View,
    Text,
    TextInput,
    Pressable,
    TouchableOpacity,
    ScrollView,
    Image,
    ActivityIndicator,
    RefreshControl,
    StyleSheet,
    Platform,
    Dimensions,
    Alert,
    Linking,
    Animated,
    useColorScheme,
    NativeModules,
  },
};

