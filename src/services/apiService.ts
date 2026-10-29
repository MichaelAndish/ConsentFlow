import { Study, DocumentStatus, WorkflowStage, CustomTemplateConfig, ActionItem } from '../types';
import { INITIAL_STUDIES, MOCK_ACTION_ITEMS } from '../data/mockData';

export async function fetchStudies(): Promise<{ source: string; studies: Study[] }> {
  try {
    const res = await fetch('/api/studies');
    if (res.ok) {
      const data = await res.json();
      return { source: data.source || 'api', studies: data.studies || [] };
    }
  } catch (err) {
    // API not reachable (e.g. running vite standalone without API_TARGET)
  }

  return { source: 'local_fallback', studies: INITIAL_STUDIES };
}

export async function fetchActionItems(): Promise<{ source: string; actionItems: ActionItem[] }> {
  try {
    const res = await fetch('/api/action-items');
    if (res.ok) {
      const data = await res.json();
      if (data.actionItems?.length) {
        return { source: data.source || 'api', actionItems: data.actionItems };
      }
    }
  } catch {
    // ignore
  }
  return { source: 'local_fallback', actionItems: MOCK_ACTION_ITEMS };
}

export async function persistStudyWorkflow(
  studyId: string,
  stage: WorkflowStage,
  stepIndex: number
): Promise<boolean> {
  try {
    const res = await fetch(`/api/studies/${studyId}/workflow`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, stepIndex }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function persistDocumentStatus(
  studyId: string,
  docId: string,
  status: DocumentStatus
): Promise<boolean> {
  try {
    const res = await fetch(`/api/studies/${studyId}/documents/${docId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function persistCustomTemplate(
  studyId: string,
  customTemplate: CustomTemplateConfig
): Promise<boolean> {
  try {
    const res = await fetch(`/api/studies/${studyId}/template`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customTemplate }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function triggerDatabaseSeed(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/seed', { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: `Seeded ${data.studiesInserted || 0} studies.` };
    }
    const err = await res.json();
    return { success: false, message: err.error || 'Failed to seed.' };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}
