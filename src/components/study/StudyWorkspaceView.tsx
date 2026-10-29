import React, { useState } from 'react';
import {
  ArrowLeft,
  Building,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  Languages,
  Users,
  Smile,
  GraduationCap,
  Sparkles,
  Download,
  Share2,
  Edit2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
  Sliders,
  Check,
  Info,
  Layers,
} from 'lucide-react';
import {
  Study,
  ICFDocument,
  DocumentAudience,
  DocumentLanguage,
  DocumentStatus,
  CustomTemplateConfig,
  ConsistencyIssueStatus,
  IssueResolutionRecord,
  BucketDocumentItem,
  CURRENT_DEMO_USER,
} from '../../types';
import {
  AUDIENCE_CONFIG,
  LANGUAGE_CONFIG,
  WORKFLOW_STEPS,
  DEFAULT_TEMPLATE_SECTIONS,
  getDocumentStatusMeta,
  getStepStatus,
  findDocumentInMatrix,
  getWorkflowNextAction,
  computeDocumentProgress,
  countOpenIssues,
  isIssueOpen,
  isIssuePendingPropagation,
  hasBlockingIssues,
} from '../../utils/studyLogic';
import { DocumentDetailModal } from './DocumentDetailModal';
import { CloudBucketSyncModal } from '../bucket/CloudBucketSyncModal';
import { CloudBucketDataFlowTab } from '../bucket/CloudBucketDataFlowTab';
import { SourceEvidenceViewerModal } from '../bucket/SourceEvidenceViewerModal';
import { findSourceFileForCitation } from '../../services/cloudBucketService';

interface StudyWorkspaceViewProps {
  study: Study;
  onBackToStudies: () => void;
  onUpdateDocumentStatus?: (studyId: string, docId: string, newStatus: DocumentStatus) => void;
  onUpdateStudy?: (updatedStudy: Study) => void;
  onResolveIssue?: (
    studyId: string,
    issueId: string,
    nextStatus: ConsistencyIssueStatus,
    resolution?: IssueResolutionRecord
  ) => void;
  onOpenWizard?: () => void;
  onNavigateToSection?: (section: any) => void;
  initialTab?: 'matrix' | 'facts' | 'issues' | 'sites' | 'bucket' | 'template';
}

