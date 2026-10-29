import { query } from './connection';
import { Study, ICFDocument, StudyFact, ConsistencyIssue, StudySite, DocumentStatus, WorkflowStage, CustomTemplateConfig } from '../types';

export async function getAllStudies(): Promise<Study[]> {
  const studiesRes = await query('SELECT * FROM studies ORDER BY created_at DESC');

  const studies: Study[] = [];

  for (const row of studiesRes.rows) {
    const studyId = row.id;

    const [sitesRes, factsRes, issuesRes, docsRes] = await Promise.all([
      query('SELECT * FROM study_sites WHERE study_id = $1', [studyId]),
      query('SELECT * FROM study_facts WHERE study_id = $1', [studyId]),
      query('SELECT * FROM consistency_issues WHERE study_id = $1', [studyId]),
      query('SELECT * FROM icf_documents WHERE study_id = $1 ORDER BY audience, language', [studyId]),
    ]);

    const participatingSites: StudySite[] = sitesRes.rows.map((s) => ({
      id: s.id,
      name: s.name,
      city: s.city,
      country: s.country,
      localCoordinator: s.local_coordinator,
      ethicsCommitteeApprovalDate: s.ethics_committee_approval_date,
      insurancePolicyId: s.insurance_policy_id,
    }));

    const facts: StudyFact[] = factsRes.rows.map((f) => ({
      id: f.id,
      studyId: f.study_id,
      key: f.key,
      label: f.label,
      value: f.value,
      conflictValue: f.conflict_value,
      sourceDoc: f.source_doc,
      sourcePage: f.source_page,
      confidence: Number(f.confidence),
      status: f.status,
      affectedAudiences: f.affected_audiences || [],
    }));

    const issues: ConsistencyIssue[] = issuesRes.rows.map((i) => ({
      id: i.id,
      studyId: i.study_id,
      title: i.title,
      description: i.description,
      factKey: i.fact_key,
      severity: i.severity,
      issueType: i.issue_type || undefined,
      affectedDocs: i.affected_docs || [],
      sourceEvidence: i.source_evidence,
      discrepancyNote: i.discrepancy_note,
      status: i.status,
      resolution: i.resolution || undefined,
    }));

    const documents: ICFDocument[] = docsRes.rows.map((d) => ({
      id: d.id,
      studyId: d.study_id,
      audience: d.audience,
      language: d.language,
      title: d.title,
      version: d.version,
      status: d.status,
      issueCount: d.issue_count,
      wordCount: d.word_count,
      lastUpdated: d.last_updated,
      updatedBy: d.updated_by,
      templateVersion: d.template_version,
      blocks: d.blocks || [],
    }));

    studies.push({
      id: row.id,
      code: row.code,
      title: row.title,
      shortTitle: row.short_title,
      sponsor: row.sponsor,
      studyType: row.study_type,
      phase: row.phase,
      responsiblePI: row.responsible_pi,
      leadSite: row.lead_site,
      assignedCoordinator: row.assigned_coordinator || row.responsible_pi || 'Unassigned',
      currentWorkflowStage: row.current_workflow_stage as WorkflowStage,
      currentStepIndex: row.current_step_index,
      templateVersion: row.template_version,
      customTemplate: row.custom_template || undefined,
      targetAudiences: row.target_audiences || ['adult', 'parent', 'adolescent', 'child'],
      targetLanguages: row.target_languages || ['EN', 'NL', 'FR'],
      readyDocumentsCount: row.ready_documents_count,
      totalDocumentsCount: row.total_documents_count,
      completionPercentage: row.completion_percentage,
      cloudBucket: row.cloud_bucket || undefined,
      bucketFiles: row.bucket_files || undefined,
      participatingSites,
      facts,
      issues,
      documents,
      createdDate: row.created_date,
      lastUpdated: row.last_updated,
    });
  }

  return studies;
}

export async function updateStudyWorkflow(
  studyId: string,
  stage: WorkflowStage,
  stepIndex: number
): Promise<void> {
  await query(
    `UPDATE studies
     SET current_workflow_stage = $1, current_step_index = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [stage, stepIndex, studyId]
  );
}

export async function updateStudyDocumentStatus(
  studyId: string,
  docId: string,
  newStatus: DocumentStatus
): Promise<void> {
  await query(
    `UPDATE icf_documents
     SET status = $1, last_updated = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND study_id = $3`,
    [newStatus, docId, studyId]
  );

  // Recalculate ready document counts for the study
  const countRes = await query(
    `SELECT COUNT(*) as ready_count FROM icf_documents
     WHERE study_id = $1 AND status IN ('approved', 'exported')`,
    [studyId]
  );

  const totalRes = await query(
    `SELECT COUNT(*) as total_count FROM icf_documents WHERE study_id = $1`,
    [studyId]
  );

  const ready = Number(countRes.rows[0]?.ready_count || 0);
  const total = Number(totalRes.rows[0]?.total_count || 12);
  const percentage = total > 0 ? Math.round((ready / total) * 100) : 0;

  await query(
    `UPDATE studies
     SET ready_documents_count = $1, completion_percentage = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [ready, percentage, studyId]
  );
}

export async function updateStudyCustomTemplate(
  studyId: string,
  customTemplate: CustomTemplateConfig
): Promise<void> {
  await query(
    `UPDATE studies
     SET custom_template = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [JSON.stringify(customTemplate), studyId]
  );
}
