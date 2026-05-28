import { describe, it, expect } from 'vitest';
import { slugify, parseRuntimeUrl, matchRepresentation } from './router';
import type { BoundaryGeometry, Representation } from '../scim/workspace/workspace.types';

describe('slugify', () => {
  it('expands german umlauts', () => {
    expect(slugify('Böhmerwald')).toBe('boehmerwald');
    expect(slugify('Grünberg')).toBe('gruenberg');
    expect(slugify('Mühlviertel-Süd')).toBe('muehlviertel-sued');
  });

  it('strips other diacritics via NFD', () => {
    expect(slugify('Café')).toBe('cafe');
  });

  it('collapses runs and trims dashes', () => {
    expect(slugify('  Hello / World  ')).toBe('hello-world');
  });

  it('returns empty for falsy', () => {
    expect(slugify('')).toBe('');
  });
});

describe('parseRuntimeUrl', () => {
  it('parses /<region>/<rep>', () => {
    expect(parseRuntimeUrl('/boehmerwald/lichtenberg')).toEqual({
      regionSlug: 'boehmerwald',
      repSlug: 'lichtenberg',
    });
  });

  it('handles trailing slash and extra segments', () => {
    expect(parseRuntimeUrl('/boehmerwald/lichtenberg/')).toEqual({
      regionSlug: 'boehmerwald',
      repSlug: 'lichtenberg',
    });
    expect(parseRuntimeUrl('/boehmerwald/lichtenberg/tour')).toEqual({
      regionSlug: 'boehmerwald',
      repSlug: 'lichtenberg',
    });
  });

  it('decodes percent-encoded umlauts and re-slugifies', () => {
    const encoded = '/' + encodeURIComponent('Böhmerwald') + '/Lichtenberg';
    expect(parseRuntimeUrl(encoded)).toEqual({
      regionSlug: 'boehmerwald',
      repSlug: 'lichtenberg',
    });
  });

  it('returns null on short paths', () => {
    expect(parseRuntimeUrl('/')).toBeNull();
    expect(parseRuntimeUrl('/onlyone')).toBeNull();
    expect(parseRuntimeUrl('')).toBeNull();
  });
});

describe('matchRepresentation', () => {
  const geometry: BoundaryGeometry = {
    id: 'lichtenberg',
    name: 'Lichtenberg',
    region: 'Böhmerwald',
    polygon: [],
    raw: {
      type: 'Feature',
      properties: { name: 'Lichtenberg', region: 'Böhmerwald' },
      geometry: { type: 'Polygon', coordinates: [[]] },
    },
  };
  const rep: Representation = {
    schema: 'scim3_representation_v1',
    id: 'rep-lichtenberg',
    name: 'Lichtenberg',
    geometry_id: 'lichtenberg',
    created_at: '2026-05-27',
  };

  it('matches by region + rep name', () => {
    const match = matchRepresentation(
      { regionSlug: 'boehmerwald', repSlug: 'lichtenberg' },
      [rep],
      [geometry],
    );
    expect(match?.representation.id).toBe('rep-lichtenberg');
    expect(match?.geometry.id).toBe('lichtenberg');
  });

  it('matches by region + geometry_id fallback', () => {
    const repWithDifferentName: Representation = { ...rep, name: 'Sommer-Variante' };
    const match = matchRepresentation(
      { regionSlug: 'boehmerwald', repSlug: 'lichtenberg' },
      [repWithDifferentName],
      [geometry],
    );
    expect(match?.representation.name).toBe('Sommer-Variante');
  });

  it('returns null on wrong region', () => {
    expect(
      matchRepresentation(
        { regionSlug: 'salzkammergut', repSlug: 'lichtenberg' },
        [rep],
        [geometry],
      ),
    ).toBeNull();
  });

  it('returns null on null route', () => {
    expect(matchRepresentation(null, [rep], [geometry])).toBeNull();
  });
});
