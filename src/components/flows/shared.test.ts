import { describe, expect, it } from 'vitest';

import {
  ALL_NODE_TYPES,
  getNodeCategories,
  getNodeMeta,
  groupNodeTypesByCategory,
  type NodeType,
} from './shared';

const t = (key: string) => key;

describe('node categories', () => {
  it('assigns every node type to a known category', () => {
    const meta = getNodeMeta(t);
    const known = new Set(getNodeCategories(t).map((c) => c.id));
    for (const type of ALL_NODE_TYPES) {
      expect(known.has(meta[type].category)).toBe(true);
    }
  });
});

describe('groupNodeTypesByCategory', () => {
  it('keeps the categories in getNodeCategories order and drops empty ones', () => {
    const groups = groupNodeTypesByCategory(['send_message', 'start', 'end'], t);
    expect(groups.map((g) => g.id)).toEqual(['messaging', 'flow']);
  });

  it('preserves the input order within a category', () => {
    const groups = groupNodeTypesByCategory(
      ['send_media', 'send_message', 'send_buttons'],
      t,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].types).toEqual([
      'send_media',
      'send_message',
      'send_buttons',
    ]);
  });

  it('partitions the full type list without losing or duplicating a type', () => {
    const grouped = groupNodeTypesByCategory(ALL_NODE_TYPES, t).flatMap(
      (g) => g.types,
    );
    expect([...grouped].sort()).toEqual([...ALL_NODE_TYPES].sort());
  });
});
