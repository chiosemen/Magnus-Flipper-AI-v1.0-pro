# UI Governance Quick Reference

**TL;DR:** Sections always render. Images use SafeImage. Feature flags use FeatureGate.

---

## ✅ DO This

### Section-Level Components

```tsx
import { SectionShell, fromReactQuery } from '@/lib/ui-contracts/SectionShell';

function MySection() {
  const query = useQuery({ queryKey: ['data'], queryFn: fetchData });

  return (
    <SectionShell
      sectionId="my-section"
      state={fromReactQuery(query)}
      renderLoading={() => <MySkeleton />}
      renderEmpty={() => <MyEmptyState />}
      renderError={(err) => <MyErrorState error={err} />}
      renderReady={(data) => <MyContent data={data} />}
    />
  );
}
```

### Images

```tsx
import { SafeImage } from '@/components/ui/SafeImage';

<SafeImage
  src={listing.imageUrl}
  alt={listing.title}
  fill
  onError={(reason) => console.warn('Image failed:', reason)}
/>
```

### Feature Flags

```tsx
import { FeatureGate } from '@/components/ui/FeatureGate';

<FeatureGate feature="analytics" enabled={isEnabled}>
  {(enabled) => enabled ? <Analytics /> : <AnalyticsDisabled />}
</FeatureGate>
```

---

## ❌ DON'T Do This

### Silent Null Returns

```tsx
// ❌ BAD: Section disappears
function MySection({ data }) {
  if (!data) return null;
  return <div>{data}</div>;
}
```

### Conditional Rendering

```tsx
// ❌ BAD: Section appears/disappears
function Page() {
  return (
    <div>
      {data && <MySection data={data} />}
    </div>
  );
}
```

### Direct next/image

```tsx
// ❌ BAD: No centralized error handling
import Image from 'next/image';

<Image src={user.avatar} alt="Avatar" />
```

---

See UI_FREEZE_CONTRACT.md for complete documentation.
