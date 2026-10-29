import React, { useState } from 'react';
import {
  FolderKanban,
  FileCheck2,
  AlertCircle,
  GitCompare,
  ArrowRight,
  Clock,
  Building,
  User,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import { Study, ActionItem } from '../../types';
import { WORKFLOW_STEPS, countOpenIssues, computeDocumentProgress } from '../../utils/studyLogic';
import { ProductTourModal } from './ProductTourModal';

interface DashboardViewProps {
  studies: Study[];
  actionItems: ActionItem[];
  onOpenStudy: (studyId: string, tab?: string) => void;
  onOpenCreateWizard: () => void;
  onSelectActionItem: (item: ActionItem) => void;
  onNavigateToSection: (section: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  studies,
  actionItems,
  onOpenStudy,
  onOpenCreateWizard,
  onSelectActionItem,
  onNavigateToSection,
}) => {
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Compute aggregate stats across studies
  const totalStudies = studies.length;
  const docsAwaitingReview = studies.reduce((acc, s) => {
    return acc + s.documents.filter((d) => d.status === 'awaiting_pi_review').length;
  }, 0);
  const totalIssuesCount = studies.reduce((acc, s) => acc + countOpenIssues(s.issues), 0);
  const missingInfoCount = studies.reduce((acc, s) => {
    return acc + (s.facts?.filter((f) => f.status === 'missing' || f.status === 'conflicted').length || 0);
  }, 0);
  const templateMigrationsCount = 1; // BSPHO v2.3 to v2.4

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            What needs attention across your consent packages.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsTourOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm transition-colors shrink-0"
        >
          <Compass className="w-4 h-4 text-teal-600" />
          <span>Tour</span>
        </button>
      </div>

      <ProductTourModal
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        studies={studies}
        onStartFromScratch={onOpenCreateWizard}
        onOpenStudy={(studyId, tab) => onOpenStudy(studyId, tab)}
        onNavigateToSection={onNavigateToSection}
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Active Studies */}
        <div
          onClick={() => onNavigateToSection('studies')}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-teal-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Studies</span>
            <FolderKanban className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalStudies}</span>
            <span className="text-xs text-slate-500">studies</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Awaiting PI Review → study Document Matrix (CF-001) */}
        <div
          onClick={() => {
            const studyWithReview = studies.find((s) =>
              s.documents.some((d) => d.status === 'awaiting_pi_review')
            );
            if (studyWithReview) onOpenStudy(studyWithReview.id, 'matrix');
            else onNavigateToSection('studies');
          }}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting PI Review</span>
            <FileCheck2 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-700">{docsAwaitingReview}</span>
            <span className="text-xs text-slate-500">Documents</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-800 font-medium flex items-center gap-1">
            <span>Open review queue</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Missing Facts → study Fact Inventory (CF-001) */}
        <div
          onClick={() => {
            const studyWithGaps = studies.find((s) =>
              s.facts?.some((f) => f.status === 'missing' || f.status === 'conflicted')
            );
            if (studyWithGaps) onOpenStudy(studyWithGaps.id, 'facts');
            else onNavigateToSection('studies');
          }}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-red-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Missing Facts</span>
            <AlertCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-red-600">{missingInfoCount}</span>
            <span className="text-xs text-slate-500">gaps</span>
          </div>
          <div className="mt-2 text-[11px] text-red-700 font-medium flex items-center gap-1">
            <span>Review facts</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateToSection('consistency_center')}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Open Issues</span>
            <AlertTriangle className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-700">{totalIssuesCount}</span>
            <span className="text-xs text-slate-500">to resolve</span>
          </div>
          <div className="mt-2 text-[11px] text-indigo-700 font-medium flex items-center gap-1">
            <span>Open Issues</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        <div
          onClick={() => onNavigateToSection('update_migration')}
          className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Updates</span>
            <GitCompare className="w-4 h-4 text-teal-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-800">{templateMigrationsCount}</span>
            <span className="text-xs text-slate-500">pending</span>
          </div>
          <div className="mt-2 text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <span>Template v2.4</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Needs attention first, then studies — matches how coordinators work */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 order-1 lg:order-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Needs attention
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Jump straight to the task</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {actionItems.length}
            </span>
          </div>

          <div className="space-y-3">
            {actionItems.map((item) => {
              const isCritical = item.priority === 'critical';
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectActionItem(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCritical
                      ? 'border-red-200 bg-red-50/40 hover:bg-red-50 hover:border-red-300'
                      : 'border-slate-200 bg-white hover:bg-slate-50 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isCritical ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.createdDate}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h3>
                  <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-teal-700 font-semibold">{item.studyName}</span>
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 order-2 lg:order-1">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-teal-600" />
                Studies
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Continue where you left off</p>
            </div>
            <button
              onClick={() => onNavigateToSection('studies')}
              className="text-xs text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-y border-slate-200/80">
                <tr>
                  <th className="py-2.5 px-3">Study</th>
                  <th className="py-2.5 px-3">PI / Site</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {studies.map((study) => {
                  const currentStep = WORKFLOW_STEPS[study.currentStepIndex - 1];
                  const progress = computeDocumentProgress(study.documents);
                  const readyDocs = progress.approvedForSubmission;
                  const totalDocs = progress.total;
                  const percent = totalDocs ? Math.round((readyDocs / totalDocs) * 100) : 0;

                  return (
                    <tr
                      key={study.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => onOpenStudy(study.id)}
                    >
                      {/* Study Name & ID */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {study.code}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{study.shortTitle}</div>
                        <span className="inline-block mt-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          {study.phase}
                        </span>
                      </td>

                      {/* PI & Site */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-800">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{study.responsiblePI}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{study.leadSite}</span>
                        </div>
                      </td>

                      {/* Workflow Stage */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                          {currentStep ? currentStep.name : study.currentWorkflowStage}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Updated {study.lastUpdated}</span>
                        </div>
                      </td>

                      {/* Document progress — approved ≠ exported semantics */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span className="text-slate-800">
                            Approved {readyDocs}/{totalDocs}
                          </span>
                          <span className="text-teal-700">{percent}%</span>
                        </div>
                        <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-600 h-full rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          ></div>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          Generated {progress.generated}/{totalDocs} · Exported {progress.exported}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenStudy(study.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
