/**
 * ConsentFlow — BSPHO ICF Workbench
 * Paediatric Clinical Research Informed Consent Form System
 * Core Data Contracts & Models
 */

export type DocumentAudience = 'adult' | 'parent' | 'adolescent' | 'child';

export type DocumentLanguage = 'EN' | 'NL' | 'FR';

export type WorkflowStage =
  | 'input_setup'
  | 'evidence_extraction'
  | 'template_understanding'
  | 'draft_generation'
  | 'pi_review'
  | 'translation'
  | 'consistency_check'
  | 'finalize_export';

export type DocumentStatus =
  | 'not_started'
  | 'draft_generated'
  | 'awaiting_pi_review'
  | 'pi_edited'
  | 'ready_to_translate'
  | 'translating'
  | 'in_consistency_check'
  | 'approved'
  | 'exported';

export type StepStatus =
  | 'not_started'
  | 'in_progress'
  | 'needs_attention'
  | 'ready_for_review'
  | 'completed';

export type BlockPolicy =
  | 'REQUIRED_VERBATIM'
  | 'ADAPTABLE_REQUIRED'
  | 'INSTRUCTION'
  | 'PLACEHOLDER'
  | 'OPTIONAL';

export interface DocumentBlock {
  id: string;
  sectionNumber: string;
  title: string;
  policy: BlockPolicy;
  content: string;
  sourceReference?: string;
  isEditedByPI?: boolean;
  notes?: string;
  isExcluded?: boolean;
  exclusionRationale?: string;
}

export interface ICFDocument {
  id: string;
  studyId: string;
  audience: DocumentAudience;
  language: DocumentLanguage;
  title: string;
  version: string;
  status: DocumentStatus;
  issueCount: number;
  wordCount: number;
  lastUpdated: string;
  updatedBy: string;
  templateVersion: string;
  blocks?: DocumentBlock[];
}

export interface StudySite {
  id: string;
  name: string;
  city: string;
  country: string;
  localCoordinator: string;
  ethicsCommitteeApprovalDate?: string;
  insurancePolicyId?: string;
}

export interface StudyFact {
  id: string;
  studyId: string;
  key: string;
  label: string;
  value: string;
  sourceDoc: string;
  sourcePage?: number;
  confidence: number;
  status: 'extracted' | 'confirmed' | 'conflicted' | 'missing';
  conflictValue?: string;
  affectedAudiences: DocumentAudience[];
}

export type ConsistencyIssueStatus =
  | 'open'
  | 'in_review'
  | 'decision_recorded'
  | 'pending_propagation'
  | 'resolved'
  | 'reopened';

export type ConsistencyIssueType =
  | 'clinical_discrepancy'
  | 'missing_mandatory_information'
  | 'template_compliance'
  | 'translation_inconsistency'
  | 'pending_clinical_review'
  | 'site_compliance';

export interface IssueResolutionRecord {
  decision: string;
  selectedValue: string;
  rationale: string;
  reviewerName: string;
  reviewerRole: string;
  decidedAt: string;
  /** Demo-only: session persistence, not a production audit store */
  demoSessionOnly: true;
}

export interface ConsistencyIssue {
  id: string;
  studyId: string;
  title: string;
  description: string;
  factKey: string;
  severity: 'high' | 'medium' | 'low';
  issueType?: ConsistencyIssueType;
  affectedDocs: { audience: DocumentAudience; language: DocumentLanguage }[];
  sourceEvidence: string;
  discrepancyNote: string;
  status: ConsistencyIssueStatus;
  resolution?: IssueResolutionRecord;
}

export interface ActionItem {
  id: string;
  studyId: string;
  studyName: string;
  title: string;
  description: string;
  type: 'missing_info' | 'pi_review' | 'discrepancy' | 'template_update';
  priority: 'critical' | 'high' | 'medium';
  targetAudience?: DocumentAudience;
  targetLanguage?: DocumentLanguage;
  createdDate: string;
}

export interface CloudBucketConfig {
  bucketName: string;
  bucketUri: string;
  region: string;
  storageClass: 'STANDARD' | 'NEARLINE' | 'COLDLINE';
  encryption: 'Google-managed' | 'CMEK (Customer Managed)' | 'Demo label';
  compliance: string;
  isConnected: boolean;
  lastSyncedAt: string;
  totalObjects: number;
  totalSizeMb: number;
}

export interface BucketDocumentItem {
  id: string;
  name: string;
  path: string;
  category: 'protocol' | 'template' | 'site_info' | 'pi_markup' | 'ethics_dossier';
  sizeBytes: number;
  sizeFormatted: string;
  contentType: string;
  updatedAt: string;
  checksumMd5: string;
  etag: string;
  targetAudiences?: DocumentAudience[];
  targetLanguages?: DocumentLanguage[];
  ingestionStatus: 'pending' | 'ingested' | 'processing' | 'error';
  extractedFactsCount?: number;
}

export interface TemplateSectionConfig {
  id: string;
  key: string;
  title: string;
  description: string;
  isIncluded: boolean;
  canExclude: boolean;
  category: 'legal' | 'clinical' | 'administrative' | 'optional_research';
  statutoryBasis?: string;
}

export interface CustomTemplateConfig {
  id: string;
  name: string;
  baseTemplate: string;
  excludeInsurance: boolean;
  excludeContraception: boolean;
  excludeBiobanking: boolean;
  sections: TemplateSectionConfig[];
  rationale?: string;
  lastModified?: string;
}

/** Demo signed-in coordinator (UI persona — not server auth) */
export const CURRENT_DEMO_USER = {
  id: 'coord-sophie',
  name: 'Dr. Sophie Laurent',
  role: 'COORDINATOR' as const,
};

export interface Study {
  id: string;
  code: string;
  title: string;
  shortTitle: string;
  sponsor: string;
  studyType: 'Interventional' | 'Observational' | 'Expanded Access' | 'Phase I/II Paediatric Trial';
  phase: string;
  responsiblePI: string;
  leadSite: string;
  /** BSPHO coordinator responsible for day-to-day consent package work */
  assignedCoordinator: string;
  participatingSites: StudySite[];
  currentWorkflowStage: WorkflowStage;
  currentStepIndex: number;
  templateVersion: string;
  customTemplate?: CustomTemplateConfig;
  targetAudiences: DocumentAudience[];
  targetLanguages: DocumentLanguage[];
  documents: ICFDocument[];
  facts: StudyFact[];
  issues: ConsistencyIssue[];
  createdDate: string;
  lastUpdated: string;
  readyDocumentsCount: number;
  totalDocumentsCount: number;
  completionPercentage: number;
  cloudBucket?: CloudBucketConfig;
  bucketFiles?: BucketDocumentItem[];
}
