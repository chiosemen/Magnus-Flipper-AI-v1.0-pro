# Motion & Animation Specifications — Enterprise Canary Dashboard

## 1. Motion Design Principles

### Core Principles

1. **"Signal, don't scream"**
   - Animations should draw attention without being distracting
   - Use subtle motion to guide focus, not aggressive flashing
   - Respect user's ability to process information

2. **Encode Severity Through Motion**
   - OK states: Gentle, smooth transitions
   - DEGRADED states: Subtle pulsing, amber glow
   - CRITICAL states: Brief, attention-grabbing (but not infinite)

3. **Short, Snappy Transitions**
   - State changes: 150–300ms
   - Micro-interactions: 100–200ms
   - Page transitions: 200–400ms
   - Avoid animations longer than 500ms unless intentional

4. **Avoid Infinite Aggressive Animations**
   - Use gentle looping for ongoing states (2.5s+ intervals)
   - Pause animations when not in viewport
   - Respect `prefers-reduced-motion`

---

## 2. State Machine for Canary & Worker Health

### State Definitions

Each worker (realtime, scheduler) has the following states:

```
IDLE
  ↓
DEPLOYING_CANARY
  ↓
CANARY_HEALTHY | CANARY_DEGRADED | CANARY_CRITICAL
  ↓
ROLLBACKING (if CRITICAL)
  ↓
ROLLBACK_COMPLETE
```

### State Transitions

#### IDLE → DEPLOYING_CANARY

**Visual Changes:**
- Status badge: Gray → Blue (spinning loader icon)
- Traffic bar: Animated from 0% → 10% canary over 600ms

**Animation:**
```css
/* Status Badge */
.status-badge {
  transition: background-color 300ms easeOutQuad;
  background-color: var(--chart-blue);
}

/* Spinner */
.spinner {
  animation: spin 1s linear infinite;
}

/* Traffic Bar */
.traffic-bar-canary {
  width: 0%;
  transition: width 600ms easeInOutCubic;
  /* After transition: width: 10% */
}
```

**Duration:** 600ms  
**Easing:** `easeInOutCubic` (cubic-bezier(0.65, 0, 0.35, 1))

---

#### DEPLOYING_CANARY → CANARY_HEALTHY

**Visual Changes:**
- Status badge: Blue → Green with soft glow
- Traffic bar: Confirms 10% canary position
- Success checkmark: Scales in

**Animation:**
```css
/* Status Badge Glow */
.status-badge.healthy {
  background-color: var(--success-500);
  box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
  animation: softGlow 400ms easeOutQuad;
}

@keyframes softGlow {
  0% { box-shadow: 0 0 0px rgba(34, 197, 94, 0); }
  50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.6); }
  100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.4); }
}

/* Checkmark */
.checkmark {
  transform: scale(0);
  animation: checkmarkPop 300ms easeOutBack 100ms forwards;
}

@keyframes checkmarkPop {
  0% { transform: scale(0) rotate(-45deg); }
  50% { transform: scale(1.1) rotate(-45deg); }
  100% { transform: scale(1) rotate(0deg); }
}
```

**Duration:** 400ms (glow), 300ms (checkmark)  
**Easing:** `easeOutQuad`, `easeOutBack` (for checkmark)

---

#### CANARY_HEALTHY → CANARY_DEGRADED

**Visual Changes:**
- Status badge: Green → Amber
- Amber glow behind card fades in
- Small dot indicator starts pulsing

**Animation:**
```css
/* Card Glow */
.card.degraded {
  box-shadow: 0 0 0px rgba(245, 158, 11, 0);
  animation: amberGlow 250ms easeOutQuad forwards;
}

@keyframes amberGlow {
  to {
    box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
  }
}

/* Pulsing Dot */
.dot-indicator {
  opacity: 0.4;
  animation: pulse 2.5s easeInOut infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
```

**Duration:** 250ms (glow), 2.5s (pulse loop)  
**Easing:** `easeOutQuad`, `easeInOut` (for pulse)

---

#### CANARY_DEGRADED → CANARY_CRITICAL

**Visual Changes:**
- Status badge: Amber → Red
- Red border flashes
- Alert icon pulses twice

**Animation:**
```css
/* Red Border Flash */
.card.critical {
  border-color: var(--danger-500);
  animation: borderFlash 300ms easeOutQuad;
}

@keyframes borderFlash {
  0% { border-color: var(--danger-500); opacity: 0.2; }
  50% { border-color: var(--danger-500); opacity: 0.8; }
  100% { border-color: var(--danger-500); opacity: 0.4; }
}

/* Alert Icon Pulse */
.alert-icon {
  animation: alertPulse 600ms easeInOut;
}

@keyframes alertPulse {
  0%, 100% { transform: scale(1); }
  25% { transform: scale(1.15); }
  50% { transform: scale(1); }
  75% { transform: scale(1.1); }
}
```

