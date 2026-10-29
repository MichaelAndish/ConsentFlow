import {
  DocumentAudience,
  DocumentLanguage,
  DocumentStatus,
  StepStatus,
  WorkflowStage,
  ICFDocument,
  TemplateSectionConfig,
  CustomTemplateConfig,
} from '../types';

export const AUDIENCE_CONFIG: Record<
  DocumentAudience,
  { label: string; ageRange: string; icon: string; description: string }
> = {
  adult: {
    label: 'Adult Participants',
    ageRange: '>= 18 years',
    icon: 'User',
    description: 'Adult oncology participants and adult reference consent',
  },
  parent: {
    label: 'Parents / Legal Guardians',
    ageRange: 'Parents of minors',
    icon: 'Users',
    description: 'Authorizing consent for paediatric patients under legal majority',
  },
  adolescent: {
    label: 'Adolescents',
    ageRange: '12 – 17 years',
    icon: 'GraduationCap',
    description: 'Assent and informed involvement for teens with maturity assessment',
  },
  child: {
    label: 'Children',
    ageRange: '8 – 11 years',
    icon: 'Smile',
    description: 'Simplified illustrated assent in age-appropriate accessible language',
  },
};

export const LANGUAGE_CONFIG: Record<
  DocumentLanguage,
  { name: string; nativeName: string; flag: string }
> = {
  EN: { name: 'English', nativeName: 'English (Master)', flag: 'GB' },
  NL: { name: 'Dutch', nativeName: 'Nederlands (België)', flag: 'BE-NL' },
  FR: { name: 'French', nativeName: 'Français (Belgique)', flag: 'BE-FR' },
};

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSectionConfig[] = [
  {
    id: 'sec-vol-consent',
    key: 'voluntary_consent',
    title: 'Voluntary Consent & Withdrawal Protection',
    description: 'Guarantees freedom to withdraw at any time without prejudice to continuing care.',
    isIncluded: true,
    canExclude: false,
    category: 'legal',
    statutoryBasis: 'Belgian Law of 7 May 2004 Art. 6',
  },
  {
    id: 'sec-insurance',
    key: 'insurance_liability',
    title: 'No-Fault Sponsor Liability Insurance',
    description: 'Article 29 mandatory insurance for interventional clinical experiments.',
    isIncluded: true,
    canExclude: true,
    category: 'legal',
    statutoryBasis: 'Belgian Law of 7 May 2004 Art. 29',
  },
  {
    id: 'sec-procedures',
    key: 'study_procedures',
    title: 'Clinical Procedures & Sampling Calendar',
    description: 'Detailed calendar of blood draws, bone marrow aspirates, and scans.',
    isIncluded: true,
    canExclude: false,
    category: 'clinical',
  },
  {
    id: 'sec-contraception',
    key: 'contraception_guidance',
    title: 'Adolescent Contraception & Pregnancy Risk',
    description: 'Reproductive risk guidelines adapted for teenagers and parent discussions.',
    isIncluded: true,
    canExclude: true,
    category: 'clinical',
  },
  {
    id: 'sec-biobank',
    key: 'optional_biobanking',
    title: 'Optional Genetic & Tumour Biobanking',
    description: 'Secondary consent for residual sample preservation in national biobank.',
    isIncluded: true,
    canExclude: true,
    category: 'optional_research',
  },
  {
    id: 'sec-contacts',
    key: 'emergency_contacts',
    title: 'Hospital Ward & 24/7 Emergency Contacts',
    description: 'Local Belgian participating site contact phone and PI pager details.',
    isIncluded: true,
    canExclude: false,
    category: 'administrative',
  },
];

