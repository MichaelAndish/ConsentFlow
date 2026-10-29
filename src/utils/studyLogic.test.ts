import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AUDIENCE_CONFIG,
  LANGUAGE_CONFIG,
  WORKFLOW_STEPS,
  getStepStatus,
  getDocumentStatusMeta,
  computeStudyStats,
  findDocumentInMatrix,
  computeDocumentProgress,
  countOpenIssues,
  countPendingPropagationIssues,
  hasBlockingIssues,
} from './studyLogic';
import { ICFDocument } from '../types';

test('AUDIENCE_CONFIG includes all four required paediatric research audiences', () => {
  assert.ok(AUDIENCE_CONFIG.adult);
  assert.ok(AUDIENCE_CONFIG.parent);
  assert.ok(AUDIENCE_CONFIG.adolescent);
  assert.ok(AUDIENCE_CONFIG.child);
  assert.equal(AUDIENCE_CONFIG.child.ageRange, '8 – 11 years');
  assert.equal(AUDIENCE_CONFIG.adolescent.ageRange, '12 – 17 years');
});

test('LANGUAGE_CONFIG includes English master, Dutch, and French', () => {
  assert.equal(LANGUAGE_CONFIG.EN.name, 'English');
  assert.equal(LANGUAGE_CONFIG.NL.name, 'Dutch');
  assert.equal(LANGUAGE_CONFIG.FR.name, 'French');
});

test('WORKFLOW_STEPS contains all 8 defined phases', () => {
  assert.equal(WORKFLOW_STEPS.length, 8);
  assert.equal(WORKFLOW_STEPS[0].stage, 'input_setup');
  assert.equal(WORKFLOW_STEPS[7].stage, 'finalize_export');
});

test('getStepStatus calculates correct progress lifecycle states', () => {
  assert.equal(getStepStatus(3, 1), 'completed');
  assert.equal(getStepStatus(3, 2), 'completed');
  assert.equal(getStepStatus(3, 3), 'in_progress');
  assert.equal(getStepStatus(3, 4), 'not_started');
});

test('computeStudyStats calculates ready counts, issues, and percentage correctly', () => {
  const mockDocs: ICFDocument[] = [
    {
      id: 'doc-1',
      studyId: 's1',
      audience: 'adult',
      language: 'EN',
      title: 'Adult EN',
      version: 'v1.0',
      status: 'approved',
      issueCount: 0,
      wordCount: 3500,
      lastUpdated: '2026-10-28',
      updatedBy: 'Dr. Laurent',
      templateVersion: 'v2.4',
    },
    {
      id: 'doc-2',
      studyId: 's1',
      audience: 'parent',
      language: 'EN',
      title: 'Parent EN',
      version: 'v1.1',
      status: 'awaiting_pi_review',
      issueCount: 2,
      wordCount: 4200,
      lastUpdated: '2026-10-28',
      updatedBy: 'System',
      templateVersion: 'v2.4',
    },
    {
      id: 'doc-3',
      studyId: 's1',
      audience: 'child',
      language: 'NL',
      title: 'Child NL',
      version: 'v0.9',
      status: 'ready_to_translate',
      issueCount: 1,
      wordCount: 1200,
      lastUpdated: '2026-10-27',
      updatedBy: 'System',
      templateVersion: 'v2.4',
    },
    {
      id: 'doc-4',
      studyId: 's1',
      audience: 'adolescent',
      language: 'FR',
      title: 'Adolescent FR',
      version: 'v1.0',
      status: 'exported',
      issueCount: 0,
      wordCount: 2800,
      lastUpdated: '2026-10-28',
      updatedBy: 'Dr. Laurent',
      templateVersion: 'v2.4',
    },
  ];

  const stats = computeStudyStats(mockDocs);
  assert.equal(stats.total, 4);
  assert.equal(stats.ready, 2); // doc-1 (approved) + doc-4 (exported)
  assert.equal(stats.pendingReview, 1);
  assert.equal(stats.needsTranslation, 1);
  assert.equal(stats.totalIssues, 3);
  assert.equal(stats.completionPercent, 50);
});

test('findDocumentInMatrix locates specific audience and language document', () => {
  const mockDocs: ICFDocument[] = [
    {
      id: 'doc-child-nl',
      studyId: 's1',
      audience: 'child',
      language: 'NL',
      title: 'Kind Informatie- en Toestemmingsformulier',
      version: 'v1.0',
      status: 'translating',
      issueCount: 1,
      wordCount: 1400,
      lastUpdated: '2026-10-28',
      updatedBy: 'System',
      templateVersion: 'v2.4',
    },
  ];

  const found = findDocumentInMatrix(mockDocs, 'child', 'NL');
  assert.ok(found);
  assert.equal(found?.id, 'doc-child-nl');

  const notFound = findDocumentInMatrix(mockDocs, 'adult', 'FR');
  assert.equal(notFound, undefined);
});

test('computeDocumentProgress separates generated, reviewed, approved, exported', () => {
  const docs: ICFDocument[] = [
    {
      id: 'a',
      studyId: 's1',
      audience: 'adult',
      language: 'EN',
      title: 'A',
      version: 'v1',
      status: 'not_started',
      issueCount: 0,
      wordCount: 1,
      lastUpdated: '2026-10-29',
      updatedBy: 'System',
      templateVersion: 'v2.4',
    },
    {
      id: 'b',
      studyId: 's1',
      audience: 'parent',
      language: 'EN',
      title: 'B',
      version: 'v1',
      status: 'draft_generated',
      issueCount: 0,
      wordCount: 1,
      lastUpdated: '2026-10-29',
      updatedBy: 'System',
      templateVersion: 'v2.4',
    },
    {
      id: 'c',
      studyId: 's1',
      audience: 'child',
      language: 'EN',
      title: 'C',
      version: 'v1',
      status: 'awaiting_pi_review',
      issueCount: 0,
      wordCount: 1,
      lastUpdated: '2026-10-29',
      updatedBy: 'System',
      templateVersion: 'v2.4',
    },
    {
      id: 'd',
      studyId: 's1',
      audience: 'adolescent',
      language: 'EN',
      title: 'D',
      version: 'v1',
      status: 'exported',
      issueCount: 0,
      wordCount: 1,
      lastUpdated: '2026-10-29',
      updatedBy: 'System',
      templateVersion: 'v2.4',
    },
  ];
  const p = computeDocumentProgress(docs);
  assert.equal(p.total, 4);
  assert.equal(p.generated, 3);
  assert.equal(p.awaitingPiReview, 1);
  assert.equal(p.approvedForSubmission, 1);
  assert.equal(p.exported, 1);
});

test('countOpenIssues excludes pending_propagation and resolved (CF-008)', () => {
  const issues = [
    { status: 'open' },
    { status: 'pending_propagation' },
    { status: 'resolved' },
    { status: 'reopened' },
  ];
  assert.equal(countOpenIssues(issues), 2);
  assert.equal(countPendingPropagationIssues(issues), 1);
});

test('hasBlockingIssues treats pending_propagation high severity as blocking (CF-029)', () => {
  assert.equal(
    hasBlockingIssues([{ status: 'pending_propagation', severity: 'high' }]),
    true
  );
  assert.equal(hasBlockingIssues([{ status: 'resolved', severity: 'high' }]), false);
  assert.equal(hasBlockingIssues([{ status: 'open', severity: 'low' }]), false);
});
