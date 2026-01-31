
## Plan: Fix Logo Display & Generate New Transparent Logo

### Problem Summary

| Issue | Cause |
|-------|-------|
| Build error | `fetchpriority` should be `fetchPriority` |
| Logo not showing | File path `/lovable-uploads/be2fb717-4d00-401a-baee-2639bb9729b3.png` doesn't exist |
| Current logos | Have dark backgrounds, not transparent |

---

### Phase 1: Generate New Logo with AI

Using the Nano banana image generation model, I'll create a **professional logo** for WanaIQ/AmaCivic with:

**Design Brief**:
- **Style**: Modern, minimal, bold
- **Symbol**: Stylized upward arrow combined with a speech bubble or community icon (represents citizen voice rising)
- **Colors**: Orange-to-gold gradient (matching existing brand)
- **Background**: Transparent (PNG)
- **Use case**: Header navigation bar (horizontal orientation works best)

**Prompt concept**:
> "Modern minimalist logo for civic engagement platform, stylized upward arrow merging with speech bubble, orange to gold gradient, clean vector style, transparent background, suitable for header navigation"

---

### Phase 2: Fix Header Component

**File**: `src/components/layout/Header.tsx`

**Changes**:
1. Fix TypeScript error: `fetchpriority` → `fetchPriority`
2. Update logo `src` to point to the new generated logo in `public/` directory
3. Add fallback to existing `logo.png` if needed

```tsx
// Before (broken):
<img 
  src="/lovable-uploads/be2fb717-4d00-401a-baee-2639bb9729b3.png"
  fetchpriority="high"
/>

// After (fixed):
<img 
  src="/wanaiq-logo.png"  // New generated logo
  fetchPriority="high"    // Correct camelCase
/>
```

---

### Phase 3: Save Logo Assets

The generated logo will be saved to:
- `public/wanaiq-logo.png` - Header logo (transparent background)
- Optionally update favicon if the new design works better

---

### Files to Create

| File | Purpose |
|------|---------|
| `public/wanaiq-logo.png` | New header logo with transparent background |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/layout/Header.tsx` | Fix `fetchPriority`, update logo path |

---

### Logo Design Rationale

Based on the platform's purpose:

| Element | Meaning |
|---------|---------|
| **Upward Arrow** | Citizen voices rising, civic progress, accountability |
| **Speech Bubble** | Community dialogue, civic discourse |
| **Orange/Gold** | Energy, warmth, action (Kenyan sunrise colors) |
| **Green accent** | Growth, Kenya's national color, hope |
| **Clean/Bold** | Authority, trustworthiness, modern digital platform |

The logo should work at small sizes (32px header) and large sizes (marketing).
