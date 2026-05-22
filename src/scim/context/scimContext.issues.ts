import type { ScimPanelId, ScimContextPath } from './scimContext.paths';

export type ScimIssueSeverity = 'info' | 'warning' | 'error' | 'blocker';

export interface ScimIssue {
  issue_id: string;
  severity: ScimIssueSeverity;
  code: string;
  message: string;
  panel: ScimPanelId;
  affected_context_path?: ScimContextPath;
  affected_object_id?: string;
  created_at: string;
  blocking: boolean;
  public_safe: boolean;
}

export function makeIssue(
  panel: ScimPanelId,
  severity: ScimIssueSeverity,
  code: string,
  message: string,
  opts?: {
    affected_context_path?: ScimContextPath;
    affected_object_id?: string;
    public_safe?: boolean;
  }
): ScimIssue {
  return {
    issue_id: `${panel}__${code}__${Date.now()}`,
    severity,
    code,
    message,
    panel,
    affected_context_path: opts?.affected_context_path,
    affected_object_id: opts?.affected_object_id,
    created_at: new Date().toISOString(),
    blocking: severity === 'blocker',
    public_safe: opts?.public_safe ?? false,
  };
}
