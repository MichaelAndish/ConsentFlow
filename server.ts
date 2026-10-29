import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { checkDatabaseHealth, isDatabaseConfigured, initSchema, query } from './src/db/connection';
import { runSeeder } from './src/db/seed';
import {
  getAllStudies,
  updateStudyWorkflow,
  updateStudyDocumentStatus,
  updateStudyCustomTemplate,
} from './src/db/studyRepository';
import { INITIAL_STUDIES, MOCK_ACTION_ITEMS } from './src/data/mockData';
import { Study, ICFDocument, CustomTemplateConfig } from './src/types';
import {
  isGeminiConfigured as isGeminiConfiguredServer,
  getGeminiModel as getGeminiModelServer,
  simplifyForAudience as simplifyForAudienceServer,
} from './src/services/geminiServer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 8080;
const HOST = '0.0.0.0';

app.use(express.json());

// In-memory persistent state (ensures 100% availability even before external DB connects)
let inMemoryStudies: Study[] = JSON.parse(JSON.stringify(INITIAL_STUDIES));

// Health check endpoint for Cloud Run & container orchestration
app.get('/_healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// API: Database connectivity and health status
app.get('/api/health', async (_req: Request, res: Response) => {
  if (!isDatabaseConfigured()) {
    return res.json({
      database: 'in-memory-ready',
      status: 'ready',
      message: 'Running with seeded in-memory state.',
    });
  }

  const health = await checkDatabaseHealth();
  res.json({
    database: 'postgresql',
    status: health.ok ? 'connected' : 'error',
    message: health.message,
    version: health.version,
  });
});

// API: Retrieve all clinical studies
app.get('/api/studies', async (_req: Request, res: Response) => {
  try {
    if (isDatabaseConfigured()) {
      const health = await checkDatabaseHealth();
      if (health.ok) {
        const studies = await getAllStudies();
        if (studies.length > 0) {
          return res.json({ source: 'database', count: studies.length, studies });
        }
        return res.json({
          source: 'database',
          count: 0,
          studies: [],
          message: 'Database connected but studies table is empty. POST /api/seed to load seed data.',
        });
      }
      console.warn('[API /api/studies] DB health check failed:', health.message);
    }
  } catch (err: any) {
    console.warn('[API /api/studies] DB read failed, falling back to seeded memory:', err.message);
  }

  return res.json({ source: 'mock_memory', count: inMemoryStudies.length, studies: inMemoryStudies });
});

// API: Action items from DB (falls back to mock)
app.get('/api/action-items', async (_req: Request, res: Response) => {
  try {
    if (isDatabaseConfigured()) {
      const health = await checkDatabaseHealth();
      if (health.ok) {
        const result = await query(
          `SELECT id, study_id, study_name, title, description, type, priority,
                  target_audience, target_language, created_date
           FROM action_items
           ORDER BY created_at DESC`
        );
        const items = result.rows.map((row) => ({
          id: row.id,
          studyId: row.study_id,
          studyName: row.study_name,
          title: row.title,
          description: row.description,
          type: row.type,
          priority: row.priority,
          targetAudience: row.target_audience || undefined,
          targetLanguage: row.target_language || undefined,
          createdDate: row.created_date,
        }));
        return res.json({ source: 'database', count: items.length, actionItems: items });
      }
    }
  } catch (err: any) {
    console.warn('[API /api/action-items] DB read failed:', err.message);
  }
  return res.json({
    source: 'mock_memory',
    count: MOCK_ACTION_ITEMS.length,
    actionItems: MOCK_ACTION_ITEMS,
  });
});

/** Optional shared secret for mutating seed endpoint (set SEED_SECRET in production). */
function isSeedAuthorized(req: Request): boolean {
  const secret = (process.env.SEED_SECRET || '').trim();
  if (!secret) return true;
  const header = String(req.get('x-seed-token') || '');
  const query = typeof req.query.token === 'string' ? req.query.token : '';
  return header === secret || query === secret;
}

// API: Gemini status (never returns the API key)
app.get('/api/gemini/status', (_req: Request, res: Response) => {
  res.json({
    configured: isGeminiConfiguredServer(),
    model: getGeminiModelServer(),
  });
});

// API: Gemini simplify proxy — key stays on the server
app.post('/api/gemini/simplify', async (req: Request, res: Response) => {
  try {
    const { text, targetAudience, targetLanguage } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text is required' });
    }
    const audience =
      targetAudience === 'child' || targetAudience === 'adolescent' || targetAudience === 'parent'
        ? targetAudience
        : 'parent';
    const language = targetLanguage === 'NL' || targetLanguage === 'FR' ? targetLanguage : 'EN';
    const result = await simplifyForAudienceServer(text, audience, language);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gemini request failed' });
  }
});

