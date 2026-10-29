import { Study, ActionItem, DocumentBlock, ICFDocument } from '../types';
import {
  MOCK_BUCKET_FILES_LEUK_01,
  MOCK_BUCKET_FILES_NEURO_03,
  MOCK_BUCKET_FILES_SARCOMA_08,
  OFFICIAL_GCS_BUCKETS,
} from '../services/cloudBucketService';
import { createCustomTemplateConfig } from '../utils/studyLogic';

export const MOCK_STUDY_BLOCKS_PARENT_EN: DocumentBlock[] = [
  {
    id: 'blk-001',
    sectionNumber: '1.0',
    title: 'Title of the Clinical Study and Regulatory Identification',
    policy: 'REQUIRED_VERBATIM',
    content:
      'Official Title: ALL-Together1: A Treatment Study Protocol for Paediatric Acute Lymphoblastic Leukaemia.\nEudraCT / CTIS: 2024-500293-18-00 | Belgian Protocol Code: BSPHO-2024-LEUK-01.\nSponsor: European Leukaemia Network & BSPHO Working Group.',
    sourceReference: 'Protocol Cover & CTIS Registry Summary',
    isEditedByPI: false,
  },
  {
    id: 'blk-002',
    sectionNumber: '2.1',
    title: 'Purpose of this Research Study',
    policy: 'ADAPTABLE_REQUIRED',
    content:
      'Your child is being invited to take part in a medical research study for Acute Lymphoblastic Leukaemia (ALL). The purpose of this study is to determine if risk-stratified therapy with PEG-Asparaginase reduces relapse risk while minimising treatment-related toxicities.',
    sourceReference: 'Protocol Section 2.3 (Study Rationale)',
    isEditedByPI: false,
  },
  {
    id: 'blk-003',
    sectionNumber: '3.2',
    title: 'Mandatory Legal Notification (Belgian Law of 7 May 2004)',
    policy: 'REQUIRED_VERBATIM',
    content:
      'Participation in this clinical experiment is entirely voluntary. Refusal to participate or decision to withdraw at any time will not affect the quality of ongoing medical care, relationship with the treating physicians, or future healthcare entitlements under the Belgian compulsory healthcare insurance.',
    sourceReference: 'BSPHO Standard Template v2.4, Legal Clause Art. 6',
    isEditedByPI: false,
  },
  {
    id: 'blk-004',
    sectionNumber: '4.2',
    title: 'Study Procedures & Blood Sampling Schedule',
    policy: 'ADAPTABLE_REQUIRED',
    content:
      'During the 6-week induction phase, your child will have 3 blood draws (approximately 5 mL each) scheduled during routine venous cannula access, minimizing needle distress. In addition, 2 bone marrow aspirates will be performed under standard paediatric procedural sedation.',
    sourceReference: 'Investigator markup / Protocol p.20 mentions 4 draws',
    isEditedByPI: true,
    notes: 'PI Dr. De Moerloose revised from 4 to 3 blood draws to reflect amended local clinical protocol.',
  },
  {
    id: 'blk-005',
    sectionNumber: '5.0',
    title: 'No-Fault Clinical Trial Insurance (Belgian Law Clause)',
    policy: 'REQUIRED_VERBATIM',
    content:
      'Even in the absence of fault, the sponsor is liable for damages sustained by the participant directly linked to the clinical trial, pursuant to Article 29 of the Belgian Law of 7 May 2004. Insurance has been subscribed with Chubb European Group SE, Policy number BEL-CLIN-2024-9982.',
    sourceReference: 'Site Agreement & Insurance Certificate',
    isEditedByPI: false,
  },
  {
    id: 'blk-006',
    sectionNumber: '6.1',
    title: 'Site Emergency Contact Details',
    policy: 'PLACEHOLDER',
    content:
      '24/7 Paediatric Oncology On-Call Service: Demo Site Clinic, Campus Demo Lane 1, 9000 Demo-City. Phone: +32 00 000 00 00 (synthetic). Treating Investigator: Prof. Dr. Barbara De Moerloose (demo cast).',
    sourceReference: 'Site Information Form Annex 1',
    isEditedByPI: false,
  },
];

