import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { flattenMessages } from '@/i18n/translate';
import { messagesEn } from '@/i18n/locales/en';

// Template placeholders and raw HTML use WhatsApp `{{1}}` syntax or `<strong>`
// tags. Our `{param}` interpolator mangles `{{1}}` if read with plain t().
// Such strings must use t.raw(). Adapted from upstream icu-safety.test (#421).

const SRC = join(process.cwd(), 'src');

/** Keys whose value contains `{{` (WhatsApp variable syntax). */
function rawRequiredKeys(): string[] {
  const flat = flattenMessages(messagesEn as unknown as Record<string, unknown>);
  return Object.entries(flat)
    .filter(([, value]) => value.includes('{{'))
    .map(([key]) => key);
}

function tsxFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return tsxFiles(full);
    return full.endsWith('.tsx') ? [full] : [];
  });
}

describe('ICU-hostile strings are not read with plain t()', () => {
  it('every {{…}} catalogue string is consumed via t.raw()', () => {
    const hostile = rawRequiredKeys();
    expect(hostile.length).toBeGreaterThan(0);

    const sources = tsxFiles(SRC).map((path) => ({
      path,
      text: readFileSync(path, 'utf8'),
    }));

    const offenders: string[] = [];

    for (const key of hostile) {
      const leaf = key.slice(key.lastIndexOf('.') + 1);

      for (const { path, text } of sources) {
        const plainCall = new RegExp(
          String.raw`(?<![.\w])t\(\s*['"](?:[\w.]+\.)?${leaf}['"]`,
        );
        const rawCall = new RegExp(
          String.raw`t\.raw\(\s*['"](?:[\w.]+\.)?${leaf}['"]`,
        );
        if (plainCall.test(text) && !rawCall.test(text)) {
          offenders.push(`${key} — plain t() in ${path.replace(process.cwd() + '/', '')}`);
        }
      }
    }

    expect(offenders.sort()).toEqual([]);
  });
});
