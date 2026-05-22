import type { ScimPanelId, ScimContextPath } from './scimContext.paths';
import type { ScimSourceRef } from './scimContext.sourceRefs';
import type { ScimContextAuditAction } from './scimContext.types';

export type { ScimContextAuditAction };

export interface ScimContextAuditEntry {
  audit_id: string;
  timestamp: string;
  panel: ScimPanelId;
  action: ScimContextAuditAction;
  context_path: ScimContextPath;
  previous_status?: string;
  next_status?: string;
  source_ref?: ScimSourceRef;
  issue_ids?: string[];
}

export interface ScimContextAudit {
  entries: ScimContextAuditEntry[];
}

export function makeEmptyAudit(): ScimContextAudit {
  return { entries: [] };
}

export function addAuditEntry(
  audit: ScimContextAudit,
  entry: Omit<ScimContextAuditEntry, 'audit_id' | 'timestamp'>
): ScimContextAudit {
  const newEntry: ScimContextAuditEntry = {
    ...entry,
    audit_id: `audit__${entry.panel}__${entry.action}__${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
  return { entries: [...audit.entries, newEntry] };
}

export function getAuditEntriesForPath(
  audit: ScimContextAudit,
  path: ScimContextPath
): ScimContextAuditEntry[] {
  return audit.entries.filter((e) => e.context_path === path);
}

export function getLastAuditEntry(
  audit: ScimContextAudit,
  path: ScimContextPath
): ScimContextAuditEntry | undefined {
  const entries = getAuditEntriesForPath(audit, path);
  return entries[entries.length - 1];
}
