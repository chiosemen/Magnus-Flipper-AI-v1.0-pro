/**
 * Callback Ownership Type Guards
 * 
 * Utilities to prevent callback ownership bugs when wrapping library components.
 * 
 * Core Principle: When a library component owns a callback signature, 
 * wrapper components must NOT redeclare or narrow those callback types.
 */

/**
 * Type guard for checking if an unknown payload item has expected chart fields
 */
export function isChartPayloadLike(item: unknown): item is {
  dataKey?: string | number;
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
} {
  return (
    typeof item === "object" &&
    item !== null &&
    ("dataKey" in item || "name" in item || "value" in item)
  );
}

/**
 * Type guard for checking if a value has numeric value property
 */
export function hasNumericValue(
  item: unknown
): item is { value: number; [key: string]: unknown } {
  return (
    typeof item === "object" &&
    item !== null &&
    "value" in item &&
    typeof item.value === "number"
  );
}

/**
 * Safely narrows an unknown payload array to a known type
 * without affecting library callback signatures.
 * 
 * Use this for local rendering logic only. Never pass the result
 * back into library-owned callbacks.
 */
export function narrowPayloadArray<T>(
  payload: unknown,
  guard: (item: unknown) => item is T
): T[] | undefined {
  if (!Array.isArray(payload)) {
    return undefined;
  }
  return payload.filter(guard);
}

/**
 * Documentation helper - JSDoc template for wrapper components
 * 
 * @example
 * ```typescript
 * // ✅ CORRECT: Extend library props without redeclaring callbacks
 * type MyTooltipProps = TooltipProps<number, string> & {
 *   customColor?: string;
 *   // Do NOT redeclare: formatter, labelFormatter, payload, etc.
 * };
 * 
 * // ❌ WRONG: Redeclaring callback signatures
 * type BadTooltipProps = TooltipProps<number, string> & {
 *   formatter?: (value: number) => React.ReactNode; // ❌ Narrowed signature
 *   payload?: MyPayload[]; // ❌ Narrowed payload type
 * };
 * ```
 */
export const CALLBACK_OWNERSHIP_DOCS = `
# Callback Ownership Rules

## Rule 1: Library Owns Callback Signatures
If your prop type extends a library component's props, do NOT redeclare callback types.
The library type is the source of truth.

## Rule 2: Split Raw vs Local Payload
- Keep \`rawPayload\` opaque for passing to callbacks
- Create local narrowed payload only for rendering
- Use type guards for safe narrowing

## Rule 3: Raw Payload Into Callbacks
Always pass the raw, un-narrowed payload to library callbacks:
- \`labelFormatter(value, rawPayload as any)\`
- \`formatter(value, name, item as any, index, rawPayload as any)\`

## Rule 4: Type Guards Over Casts
Prefer type guard functions over broad \`as\` casts for local logic.

## Rule 5: Minimal Diffs
- Add helpers near the component
- Don't change exported public types unless necessary
- Keep changes localized
`;