function generate12Documents(studyId: string, templateVersion: string): ICFDocument[] {
  const audiences: { key: 'adult' | 'parent' | 'adolescent' | 'child'; titlePrefix: string; baseWords: number }[] = [
    { key: 'adult', titlePrefix: 'Adult Participant Information & Consent Form', baseWords: 3800 },
    { key: 'parent', titlePrefix: 'Parent / Legal Guardian Informed Consent Form', baseWords: 4300 },
    { key: 'adolescent', titlePrefix: 'Adolescent Information & Assent Form (12–17y)', baseWords: 2600 },
    { key: 'child', titlePrefix: 'Children Information & Assent Booklet (8–11y)', baseWords: 1400 },
  ];

  const languages: { key: 'EN' | 'NL' | 'FR'; suffix: string }[] = [
    { key: 'EN', suffix: 'EN' },
    { key: 'NL', suffix: 'NL' },
    { key: 'FR', suffix: 'FR' },
  ];

  const docs: ICFDocument[] = [];

  for (const aud of audiences) {
    for (const lang of languages) {
      const docId = `doc-${studyId}-${aud.key}-${lang.key.toLowerCase()}`;
      let status: ICFDocument['status'] = 'draft_generated';
      let issueCount = 0;
      let version = 'v1.0';

      if (studyId === 'study-leuk-01') {
        if (aud.key === 'adult' && lang.key === 'EN') {
          status = 'approved';
          version = 'v1.2';
        } else if (aud.key === 'adult' && (lang.key === 'NL' || lang.key === 'FR')) {
          status = 'ready_to_translate';
          version = 'v1.0';
        } else if (aud.key === 'parent' && lang.key === 'EN') {
          status = 'pi_edited';
          version = 'v1.2';
          issueCount = 1;
        } else if (aud.key === 'parent' && lang.key === 'NL') {
          status = 'translating';
          version = 'v1.0';
          issueCount = 1;
        } else if (aud.key === 'parent' && lang.key === 'FR') {
          status = 'awaiting_pi_review';
          version = 'v1.0';
          issueCount = 2;
        } else if (aud.key === 'adolescent' && lang.key === 'EN') {
          status = 'awaiting_pi_review';
          version = 'v1.1';
          issueCount = 1;
        } else if (aud.key === 'adolescent') {
          status = 'draft_generated';
          version = 'v0.9';
          issueCount = 1;
        } else if (aud.key === 'child') {
          status = lang.key === 'FR' ? 'approved' : 'approved';
          version = 'v1.1';
          issueCount = 0;
        }
      } else if (studyId === 'study-sarcoma-08') {
        status = 'exported';
        version = 'v2.0';
        issueCount = 0;
      } else if (studyId === 'study-neuro-03') {
        if (lang.key === 'EN') {
          status = 'draft_generated';
          version = 'v0.8';
          issueCount = 2;
        } else {
          status = 'not_started';
          version = 'v0.1';
          issueCount = 0;
        }
      }

      docs.push({
        id: docId,
        studyId,
        audience: aud.key,
        language: lang.key,
        title: `${aud.titlePrefix} (${lang.suffix})`,
        version,
        status,
        issueCount,
        wordCount: aud.baseWords + (lang.key === 'FR' ? 240 : lang.key === 'NL' ? 120 : 0),
        lastUpdated: '2026-10-28',
        updatedBy: lang.key === 'EN' ? 'Prof. Dr. De Moerloose' : 'Elena Vanderberghe (BSPHO)',
        templateVersion,
        blocks: aud.key === 'parent' && lang.key === 'EN' ? MOCK_STUDY_BLOCKS_PARENT_EN : undefined,
      });
    }
  }

  return docs;
}