export const StudyWorkspaceView: React.FC<StudyWorkspaceViewProps> = ({
  study,
  onBackToStudies,
  onUpdateDocumentStatus,
  onUpdateStudy,
  onResolveIssue,
  onOpenWizard,
  onNavigateToSection,
  initialTab = 'matrix',
}) => {
  const [selectedDoc, setSelectedDoc] = useState<ICFDocument | null>(null);
  const [activeTab, setActiveTab] = useState<'matrix' | 'facts' | 'issues' | 'sites' | 'bucket' | 'template'>(initialTab);
  const [isBucketModalOpen, setIsBucketModalOpen] = useState(false);
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'issues_only' | 'approved_only'>('all');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(study.currentStepIndex);
  const [sourceViewer, setSourceViewer] = useState<{
    file: BucketDocumentItem;
    citationLabel?: string;
    pageHint?: number | string;
  } | null>(null);

  // Keep the workflow banner aligned with DB-backed progress when study identity or step changes.
  React.useEffect(() => {
    setActiveWorkflowStep(study.currentStepIndex);
  }, [study.id, study.currentStepIndex]);

  React.useEffect(() => {
    setTemplateConfig(
      study.customTemplate || {
        id: `tmpl-${study.id}`,
        name: 'BSPHO Standard Interventional v2.4',
        baseTemplate: study.templateVersion || 'BSPHO ICF Template v2.4 (2024)',
        excludeInsurance: false,
        excludeContraception: false,
        excludeBiobanking: false,
        sections: DEFAULT_TEMPLATE_SECTIONS,
      }
    );
  }, [study.id, study.customTemplate, study.templateVersion]);

  const openSourceCitation = (citation: string, pageHint?: number | string) => {
    const file = findSourceFileForCitation(study.bucketFiles, citation);
    if (!file) return;
    setSourceViewer({ file, citationLabel: citation, pageHint });
  };

  const [templateConfig, setTemplateConfig] = useState<CustomTemplateConfig>(
    study.customTemplate || {
      id: `tmpl-${study.id}`,
      name: 'BSPHO Standard Interventional v2.4',
      baseTemplate: study.templateVersion || 'BSPHO ICF Template v2.4 (2024)',
      excludeInsurance: false,
      excludeContraception: false,
      excludeBiobanking: false,
      sections: DEFAULT_TEMPLATE_SECTIONS,
    }
  );

  const handleToggleSectionExclusion = (key: string) => {
    const updatedSections = templateConfig.sections.map((sec) =>
      sec.key === key ? { ...sec, isIncluded: !sec.isIncluded } : sec
    );
    const isInsuranceExcluded = !updatedSections.find((s) => s.key === 'insurance_liability')?.isIncluded;
    const isContraceptionExcluded = !updatedSections.find((s) => s.key === 'contraception_guidance')?.isIncluded;
    const isBiobankingExcluded = !updatedSections.find((s) => s.key === 'optional_biobanking')?.isIncluded;

    const newConfig: CustomTemplateConfig = {
      ...templateConfig,
      excludeInsurance: isInsuranceExcluded,
      excludeContraception: isContraceptionExcluded,
      excludeBiobanking: isBiobankingExcluded,
      sections: updatedSections,
      lastModified: '2026-10-29',
    };

    setTemplateConfig(newConfig);

    if (onUpdateStudy) {
      const adjustedIssues = isInsuranceExcluded
        ? study.issues.filter((iss) => !iss.title.toLowerCase().includes('insurance'))
        : study.issues;

      onUpdateStudy({
        ...study,
        customTemplate: newConfig,
        issues: adjustedIssues,
      });
    }
  };

  const audiences: DocumentAudience[] = ['adult', 'parent', 'adolescent', 'child'];
  const languages: DocumentLanguage[] = ['EN', 'NL', 'FR'];

  const getAudienceIcon = (aud: DocumentAudience) => {
    switch (aud) {
      case 'adult':
        return <User className="w-4 h-4 text-slate-600" />;
      case 'parent':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'adolescent':
        return <GraduationCap className="w-4 h-4 text-teal-600" />;
      case 'child':
        return <Smile className="w-4 h-4 text-amber-600" />;
    }
  };

  const handleUpdateStatus = (docId: string, newStatus: DocumentStatus) => {
    if (onUpdateDocumentStatus) {
      onUpdateDocumentStatus(study.id, docId, newStatus);
    }
  };

  const currentStep = WORKFLOW_STEPS[study.currentStepIndex - 1];
  const nextAction = getWorkflowNextAction(study.currentStepIndex);
  const docProgress = computeDocumentProgress(study.documents);
  const openIssueCount = countOpenIssues(study.issues);
  const blockingApproval = hasBlockingIssues(study.issues);

  const handleGenerateDrafts = () => {
    if (!onUpdateStudy) return;
    const updatedDocs = study.documents.map((d) =>
      d.status === 'not_started' ? { ...d, status: 'draft_generated' as DocumentStatus, lastUpdated: '2026-10-29' } : d
    );
    const stillNotStarted = updatedDocs.some((d) => d.status === 'not_started');
    // Never rewind an advanced study (e.g. step 8 export) back to drafts view.
    const nextStepIndex = Math.max(study.currentStepIndex, stillNotStarted ? study.currentStepIndex : 4);
    onUpdateStudy({
      ...study,
      documents: updatedDocs,
      currentStepIndex: nextStepIndex,
      currentWorkflowStage:
        stillNotStarted || study.currentStepIndex >= 4
          ? study.currentWorkflowStage
          : 'draft_generation',
      lastUpdated: '2026-10-29',
      ...(() => {
        const p = computeDocumentProgress(updatedDocs);
        return {
          readyDocumentsCount: p.approvedForSubmission,
          completionPercentage: p.total ? Math.round((p.approvedForSubmission / p.total) * 100) : 0,
        };
      })(),
    });
    setActiveTab('matrix');
    setActiveWorkflowStep(nextStepIndex);
  };

  const handleAdvanceWorkflow = () => {
    if (!onUpdateStudy || study.currentStepIndex >= 8) {
      setActiveTab(nextAction.tab);
      return;
    }
    const nextIndex = study.currentStepIndex + 1;
    const nextStep = WORKFLOW_STEPS[nextIndex - 1];
    onUpdateStudy({
      ...study,
      currentStepIndex: nextIndex,
      currentWorkflowStage: nextStep.stage,
      lastUpdated: '2026-10-29',
    });
    setActiveWorkflowStep(nextIndex);
    setActiveTab(getWorkflowNextAction(nextIndex).tab);
  };

  const handleSelectWorkflowStep = (stepIndex: number) => {
    setActiveWorkflowStep(stepIndex);
    setActiveTab(getWorkflowNextAction(stepIndex).tab);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBackToStudies}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All studies</span>
        </button>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
          Step {study.currentStepIndex}/8 · {currentStep ? currentStep.shortName : study.currentWorkflowStage}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md">
                {study.code}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                {study.phase}
              </span>
              {openIssueCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('issues')}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200 inline-flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {openIssueCount} open issue{openIssueCount === 1 ? '' : 's'}
                </button>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{study.title}</h1>
            <p className="text-xs text-slate-500 mt-1 truncate">
              PI {study.responsiblePI} · Coordinator {study.assignedCoordinator}
              {study.assignedCoordinator === CURRENT_DEMO_USER.name ? ' (you)' : ''} · {study.leadSite}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleGenerateDrafts}
              className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              title="Mark not-started variants as draft generated (demo)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Drafts</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
          {[
            { label: 'Generated', value: `${docProgress.generated}/${docProgress.total}` },
            { label: 'Awaiting PI', value: String(docProgress.awaitingPiReview) },
            { label: 'Approved', value: `${docProgress.approvedForSubmission}/${docProgress.total}` },
            { label: 'Exported', value: `${docProgress.exported}/${docProgress.total}` },
          ].map((c) => (
            <div key={c.label} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
              <p className="text-[10px] font-medium text-slate-500">{c.label}</p>
              <p className="text-base font-bold text-slate-900">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Workflow</h2>
            <p className="text-xs text-slate-500 mt-0.5">One step at a time — from setup to export</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {WORKFLOW_STEPS.map((step) => {
            const stepStatus = getStepStatus(study.currentStepIndex, step.index);
            const isCurrent = step.index === study.currentStepIndex;
            const isPassed = step.index < study.currentStepIndex;
            const isSelected = step.index === activeWorkflowStep;

            return (
              <button
                type="button"
                key={step.index}
                onClick={() => handleSelectWorkflowStep(step.index)}
                className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                  isCurrent
                    ? 'border-teal-500 bg-teal-50/70 shadow-xs ring-1 ring-teal-500/20'
                    : isPassed
                    ? 'border-emerald-200 bg-emerald-50/30 hover:bg-emerald-50/60'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 opacity-70'
                } ${isSelected && !isCurrent ? 'ring-1 ring-slate-300' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] font-bold text-slate-500">{step.index}</span>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isCurrent ? (
                    <Clock className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  )}
                </div>
                <div className="font-semibold text-slate-900 truncate" title={step.name}>
                  {step.shortName}
                </div>
                <div className="text-[10px] mt-0.5 truncate text-slate-500 capitalize">
                  {stepStatus.replace('_', ' ')}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-teal-700">What to do next</span>
              {activeWorkflowStep !== study.currentStepIndex && (
                <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  Viewing step {activeWorkflowStep}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-900">
              {(activeWorkflowStep === study.currentStepIndex
                ? nextAction
                : getWorkflowNextAction(activeWorkflowStep)
              ).title}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {(activeWorkflowStep === study.currentStepIndex
                ? nextAction
                : getWorkflowNextAction(activeWorkflowStep)
              ).hint}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(getWorkflowNextAction(activeWorkflowStep).tab)}
              className="px-3 py-2 rounded-lg border border-teal-300 bg-white hover:bg-teal-50 text-teal-800 text-xs font-semibold transition-colors"
            >
              Go to step
            </button>
            {activeWorkflowStep === study.currentStepIndex && study.currentStepIndex < 8 && (
              <button
                type="button"
                onClick={handleAdvanceWorkflow}
                className="px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <span>{nextAction.primaryCta}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {study.currentStepIndex >= 8 && activeWorkflowStep === 8 && (
              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Review & export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact workspace tabs */}
      <div className="border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs font-semibold">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {(
            [
              { id: 'matrix' as const, label: 'Documents', icon: FileText, count: study.documents.length },
              { id: 'facts' as const, label: 'Facts', icon: ShieldCheck, count: study.facts.length },
              { id: 'issues' as const, label: 'Issues', icon: AlertTriangle, count: openIssueCount, warn: openIssueCount > 0 },
              { id: 'sites' as const, label: 'Sites', icon: Building, count: study.participatingSites.length },
              { id: 'template' as const, label: 'Template', icon: Sliders, count: undefined },
              { id: 'bucket' as const, label: 'Sources', icon: Database, count: study.bucketFiles?.length || 0 },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-teal-600 text-teal-800'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${'warn' in tab && tab.warn && !isActive ? 'text-amber-500' : ''}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      'warn' in tab && tab.warn
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {tab.id === 'template' && templateConfig.excludeInsurance && (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px]">
                    Custom
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Filter controls when on Matrix tab */}
        {activeTab === 'matrix' && (
          <div className="flex items-center gap-2 py-2">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            <button
              onClick={() => setMatrixFilter('all')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                matrixFilter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All (12)
            </button>
            <button
              onClick={() => setMatrixFilter('issues_only')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                matrixFilter === 'issues_only'
                  ? 'bg-red-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              With Issues Only
            </button>
            <button
              onClick={() => setMatrixFilter('approved_only')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                matrixFilter === 'approved_only'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Approved
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: 4x3 Document Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Document matrix — 4 audiences × 3 languages
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click a cell to open that consent form, review content, and advance its status.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Approved
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span> PI Edited
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Awaiting PI
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span> Translating
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-xs font-semibold text-slate-700">
                    <th className="p-4 text-left w-64 bg-slate-100/90 border-r border-slate-200">
                      Target Audience
                    </th>
                    {languages.map((lang) => {
                      const cfg = LANGUAGE_CONFIG[lang];
                      return (
                        <th key={lang} className="p-4 text-left border-r border-slate-200 last:border-r-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">
                              {cfg.name} ({lang})
                            </span>
                            <span className="text-[10px] font-normal text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                              {cfg.nativeName}
                            </span>
                          </div>
                          {lang === 'EN' && (
                            <span className="text-[10px] text-teal-700 font-medium block mt-0.5">
                              ★ Master Source for PI Word Review
                            </span>
                          )}
                          {lang !== 'EN' && (
                            <span className="text-[10px] text-slate-500 font-normal block mt-0.5">
                              Constrained Translation to Belgian Template
                            </span>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {audiences.map((aud) => {
                    const audCfg = AUDIENCE_CONFIG[aud];

                    return (
                      <tr key={aud} className="hover:bg-slate-50/40 transition-colors">
                        {/* Audience Row Header */}
                        <td className="p-4 bg-slate-50/60 border-r border-slate-200 align-top">
                          <div className="flex items-center gap-2 mb-1">
                            {getAudienceIcon(aud)}
                            <h4 className="font-bold text-slate-900 text-xs">{audCfg.label}</h4>
                          </div>
                          <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-semibold mb-1">
                            {audCfg.ageRange}
                          </span>
                          <p className="text-[11px] text-slate-500 leading-tight">{audCfg.description}</p>
                        </td>

                        {/* 3 Language Document Cells */}
                        {languages.map((lang) => {
                          const doc = findDocumentInMatrix(study.documents, aud, lang);

                          if (!doc) {
                            return (
                              <td
                                key={lang}
                                className="p-4 border-r border-slate-200 text-xs text-slate-400 italic bg-slate-50/20"
                              >
                                Not configured
                              </td>
                            );
                          }

                          const statusMeta = getDocumentStatusMeta(doc.status);
                          const isMatchesFilter =
                            matrixFilter === 'all' ||
                            (matrixFilter === 'issues_only' && doc.issueCount > 0) ||
                            (matrixFilter === 'approved_only' && doc.status === 'approved');

                          if (!isMatchesFilter) {
                            return (
                              <td
                                key={lang}
                                className="p-4 border-r border-slate-200 text-xs opacity-30 bg-slate-50/40"
                              >
                                <div className="text-[11px] text-slate-400">{doc.title}</div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={lang}
                              className="p-3 border-r border-slate-200 last:border-r-0 align-top"
                            >
                              <div
                                onClick={() => setSelectedDoc(doc)}
                                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-36"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                                      {doc.version}
                                    </span>
                                    {doc.issueCount > 0 ? (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-red-100 text-red-700">
                                        <AlertTriangle className="w-3 h-3" />
                                        {doc.issueCount} Issue{doc.issueCount > 1 ? 's' : ''}
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-slate-400">
                                        ~{doc.wordCount} words
                                      </span>
                                    )}
                                  </div>

                                  <h5 className="font-bold text-xs text-slate-800 line-clamp-2 group-hover:text-teal-700 transition-colors">
                                    {doc.title}
                                  </h5>
                                </div>

                                <div className="pt-2 border-t border-slate-100">
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.badgeClass}`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${statusMeta.indicatorColor}`}
                                    ></span>
                                    {statusMeta.label}
                                  </span>

                                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 group-hover:text-teal-700">
                                    <span>Inspect Document</span>
                                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                  </div>
                                </div>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Study Fact Inventory */}
      {activeTab === 'facts' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Study facts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Key facts extracted from the protocol. Confirm or resolve conflicts before drafting.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex gap-2">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>
                <strong>Confidence %</strong> in this demo is a heuristic display value — not a calibrated clinical
                accuracy score. Click a source to open the evidence viewer (HTTPS may 403 without GCS IAM).
              </span>
            </div>

            <div className="space-y-3">
              {study.facts.map((fact) => {
                const isConflicted = fact.status === 'conflicted';
                const matchedSource = findSourceFileForCitation(study.bucketFiles, fact.sourceDoc);
                return (
                  <div
                    key={fact.id}
                    className={`p-4 rounded-xl border ${
                      isConflicted ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900">{fact.label}</span>
                          <span className="font-mono text-[10px] text-slate-500">[{fact.key}]</span>
                          <span
                            className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                              isConflicted
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {fact.status}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800">{fact.value}</p>

                        {fact.conflictValue && (
                          <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold block">Contradicting Value Detected:</span>
                              {fact.conflictValue}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right text-xs text-slate-500 shrink-0">
                        {matchedSource ? (
                          <button
                            type="button"
                            onClick={() => openSourceCitation(fact.sourceDoc, fact.sourcePage)}
                            className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 ml-auto"
                            title="Open source evidence viewer"
                          >
                            Source: {fact.sourceDoc}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <div title="No matching registered source file">
                            Source: {fact.sourceDoc}
                            <span className="block text-[10px] text-slate-400">(no registered file)</span>
                          </div>
                        )}
                        {fact.sourcePage && <div>Page {fact.sourcePage}</div>}
                        <div className="text-teal-700 font-semibold mt-1" title="Demo heuristic — not clinical certainty">
                          Confidence: {Math.round(fact.confidence * 100)}% (demo)
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Consistency & Conflicts */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div>
                <h3 className="font-bold text-slate-900 text-sm">
                Consistency issues
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Seeded discrepancy examples for this study. Record decisions under Issues.
              </p>
            </div>

            {study.issues.filter((i) => isIssueOpen(i.status) || isIssuePendingPropagation(i.status)).length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-slate-800">No open consistency issues for this study</p>
                <p className="mt-1">Resolved items may still appear under Issues → Resolved.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {study.issues.filter((i) => isIssueOpen(i.status) || isIssuePendingPropagation(i.status)).map((issue) => (
                  <div
                    key={issue.id}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/20 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        {issue.title}
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800">
                        {issue.status.replace('_', ' ')} · {issue.severity}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{issue.description}</p>

                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                      <div className="text-slate-600 flex flex-wrap items-center gap-1">
                        <strong>Source Evidence:</strong>{' '}
                        {findSourceFileForCitation(study.bucketFiles, issue.sourceEvidence) ? (
                          <button
                            type="button"
                            onClick={() => openSourceCitation(issue.sourceEvidence)}
                            className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1"
                          >
                            {issue.sourceEvidence}
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span>{issue.sourceEvidence}</span>
                        )}
                      </div>
                      <div className="text-amber-900">
                        <strong>Resolution Note:</strong> {issue.discrepancyNote}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 gap-2">
                      <span className="text-slate-500">
                        Affected Variants: {issue.affectedDocs.map((d) => `${d.audience.toUpperCase()}-${d.language}`).join(', ')}
                      </span>
                      <div className="flex items-center gap-2">
                        {onResolveIssue && (issue.status === 'open' || issue.status === 'reopened') && (
                          <button
                            type="button"
                            onClick={() => onNavigateToSection?.('consistency_center')}
                            className="text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                          >
                            Record decision →
                          </button>
                        )}
                        <button
                          onClick={() => {
                            const doc = study.documents.find(
                              (d) => d.audience === issue.affectedDocs[0].audience && d.language === issue.affectedDocs[0].language
                            );
                            if (doc) setSelectedDoc(doc);
                          }}
                          className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                        >
                          Inspect document →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Participating Belgian Sites */}
      {activeTab === 'sites' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Participating sites
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Loaded from the study database. Missing insurance / pending ethics labels are seeded workflow
                states for the demo — not claims about real hospitals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {study.participatingSites.map((site) => (
                <div key={site.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-teal-600" />
                      {site.name}
                    </h4>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {site.city}, BE
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pt-1">
                    <div>
                      <strong>Site Coordinator:</strong> {site.localCoordinator}
                    </div>
                    <div>
                      <strong>Ethics Committee Approval:</strong>{' '}
                      {site.ethicsCommitteeApprovalDate ? (
                        <span className="text-emerald-700 font-semibold">
                          Approved ({site.ethicsCommitteeApprovalDate})
                        </span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Pending Local Dossier</span>
                      )}
                    </div>
                    <div>
                      <strong>No-Fault Insurance Policy:</strong>{' '}
                      {site.insurancePolicyId ? (
                        <span className="font-mono text-slate-800">{site.insurancePolicyId}</span>
                      ) : (
                        <span className="text-red-600 font-semibold bg-red-50 px-1.5 py-0.2 rounded">
                          MISSING LOCAL RIDER
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Google Cloud Bucket Data Flow */}
      {activeTab === 'bucket' && (
        <CloudBucketDataFlowTab
          study={study}
          onUpdateStudyBucket={(updated, logs) => {
            if (onUpdateStudy) onUpdateStudy(updated);
          }}
          onOpenSyncModal={() => setIsBucketModalOpen(true)}
        />
      )}

      {/* Tab 6: Custom Template & Modular Section Exclusions */}
      {activeTab === 'template' && (
        <div className="space-y-6 text-xs">
          {/* Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-900 via-slate-900 to-teal-950 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-amber-200">Demo template profile</span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-300">{templateConfig.baseTemplate}</span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>{templateConfig.name}</span>
              </h3>
              <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
                Toggle which sample sections are marked included for this study. Toggles update local demo state only —
                they do not rewrite generated documents or call a template service.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 text-center shrink-0">
              <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-semibold">Included</span>
              <span className="text-sm font-bold text-white flex items-center justify-center gap-1 mt-0.5">
                {templateConfig.sections.filter((s) => s.isIncluded).length} / {templateConfig.sections.length}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">session only</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Section inclusions</h4>
              <p className="text-slate-500 text-xs mt-0.5">
                Demo toggles. Excluding a section does not yet remove it from document previews or Issues.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templateConfig.sections.map((section) => (
                <div
                  key={section.id}
                  className={`p-4 rounded-xl border transition-all ${
                    section.isIncluded
                      ? 'border-slate-200 bg-white hover:border-slate-300'
                      : 'border-purple-200 bg-purple-50/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-bold text-slate-900 text-xs">{section.title}</span>
                        {section.category === 'legal' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                            LEGAL
                          </span>
                        )}
                        {section.category === 'clinical' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                            CLINICAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{section.description}</p>
                      {section.statutoryBasis && (
                        <span className="font-mono text-[10px] text-slate-400 mt-1 block">
                          Statutory basis: {section.statutoryBasis}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 text-right">
                      {section.canExclude ? (
                        <button
                          onClick={() => handleToggleSectionExclusion(section.key)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                            section.isIncluded
                              ? 'bg-slate-100 text-slate-700 hover:bg-red-50 hover:text-red-700 border border-slate-200'
                              : 'bg-purple-600 text-white hover:bg-purple-700 border border-purple-600'
                          }`}
                        >
                          {section.isIncluded ? 'Exclude Section' : 'Excluded (Re-include)'}
                        </button>
                      ) : (
                        <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[10px] font-semibold border border-slate-200">
                          Mandatory Verbatim
                        </span>
                      )}
                    </div>
                  </div>

                  {!section.isIncluded && (
                    <div className="p-2 rounded-lg bg-purple-100/60 border border-purple-200 text-purple-950 text-[11px] mt-2 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      <span>Marked excluded in this demo profile — documents and issue queues are unchanged until real template apply exists.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 8-Step Lifecycle Impact Viewer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Where this would matter (planned)</h4>
              <p className="text-slate-500 text-xs mt-0.5">
                Intended workflow impact — labels below are guidance, not measured outcomes
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                {
                  step: 'Step 1: Setup',
                  desc: 'Record which template profile the study uses.',
                  status: 'Planned',
                },
                {
                  step: 'Step 2: Evidence',
                  desc: templateConfig.excludeInsurance
                    ? 'Skip insurance fact requirement when excluded.'
                    : 'Expect insurance evidence when included.',
                  status: 'Planned',
                },
                {
                  step: 'Step 3: Templates',
                  desc: 'Render only included blocks in drafts.',
                  status: 'Planned',
                },
                {
                  step: 'Step 4: Drafts (EN)',
                  desc: 'Generate EN audience drafts from facts + template.',
                  status: 'Demo CTA only',
                },
                {
                  step: 'Step 5: PI Review',
                  desc: 'Investigator reviews clinical content.',
                  status: 'Planned',
                },
                {
                  step: 'Step 6: NL/FR Adapt',
                  desc: 'Produce Dutch and French variants with the same exclusions.',
                  status: 'Planned',
                },
                {
                  step: 'Step 7: Consistency',
                  desc: 'Cross-check facts across variants; ignore excluded sections.',
                  status: 'Demo queue',
                },
                {
                  step: 'Step 8: Finalize',
                  desc: 'Export a package for later Ethics Committee submission.',
                  status: 'Not EC approval',
                },
              ].map((st, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{st.step}</span>
                    <span className="font-mono text-[9px] font-bold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                      {st.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDoc && (
      <DocumentDetailModal
        document={selectedDoc}
        studyCode={study.code}
        onClose={() => setSelectedDoc(null)}
        onUpdateStatus={handleUpdateStatus}
        hasBlockingIssues={blockingApproval}
      />
      )}

      {/* Cloud Bucket Sync & Ingestion Modal */}
      <CloudBucketSyncModal
        isOpen={isBucketModalOpen}
        onClose={() => setIsBucketModalOpen(false)}
        study={study}
        onUpdateStudyBucket={(updated, logs) => {
          if (onUpdateStudy) onUpdateStudy(updated);
        }}
      />

      <SourceEvidenceViewerModal
        file={sourceViewer?.file ?? null}
        studyCode={study.code}
        citationLabel={sourceViewer?.citationLabel}
        pageHint={sourceViewer?.pageHint}
        onClose={() => setSourceViewer(null)}
      />
    </div>
  );
};
