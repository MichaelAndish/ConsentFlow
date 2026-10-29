import {
  CloudBucketConfig,
  BucketDocumentItem,
  Study,
  StudyFact,
  ICFDocument,
  ConsistencyIssue,
} from '../types';

/** Sample URI presets for the demo UI — not live GCS connections or compliance certificates */
export const OFFICIAL_GCS_BUCKETS: CloudBucketConfig[] = [
  {
    bucketName: 'use-cases-qwiklabs-gcp-01-d64f5abfabdc',
    bucketUri: 'gs://use-cases-qwiklabs-gcp-01-d64f5abfabdc/',
    region: 'europe-west1 (Belgium)',
    storageClass: 'STANDARD',
    encryption: 'Demo label',
    compliance: 'Demo sample URI — live IAM not verified',
    isConnected: false,
    lastSyncedAt: '—',
    totalObjects: 24,
    totalSizeMb: 186.4,
  },
  {
    bucketName: 'bspho-trial-dossiers-belgium',
    bucketUri: 'gs://bspho-trial-dossiers-belgium/protocols/',
    region: 'europe-west1 (Brussels, Belgium)',
    storageClass: 'STANDARD',
    encryption: 'Demo label',
    compliance: 'Demo sample URI — live IAM not verified',
    isConnected: false,
    lastSyncedAt: '—',
    totalObjects: 18,
    totalSizeMb: 142.6,
  },
  {
    bucketName: 'bspho-official-templates-v24',
    bucketUri: 'gs://bspho-official-templates-v24/master/',
    region: 'europe-west1 (Brussels, Belgium)',
    storageClass: 'STANDARD',
    encryption: 'Demo label',
    compliance: 'Demo sample URI — live IAM not verified',
    isConnected: false,
    lastSyncedAt: '—',
    totalObjects: 12,
    totalSizeMb: 48.2,
  },
  {
    bucketName: 'uz-gent-clinical-oncology-vault',
    bucketUri: 'gs://uz-gent-clinical-oncology-vault/leuk-01/',
    region: 'europe-west1 (Brussels, Belgium)',
    storageClass: 'STANDARD',
    encryption: 'Demo label',
    compliance: 'Demo sample URI — live IAM not verified',
    isConnected: false,
    lastSyncedAt: '—',
    totalObjects: 6,
    totalSizeMb: 34.1,
  },
];

