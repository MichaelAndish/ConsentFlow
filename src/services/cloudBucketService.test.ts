import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBucketUri,
  getStudyCloudBucket,
  syncCloudBucketContentFlow,
  OFFICIAL_GCS_BUCKETS,
  MOCK_BUCKET_FILES_LEUK_01,
} from './cloudBucketService';
import { Study } from '../types';

test('validateBucketUri validates gs:// URIs correctly', () => {
  const result = validateBucketUri('gs://bspho-trial-dossiers-belgium/protocols/leuk-01/');
  assert.equal(result.valid, true);
  assert.equal(result.bucketName, 'bspho-trial-dossiers-belgium');
  assert.equal(result.prefix, 'protocols/leuk-01/');
});

test('validateBucketUri validates https://storage.googleapis.com URIs', () => {
  const result = validateBucketUri('https://storage.googleapis.com/bspho-official-templates-v24/master/');
  assert.equal(result.valid, true);
  assert.equal(result.bucketName, 'bspho-official-templates-v24');
  assert.equal(result.prefix, 'master/');
});

test('validateBucketUri rejects invalid schemes', () => {
  const result = validateBucketUri('ftp://invalid-bucket/file');
  assert.equal(result.valid, false);
  assert.ok(result.error);
});

test('OFFICIAL_GCS_BUCKETS contains Belgian region europe-west1 buckets', () => {
  assert.ok(OFFICIAL_GCS_BUCKETS.length >= 2);
  assert.ok(OFFICIAL_GCS_BUCKETS[0].region.includes('europe-west1'));
  assert.ok(OFFICIAL_GCS_BUCKETS[0].bucketUri.startsWith('gs://'));
});

test('syncCloudBucketContentFlow executes and returns stream logs with valid study update', () => {
  const mockStudy: Study = {
    id: 's1',
    code: 'BSPHO-2024-LEUK-01',
    title: 'Test Study',
    shortTitle: 'Test',
    sponsor: 'BSPHO',
    studyType: 'Phase I/II Paediatric Trial',
    phase: 'Phase III',
    responsiblePI: 'Dr. Test',
    leadSite: 'UZ Gent',
    assignedCoordinator: 'Dr. Sophie Laurent',
    participatingSites: [],
    currentWorkflowStage: 'input_setup',
    currentStepIndex: 1,
    templateVersion: 'v2.4',
    targetAudiences: ['adult', 'parent', 'adolescent', 'child'],
    targetLanguages: ['EN', 'NL', 'FR'],
    documents: [],
    facts: [],
    issues: [],
    createdDate: '2026-10-29',
    lastUpdated: '2026-10-28',
    readyDocumentsCount: 0,
    totalDocumentsCount: 0,
    completionPercentage: 0,
  };

  const { syncedStudy, logs } = syncCloudBucketContentFlow(mockStudy);
  assert.ok(logs.length >= 5);
  assert.equal(syncedStudy.cloudBucket?.isConnected, false);
  assert.ok(logs.some((l) => /demo|synthetic|not run/i.test(l)));
  assert.ok(syncedStudy.bucketFiles && syncedStudy.bucketFiles.length > 0);
});
