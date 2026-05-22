import type { ScimContext } from '../context/scimContext.types';
import type { SensusCorePackageState } from './sensusCorePackage.types';

export function applySensusCorePackageToContext(context: ScimContext, pkg: SensusCorePackageState): ScimContext {
  if (pkg.status !== 'package_valid' && pkg.status !== 'package_warning') {
    throw new Error('Cannot apply invalid or unbuilt Sensus-Core Package to SCIM context.');
  }
  return { ...context, sensus_core_package: pkg };
}