export const MOCK_BUCKET_FILES_LEUK_01: BucketDocumentItem[] = [
  {
    id: 'gcs-leuk-01',
    name: 'ALL-Together1_Sponsor_Protocol_v1.4_Final.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/ALL-Together1_Sponsor_Protocol_v1.4_Final.pdf',
    category: 'protocol',
    sizeBytes: 14820120,
    sizeFormatted: '14.1 MB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-24 16:30 CET',
    checksumMd5: 'a89f3c1d94b0028e',
    etag: '"c2394a19-01"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 14,
  },
  {
    id: 'gcs-leuk-02',
    name: 'Investigator_Brochure_PEG_Asparaginase_v3.2.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/Investigator_Brochure_PEG_Asparaginase_v3.2.pdf',
    category: 'protocol',
    sizeBytes: 8912440,
    sizeFormatted: '8.5 MB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-22 10:15 CET',
    checksumMd5: 'fe14b09e3381a8c9',
    etag: '"d9817e22-03"',
    targetAudiences: ['adult', 'parent', 'adolescent'],
    targetLanguages: ['EN', 'NL', 'FR'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 6,
  },
  {
    id: 'gcs-leuk-03',
    name: 'BSPHO_ICF_Standard_Template_v2.4_Master_EN.docx',
    path: 'gs://bspho-official-templates-v24/master/BSPHO_ICF_Standard_Template_v2.4_Master_EN.docx',
    category: 'template',
    sizeBytes: 1248000,
    sizeFormatted: '1.2 MB',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    updatedAt: '2026-10-15 14:00 CET',
    checksumMd5: '71c82e0a4f5d6b81',
    etag: '"b991823a-12"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 8,
  },
  {
    id: 'gcs-leuk-04',
    name: 'BSPHO_ICF_Template_v2.4_NL_Belgie.docx',
    path: 'gs://bspho-official-templates-v24/master/BSPHO_ICF_Template_v2.4_NL_Belgie.docx',
    category: 'template',
    sizeBytes: 1290000,
    sizeFormatted: '1.2 MB',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    updatedAt: '2026-10-15 14:05 CET',
    checksumMd5: '3e8812c9b4f001aa',
    etag: '"bb02183a-14"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['NL'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 8,
  },
  {
    id: 'gcs-leuk-05',
    name: 'BSPHO_ICF_Template_v2.4_FR_Belgique.docx',
    path: 'gs://bspho-official-templates-v24/master/BSPHO_ICF_Template_v2.4_FR_Belgique.docx',
    category: 'template',
    sizeBytes: 1310000,
    sizeFormatted: '1.3 MB',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    updatedAt: '2026-10-15 14:10 CET',
    checksumMd5: '4f9923da10b332cc',
    etag: '"bc13941d-15"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['FR'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 8,
  },
  {
    id: 'gcs-leuk-06',
    name: 'PI_Redline_Dr_DeMoerloose_Word_Markup_v1.2.docx',
    path: 'gs://uz-gent-clinical-oncology-vault/leuk-01/PI_Redline_Dr_DeMoerloose_Word_Markup_v1.2.docx',
    category: 'pi_markup',
    sizeBytes: 1420000,
    sizeFormatted: '1.4 MB',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    updatedAt: '2026-10-28 14:15 CET',
    checksumMd5: '9b28a1c84f552109',
    etag: '"ef99104b-09"',
    targetAudiences: ['parent', 'adolescent'],
    targetLanguages: ['EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 3,
  },
  {
    id: 'gcs-leuk-07',
    name: 'UZ_Gent_Site_Information_Annex_1.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/sites/UZ_Gent_Site_Information_Annex_1.pdf',
    category: 'site_info',
    sizeBytes: 740000,
    sizeFormatted: '740 KB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-20 09:20 CET',
    checksumMd5: '12883da0f5bc912a',
    etag: '"aa48194c-02"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['NL', 'EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 4,
  },
  {
    id: 'gcs-leuk-08',
    name: 'Saint_Luc_Hospital_Belgian_Insurance_Rider_Pending.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/ALL-Together1/sites/Saint_Luc_Hospital_Belgian_Insurance_Rider_Pending.pdf',
    category: 'site_info',
    sizeBytes: 512000,
    sizeFormatted: '512 KB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-27 11:00 CET',
    checksumMd5: '66a12b0e98dd4311',
    etag: '"ab9012cd-08"',
    targetAudiences: ['adult', 'parent'],
    targetLanguages: ['FR'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 2,
  },
];

/** Demo source inventory for neuro study (step 4 drafts). */
export const MOCK_BUCKET_FILES_NEURO_03: BucketDocumentItem[] = [
  {
    id: 'gcs-neuro-01',
    name: 'SIOP-E_Medulloblastoma_Protocol_v2.1_Final.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/SIOP-E_Medulloblastoma_Protocol_v2.1_Final.pdf',
    category: 'protocol',
    sizeBytes: 11240000,
    sizeFormatted: '10.7 MB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-18 11:20 CET',
    checksumMd5: 'c1neuro01aabbcc',
    etag: '"neuro-01"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 9,
  },
  {
    id: 'gcs-neuro-02',
    name: 'Investigator_Brochure_Adaptive_Cohort_v1.0.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/Investigator_Brochure_Adaptive_Cohort_v1.0.pdf',
    category: 'protocol',
    sizeBytes: 6200000,
    sizeFormatted: '5.9 MB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-12 09:00 CET',
    checksumMd5: 'c1neuro02ddeeff',
    etag: '"neuro-02"',
    targetAudiences: ['adult', 'parent', 'adolescent'],
    targetLanguages: ['EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 5,
  },
  {
    id: 'gcs-neuro-03',
    name: 'HIRUZ_Observational_ICF_Template_Master_EN.docx',
    path: 'gs://bspho-official-templates-v24/master/HIRUZ_Observational_ICF_Template_Master_EN.docx',
    category: 'template',
    sizeBytes: 980000,
    sizeFormatted: '958 KB',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    updatedAt: '2026-09-30 16:00 CET',
    checksumMd5: 'c1neuro03tmpl01',
    etag: '"neuro-03"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 4,
  },
  {
    id: 'gcs-neuro-04',
    name: 'UZ_Antwerpen_Site_Information_Annex.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2024-NEURO-03/sites/UZ_Antwerpen_Site_Information_Annex.pdf',
    category: 'site_info',
    sizeBytes: 410000,
    sizeFormatted: '400 KB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-08 14:40 CET',
    checksumMd5: 'c1neuro04site01',
    etag: '"neuro-04"',
    targetAudiences: ['adult', 'parent'],
    targetLanguages: ['NL', 'EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 3,
  },
];

/** Demo source inventory for sarcoma study (step 8 export-complete). */
export const MOCK_BUCKET_FILES_SARCOMA_08: BucketDocumentItem[] = [
  {
    id: 'gcs-sarc-01',
    name: 'Euro-Ewing_Rhabdomyosarcoma_Protocol_v3.0_Final.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/Euro-Ewing_Rhabdomyosarcoma_Protocol_v3.0_Final.pdf',
    category: 'protocol',
    sizeBytes: 13400000,
    sizeFormatted: '12.8 MB',
    contentType: 'application/pdf',
    updatedAt: '2026-09-01 10:00 CET',
    checksumMd5: 'c1sarc01proto',
    etag: '"sarc-01"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 11,
  },
  {
    id: 'gcs-sarc-02',
    name: 'BSPHO_ICF_Standard_Template_v2.3_Master_EN.docx',
    path: 'gs://bspho-official-templates-v24/master/BSPHO_ICF_Standard_Template_v2.3_Master_EN.docx',
    category: 'template',
    sizeBytes: 1180000,
    sizeFormatted: '1.1 MB',
    contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    updatedAt: '2023-10-01 12:00 CET',
    checksumMd5: 'c1sarc02tmpl',
    etag: '"sarc-02"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 7,
  },
  {
    id: 'gcs-sarc-03',
    name: 'PI_Approved_Package_Philippet_Signoff_v2.0.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/PI_Approved_Package_Philippet_Signoff_v2.0.pdf',
    category: 'pi_markup',
    sizeBytes: 2200000,
    sizeFormatted: '2.1 MB',
    contentType: 'application/pdf',
    updatedAt: '2026-10-20 15:30 CET',
    checksumMd5: 'c1sarc03pi',
    etag: '"sarc-03"',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 2,
  },
  {
    id: 'gcs-sarc-04',
    name: 'CHC_MontLegia_Ethics_Dossier_Annex.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/sites/CHC_MontLegia_Ethics_Dossier_Annex.pdf',
    category: 'ethics_dossier',
    sizeBytes: 890000,
    sizeFormatted: '869 KB',
    contentType: 'application/pdf',
    updatedAt: '2023-11-04 09:15 CET',
    checksumMd5: 'c1sarc04eth',
    etag: '"sarc-04"',
    targetAudiences: ['adult', 'parent'],
    targetLanguages: ['FR', 'EN'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 4,
  },
  {
    id: 'gcs-sarc-05',
    name: 'HUDERF_Site_Insurance_Certificate_EUR-SAR-2023-441.pdf',
    path: 'gs://bspho-trial-dossiers-belgium/protocols/BSPHO-2023-SARCOMA-08/sites/HUDERF_Site_Insurance_Certificate_EUR-SAR-2023-441.pdf',
    category: 'site_info',
    sizeBytes: 540000,
    sizeFormatted: '527 KB',
    contentType: 'application/pdf',
    updatedAt: '2023-11-12 11:00 CET',
    checksumMd5: 'c1sarc05ins',
    etag: '"sarc-05"',
    targetAudiences: ['adult', 'parent'],
    targetLanguages: ['FR', 'NL'],
    ingestionStatus: 'ingested',
    extractedFactsCount: 2,
  },
];

/**
 * Validates Google Cloud Storage URI
 */
export function validateBucketUri(uri: string): {
  valid: boolean;
  bucketName: string;
  prefix: string;
  error?: string;
} {
  const trimmed = uri.trim();
  if (!trimmed) {
    return { valid: false, bucketName: '', prefix: '', error: 'Bucket URI cannot be empty.' };
  }

  // Format: gs://[bucket-name]/[optional-prefix]
  const gsMatch = trimmed.match(/^gs:\/\/([a-z0-9][a-z0-9._-]{1,61}[a-z0-9])(\/.*)?$/i);
  if (gsMatch) {
    const bucketName = gsMatch[1];
    const prefix = gsMatch[2] ? gsMatch[2].replace(/^\//, '') : '';
    return { valid: true, bucketName, prefix };
  }

  // Also support https://storage.googleapis.com/[bucket-name]/
  const httpsMatch = trimmed.match(/^https:\/\/storage\.googleapis\.com\/([a-z0-9][a-z0-9._-]{1,61}[a-z0-9])(\/.*)?$/i);
  if (httpsMatch) {
    const bucketName = httpsMatch[1];
    const prefix = httpsMatch[2] ? httpsMatch[2].replace(/^\//, '') : '';
    return { valid: true, bucketName, prefix };
  }

  return {
    valid: false,
    bucketName: '',
    prefix: '',
    error: 'Invalid Google Cloud Storage URI. Must start with gs://[bucket-name]/ or https://storage.googleapis.com/[bucket-name]/',
  };
}

/** Convert gs://bucket/object to HTTPS object URL (may 403 without IAM). */
export function gsPathToHttpsUrl(gsPath: string): string | null {
  const match = gsPath.trim().match(/^gs:\/\/([^/]+)\/(.+)$/i);
  if (!match) return null;
  return `https://storage.googleapis.com/${match[1]}/${match[2]}`;
}

/** GCP console deep link for an object (always useful even when bytes are private). */
export function gsPathToConsoleUrl(gsPath: string): string | null {
  const match = gsPath.trim().match(/^gs:\/\/([^/]+)\/(.+)$/i);
  if (!match) return null;
  const bucket = match[1];
  const objectPath = match[2];
  return `https://console.cloud.google.com/storage/browser/_details/${bucket}/${objectPath}`;
}

export type SourceOpenability = 'demo_preview' | 'https_attempt' | 'unavailable';

export function getSourceOpenability(file: BucketDocumentItem): {
  status: SourceOpenability;
  httpsUrl: string | null;
  consoleUrl: string | null;
  note: string;
} {
  const httpsUrl = gsPathToHttpsUrl(file.path);
  const consoleUrl = gsPathToConsoleUrl(file.path);
  if (!httpsUrl) {
    return {
      status: 'unavailable',
      httpsUrl: null,
      consoleUrl: null,
      note: 'No openable path is registered for this source.',
    };
  }
  return {
    status: 'demo_preview',
    httpsUrl,
    consoleUrl,
    note: 'Demo seed file — preview text below is sample metadata, not verified live GCS bytes. HTTPS/console links may 403 without IAM.',
  };
}

/** Best-effort match from a fact citation string to a registered study source file. */
export function findSourceFileForCitation(
  files: BucketDocumentItem[] | undefined,
  citation: string
): BucketDocumentItem | null {
  if (!files?.length || !citation.trim()) return null;
  const q = citation.toLowerCase();
  const byName = files.find((f) => q.includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(q));
  if (byName) return byName;

  const keywords: { test: RegExp; prefer: (f: BucketDocumentItem) => boolean }[] = [
    { test: /protocol|sponsor/i, prefer: (f) => f.category === 'protocol' && /protocol/i.test(f.name) },
    { test: /investigator|brochure|ib\b/i, prefer: (f) => /brochure|investigator/i.test(f.name) },
    { test: /redline|markup|pi_|track.?change/i, prefer: (f) => f.category === 'pi_markup' },
    { test: /template|bspho/i, prefer: (f) => f.category === 'template' },
    { test: /insurance|saint.?luc|site/i, prefer: (f) => f.category === 'site_info' },
    { test: /ethics|dossier|annex/i, prefer: (f) => f.category === 'ethics_dossier' || f.category === 'site_info' },
  ];
  for (const rule of keywords) {
    if (rule.test.test(citation)) {
      const hit = files.find(rule.prefer);
      if (hit) return hit;
    }
  }
  return null;
}

/** Short honest demo excerpt for the evidence viewer (not real file contents). */
export function getDemoSourceExcerpt(file: BucketDocumentItem): { heading: string; body: string; pageHint?: string } {
  switch (file.category) {
    case 'protocol':
      if (/brochure/i.test(file.name)) {
        return {
          heading: 'Sample excerpt (demo)',
          body: 'Investigational agent: PEG-Asparaginase. Known risks summarised for paediatric ALL induction; dosing window and hypersensitivity monitoring noted in IB §3.2.',
          pageHint: 'Demo citation · not live PDF text',
        };
      }
      return {
        heading: 'Sample excerpt (demo)',
        body: 'Study duration: 24 months maintenance / ~36 months total. Blood sampling schedule in §6.2 lists four venous draws in the sponsor protocol (PI markup later revises to three).',
        pageHint: 'Demo · e.g. protocol p.20',
      };
    case 'pi_markup':
      return {
        heading: 'Sample PI markup note (demo)',
        body: '§4.2 Study Procedures — changed from 4 to 3 blood draws during induction to reflect local amended practice. Requires consistency propagation to NL/FR variants.',
        pageHint: 'Demo · investigator Word redline',
      };
    case 'template':
      return {
        heading: 'Sample template block (demo)',
        body: 'Locked Belgian legal clause (Art. 6 voluntary consent / Art. 29 no-fault insurance where applicable). Clinical placeholders remain editable; verbatim legal runs must not be machine-rewritten.',
        pageHint: 'Demo · BSPHO template policy',
      };
    case 'site_info':
      return {
        heading: 'Sample site annex (demo)',
        body: /insurance|saint.?luc|pending/i.test(file.name)
          ? 'Insurance rider status: missing local policy addendum for Saint-Luc (Article 29). Coordinator follow-up required before French ICF finalisation.'
          : 'Local site contacts, ward pager, and ethics approval dates for the participating Belgian centre.',
        pageHint: 'Demo · site annex',
      };
    default:
      return {
        heading: 'Sample metadata (demo)',
        body: 'No structured excerpt is registered for this file category in the demo seed.',
      };
  }
}

/**
 * Parses and returns cloud bucket data flow summary for a given study
 */
export function getStudyCloudBucket(study: Study): CloudBucketConfig {
  if (study.cloudBucket) {
    return study.cloudBucket;
  }
  return {
    bucketName: `bspho-${study.code.toLowerCase().replace(/[^a-z0-9]/g, '-')}-dossier`,
    bucketUri: `gs://bspho-trial-dossiers-belgium/protocols/${study.code}/`,
    region: 'europe-west1 (Brussels, Belgium)',
    storageClass: 'STANDARD',
    encryption: 'CMEK (Customer Managed)',
    compliance: 'Demo sample URI — live IAM not verified',
    isConnected: false,
    lastSyncedAt: '—',
    totalObjects: study.bucketFiles?.length || 8,
    totalSizeMb: 42.5,
  };
}

/**
 * Demo-only: refreshes in-memory sample file list. Does not call GCS or parse files.
 */
export function syncCloudBucketContentFlow(study: Study): {
  syncedStudy: Study;
  logs: string[];
} {
  const uri = study.cloudBucket?.bucketUri || 'gs://bspho-trial-dossiers-belgium/';
  const logs: string[] = [
    `Demo refresh for URI label: ${uri}`,
    'No live GCS authentication or object listing in this build.',
    'Loaded the synthetic study document list already in the app.',
    'Fact extraction, checksum verification, and template legal checks were not run.',
    'Document matrix was not regenerated.',
  ];

  const now = new Date().toISOString().replace('T', ' ').substring(0, 16) + ' CET';

  const updatedBucket: CloudBucketConfig = {
    ...(study.cloudBucket || getStudyCloudBucket(study)),
    isConnected: false,
    lastSyncedAt: `Demo refresh ${now}`,
  };

  const syncedStudy: Study = {
    ...study,
    lastUpdated: '2026-10-29',
    cloudBucket: updatedBucket,
    bucketFiles: study.bucketFiles && study.bucketFiles.length > 0 ? study.bucketFiles : MOCK_BUCKET_FILES_LEUK_01,
  };

  return { syncedStudy, logs };
}