**Duration:** 300ms (border), 600ms (icon)  
**Easing:** `easeOutQuad`, `easeInOut`

---

#### CANARY_CRITICAL → ROLLBACKING

**Visual Changes:**
- Status badge: Red → Gray (with spinner)
- Traffic bar: Animated from 10% → 0% canary over 800ms
- "Rolling back..." text fades in

**Animation:**
```css
.traffic-bar-canary {
  width: 10%;
  transition: width 800ms easeInOutCubic;
  /* After transition: width: 0% */
}

.rollback-text {
  opacity: 0;
  animation: fadeIn 200ms easeOutQuad 400ms forwards;
}
```

**Duration:** 800ms (traffic), 200ms (text)  
**Easing:** `easeInOutCubic`, `easeOutQuad`

---

#### ROLLBACKING → ROLLBACK_COMPLETE

**Visual Changes:**
- Status badge: Gray → Green (stable)
- Traffic bar: Confirms 0% canary
- Success message slides in

**Animation:**
```css
.rollback-complete {
  transform: translateY(-16px);
  opacity: 0;
  animation: slideDown 300ms easeOutQuad forwards;
}

@keyframes slideDown {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Duration:** 300ms  
**Easing:** `easeOutQuad`

---

## 3. Alert Animations by Severity

### PROMOTE (Healthy Canary)

**Entry Animation:**
```css
.alert-banner.promote {
  transform: translateY(-16px);
  opacity: 0;
  animation: slideDown 220ms easeOutQuad forwards;
}

