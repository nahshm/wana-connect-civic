

# Fix Remaining Build Errors: Header, InstitutionPage, OfficeHubPage, and Edge Function

These are pre-existing errors unrelated to the combined plan. Here are the fixes:

## 1. Header.tsx — `fetchpriority` casing (line 69)

Change `fetchpriority="high"` to `fetchPriority="high"` (React uses camelCase for HTML attributes).

## 2. InstitutionPage.tsx — Two errors

### Missing `Filter` import (line 634)
The code uses `<Filter className="w-12 h-12" />` but `Filter` is not imported from lucide-react. Add `Filter` to the import statement on line 13-18.

### `ActionDetailSheet` prop mismatch (line 783-787)
The component is called with `issueId` but the interface expects `actionId`. Change `issueId={selectedIssueId}` to `actionId={selectedIssueId}`.

### Excessively deep type instantiation (line 290)
The `.in('community_type', [...])` query triggers deep type inference. Add `as any` to the query chain or cast the result explicitly to suppress the TS2589 error.

## 3. OfficeHubPage.tsx — Multiple type mismatches

### `responsibilities` type (lines 295, 316)
The DB column `responsibilities` is `text` (string), but the local `GovernmentPosition` interface defines it as `string[]`. Change line 63 from `responsibilities: string[] | null` to `responsibilities: string | string[] | null`. The existing parsing logic on line 733 already handles both formats.

### `is_active` missing from office_holders query (line 334)
The `activeHolder` query selects specific columns but omits `is_active`, which the local `OfficeHolder` interface requires. It's filtered via `.eq('is_active', true)` but not selected. Add `is_active` to the select string on line 327.

### `profiles` ambiguous join (lines 334, 411)
The `office_holders` and `office_questions` tables have multiple FK paths to `profiles`. The error says to hint the column. Change `profiles(...)` to `profiles!office_holders_user_id_fkey(...)` on line 327 and `profiles!office_questions_asked_by_fkey(...)` on line 407.

### `category` missing from `office_promises` query (line 381)
The `OfficePromise` interface requires `category` but the select string omits it. Add `category` to the select on line 381.

### `profiles` missing from `office_manifestos` query (line 442)
The `OfficeManifesto` interface requires a `profiles` join but the query only selects `uploaded_by`. Add `profiles!office_manifestos_uploaded_by_fkey(username, full_name)` to the select.

### `urgency` and `status` string literal types (lines 354, 378)
The DB returns plain `string` but the interfaces expect union types like `'high' | 'medium' | 'low'`. The queries already cast with `as` but the generic type parameter on `useQuery` forces strict checking. Cast the return values through `unknown` or relax the interface types to `string`.

## 4. Edge Function — openai dependency resolution

The `promptBuilder.ts` edge function imports trigger a Deno type resolution error for `npm:openai@^4.52.5`. This is a Deno-specific issue — the edge function needs `openai` listed in `supabase/functions/deno.json` or a local import map.

**Fix**: Check if `supabase/functions/deno.json` exists. If not, create it with the openai import mapping. If it exists, add the openai entry.

## Summary

| File | Fix |
|------|-----|
| `Header.tsx` | `fetchpriority` -> `fetchPriority` |
| `InstitutionPage.tsx` | Add `Filter` import, fix `issueId` -> `actionId`, suppress deep type |
| `OfficeHubPage.tsx` | Fix `responsibilities` type, add `is_active` to select, hint `profiles` joins, add `category` to promises select, add `profiles` to manifestos select, relax union types |
| Edge function | Add openai to deno.json import map |