// API: Trigger idempotent database seed
app.post('/api/seed', async (req: Request, res: Response) => {
  try {
    if (!isSeedAuthorized(req)) {
      return res.status(401).json({
        error: 'Unauthorized. Provide X-Seed-Token matching SEED_SECRET.',
      });
    }

    if (!isDatabaseConfigured()) {
      return res.status(200).json({
        success: true,
        source: 'in-memory',
        message: 'In-memory data already active with 3 multicentric clinical trials.',
      });
    }

    const result = await runSeeder();
    res.json({ success: true, source: 'postgresql', ...result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API: Update workflow step & stage
app.put('/api/studies/:id/workflow', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, stepIndex } = req.body;

  try {
    if (isDatabaseConfigured()) {
      await updateStudyWorkflow(id, stage, stepIndex);
    }
  } catch (err: any) {
    console.warn('[API Workflow] DB update error, saving in memory:', err.message);
  }

  // Update in-memory state
  inMemoryStudies = inMemoryStudies.map((s) =>
    s.id === id ? { ...s, currentWorkflowStage: stage, currentStepIndex: stepIndex } : s
  );

  res.json({ success: true, id, stage, stepIndex });
});

// API: Update document status
app.put('/api/studies/:studyId/documents/:docId/status', async (req: Request, res: Response) => {
  const { studyId, docId } = req.params;
  const { status } = req.body;

  try {
    if (isDatabaseConfigured()) {
      await updateStudyDocumentStatus(studyId, docId, status);
    }
  } catch (err: any) {
    console.warn('[API Doc Status] DB update error, saving in memory:', err.message);
  }

  inMemoryStudies = inMemoryStudies.map((s) => {
    if (s.id !== studyId) return s;
    const updatedDocs = s.documents.map((d) => (d.id === docId ? { ...d, status } : d));
    const ready = updatedDocs.filter((d) => d.status === 'approved' || d.status === 'exported').length;
    return {
      ...s,
      documents: updatedDocs,
      readyDocumentsCount: ready,
      completionPercentage: Math.round((ready / updatedDocs.length) * 100),
    };
  });

  res.json({ success: true, studyId, docId, status });
});

// API: Update custom template configuration
app.put('/api/studies/:studyId/template', async (req: Request, res: Response) => {
  const { studyId } = req.params;
  const { customTemplate } = req.body;

  try {
    if (isDatabaseConfigured()) {
      await updateStudyCustomTemplate(studyId, customTemplate);
    }
  } catch (err: any) {
    console.warn('[API Template] DB update error, saving in memory:', err.message);
  }

  inMemoryStudies = inMemoryStudies.map((s) =>
    s.id === studyId ? { ...s, customTemplate } : s
  );

  res.json({ success: true, studyId, customTemplate });
});

// Serve static assets built by Vite
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback: non-static route serves index.html
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Bootstrap server and auto-seed if database is reachable
app.listen(PORT, HOST, async () => {
  console.log(`[ConsentFlow] Production server listening on http://${HOST}:${PORT}`);

  if (isDatabaseConfigured()) {
    try {
      const health = await checkDatabaseHealth();
      if (health.ok) {
        console.log(`[ConsentFlow] PostgreSQL connection confirmed. Checking seeder status...`);
        await initSchema();
        // Idempotent seeder keeps workflow/tab inventories aligned with mock seed source of truth.
        console.log('[ConsentFlow] Running idempotent seeder to sync studies, sites, facts, sources…');
        const seedResult = await runSeeder();
        console.log(
          `[ConsentFlow] Seed sync complete — studies+${seedResult.studiesInserted}, docs+${seedResult.documentsInserted}, facts+${seedResult.factsInserted}, sites+${seedResult.sitesInserted}, issues+${seedResult.issuesInserted}`
        );
      }
    } catch (err: any) {
      console.warn('[ConsentFlow] Initial DB check deferred:', err.message);
    }
  } else {
    console.log('[ConsentFlow] Operating with seeded state layer (3 multicentric clinical trials ready).');
  }
});
