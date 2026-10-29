import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  ArrowRight,
  User,
  Building,
  AlertTriangle,
} from 'lucide-react';
import { Study, CURRENT_DEMO_USER } from '../../types';
import { WORKFLOW_STEPS, computeDocumentProgress, countOpenIssues } from '../../utils/studyLogic';

type ScopeFilter = 'mine' | 'all' | 'review';

interface StudiesListViewProps {
  studies: Study[];
  onOpenStudy: (studyId: string) => void;
  onOpenCreateWizard: () => void;
  searchFilter?: string;
}

function isMine(study: Study): boolean {
  return study.assignedCoordinator === CURRENT_DEMO_USER.name;
}

function needsReview(study: Study): boolean {
  const awaitingPi = study.documents.some((d) => d.status === 'awaiting_pi_review');
  const openIssues = countOpenIssues(study.issues) > 0;
  return awaitingPi || openIssues;
}

export const StudiesListView: React.FC<StudiesListViewProps> = ({
  studies,
  onOpenStudy,
  onOpenCreateWizard,
  searchFilter = '',
}) => {
  const [localSearch, setLocalSearch] = useState(searchFilter);
  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('all');

  const mineCount = studies.filter(isMine).length;
  const reviewCount = studies.filter(needsReview).length;

  const filteredStudies = studies.filter((study) => {
    const q = (localSearch || searchFilter).toLowerCase();
    const matchesSearch =
      !q ||
      study.title.toLowerCase().includes(q) ||
      study.code.toLowerCase().includes(q) ||
      study.sponsor.toLowerCase().includes(q) ||
      study.responsiblePI.toLowerCase().includes(q) ||
      study.assignedCoordinator.toLowerCase().includes(q) ||
      study.leadSite.toLowerCase().includes(q);

    const matchesPhase = phaseFilter === 'all' || study.currentWorkflowStage === phaseFilter;

    const matchesScope =
      scopeFilter === 'all'
        ? true
        : scopeFilter === 'mine'
        ? isMine(study)
        : needsReview(study);

    return matchesSearch && matchesPhase && matchesScope;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <FolderKanban className="w-5 h-5 text-teal-600" />
          Studies
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Yours for day-to-day work, or the full network for review and approvals
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all' as const, label: 'All studies', count: studies.length },
            { id: 'mine' as const, label: 'Assigned to me', count: mineCount },
            { id: 'review' as const, label: 'Needs review', count: reviewCount },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setScopeFilter(opt.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              scopeFilter === opt.id
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {opt.label}
            <span
              className={`ml-1.5 ${scopeFilter === opt.id ? 'text-slate-300' : 'text-slate-400'}`}
            >
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, title, PI, coordinator…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-400 text-xs">Stage:</span>
          <select
            value={phaseFilter}
            onChange={(e) => setPhaseFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All stages</option>
            {WORKFLOW_STEPS.map((step) => (
              <option key={step.stage} value={step.stage}>
                {step.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredStudies.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <FolderKanban className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-slate-900">No studies match these filters</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Switch to <strong>All studies</strong> to see the network list, or clear search and stage.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setPhaseFilter('all');
                setScopeFilter('all');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Show all studies
            </button>
            <button
              type="button"
              onClick={onOpenCreateWizard}
              className="px-3 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Study
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStudies.map((study) => {
          const currentStep = WORKFLOW_STEPS[study.currentStepIndex - 1];
          const progress = computeDocumentProgress(study.documents);
          const readyDocs = progress.approvedForSubmission;
          const totalDocs = progress.total;
          const percent = totalDocs ? Math.round((readyDocs / totalDocs) * 100) : 0;
          const mine = isMine(study);
          const review = needsReview(study);
          const openIssues = countOpenIssues(study.issues);

          return (
            <div
              key={study.id}
              onClick={() => onOpenStudy(study.id)}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded">
                    {study.code}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                      mine
                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {mine ? 'Assigned to me' : 'Network'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                  {study.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">Sponsor: {study.sponsor}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">PI: {study.responsiblePI}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">Coordinator: {study.assignedCoordinator}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{study.leadSite}</span>
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                    Stage {study.currentStepIndex}:{' '}
                    {currentStep ? currentStep.shortName : study.currentWorkflowStage}
                  </span>
                  {review && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                      <AlertTriangle className="w-3 h-3" />
                      {openIssues > 0 ? `${openIssues} issue${openIssues === 1 ? '' : 's'}` : 'PI review'}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-500">Approved</span>
                  <span className="text-slate-800 font-bold">
                    {readyDocs}/{totalDocs}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mb-1.5">
                  Generated {progress.generated}/{totalDocs}
                  {progress.exported > 0 ? ` · Exported ${progress.exported}` : ''}
                </p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-teal-700 pt-1">
                  <span>{mine ? 'Open workspace' : 'Open for review'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
