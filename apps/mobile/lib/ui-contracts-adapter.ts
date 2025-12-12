/**
 * UI Contracts Adapter
 * Bridges web UI contracts to React Native components
 */

import type {
  ButtonContract,
  CardContract,
  InputContract,
} from "@magnus-flipper-ai/core/ui-contracts";
import { Pressable, Text, View, TextInput, StyleSheet } from "react-native";

/**
 * Map web button variant to mobile style
 */
function mapButtonVariant(variant: ButtonContract["variant"]): any {
  const variants: Record<string, any> = {
    default: { backgroundColor: "#3b82f6", color: "#fff" },
    secondary: { backgroundColor: "#6b7280", color: "#fff" },
    destructive: { backgroundColor: "#ef4444", color: "#fff" },
    outline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#3b82f6", color: "#3b82f6" },
    ghost: { backgroundColor: "transparent", color: "#3b82f6" },
    link: { backgroundColor: "transparent", color: "#3b82f6", textDecorationLine: "underline" },
  };
  return variants[variant || "default"] || variants.default;
}

/**
 * Map web button size to mobile style
 */
function mapButtonSize(size: ButtonContract["size"]): any {
  const sizes: Record<string, any> = {
    default: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 16 },
    sm: { paddingVertical: 6, paddingHorizontal: 12, fontSize: 14 },
    lg: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 18 },
    icon: { paddingVertical: 8, paddingHorizontal: 8, fontSize: 16 },
  };
  return sizes[size || "default"] || sizes.default;
}

/**
 * Mobile Button Adapter
 * Implements ButtonContract for React Native
 */
export function MobileButtonAdapter(props: ButtonContract & { children?: React.ReactNode }) {
  const { variant, size, disabled, loading, onClick, children, ...rest } = props;
  const variantStyle = mapButtonVariant(variant);
  const sizeStyle = mapButtonSize(size);

  return (
    <Pressable
      onPress={onClick as any}
      disabled={disabled || loading}
      style={[
        {
          ...variantStyle,
          ...sizeStyle,
          opacity: disabled || loading ? 0.5 : 1,
        },
        rest.style,
      ]}
      {...(rest.testID ? { testID: rest.testID } : {})}
      {...(rest.accessibilityLabel ? { accessibilityLabel: rest.accessibilityLabel } : {})}
    >
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <Text style={{ color: variantStyle.color }}>{children}</Text>
      )}
    </Pressable>
  );
}

/**
 * Mobile Card Adapter
 * Implements CardContract for React Native
 */
export function MobileCardAdapter(props: CardContract & { children?: React.ReactNode }) {
  const { variant, interactive, children, ...rest } = props;
  
  const variantStyles: Record<string, any> = {
    default: { backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a" },
    outlined: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#2a2a2a" },
    elevated: { backgroundColor: "#1a1a1a", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    flat: { backgroundColor: "#1a1a1a" },
  };

  return (
    <View
      style={[
        variantStyles[variant || "default"],
        interactive && { opacity: 0.9 },
        rest.style,
      ]}
      {...(rest.testID ? { testID: rest.testID } : {})}
    >
      {children}
    </View>
  );
}

/**
 * Mobile Input Adapter
 * Implements InputContract for React Native
 */
export function MobileInputAdapter(props: InputContract) {
  const { variant, size, disabled, onChange, value, placeholder, ...rest } = props;

  const sizeStyles: Record<string, any> = {
    default: { paddingVertical: 10, paddingHorizontal: 12, fontSize: 16 },
    sm: { paddingVertical: 6, paddingHorizontal: 10, fontSize: 14 },
    lg: { paddingVertical: 14, paddingHorizontal: 16, fontSize: 18 },
  };

  return (
    <TextInput
      value={value}
      onChangeText={onChange as any}
      placeholder={placeholder}
      editable={!disabled}
      style={[
        {
          backgroundColor: "#1a1a1a",
          borderWidth: 1,
          borderColor: "#2a2a2a",
          borderRadius: 4,
          color: "#fff",
          ...sizeStyles[size || "default"],
        },
        rest.style,
      ]}
      {...(rest.testID ? { testID: rest.testID } : {})}
      {...(rest.accessibilityLabel ? { accessibilityLabel: rest.accessibilityLabel } : {})}
    />
  );
}

/**
 * Contract validation helper
 */
export function validateContract<T extends Record<string, any>>(
  contract: T,
  requiredProps: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing = requiredProps.filter((prop) => contract[prop] === undefined);
  return {
    valid: missing.length === 0,
    missing: missing.map((p) => String(p)),
  };
}