export function createCustomTemplateConfig(
  name: string = 'BSPHO Custom Paediatric Template',
  baseTemplate: string = 'BSPHO ICF Template v2.4 (2024)',
  overrides?: {
    id?: string;
    excludeInsurance?: boolean;
    excludeContraception?: boolean;
    excludeBiobanking?: boolean;
    rationale?: string;
  }
): CustomTemplateConfig {
  const excludeInsurance = overrides?.excludeInsurance ?? false;
  const excludeContraception = overrides?.excludeContraception ?? false;
  const excludeBiobanking = overrides?.excludeBiobanking ?? false;

  const sections: TemplateSectionConfig[] = DEFAULT_TEMPLATE_SECTIONS.map((sec) => {
    if (sec.key === 'insurance_liability') {
      return { ...sec, isIncluded: !excludeInsurance };
    }
    if (sec.key === 'contraception_guidance') {
      return { ...sec, isIncluded: !excludeContraception };
    }
    if (sec.key === 'optional_biobanking') {
      return { ...sec, isIncluded: !excludeBiobanking };
    }
    return { ...sec };
  });

  return {
    id: overrides?.id || `tmpl-${Date.now()}`,
    name,
    baseTemplate,
    excludeInsurance,
    excludeContraception,
    excludeBiobanking,
    sections,
    rationale: overrides?.rationale || 'Tailored for paediatric academic trial requirements.',
    lastModified: '2026-10-29',
  };
}

export interface WorkflowStepDefinition {
  index: number;
  stage: WorkflowStage;
  name: string;
  shortName: string;
  description: string;
}

export const WORKFLOW_STEPS: WorkflowStepDefinition[] = [
  {
    index: 1,
    stage: 'input_setup',
    name: '1. Setup',
    shortName: 'Setup',
    description: 'Add the protocol, templates, and participating sites',
  },
  {
    index: 2,
    stage: 'evidence_extraction',
    name: '2. Extract Facts',
    shortName: 'Facts',
    description: 'Confirm key study facts pulled from the protocol',
  },
  {
    index: 3,
    stage: 'template_understanding',
    name: '3. Configure Template',
    shortName: 'Template',
    description: 'Choose which template sections apply to this study',
  },
  {
    index: 4,
    stage: 'draft_generation',
    name: '4. Generate Drafts',
    shortName: 'Drafts',
    description: 'Create English drafts for each audience',
  },
  {
    index: 5,
    stage: 'pi_review',
    name: '5. PI Review',
    shortName: 'PI Review',
    description: 'Investigator reviews and edits the English masters',
  },
  {
    index: 6,
    stage: 'translation',
    name: '6. Translate',
    shortName: 'Translate',
    description: 'Adapt approved English content into Dutch and French',
  },
  {
    index: 7,
    stage: 'consistency_check',
    name: '7. Consistency',
    shortName: 'Check',
    description: 'Resolve mismatches across audiences and languages',
  },
  {
    index: 8,
    stage: 'finalize_export',
    name: '8. Export',
    shortName: 'Export',
    description: 'Approve and export the full 12-document package',
  },
];

/** Plain-language guidance for the current workflow step */
export function getWorkflowNextAction(stepIndex: number): {
  title: string;
  hint: string;
  primaryCta: string;
  tab: 'matrix' | 'facts' | 'issues' | 'sites' | 'bucket' | 'template';
} {
  switch (stepIndex) {
    case 1:
      return {
        title: 'Finish study setup',
        hint: 'Confirm sites and source documents, then continue to fact extraction.',
        primaryCta: 'Continue to Extract Facts',
        tab: 'sites',
      };
    case 2:
      return {
        title: 'Review extracted facts',
        hint: 'Confirm duration, procedures, and insurance details before drafting.',
        primaryCta: 'Continue to Template',
        tab: 'facts',
      };
    case 3:
      return {
        title: 'Set template exclusions',
        hint: 'Exclude sections that do not apply (e.g. insurance for observational studies).',
        primaryCta: 'Continue to Drafts',
        tab: 'template',
      };
    case 4:
      return {
        title: 'Review English drafts',
        hint: 'Open each audience draft in the matrix, then send them for PI review.',
        primaryCta: 'Send to PI Review',
        tab: 'matrix',
      };
    case 5:
      return {
        title: 'Complete PI review',
        hint: 'Open documents awaiting review, accept investigator edits, then unlock translation.',
        primaryCta: 'Unlock Translation',
        tab: 'matrix',
      };
    case 6:
      return {
        title: 'Adapt NL & FR variants',
        hint: 'Translate adaptable clinical text while keeping locked legal clauses intact.',
        primaryCta: 'Run Consistency Check',
        tab: 'matrix',
      };
    case 7:
      return {
        title: 'Resolve consistency issues',
        hint: 'Fix factual mismatches across languages and age groups before export.',
        primaryCta: 'Proceed to Export',
        tab: 'issues',
      };
    case 8:
      return {
        title: 'Finalize & export package',
        hint: 'Approve remaining documents and export the ethics-ready dossier.',
        primaryCta: 'Export Package',
        tab: 'matrix',
      };
    default:
      return {
        title: 'Continue workflow',
        hint: 'Follow the current stage guidance in the workspace.',
        primaryCta: 'Continue',
        tab: 'matrix',
      };
  }
}

