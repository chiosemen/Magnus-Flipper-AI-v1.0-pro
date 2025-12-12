# UI Component Contracts

Shared API contracts for cross-platform component consistency.

## Purpose

These contracts define the expected API for UI components across web and mobile platforms, ensuring:
- Consistent prop naming
- Variant support parity
- Event handler compatibility
- Accessibility requirements

## Contracts

- **Button.types.ts** - Button component contract
- **Card.types.ts** - Card component contract
- **Input.types.ts** - Input component contract
- **Layout.types.ts** - Layout component contracts

## Usage

### For Web Developers
```typescript
import { ButtonContract } from '@magnus-flipper-ai/core/ui-contracts';

const props: ButtonContract = {
  variant: 'default',
  size: 'lg',
  onClick: () => {},
};
```

### For Mobile Developers
```typescript
import { ButtonContract } from '@magnus-flipper-ai/core/ui-contracts';

// Use contract as reference for mobile adapter
// Map web props to mobile equivalents
```

## Platform Differences

These contracts document expected platform differences:
- `onClick` (web) vs `onPress` (mobile)
- `onChange` (web) vs `onChangeText` (mobile)
- `data-testid` (web) vs `testID` (mobile)
- `aria-label` (web) vs `accessibilityLabel` (mobile)
- `className` (web) vs `style` (mobile)

## Future Adapters

Contracts can be used to create mobile adapters that bridge platform differences while maintaining API consistency.
