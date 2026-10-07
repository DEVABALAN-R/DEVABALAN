#!/usr/bin/env node
/**
 * Fails CI when the gzipped web JavaScript grows past the regression ceiling.
 * Phase 1 baseline: ~476 KiB gzip (framework-dominated: expo-router, reanimated,
 * react-native-web, react-dom). The 2026 UI redesign added ~25 KiB of app code,
 * so the ceiling moved 500 → 520 KiB. Replacing Reanimated (~140 KiB gzip on web)
 * with React Native's built-in Animated brought the bundle to ~380 KiB, so the
 * ceiling dropped to 430 KiB: room for the rest of the expense manager, not
 * for regressions. Phase 11 target from the plan: ≤ 350 KiB (route-level code
 * splitting). Raise the ceiling only deliberately, in the same PR that explains why.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const CEILING_KIB = 430;
const TARGET_KIB = 350;
// npm scripts run from the package root.
const dir = path.join(process.cwd(), 'dist', '_expo', 'static', 'js', 'web');

if (!fs.existsSync(dir)) {
  console.error(`No web bundle found in ${dir}. Run "npm run build:web" first.`);
  process.exit(1);
}

let total = 0;
for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.js'))) {
  const size = zlib.gzipSync(fs.readFileSync(path.join(dir, file)), { level: 9 }).length;
  total += size;
  console.log(`${file}: ${(size / 1024).toFixed(1)} KiB gzip`);
}
const kib = total / 1024;
console.log(
  `Total: ${kib.toFixed(1)} KiB gzip (ceiling ${CEILING_KIB} KiB, target ${TARGET_KIB} KiB)`,
);
if (kib > CEILING_KIB) {
  console.error('Web bundle exceeds the regression ceiling.');
  process.exit(1);
}