@keyframes slideDown {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Badge Animation:**
```css
.ml-badge.promote {
  transform: scale(0.9);
  animation: badgePop 180ms spring forwards;
}

@keyframes badgePop {
  0% { transform: scale(0.9); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
```

**Card Shimmer:**
```css
.card.promote::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(34, 197, 94, 0.2),
    transparent
  );
  animation: shimmer 600ms easeInOut;
}

@keyframes shimmer {
  to { left: 100%; }
}
```

**Durations:**
- Banner slide: 220ms
- Badge pop: 180ms (spring)
- Shimmer: 600ms (one-time)

---

### ROLLBACK (Critical Failure)

**Entry Animation:**
```css
.alert-banner.rollback {
  transform: translateX(0);
  animation: shake 320ms easeOutQuad forwards;
}

@keyframes shake {
  0% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
  100% { transform: translateX(0); }
}
```

**Border Flash:**
```css
.card.rollback {
  border: 2px solid var(--danger-500);
  animation: borderFlashCycle 300ms easeInOut 2;
}

@keyframes borderFlashCycle {
  0%, 100% { border-color: var(--danger-500); opacity: 0.2; }
  50% { border-color: var(--danger-500); opacity: 0.6; }
}
```

**Icon Pulse:**
```css
.alert-icon.rollback {
  animation: iconPulse 300ms easeInOut 2;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

**Durations:**
- Shake: 320ms
- Border flash: 300ms × 2 cycles
- Icon pulse: 300ms × 2 cycles

---

### DEGRADED (Needs Review)

**Entry Animation:**
```css
.alert-banner.degraded {
  opacity: 0;
  animation: fadeIn 250ms easeOutQuad forwards;
}

@keyframes fadeIn {
  to { opacity: 1; }
}
```

**Card Glow:**
```css
.card.degraded {
  box-shadow: 0 0 0px rgba(245, 158, 11, 0);
  animation: amberGlowIn 250ms easeOutQuad forwards;
}

@keyframes amberGlowIn {
  to {
    box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
  }
}
```

**Dot Pulse:**
```css
.dot-indicator.degraded {
  opacity: 0.4;
  animation: gentlePulse 2.5s easeInOut infinite;
}

@keyframes gentlePulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
```

**Durations:**
- Fade in: 250ms
- Glow: 250ms
- Dot pulse: 2.5s (infinite, gentle)

---

## 4. Component-Level Micro-Interactions

### ML Decision Chip

**State Change Animation:**
```css
.ml-chip {
  position: relative;
  overflow: hidden;
}

/* Old text fades out */
.ml-chip .text-old {
  opacity: 1;
  animation: fadeOut 120ms easeIn forwards;
}

/* Background color cross-fade */
.ml-chip {
  background-color: var(--old-color);
  transition: background-color 200ms easeInOut;
  /* After: background-color: var(--new-color); */
}

/* New text slides up */
.ml-chip .text-new {
  opacity: 0;
  transform: translateY(6px);
  animation: slideUp 180ms easeOut 120ms forwards;
}

@keyframes slideUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Duration:** 300ms total (120ms fade + 180ms slide)  
**Easing:** `easeIn` (fade), `easeOut` (slide)

---

### Traffic Split Bar

**Width Animation:**
```css
.traffic-bar-canary {
  width: var(--old-width);
  transition: width 500ms easeInOutCubic;
  /* After: width: var(--new-width); */
}
```

**Number Count-Up:**
```javascript
// Framer Motion example
<motion.div
  animate={{ 
    canaryPercent: newValue 
  }}
  transition={{ 
    duration: 0.35,
    ease: "easeOut"
  }}
>
  {Math.round(canaryPercent * 100)}%
</motion.div>
```

**Duration:** 500ms (bar), 350ms (numbers)  
**Easing:** `easeInOutCubic`, `easeOut`

---

### Latency & Error Charts

**Data Update Animation:**
```css
/* Chart.js animation config */
const chartOptions = {
  animation: {
    duration: 600,
    easing: 'easeInOutCubic',
  },
  transitions: {
    active: {
      animation: {
        duration: 600,
      },
    },
  },
};
```

**Spike Highlight:**
```css
.chart-spike {
  fill: var(--chart-red);
  opacity: 1;
  animation: spikeHighlight 400ms easeOutQuad;
}

@keyframes spikeHighlight {
  0% { opacity: 1; fill: var(--chart-red); }
  50% { opacity: 0.8; fill: var(--chart-orange); }
  100% { opacity: 0.6; fill: var(--chart-red); }
}
```

**Duration:** 600ms (chart), 400ms (spike)  
**Easing:** `easeInOutCubic`, `easeOutQuad`

---

### Log Stream Panel

**New Log Entry:**
```css
.log-line {
  transform: translateY(4px);
  opacity: 0;
  animation: logSlideIn 120ms easeOutQuad forwards;
}

@keyframes logSlideIn {
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

**Critical Log Highlight:**
```css
.log-line.critical {
  border-left: 3px solid var(--danger-500);
  animation: criticalFlash 600ms easeOutQuad;
}

@keyframes criticalFlash {
  0% { border-left-color: var(--danger-500); opacity: 0.8; }
  50% { border-left-color: var(--danger-500); opacity: 1; box-shadow: 0 0 8px rgba(239, 68, 68, 0.4); }
  100% { border-left-color: var(--danger-500); opacity: 1; box-shadow: none; }
}
```

**Duration:** 120ms (slide), 600ms (flash)  
**Easing:** `easeOutQuad`

---

## 5. Motion Specs for Figma Prototyping

### Smart Animate Transitions

#### Alert Banner States

**Frame Names:**
- `Alert_PROMOTE` → `Alert_IDLE`
- `Alert_ROLLBACK` → `Alert_IDLE`
- `Alert_DEGRADED` → `Alert_IDLE`

**Smart Animate Settings:**
- Duration: 220ms
- Easing: Ease Out
- Match: Same layer names

---

#### ML Decision Chip Variants

**Component Variants:**
- `chip-ml-decision-PROMOTE`
- `chip-ml-decision-ROLLBACK`
- `chip-ml-decision-DEGRADED`

**Transition:**
- Duration: 200ms
- Easing: Ease In-Out
- Match: Same component

---

#### Traffic Bar Animation

**Frames:**
- `Traffic_10pct` → `Traffic_15pct`
- `Traffic_10pct` → `Traffic_0pct` (rollback)

**Smart Animate:**
- Duration: 500ms
- Easing: Ease In-Out
- Match: Auto-layout width

---

#### Status Badge States

**Frames:**
- `Status_IDLE` → `Status_DEPLOYING`
- `Status_DEPLOYING` → `Status_HEALTHY`
- `Status_HEALTHY` → `Status_DEGRADED`
- `Status_DEGRADED` → `Status_CRITICAL`

**Smart Animate:**
- Duration: 300ms
- Easing: Ease Out
- Match: Fill color, text content

---

### Prototype Interactions

**Click Interactions:**
- Button hover: 150ms easeOut (scale 1.02)
- Button click: 100ms easeIn (scale 0.98)
- Card hover: 200ms easeOut (shadow increase)

**Auto-advance:**
- Alert banner: Auto-advance after 5s
- Status updates: Auto-advance after 3s

---

## 6. Implementation Notes

### Framer Motion Examples

#### Status Badge Transition
```tsx
import { motion } from 'framer-motion';

<motion.div
  animate={{
    backgroundColor: status === 'healthy' ? '#22C55E' : '#EF4444',
    scale: status === 'healthy' ? 1 : 1.05,
  }}
  transition={{
    duration: 0.3,
    ease: 'easeOut',
  }}
>
  {status}
</motion.div>
```

#### Alert Banner Slide-In
```tsx
<motion.div
  initial={{ y: -16, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  exit={{ y: -16, opacity: 0 }}
  transition={{
    duration: 0.22,
    ease: 'easeOut',
  }}
>
  Alert content
</motion.div>
```

#### Traffic Bar Width
```tsx
<motion.div
  animate={{
    width: `${canaryPercent * 100}%`,
  }}
  transition={{
    duration: 0.5,
    ease: [0.65, 0, 0.35, 1], // easeInOutCubic
  }}
/>
```

---

### CSS Variables for Motion

```css
:root {
  /* Durations */
  --motion-fast: 150ms;
  --motion-medium: 250ms;
  --motion-slow: 400ms;
  --motion-slower: 600ms;

  /* Easing */
  --easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
  --easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
  --easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
  --easing-sharp: cubic-bezier(0.4, 0.0, 0.6, 1);
  
  /* Custom */
  --easing-easeOutQuad: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --easing-easeInOutCubic: cubic-bezier(0.65, 0, 0.35, 1);
  --easing-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Usage */
.component {
  transition: all var(--motion-medium) var(--easing-easeOutQuad);
}
```

---

### Respecting `prefers-reduced-motion`

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```tsx
// Framer Motion
const shouldReduceMotion = useReducedMotion();

<motion.div
  animate={shouldReduceMotion ? {} : { scale: 1.1 }}
  transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3 }}
/>
```

---

## 7. ML Integration

### Decision → Animation Mapping

| ML Decision | Severity | Animation Set |
|------------|----------|---------------|
| PROMOTE | OK | PROMOTE animations (green glow, slide-in, shimmer) |
| PROMOTE | DEGRADED | DEGRADED animations (amber glow, gentle pulse) |
| ROLLBACK | CRITICAL | ROLLBACK animations (shake, red flash, icon pulse) |
| ROLLBACK | DEGRADED | ROLLBACK animations (moderate intensity) |
| DEGRADED | OK | DEGRADED animations (amber glow, subtle pulse) |
| DEGRADED | CRITICAL | DEGRADED + CRITICAL hybrid (stronger amber, brief red flash) |

### Confidence-Based Intensity

```tsx
const getAnimationIntensity = (confidence: number) => {
  if (confidence > 0.9) return 'strong'; // Full animations
  if (confidence > 0.7) return 'medium'; // Reduced intensity
  return 'subtle'; // Minimal animations
};

// Apply to animations
const intensity = getAnimationIntensity(mlDecision.confidence);
const duration = intensity === 'strong' ? 300 : intensity === 'medium' ? 200 : 150;
```

### Anomaly-Based Highlights

```tsx
// If anomalies detected, add extra highlight
{mlDecision.anomalies.length > 0 && (
  <motion.div
    animate={{
      boxShadow: [
        '0 0 0px rgba(245, 158, 11, 0)',
        '0 0 20px rgba(245, 158, 11, 0.4)',
        '0 0 0px rgba(245, 158, 11, 0)',
      ],
    }}
    transition={{
      duration: 1,
      repeat: 2,
      ease: 'easeInOut',
    }}
  />
)}
```

---

## Summary

### Animation Duration Guidelines

- **Fast (100–150ms):** Button clicks, hover states
- **Medium (200–300ms):** State changes, badge updates
- **Slow (400–600ms):** Traffic bar, chart updates
- **Slower (800ms+):** Major transitions, rollbacks

### Easing Guidelines

- **easeOutQuad:** Most common (smooth, natural)
- **easeInOutCubic:** Width/height changes
- **easeOutBack:** Playful pops (checkmarks, badges)
- **Spring:** Bouncy interactions (rare, use sparingly)

### Severity Encoding

- **OK:** Smooth, gentle, green
- **DEGRADED:** Amber glow, subtle pulse
- **CRITICAL:** Red flash, shake, attention-grabbing

---

**Status:** ✅ Complete Motion Specification  
**Ready for:** Implementation in React/Framer Motion and Figma prototyping