export function getBlockPolicyLabel(policy: string): { label: string; hint: string } {
  switch (policy) {
    case 'REQUIRED_VERBATIM':
      return { label: 'Locked legal text', hint: 'Must stay exactly as written' };
    case 'ADAPTABLE_REQUIRED':
      return { label: 'Editable clinical text', hint: 'Required section — wording may be adapted' };
    case 'INSTRUCTION':
      return { label: 'Instruction', hint: 'Guidance for authors — not patient-facing' };
    case 'PLACEHOLDER':
      return { label: 'Site-specific', hint: 'Fill with local site details' };
    case 'OPTIONAL':
      return { label: 'Optional', hint: 'Include only when relevant' };
    default:
      return { label: policy, hint: '' };
  }
}

export function getNextDocumentStatus(status: DocumentStatus): DocumentStatus | null {
  switch (status) {
    case 'not_started':
      return 'draft_generated';
    case 'draft_generated':
      return 'awaiting_pi_review';
    case 'awaiting_pi_review':
      return 'pi_edited';
    case 'pi_edited':
      return 'ready_to_translate';
    case 'ready_to_translate':
      return 'translating';
    case 'translating':
      return 'in_consistency_check';
    case 'in_consistency_check':
      return 'approved';
    case 'approved':
      return 'exported';
    default:
      return null;
  }
}

export function getDocumentStatusActionLabel(status: DocumentStatus): string | null {
  const next = getNextDocumentStatus(status);
  if (!next) return null;
  switch (next) {
    case 'draft_generated':
      return 'Generate Draft';
    case 'awaiting_pi_review':
      return 'Send to PI Review';
    case 'pi_edited':
      return 'Record PI Edits';
    case 'ready_to_translate':
      return 'Mark Ready to Translate';
    case 'translating':
      return 'Start Translation';
    case 'in_consistency_check':
      return 'Send to Consistency Check';
    case 'approved':
      return 'Approve Document';
    case 'exported':
      return 'Export Document';
    default:
      return 'Advance Status';
  }
}

export function getStepStatus(currentStepIndex: number, stepIndex: number): StepStatus {
  if (stepIndex < currentStepIndex) return 'completed';
  if (stepIndex === currentStepIndex) return 'in_progress';
  return 'not_started';
}

export function getDocumentStatusMeta(status: DocumentStatus): {
  label: string;
  badgeClass: string;
  indicatorColor: string;
} {
  switch (status) {
    case 'not_started':
      return {
        label: 'Not Started',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        indicatorColor: 'bg-slate-300',
      };
    case 'draft_generated':
      return {
        label: 'Draft Generated',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        indicatorColor: 'bg-blue-400',
      };
    case 'awaiting_pi_review':
      return {
        label: 'Awaiting PI Review',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-300',
        indicatorColor: 'bg-amber-500',
      };
    case 'pi_edited':
      return {
        label: 'PI Edited (Ready for Review)',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        indicatorColor: 'bg-purple-500',
      };
    case 'ready_to_translate':
      return {
        label: 'Ready to Translate',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        indicatorColor: 'bg-indigo-500',
      };
    case 'translating':
      return {
        label: 'Translating / Adapting',
        badgeClass: 'bg-teal-50 text-teal-700 border-teal-200',
        indicatorColor: 'bg-teal-500',
      };
    case 'in_consistency_check':
      return {
        label: 'In Consistency Check',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        indicatorColor: 'bg-sky-500',
      };
    case 'approved':
      return {
        label: 'Approved & Aligned',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
        indicatorColor: 'bg-emerald-500',
      };
    case 'exported':
      return {
        label: 'Exported & Locked',
        badgeClass: 'bg-slate-900 text-white border-slate-900',
        indicatorColor: 'bg-emerald-400',
      };
    default:
      return {
        label: status,
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        indicatorColor: 'bg-slate-400',
      };
  }
}

