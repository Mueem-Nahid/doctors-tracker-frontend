# Doctor Tracker frontend implementation plan

[Design](DESIGN.md) · [Delivery phases](../../docs/IMPLEMENTATION_PLAN.md#phases) · [REST contract](../../backend/docs/API_CONTRACT.md)

Build on the existing Next.js App Router project. Use the design's tokens, page layouts, and Atomic Design hierarchy. Use TanStack Query v5 for server data, `nuqs` for table and dashboard parameters, Zustand for shared UI preferences, `next-themes` for theme, and React Hook Form with shared Zod schemas for forms. Reuse the generic table across doctor, patient, doctor-patient, and recent-patient views. [TanStack Query pagination](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)

## Next.js and Express integration

- Add an external rewrite in `next.config.ts` from `/api/:path*` to `${BACKEND_ORIGIN}/api/v1/:path*`. `BACKEND_ORIGIN` is server-only and points to Express. Use relative `/api` requests with same-origin credentials from the browser. Reserve that prefix for the Express API. [Next.js rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites)
- Add a server-only session helper that forwards the session cookie to Express `/api/v1/auth/me` using a request-specific, uncached fetch. Call it from protected page entry points and the login page where redirect behavior depends on the session. Map `401` to login, `403` to access denied, and upstream failures to a retryable error. Keep auth and user data out of the shared Next.js cache and static prerender. Verify that navigations and direct page loads honor the same access rules. [Next.js authentication guide](https://nextjs.org/docs/app/guides/authentication) · [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- Use one `apiFetch` wrapper for response parsing, `ApiError` mapping, and cancellation. Treat `204` as bodyless. Preserve inline login errors on `INVALID_CREDENTIALS`. On protected API `401`, clear the auth-scoped cache and redirect once to login with a validated internal return path. On logout success, cancel in-flight queries, clear the cache, navigate to login, and refresh server-rendered state. Render `403` as an access-denied state. Keep authenticated queries in memory and avoid sending search terms or patient fields to frontend telemetry. URL-based `q` is shareable and may contain names or contact information, so use synthetic records in the demo and review URL/history exposure before a real-data rollout.
- Import DTOs and form schemas from `packages/contracts`. Keep `src/lib/api.ts`, query hooks and keys, server-only session access, UI stores, and generic hooks in `frontend/`. Place MongoDB models, queries, password handling, and cookie issuance in `backend/`.

## Work by phase

| Phase | Frontend work | Acceptance |
| --- | --- | --- |
| **0. Design handoff** | Resolve the integration items below. Create empty and populated API fixtures for table, validation error, and dashboard rendering. Review token, interaction, and accessibility requirements in `DESIGN.md`. | Fixtures match the contract and the build has a single agreed API prefix. |
| **1. Tokens and shell** | Implement CSS variables and theme tokens, shadcn primitives under atoms, providers, navigation, app shell, page layouts, error boundary, and skeletons. Enforce one-way imports with ESLint. | Desktop sidebar, mobile sheet, keyboard focus, and light/dark switching work. The rewrite reaches Express using the local environment settings. |
| **2. Login and session** | Build the responsive login form, field errors and submit state. Add protected routes and safe login return handling. Wire logout and session expiry. | Wrong password stays inline on the login screen. Valid login returns to the intended page. Refresh, expiry, back navigation, and logout leave the correct UI and query state. |
| **3. Doctors and scoped patients** | Build Doctors table, Add doctor dialog, filter chips, date/facet controls, doctor profile and scoped Patients panel. Reuse the patient form with the doctor locked. | Duplicate email maps to the email field. Table state survives reload. Doctor counts and scoped rows refresh after patient creation or deletion. |
| **4. Global Patients** | Add the global list and its facets, doctor selector, create/edit forms, and named delete confirmation. Load patient detail when edit opens and submit the changed fields only. | Notes stay out of list payloads. Changes to doctor assignment update both doctors' lists and counts. Clearing optional fields works. Deleting the final row on a page returns the user to a populated page or the relevant empty state. |
| **5. Dashboard** | Add KPI grid, lazy-loaded Recharts, chart data tables, date selector, and recent patients from the summary response. Provide accessible drilldown links for doctor and individual condition values. | Keyboard and touch users can access the data, grouped condition slices have no misleading filter link, and a zero prior count displays no percentage. Range switching updates only date-dependent values for a fixed data set. |
| **6. Polish and evidence** | Run browser smoke tests and accessibility checks. Verify design breakpoints, reduced motion, dark mode, focus behavior, and form/error states. Capture desktop and mobile screenshots. | Review against `DESIGN.md` §12, §15, and §16 and link the screenshots in the submission README. |

## Data and interaction details

- Canonicalize list params before creating query keys. Preserve repeated text facet values when serializing to the API. Reset to page 1 when search, filters, page size, or sort changes. Debounce search by 300 ms. Use the previous result during pagination, a visible fetching state, and request cancellation for superseded queries. Prefetch only when metadata indicates another valid page.
- Keep `qk` as the only query-key factory. Keep hooks inside organisms, with optional page-level prefetch. Use a 30-second list freshness window, five minutes for filter metadata, and 60 seconds for the dashboard. These are browser query-cache settings. If SSR prefetch is later useful, use a request-scoped `QueryClient` and direct server-to-Express calls with the session cookie. [TanStack Query App Router SSR](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- Mutation hooks own invalidation. Create doctor invalidates doctor lists, facets, and dashboard. Patient create, update, and delete invalidate patient queries, including detail and scoped lists, and dashboard. Create, delete, and reassignment also invalidate doctor lists and details. Start with confirmed deletes and refetch the affected data after success.
- Render loading, empty, error, and success states for each async screen. Distinguish an empty collection from a filter with no results. Keep form errors associated with their fields, restore focus after dialogs, and show a retry action when a request fails.

## Reconcile with `DESIGN.md` in phase 0

| Design section | Planned integration detail |
| --- | --- |
| §0.7, §14–15 | Select standalone Express. Replace the suggested Next.js Route Handlers and backend folders with the same-origin rewrite and the `backend/` module layout. Document both apps in the README. |
| §7.1, §10.1, §10.3 | Put shared Zod schemas in `packages/contracts`. Use Express-owned opaque MongoDB sessions and Argon2id. Apply origin validation to browser mutations and use the session helper for page access. Doctor email is unique. Patient email is optional and may repeat. |
| §8.5, §9–10 | Filter by `createdAt` and label the date filter **Added**. Use the approved sort allow-lists, repeated free-text facets, patient detail endpoint for notes, `recentPatients` in the summary, and grouped condition labels from the contract. |
| §10.4, §16 | Measure index use for the common list paths. Keep one dashboard HTTP request and separate the all-time and date-window MongoDB reads so date filters preserve all-time totals. |
| §11.4 | Load authenticated data from Express for any SSR prefetch. Treat bad-login `401` separately from session expiry. Invalidate doctor queries when editing changes the assignment. |
