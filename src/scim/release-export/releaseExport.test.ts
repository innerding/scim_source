import { describe, it, expect } from 'vitest';
import { mockReleaseExportState } from './releaseExport.mock';
import { validateReleaseExport } from './releaseExport.validation';
import { applyReleaseExportToContext } from './releaseExport.context';
import { mockSensusCorePackageState } from '../sensus-core-package/sensusCorePackage.mock';
import { mockLeafletEffectCheckState } from '../leaflet-effect-check/leafletEffectCheck.mock';
import { makeEmptyContext } from '../context/scimContext.types';

describe('ReleaseExport – 42.1 valid mock passes validation', () => {
  it('mock state is valid', () => {
    const result = validateReleaseExport(mockReleaseExportState, mockSensusCorePackageState, mockLeafletEffectCheckState);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('ReleaseExport – 42.2 package missing', () => {
  it('produces REL_PACKAGE_MISSING', () => {
    const result = validateReleaseExport(mockReleaseExportState, undefined, mockLeafletEffectCheckState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'REL_PACKAGE_MISSING')).toBe(true);
  });
});

describe('ReleaseExport – 42.3 privacy not verified', () => {
  it('produces REL_PRIVACY_NOT_VERIFIED', () => {
    const state = {
      ...mockReleaseExportState,
      metadata: { ...mockReleaseExportState.metadata, privacy_verified: false },
    };
    const result = validateReleaseExport(state, mockSensusCorePackageState, mockLeafletEffectCheckState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'REL_PRIVACY_NOT_VERIFIED')).toBe(true);
  });
});

describe('ReleaseExport – 42.4 not sensus_core_safe', () => {
  it('produces REL_NOT_SENSUS_CORE_SAFE', () => {
    const state = {
      ...mockReleaseExportState,
      metadata: { ...mockReleaseExportState.metadata, sensus_core_safe: false },
    };
    const result = validateReleaseExport(state, mockSensusCorePackageState, mockLeafletEffectCheckState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'REL_NOT_SENSUS_CORE_SAFE')).toBe(true);
  });
});

describe('ReleaseExport – 42.5 raw_signals_excluded false', () => {
  it('produces REL_RAW_SIGNALS_NOT_EXCLUDED', () => {
    const state = {
      ...mockReleaseExportState,
      metadata: { ...mockReleaseExportState.metadata, raw_signals_excluded: false as unknown as true },
    };
    const result = validateReleaseExport(state, mockSensusCorePackageState, mockLeafletEffectCheckState);
    expect(result.is_valid).toBe(false);
    expect(result.errors.some(e => e.code === 'REL_RAW_SIGNALS_NOT_EXCLUDED')).toBe(true);
  });
});

describe('ReleaseExport – 42.6 effect check missing triggers warning', () => {
  it('produces REL_EFFECT_CHECK_MISSING as warning', () => {
    const result = validateReleaseExport(mockReleaseExportState, mockSensusCorePackageState, undefined);
    expect(result.is_valid).toBe(true);
    expect(result.warnings.some(w => w.code === 'REL_EFFECT_CHECK_MISSING')).toBe(true);
  });
});

describe('ReleaseExport – 42.7 context protection', () => {
  it('writes only release', () => {
    const context = makeEmptyContext();
    const updated = applyReleaseExportToContext(context, mockReleaseExportState);
    expect(updated.sensus_core_package).toBe(context.sensus_core_package);
    expect(updated.release).toBe(mockReleaseExportState);
  });
});

describe('ReleaseExport – 42.8 unreleased status blocks apply', () => {
  it('throws when status is not released', () => {
    const state = { ...mockReleaseExportState, status: 'preparing' as const };
    expect(() => applyReleaseExportToContext(makeEmptyContext(), state)).toThrow();
  });
});

describe('ReleaseExport – 42.9 privacy_verified false blocks apply', () => {
  it('throws when metadata.privacy_verified is false', () => {
    const state = {
      ...mockReleaseExportState,
      metadata: { ...mockReleaseExportState.metadata, privacy_verified: false },
    };
    expect(() => applyReleaseExportToContext(makeEmptyContext(), state)).toThrow('privacy_verified');
  });
});
