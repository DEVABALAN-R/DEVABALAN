/**
 * DESIGN PREVIEW DATA — NOT YOUR FINANCES.
 *
 * Everything under src/features/preview is fixed, generated sample data used to
 * show the redesigned screens before the data phases ship (Phase 3: database,
 * Phase 4: dashboard, Phase 5: expenses, Phase 6: investments). Fund and company
 * names are fictional. Every screen that uses it shows the SampleDataBadge.
 * Delete this folder when the real repositories replace it.
 */
export const SAMPLE_DATA_LABEL = 'Sample data';
export const SAMPLE_DATA_DESCRIPTION = 'Design preview with sample data — not your real finances.';

/** Editable preview (expense manager): works like the real thing, but nothing is stored. */
export const PREVIEW_STORE_LABEL = 'Preview · not saved';
export const PREVIEW_STORE_DESCRIPTION =
  'Preview with sample data. Entries you add or change stay in this tab only and are lost when the page reloads.';

export const previewProfile = { name: 'Devabalan', plan: 'Personal' } as const;