export const INITIAL_STUDIES: Study[] = [
  {
    id: 'study-leuk-01',
    code: 'BSPHO-2024-LEUK-01',
    title: 'ALL-Together1: European Treatment Protocol for Paediatric Acute Lymphoblastic Leukaemia',
    shortTitle: 'ALL-Together1 Paediatric ALL',
    sponsor: 'European Leukaemia Network & BSPHO Leukaemia Committee',
    studyType: 'Phase I/II Paediatric Trial',
    phase: 'Phase III Multicentric',
    responsiblePI: 'Prof. Dr. Barbara De Moerloose',
    leadSite: 'UZ Gent - Paediatric Haematology & Oncology',
    assignedCoordinator: 'Dr. Sophie Laurent',
    participatingSites: [
      {
        id: 'site-uzg',
        name: 'UZ Gent',
        city: 'Gent',
        country: 'Belgium',
        localCoordinator: 'Elena Vanderberghe',
        ethicsCommitteeApprovalDate: '2024-06-15',
        insurancePolicyId: 'BEL-CLIN-2024-9982',
      },
      {
        id: 'site-uzl',
        name: 'UZ Leuven (Campus Gasthuisberg)',
        city: 'Leuven',
        country: 'Belgium',
        localCoordinator: 'Dr. Anne Uyttebroeck',
        ethicsCommitteeApprovalDate: '2024-07-02',
        insurancePolicyId: 'BEL-CLIN-2024-9982',
      },
      {
        id: 'site-csl',
        name: 'Cliniques universitaires Saint-Luc',
        city: 'Brussels',
        country: 'Belgium',
        localCoordinator: 'Dr. Marc Henrion',
        insurancePolicyId: undefined, // Demonstrating missing insurance
      },
      {
        id: 'site-huderf',
        name: 'HUDERF (Hôpital Universitaire Des Enfants Reine Fabiola)',
        city: 'Brussels',
        country: 'Belgium',
        localCoordinator: 'Dr. Alina Ferster',
        ethicsCommitteeApprovalDate: '2024-06-20',
        insurancePolicyId: 'BEL-CLIN-2024-9982',
      },
    ],
    currentWorkflowStage: 'pi_review',
    currentStepIndex: 5,
    templateVersion: 'BSPHO ICF Template v2.4 (2024)',
    customTemplate: createCustomTemplateConfig(
      'BSPHO Interventional v2.4 (Standard)',
      'BSPHO ICF Template v2.4 (2024)'
    ),
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    documents: generate12Documents('study-leuk-01', 'BSPHO ICF Template v2.4 (2024)'),
    facts: [
      {
        id: 'fact-1',
        studyId: 'study-leuk-01',
        key: 'study_duration',
        label: 'Total Study Duration',
        value: '24 months maintenance, 36 months total follow-up',
        sourceDoc: 'Protocol Section 4.1',
        sourcePage: 14,
        confidence: 0.98,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent', 'adolescent', 'child'],
      },
      {
        id: 'fact-2',
        studyId: 'study-leuk-01',
        key: 'blood_draws',
        label: 'Number of Blood Draws (Induction)',
        value: '3 blood draws (PI markup)',
        conflictValue: '4 blood draws (Sponsor protocol page 20)',
        sourceDoc: 'Sponsor Protocol v1.4, Section 6.2 vs Investigator Track Changes',
        sourcePage: 20,
        confidence: 0.76,
        status: 'conflicted',
        affectedAudiences: ['adult', 'parent', 'adolescent', 'child'],
      },
      {
        id: 'fact-3',
        studyId: 'study-leuk-01',
        key: 'investigational_agent',
        label: 'Investigational Intervention',
        value: 'PEG-Asparaginase combined with Methotrexate',
        sourceDoc: 'Investigator Brochure (IB) Section 3.2',
        sourcePage: 8,
        confidence: 0.99,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent', 'adolescent'],
      },
      {
        id: 'fact-4',
        studyId: 'study-leuk-01',
        key: 'site_insurance',
        label: 'Belgian Clinical Trial No-Fault Insurance',
        value: 'Chubb European Group SE - Policy BEL-CLIN-2024-9982',
        sourceDoc: 'Central Ethics Dossier Annex 4',
        sourcePage: 1,
        confidence: 0.95,
        status: 'conflicted',
        conflictValue: 'Saint-Luc local rider missing certificate of insurance',
        affectedAudiences: ['adult', 'parent'],
      },
    ],
    issues: [
      {
        id: 'iss-01',
        studyId: 'study-leuk-01',
        title: 'Blood Sampling Frequency Discrepancy (4 vs 3 draws)',
        description:
          'Protocol p. 20 specifies 4 venous blood samples during the induction phase. PI Dr. De Moerloose marked 3 draws in the English draft to conform with local central venous access protocols. Dutch and French parent templates must be synchronized.',
        factKey: 'blood_draws',
        severity: 'high',
        affectedDocs: [
          { audience: 'parent', language: 'EN' },
          { audience: 'parent', language: 'NL' },
          { audience: 'parent', language: 'FR' },
          { audience: 'adolescent', language: 'EN' },
        ],
        sourceEvidence: 'Sponsor Protocol p.20 vs Word Redline by Dr. De Moerloose',
        discrepancyNote: 'Requires PI sign-off before propagating amendment to NL/FR translations.',
        status: 'open',
        issueType: 'clinical_discrepancy',
      },
      {
        id: 'iss-02',
        studyId: 'study-leuk-01',
        title: 'Missing Insurance Certificate for Saint-Luc Hospital Site',
        description:
          'Local annex for Cliniques universitaires Saint-Luc does not have the mandatory policy addendum required under Article 29 of the Belgian Law of 7 May 2004.',
        factKey: 'site_insurance',
        severity: 'high',
        affectedDocs: [
          { audience: 'parent', language: 'FR' },
          { audience: 'adult', language: 'FR' },
        ],
        sourceEvidence: 'Site Information Dossier (Saint-Luc)',
        discrepancyNote: 'Site coordinator Dr. Marc Henrion contacted on 2026-10-27.',
        status: 'open',
        issueType: 'site_compliance',
      },
    ],
    createdDate: '2024-05-10',
    lastUpdated: '2026-10-28',
    readyDocumentsCount: 4,
    totalDocumentsCount: 12,
    completionPercentage: 33,
    cloudBucket: OFFICIAL_GCS_BUCKETS[0],
    bucketFiles: MOCK_BUCKET_FILES_LEUK_01,
  },
  {
    id: 'study-neuro-03',
    code: 'BSPHO-2024-NEURO-03',
    title: 'SIOP-E High-Risk Medulloblastoma & Neuroblastoma Adaptive Trial',
    shortTitle: 'SIOP-E Medulloblastoma Trial',
    sponsor: 'SIOP Europe Brain Tumour Group',
    studyType: 'Phase I/II Paediatric Trial',
    phase: 'Phase II Adaptive Cohort',
    responsiblePI: 'Dr. Joris Verlooy',
    leadSite: 'UZ Antwerpen',
    assignedCoordinator: 'Elena Vanderberghe',
    participatingSites: [
      {
        id: 'site-uza',
        name: 'UZ Antwerpen',
        city: 'Edegem / Antwerpen',
        country: 'Belgium',
        localCoordinator: 'Dr. Joris Verlooy',
        ethicsCommitteeApprovalDate: '2024-08-11',
        insurancePolicyId: 'BEL-NEURO-2024-001',
      },
      {
        id: 'site-uzl-2',
        name: 'UZ Leuven',
        city: 'Leuven',
        country: 'Belgium',
        localCoordinator: 'Prof. Dr. Sandra Jacobs',
        ethicsCommitteeApprovalDate: '2024-08-15',
        insurancePolicyId: 'BEL-NEURO-2024-001',
      },
    ],
    currentWorkflowStage: 'draft_generation',
    currentStepIndex: 4,
    templateVersion: 'BSPHO ICF Template v2.4 (2024)',
    customTemplate: createCustomTemplateConfig(
      'HIRUZ Observational (Insurance Excluded)',
      'HIRUZ Paediatric Observational Template',
      {
        excludeInsurance: true,
        rationale: 'Non-interventional protocol: Art. 29 no-fault insurance waived per Belgian FAMHP guidance.',
      }
    ),
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    documents: generate12Documents('study-neuro-03', 'BSPHO ICF Template v2.4 (2024)'),
    facts: [
      {
        id: 'fact-n1',
        studyId: 'study-neuro-03',
        key: 'study_duration',
        label: 'Study Duration',
        value: '18 months active therapy + 5 years survivorship',
        sourceDoc: 'SIOP-E Medulloblastoma Protocol v2.1, Section 3.1',
        sourcePage: 9,
        confidence: 0.95,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent', 'adolescent', 'child'],
      },
      {
        id: 'fact-n2',
        studyId: 'study-neuro-03',
        key: 'imaging_schedule',
        label: 'MRI Surveillance Schedule',
        value: 'Baseline + every 3 months during active therapy',
        sourceDoc: 'SIOP-E Medulloblastoma Protocol v2.1, Section 5.4',
        sourcePage: 22,
        confidence: 0.91,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent', 'adolescent'],
      },
      {
        id: 'fact-n3',
        studyId: 'study-neuro-03',
        key: 'insurance_waiver',
        label: 'No-Fault Insurance Status',
        value: 'Waived — observational / non-interventional FAMHP guidance',
        sourceDoc: 'HIRUZ Observational Template policy note',
        sourcePage: 1,
        confidence: 0.88,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent'],
      },
    ],
    issues: [],
    createdDate: '2024-07-22',
    lastUpdated: '2026-10-25',
    readyDocumentsCount: 0,
    totalDocumentsCount: 12,
    completionPercentage: 15,
    cloudBucket: {
      ...OFFICIAL_GCS_BUCKETS[1],
      bucketUri: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/',
      lastSyncedAt: '2026-10-25 09:10 CET',
      totalObjects: 4,
      totalSizeMb: 18.0,
    },
    bucketFiles: MOCK_BUCKET_FILES_NEURO_03,
  },
  {
    id: 'study-sarcoma-08',
    code: 'BSPHO-2023-SARCOMA-08',
    title: 'Euro-Ewing Paediatric & Adolescent Rhabdomyosarcoma Protocol',
    shortTitle: 'Euro-Ewing Sarcoma Trial',
    sponsor: 'Euro-Ewing Consortium / BSPHO Sarcoma Committee',
    studyType: 'Interventional',
    phase: 'Phase III',
    responsiblePI: 'Prof. Dr. Pierre Philippet',
    leadSite: 'CHC MontLégia Liège',
    assignedCoordinator: 'Dr. Marc Henrion',
    participatingSites: [
      {
        id: 'site-chc',
        name: 'CHC MontLégia Liège',
        city: 'Liège',
        country: 'Belgium',
        localCoordinator: 'Prof. Dr. Pierre Philippet',
        ethicsCommitteeApprovalDate: '2023-11-04',
        insurancePolicyId: 'EUR-SAR-2023-441',
      },
      {
        id: 'site-hud-2',
        name: 'HUDERF Brussels',
        city: 'Brussels',
        country: 'Belgium',
        localCoordinator: 'Dr. Laurence Dedeken',
        ethicsCommitteeApprovalDate: '2023-11-12',
        insurancePolicyId: 'EUR-SAR-2023-441',
      },
    ],
    currentWorkflowStage: 'finalize_export',
    currentStepIndex: 8,
    templateVersion: 'BSPHO ICF Template v2.3 (2023)',
    customTemplate: createCustomTemplateConfig(
      'BSPHO Interventional v2.3 (Sarcoma archive)',
      'BSPHO ICF Template v2.3 (2023)'
    ),
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    documents: generate12Documents('study-sarcoma-08', 'BSPHO ICF Template v2.3 (2023)'),
    facts: [
      {
        id: 'fact-s1',
        studyId: 'study-sarcoma-08',
        key: 'study_duration',
        label: 'Total Study Duration',
        value: '12 months induction/consolidation + 24 months follow-up',
        sourceDoc: 'Euro-Ewing Protocol v3.0, Section 4.1',
        sourcePage: 16,
        confidence: 0.97,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent', 'adolescent', 'child'],
      },
      {
        id: 'fact-s2',
        studyId: 'study-sarcoma-08',
        key: 'investigational_agent',
        label: 'Investigational Intervention',
        value: 'Standard multi-agent chemo ± radiotherapy per risk stratum',
        sourceDoc: 'Euro-Ewing Protocol v3.0, Section 6.0',
        sourcePage: 28,
        confidence: 0.96,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent', 'adolescent'],
      },
      {
        id: 'fact-s3',
        studyId: 'study-sarcoma-08',
        key: 'site_insurance',
        label: 'Belgian Clinical Trial No-Fault Insurance',
        value: 'Policy EUR-SAR-2023-441 (both participating sites)',
        sourceDoc: 'HUDERF / CHC insurance certificates',
        sourcePage: 1,
        confidence: 0.99,
        status: 'confirmed',
        affectedAudiences: ['adult', 'parent'],
      },
    ],
    issues: [
      {
        id: 'iss-s01',
        studyId: 'study-sarcoma-08',
        title: 'Radiotherapy optional wording — resolved for export',
        description:
          'Earlier NL parent draft omitted optional radiotherapy language present in EN. Corrected and re-exported in v2.0 package.',
        factKey: 'investigational_agent',
        severity: 'medium',
        affectedDocs: [
          { audience: 'parent', language: 'NL' },
          { audience: 'parent', language: 'FR' },
        ],
        sourceEvidence: 'Euro-Ewing Protocol v3.0 §6.0 vs PI-approved package v2.0',
        discrepancyNote: 'Resolved prior to finalize/export — retained for audit trail.',
        status: 'resolved',
        issueType: 'translation_inconsistency',
        resolution: {
          decision: 'propagate_selected_value',
          selectedValue: 'Include optional radiotherapy wording in NL/FR',
          rationale: 'Align all languages with protocol §6.0 before ethics package export.',
          reviewerName: 'Dr. Marc Henrion',
          reviewerRole: 'Study Coordinator',
          decidedAt: '2026-10-15T10:00:00.000Z',
          demoSessionOnly: true,
        },
      },
    ],
    createdDate: '2023-09-15',
    lastUpdated: '2026-10-27',
    readyDocumentsCount: 12,
    totalDocumentsCount: 12,
    completionPercentage: 100,
    cloudBucket: {
      ...OFFICIAL_GCS_BUCKETS[1],
      bucketUri: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/',
      lastSyncedAt: '2026-10-27 08:45 CET',
      totalObjects: 5,
      totalSizeMb: 17.4,
    },
    bucketFiles: MOCK_BUCKET_FILES_SARCOMA_08,
  },
];

