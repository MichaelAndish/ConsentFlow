import { fileURLToPath } from 'url';
import path from 'path';
import { query, initSchema, checkDatabaseHealth } from './connection';
import { INITIAL_STUDIES, MOCK_ACTION_ITEMS } from '../data/mockData';
import { DEFAULT_TEMPLATE_SECTIONS, createCustomTemplateConfig } from '../utils/studyLogic';

export async function runSeeder(): Promise<{
  studiesInserted: number;
  documentsInserted: number;
  factsInserted: number;
  issuesInserted: number;
  sitesInserted: number;
  actionsInserted: number;
  skippedCount: number;
}> {
  console.log('[Seeder] Starting idempotent database seed...');

  // 1. Verify schema
  await initSchema();

  let studiesInserted = 0;
  let documentsInserted = 0;
  let factsInserted = 0;
  let issuesInserted = 0;
  let sitesInserted = 0;
  let actionsInserted = 0;
  let skippedCount = 0;

  // 2. Seed Studies and related entities
  for (const study of INITIAL_STUDIES) {
    // Check if study already exists
    const checkStudy = await query('SELECT id FROM studies WHERE id = $1', [study.id]);

    if (checkStudy.rows.length === 0) {
      await query(
        `INSERT INTO studies (
          id, code, title, short_title, sponsor, study_type, phase,
          responsible_pi, lead_site, assigned_coordinator, current_workflow_stage, current_step_index,
          template_version, custom_template, target_audiences, target_languages,
          ready_documents_count, total_documents_count, completion_percentage,
          cloud_bucket, bucket_files, created_date, last_updated
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19,
          $20, $21, $22, $23
        ) ON CONFLICT (id) DO NOTHING`,
        [
          study.id,
          study.code,
          study.title,
          study.shortTitle,
          study.sponsor,
          study.studyType,
          study.phase,
          study.responsiblePI,
          study.leadSite,
          study.assignedCoordinator,
          study.currentWorkflowStage,
          study.currentStepIndex,
          study.templateVersion,
          JSON.stringify(study.customTemplate || null),
          JSON.stringify(study.targetAudiences),
          JSON.stringify(study.targetLanguages),
          study.readyDocumentsCount,
          study.totalDocumentsCount,
          study.completionPercentage,
          JSON.stringify(study.cloudBucket || null),
          JSON.stringify(study.bucketFiles || null),
          study.createdDate,
          study.lastUpdated,
        ]
      );
      studiesInserted++;
    } else {
      // Keep existing rows in sync with mock seed fields that were added later
      await query(
        `UPDATE studies
         SET assigned_coordinator = $1,
             ready_documents_count = $2,
             completion_percentage = $3,
             current_workflow_stage = $4,
             current_step_index = $5,
             custom_template = $6,
             cloud_bucket = $7,
             bucket_files = $8,
             last_updated = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10`,
        [
          study.assignedCoordinator,
          study.readyDocumentsCount,
          study.completionPercentage,
          study.currentWorkflowStage,
          study.currentStepIndex,
          JSON.stringify(study.customTemplate || null),
          JSON.stringify(study.cloudBucket || null),
          JSON.stringify(study.bucketFiles || null),
          study.lastUpdated,
          study.id,
        ]
      );
      skippedCount++;
    }

    // Seed Study Sites
    for (const site of study.participatingSites) {
      const checkSite = await query('SELECT id FROM study_sites WHERE id = $1', [site.id]);
      if (checkSite.rows.length === 0) {
        await query(
          `INSERT INTO study_sites (
            id, study_id, name, city, country, local_coordinator,
            ethics_committee_approval_date, insurance_policy_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING`,
          [
            site.id,
            study.id,
            site.name,
            site.city,
            site.country || 'Belgium',
            site.localCoordinator,
            site.ethicsCommitteeApprovalDate || null,
            site.insurancePolicyId || null,
          ]
        );
        sitesInserted++;
      }
    }

    // Seed Study Facts
    for (const fact of study.facts) {
      const checkFact = await query('SELECT id FROM study_facts WHERE id = $1', [fact.id]);
      if (checkFact.rows.length === 0) {
        await query(
          `INSERT INTO study_facts (
            id, study_id, key, label, value, conflict_value,
            source_doc, source_page, confidence, status, affected_audiences
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO NOTHING`,
          [
            fact.id,
            study.id,
            fact.key,
            fact.label,
            fact.value,
            fact.conflictValue || null,
            fact.sourceDoc,
            fact.sourcePage || null,
            fact.confidence,
            fact.status,
            JSON.stringify(fact.affectedAudiences),
          ]
        );
        factsInserted++;
      } else {
        await query(
          `UPDATE study_facts
           SET label = $1,
               value = $2,
               conflict_value = $3,
               source_doc = $4,
               source_page = $5,
               confidence = $6,
               status = $7,
               affected_audiences = $8
           WHERE id = $9`,
          [
            fact.label,
            fact.value,
            fact.conflictValue || null,
            fact.sourceDoc,
            fact.sourcePage || null,
            fact.confidence,
            fact.status,
            JSON.stringify(fact.affectedAudiences),
            fact.id,
          ]
        );
      }
    }

    // Seed Consistency Issues
    for (const issue of study.issues) {
      const checkIssue = await query('SELECT id FROM consistency_issues WHERE id = $1', [issue.id]);
      if (checkIssue.rows.length === 0) {
        await query(
          `INSERT INTO consistency_issues (
            id, study_id, title, description, fact_key,
            severity, issue_type, affected_docs, source_evidence, discrepancy_note, status, resolution
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (id) DO NOTHING`,
          [
            issue.id,
            study.id,
            issue.title,
            issue.description,
            issue.factKey,
            issue.severity,
            issue.issueType || null,
            JSON.stringify(issue.affectedDocs),
            issue.sourceEvidence,
            issue.discrepancyNote,
            issue.status,
            issue.resolution ? JSON.stringify(issue.resolution) : null,
          ]
        );
        issuesInserted++;
      } else {
        await query(
          `UPDATE consistency_issues
           SET issue_type = COALESCE($1, issue_type),
               severity = $2,
               status = $3,
               affected_docs = $4,
               source_evidence = $5,
               discrepancy_note = $6
           WHERE id = $7`,
          [
            issue.issueType || null,
            issue.severity,
            issue.status,
            JSON.stringify(issue.affectedDocs),
            issue.sourceEvidence,
            issue.discrepancyNote,
            issue.id,
          ]
        );
      }
    }

    // Seed 12-Document Matrix
    for (const doc of study.documents) {
      const checkDoc = await query('SELECT id FROM icf_documents WHERE id = $1', [doc.id]);
      if (checkDoc.rows.length === 0) {
        await query(
          `INSERT INTO icf_documents (
            id, study_id, audience, language, title, version,
            status, issue_count, word_count, last_updated, updated_by,
            template_version, blocks
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          ON CONFLICT (id) DO NOTHING`,
          [
            doc.id,
            study.id,
            doc.audience,
            doc.language,
            doc.title,
            doc.version,
            doc.status,
            doc.issueCount,
            doc.wordCount,
            doc.lastUpdated,
            doc.updatedBy,
            doc.templateVersion,
            JSON.stringify(doc.blocks || []),
          ]
        );
        documentsInserted++;
      } else {
        await query(
          `UPDATE icf_documents
           SET status = $1,
               issue_count = $2,
               version = $3,
               word_count = $4,
               last_updated = $5,
               updated_by = $6,
               template_version = $7,
               blocks = $8,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $9`,
          [
            doc.status,
            doc.issueCount,
            doc.version,
            doc.wordCount,
            doc.lastUpdated,
            doc.updatedBy,
            doc.templateVersion,
            JSON.stringify(doc.blocks || []),
            doc.id,
          ]
        );
      }
    }
  }

  // 3. Seed Action Items
  for (const item of MOCK_ACTION_ITEMS) {
    const checkAction = await query('SELECT id FROM action_items WHERE id = $1', [item.id]);
    if (checkAction.rows.length === 0) {
      await query(
        `INSERT INTO action_items (
          id, study_id, study_name, title, description, type,
          priority, target_audience, target_language, created_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (id) DO NOTHING`,
        [
          item.id,
          item.studyId,
          item.studyName,
          item.title,
          item.description,
          item.type,
          item.priority,
          item.targetAudience || null,
          item.targetLanguage || null,
          item.createdDate,
        ]
      );
      actionsInserted++;
    }
  }

  // 4. Seed Standard & Modular Custom Templates
  const standardTemplates = [
    createCustomTemplateConfig(
      'BSPHO Paediatric Interventional v2.4 (Standard)',
      'BSPHO ICF Template v2.4 (2024)',
      {
        id: 'tmpl-bspho-interventional-v24',
        excludeInsurance: false,
        excludeContraception: false,
        excludeBiobanking: false,
      }
    ),
    createCustomTemplateConfig(
      'HIRUZ Observational (Insurance Excluded)',
      'HIRUZ Paediatric Observational Template',
      {
        id: 'tmpl-hiruz-observational',
        excludeInsurance: true,
        excludeContraception: true,
        rationale: 'Article 29 no-fault insurance waived per Belgian Law & FAMHP non-interventional guidance.',
      }
    ),
  ];

  for (const tmpl of standardTemplates) {
    const checkTmpl = await query('SELECT id FROM custom_templates WHERE id = $1', [tmpl.id]);
    if (checkTmpl.rows.length === 0) {
      await query(
        `INSERT INTO custom_templates (
          id, name, base_template, exclude_insurance, exclude_contraception,
          exclude_biobanking, sections, rationale, last_modified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO NOTHING`,
        [
          tmpl.id,
          tmpl.name,
          tmpl.baseTemplate,
          tmpl.excludeInsurance,
          tmpl.excludeContraception,
          tmpl.excludeBiobanking,
          JSON.stringify(tmpl.sections),
          tmpl.rationale,
          tmpl.lastModified || '2026-10-29',
        ]
      );
    }
  }

  console.log(`[Seeder Complete]
  - Studies inserted : ${studiesInserted} (${skippedCount} already existed)
  - Documents inserted: ${documentsInserted}
  - Facts inserted   : ${factsInserted}
  - Issues inserted  : ${issuesInserted}
  - Sites inserted   : ${sitesInserted}
  - Actions inserted : ${actionsInserted}
  - No duplicate records created.`);

  return {
    studiesInserted,
    documentsInserted,
    factsInserted,
    issuesInserted,
    sitesInserted,
    actionsInserted,
    skippedCount,
  };
}

// Direct execution CLI entrypoint (only when this file is run via `tsx src/db/seed.ts`)
// Guard filename so a bundled server.js that imports this module never process.exit().
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const thisFilePath = fileURLToPath(import.meta.url);
const isSeedCli =
  Boolean(invokedPath) &&
  invokedPath === thisFilePath &&
  /(^|[/\\])seed\.(ts|js|mjs|cjs)$/.test(invokedPath);

if (isSeedCli) {
  (async () => {
    try {
      const health = await checkDatabaseHealth();
      if (!health.ok) {
        console.error(`[DB Error] ${health.message}`);
        process.exit(1);
      }
      console.log(`[DB Connected] ${health.message}`);
      await runSeeder();
      process.exit(0);
    } catch (err: any) {
      console.error('[Seeder Failed]', err);
      process.exit(1);
    }
  })();
}
