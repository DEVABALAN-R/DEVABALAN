# Command Center (Expo)

The new cross-platform app (iOS, Android, web) that will replace the Vite app at the
repository root. It is being built in phases — see
[`docs/architecture/MODERNIZATION_PLAN.md`](../../docs/architecture/MODERNIZATION_PLAN.md).

**Status: Phase 1 (architecture + design system).** The app contains the adaptive shell,
design tokens and components. Every destination is a clearly labelled placeholder: it reads
and writes **no** user data, and there is no sign-in yet (Phase 2). Keep using the existing
app for real finances.

## Run

```bash
cd apps/command-center
npm ci
npm run web        # browser
npm run ios        # iOS simulator / Expo Go
npm run android    # Android emulator / Expo Go
```

The design-system gallery is at `/dev/components` (development builds only; production
builds redirect it away).

## Checks (same as CI)

```bash
npm run typecheck
npx eslint . --max-warnings 0
npm run format:check
npm test
npm run build:web && npm run check:bundle
```

## Structure

```
src/
  app/                 routes only (Expo Router); thin, ≤ 80 lines each
    dashboard/         adaptive shell + destinations
    dev/components     design-system gallery (dev only)
  components/          ui · layout · navigation · feedback · overlays · icons.ts
  features/            shell (sidebar, bottom bar, top bar), settings, dev-gallery
  hooks/               useBreakpoint, useInteractionState
  lib/formatting/      display-only money/percent formatting (integer paise in)
  state/               small Zustand UI store (no financial data)
  theme/               tokens, typography, semantic colours (light/dark), motion, ThemeProvider
```

## Conventions

- **Colours** come from semantic roles in `src/theme/colors.ts`; no hex values elsewhere.
  `src/theme/__tests__/contrast.test.ts` enforces WCAG contrast for every text/UI pairing.
- **Icons** are imported from `@/components/icons` (per-icon imports). Importing the
  `lucide-react-native` barrel is a lint error because it adds ~2 MB to the web bundle.
- **Money** is passed to UI as integer minor units (paise); formatting happens only at display.
- **Motion** timings come from `useMotion()`, which honours the OS reduced-motion setting.
- **Responsive layouts** are chosen per breakpoint (`useBreakpoint`), not shrunk from desktop.
- Web output is a single-page app; Vercel must rewrite unknown paths to `index.html`.