export const MOCK_ACTION_ITEMS: ActionItem[] = [
  {
    id: 'act-01',
    studyId: 'study-leuk-01',
    studyName: 'BSPHO-2024-LEUK-01 (ALL-Together1)',
    title: 'Missing site insurance rider for Saint-Luc Hospital',
    description:
      'Required by Belgian Law of 7 May 2004 Article 29 before ethical dossier submission. French ICF variants currently lack local insurer reference.',
    type: 'missing_info',
    priority: 'critical',
    targetAudience: 'parent',
    targetLanguage: 'FR',
    createdDate: '2026-10-27',
  },
  {
    id: 'act-02',
    studyId: 'study-leuk-01',
    studyName: 'BSPHO-2024-LEUK-01 (ALL-Together1)',
    title: 'PI-edited English document awaiting NL/FR translation',
    description:
      'Prof. Dr. De Moerloose uploaded redline revisions for Parent (EN) Section 4.2. Ready for constrained translation into Dutch and French templates.',
    type: 'pi_review',
    priority: 'high',
    targetAudience: 'parent',
    targetLanguage: 'EN',
    createdDate: '2026-10-28',
  },
  {
    id: 'act-03',
    studyId: 'study-leuk-01',
    studyName: 'BSPHO-2024-LEUK-01 (ALL-Together1)',
    title: 'Discrepancy: Blood sampling count between protocol & draft',
    description:
      'Sponsor Protocol Section 6.2 states 4 venous blood draws; Investigator revision specifies 3 draws. Discrepancy impact flagged for 4 documents.',
    type: 'discrepancy',
    priority: 'high',
    createdDate: '2026-10-28',
  },
  {
    id: 'act-04',
    studyId: 'study-sarcoma-08',
    studyName: 'BSPHO-2023-SARCOMA-08 (Euro-Ewing)',
    title: 'BSPHO Template v2.4 migration available for approval',
    description:
      'New national template release v2.4 includes updated GDPR clause and paediatric assent layout. 12 documents eligible for automated migration review.',
    type: 'template_update',
    priority: 'medium',
    createdDate: '2026-10-24',
  },
];