export function findDocumentInMatrix(
  documents: ICFDocument[],
  audience: DocumentAudience,
  language: DocumentLanguage
): ICFDocument | undefined {
  return documents.find((doc) => doc.audience === audience && doc.language === language);
}

export function computeStudyStats(documents: ICFDocument[]): {
  total: number;
  ready: number;
  pendingReview: number;
  needsTranslation: number;
  totalIssues: number;
  completionPercent: number;
} {
  const total = documents.length;
  if (total === 0) {
    return {
      total: 0,
      ready: 0,
      pendingReview: 0,
      needsTranslation: 0,
      totalIssues: 0,
      completionPercent: 0,
    };
  }

  const ready = documents.filter((d) => d.status === 'approved' || d.status === 'exported').length;
  const pendingReview = documents.filter((d) => d.status === 'awaiting_pi_review').length;
  const needsTranslation = documents.filter((d) => d.status === 'ready_to_translate' || d.status === 'translating').length;
  const totalIssues = documents.reduce((sum, d) => sum + (d.issueCount || 0), 0);
  const completionPercent = Math.round((ready / total) * 100);

  return {
    total,
    ready,
    pendingReview,
    needsTranslation,
    totalIssues,
    completionPercent,
  };
}

/** Progress that distinguishes generated vs reviewed vs approved (CF-002 / CF-004) */
export function computeDocumentProgress(documents: ICFDocument[]): {
  total: number;
  generated: number;
  awaitingPiReview: number;
  reviewed: number;
  approvedForSubmission: number;
  exported: number;
} {
  const total = documents.length;
  const generated = documents.filter((d) => d.status !== 'not_started').length;
  const awaitingPiReview = documents.filter((d) => d.status === 'awaiting_pi_review').length;
  const reviewed = documents.filter((d) =>
    ['pi_edited', 'ready_to_translate', 'translating', 'in_consistency_check', 'approved', 'exported'].includes(
      d.status
    )
  ).length;
  const approvedForSubmission = documents.filter((d) => d.status === 'approved' || d.status === 'exported').length;
  const exported = documents.filter((d) => d.status === 'exported').length;
  return { total, generated, awaitingPiReview, reviewed, approvedForSubmission, exported };
}

/** Needs a decision (excludes pending_propagation — counted separately) */
export function isIssueOpen(status: string): boolean {
  return status === 'open' || status === 'in_review' || status === 'decision_recorded' || status === 'reopened';
}

export function isIssuePendingPropagation(status: string): boolean {
  return status === 'pending_propagation';
}

/** Still blocks approval until fully resolved (open + pending sync) */
export function isIssueBlockingLifecycle(status: string): boolean {
  return isIssueOpen(status) || isIssuePendingPropagation(status);
}

export function countOpenIssues(issues: { status: string }[] | undefined): number {
  if (!issues?.length) return 0;
  return issues.filter((i) => isIssueOpen(i.status)).length;
}

export function countPendingPropagationIssues(issues: { status: string }[] | undefined): number {
  if (!issues?.length) return 0;
  return issues.filter((i) => isIssuePendingPropagation(i.status)).length;
}

/** High-severity unresolved / pending-propagation issues block clinical approval in the UI (demo gate) */
export function hasBlockingIssues(issues: { status: string; severity: string }[] | undefined): boolean {
  if (!issues?.length) return false;
  return issues.some((i) => isIssueBlockingLifecycle(i.status) && i.severity === 'high');
}
