import React, { useState } from 'react';
import {
  X,
  Compass,
  Rocket,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Plus,
  FileText,
  Languages,
  AlertTriangle,
  Download,
  Link2,
} from 'lucide-react';
import { Study } from '../../types';
import { WORKFLOW_STEPS } from '../../utils/studyLogic';
import { buildRouteUrl, getAppBaseUrl } from '../../utils/appUrl';

interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  studies: Study[];
  onStartFromScratch: () => void;
  onOpenStudy: (studyId: string, tab?: string) => void;
  onNavigateToSection: (section: string) => void;
}

type TourTab = 'scratch' | 'review';

export const ProductTourModal: React.FC<ProductTourModalProps> = ({
  isOpen,
  onClose,
  studies,
  onStartFromScratch,
  onOpenStudy,
  onNavigateToSection,
}) => {
  const [activeTab, setActiveTab] = useState<TourTab>('scratch');

  if (!isOpen) return null;

  const baseUrl = getAppBaseUrl();
  const featuredStudies = studies.slice(0, 3);

  const scratchSteps = [
    {
      n: 1,
      title: 'Create a new study',
      detail: 'Open New Study and enter the trial title, code, PI, and Belgian lead site.',
      cta: 'Open New Study',
      onAction: () => {
        onClose();
        onStartFromScratch();
      },
    },
    {
      n: 2,
      title: 'Register source documents',
      detail: 'Attach the protocol and BSPHO templates (demo upload in this build).',
    },
    {
      n: 3,
      title: 'Choose audiences & languages',
      detail: 'Select Adult / Parent / Adolescent / Child and EN / NL / FR to build the 12-doc matrix.',
    },
    {
      n: 4,
      title: 'Follow the 8-step workflow',
      detail: 'In the study workspace, use “What to do next” to move from Setup → Export.',
      steps: WORKFLOW_STEPS.map((s) => s.shortName),
    },
    {
      n: 5,
      title: 'Review documents & resolve issues',
      detail: 'Open matrix cells to advance document status. Clear Issues before ethics export.',
    },
  ];

  const reviewLinks = [
    {
      label: 'Studies registry',
      description: 'Browse all consent packages',
      href: buildRouteUrl({ section: 'studies' }),
      onClick: () => {
        onClose();
        onNavigateToSection('studies');
      },
    },
    {
      label: 'Consistency center',
      description: 'Cross-document mismatches',
      href: buildRouteUrl({ section: 'consistency_center' }),
      onClick: () => {
        onClose();
        onNavigateToSection('consistency_center');
      },
      icon: AlertTriangle,
    },
    {
      label: 'Translation studio',
      description: 'EN → NL / FR adaptation',
      href: buildRouteUrl({ section: 'translation' }),
      onClick: () => {
        onClose();
        onNavigateToSection('translation');
      },
      icon: Languages,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[11px] font-bold">
                <Compass className="w-3.5 h-3.5" />
                Product tour
              </span>
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]" title={baseUrl}>
                {baseUrl}
              </span>
            </div>
            <h2 id="tour-modal-title" className="text-lg font-bold text-slate-900">
              How to use ConsentFlow
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              A short walkthrough for clients — start a package from scratch, or jump into an existing study.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close tour"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 border-b border-slate-200 flex items-center gap-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('scratch')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'scratch'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            Start from scratch
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('review')}
            className={`py-3 px-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'review'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Review existing
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
          {activeTab === 'scratch' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Best for demos: create a new study and walk the full 8-step consent package workflow.
              </p>

              {scratchSteps.map((step) => (
                <div
                  key={step.n}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 flex gap-3"
                >
                  <span className="w-7 h-7 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900">{step.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.detail}</p>
                    {step.steps && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {step.steps.map((label) => (
                          <span
                            key={label}
                            className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-600"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    )}
                    {step.onAction && step.cta && (
                      <button
                        type="button"
                        onClick={step.onAction}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {step.cta}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <span>
                  Tip: inside a study, always follow the teal <strong>What to do next</strong> banner — it advances
                  the real workflow stage.
                </span>
              </div>
            </div>
          )}

          {activeTab === 'review' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Jump into sample packages already in progress. Links use your configured{' '}
                <code className="px-1 py-0.5 rounded bg-slate-100 text-[10px] font-mono">ENV_URL</code> so they stay
                valid after deploy.
              </p>

              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Open a study workspace
                </h3>
                <div className="space-y-2">
                  {featuredStudies.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 border border-dashed border-slate-200 rounded-xl">
                      No studies yet — switch to “Start from scratch” to create one.
                    </p>
                  ) : (
                    featuredStudies.map((study) => {
                      const workspaceUrl = buildRouteUrl({
                        section: 'study',
                        studyId: study.id,
                        tab: 'matrix',
                      });
                      const issuesUrl = buildRouteUrl({
                        section: 'study',
                        studyId: study.id,
                        tab: 'issues',
                      });
                      return (
                        <div
                          key={study.id}
                          className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-mono text-[11px] font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                                {study.code}
                              </span>
                              <p className="text-xs font-semibold text-slate-900 mt-1.5 line-clamp-2">
                                {study.shortTitle || study.title}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                Step {study.currentStepIndex}/8 · {study.readyDocumentsCount}/
                                {study.totalDocumentsCount} docs ready
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenStudy(study.id, 'matrix');
                              }}
                              className="shrink-0 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold inline-flex items-center gap-1"
                            >
                              Open
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-1.5">
                            <a
                              href={workspaceUrl}
                              onClick={(e) => {
                                e.preventDefault();
                                onClose();
                                onOpenStudy(study.id, 'matrix');
                              }}
                              className="flex items-center gap-1.5 text-[11px] text-teal-700 hover:text-teal-900 font-medium group"
                            >
                              <Link2 className="w-3 h-3 shrink-0" />
                              <span className="truncate font-mono group-hover:underline">{workspaceUrl}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                            </a>
                            {study.issues.length > 0 && (
                              <a
                                href={issuesUrl}
                                onClick={(e) => {
                                  e.preventDefault();
                                  onClose();
                                  onOpenStudy(study.id, 'issues');
                                }}
                                className="flex items-center gap-1.5 text-[11px] text-amber-700 hover:text-amber-900 font-medium group"
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span className="truncate">
                                  Issues ({study.issues.length}) —{' '}
                                  <span className="font-mono group-hover:underline">{issuesUrl}</span>
                                </span>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-teal-600" />
                  Key tools
                </h3>
                <div className="space-y-2">
                  {reviewLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        link.onClick();
                      }}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50/40 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-teal-800">{link.label}</p>
                        <p className="text-[11px] text-slate-500">{link.description}</p>
                        <p className="text-[10px] font-mono text-teal-700 mt-1 truncate">{link.href}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-teal-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            Base URL from <span className="font-mono">ENV_URL</span> in environment
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
