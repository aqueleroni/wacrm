/**
 * Single source of truth for the color-theme catalog.
 *
 * The CSS variables themselves live in `src/app/globals.css` under
 * `html[data-theme="..."]` blocks — that file is the one we paste
 * theme tokens into. This module only carries the metadata the UI
 * (settings picker, no-flash boot script) needs.
 *
 * Adding a new theme is a two-step change:
 *   1. Append the new `html[data-theme="<id>"]` block in globals.css
 *      with every token from an existing theme (use violet as the
 *      shape reference).
 *   2. Add an entry below. The order here drives the picker grid.
 */

export const THEME_IDS = [
  "violet",
  "emerald",
  "cobalt",
  "amber",
  "rose",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "violet";

export const STORAGE_KEY = "wacrm.theme";

/**
 * MODE — the light/dark dimension, orthogonal to the accent theme.
 *
 * The CSS variables live in `src/app/globals.css` under
 * `html[data-mode="..."]` blocks (neutral surfaces only). Applied
 * at runtime via `document.documentElement.dataset.mode`. Dark is
 * the historical default and stays the app's identity; light is the
 * opt-in eye-strain-friendly alternative.
 *
 * Persisted under its own localStorage key so it composes freely
 * with the accent choice (you can run Violet-light or Violet-dark).
 */
export const MODES = ["light", "dark"] as const;

export type Mode = (typeof MODES)[number];

export const DEFAULT_MODE: Mode = "dark";

export const MODE_STORAGE_KEY = "wacrm.mode";

export function isMode(value: unknown): value is Mode {
  return (
    typeof value === "string" && (MODES as ReadonlyArray<string>).includes(value)
  );
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  tagline: string;
  /**
   * Static swatch color for the picker chip. Hard-coded so the boot
   * script / picker cards don't need a getComputedStyle round trip
   * before the page settles. Must mirror `--primary` of the same
   * theme in globals.css.
   */
  swatch: string;
}

export type ThemeTranslateFn = (
  key: string,
  params?: Record<string, string | number>,
) => string;

const THEME_SWATCHES: Record<ThemeId, string> = {
  violet: "oklch(0.526 0.247 293)",
  emerald: "oklch(0.62 0.16 162)",
  cobalt: "oklch(0.585 0.2 254)",
  amber: "oklch(0.745 0.16 65)",
  rose: "oklch(0.645 0.22 16)",
};

/** Translated theme catalog for UI pickers — pass `t` from useT() or i18n. */
export function getThemes(t: ThemeTranslateFn): ReadonlyArray<ThemeMeta> {
  return THEME_IDS.map((id) => ({
    id,
    name: t(`settings.appearance.themes.${id}.name`),
    tagline: t(`settings.appearance.themes.${id}.tagline`),
    swatch: THEME_SWATCHES[id],
  }));
}

/** English fallback catalog (boot script / non-React contexts). */
export const THEMES: ReadonlyArray<ThemeMeta> = [
  {
    id: "violet",
    name: "Violet",
    tagline: "The default — confident, slightly playful.",
    swatch: THEME_SWATCHES.violet,
  },
  {
    id: "emerald",
    name: "Emerald",
    tagline: "Growth-coded, nods at messaging without copying WhatsApp green.",
    swatch: THEME_SWATCHES.emerald,
  },
  {
    id: "cobalt",
    name: "Cobalt",
    tagline: "Clean B2B-SaaS blue — calm and product-y.",
    swatch: THEME_SWATCHES.cobalt,
  },
  {
    id: "amber",
    name: "Amber",
    tagline: "Warm and friendly — feels good for SMB teams.",
    swatch: THEME_SWATCHES.amber,
  },
  {
    id: "rose",
    name: "Rose",
    tagline: "Bold and modern — D2C, creator-economy, lifestyle.",
    swatch: THEME_SWATCHES.rose,
  },
];

export function isThemeId(value: unknown): value is ThemeId {
  return (
    typeof value === "string" &&
    (THEME_IDS as ReadonlyArray<string>).includes(value)
  );
}
