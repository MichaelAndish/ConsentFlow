import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Check,
  ArrowRight,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  Study,
  ConsistencyIssue,
  ConsistencyIssueStatus,
  IssueResolutionRecord,
  BucketDocumentItem,
} from '../../types';
import { isIssueOpen, isIssuePendingPropagation, countOpenIssues, countPendingPropagationIssues } from '../../utils/studyLogic';
import { findSourceFileForCitation } from '../../services/cloudBucketService';
import { SourceEvidenceViewerModal } from '../bucket/SourceEvidenceViewerModal';

interface ConsistencyCenterProps {
  studies: Study[];
  onOpenStudy: (studyId: string, tab?: string) => void;
  onResolveIssue: (
    studyId: string,
    issueId: string,
    nextStatus: ConsistencyIssueStatus,
    resolution?: IssueResolutionRecord
  ) => void;
}

export const ConsistencyCenterPreviewView: React.FC<ConsistencyCenterProps> = ({
  studies,
  onOpenStudy,
  onResolveIssue,
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'open' | 'all' | 'resolved'>('open');
  const [resolving, setResolving] = useState<ConsistencyIssue | null>(null);
  const [selectedValue, setSelectedValue] = useState('');
  const [rationale, setRationale] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [sourceViewer, setSourceViewer] = useState<{
    file: BucketDocumentItem;
    studyCode?: string;
    citationLabel?: string;
  } | null>(null);

  const studyForIssue = (issue: ConsistencyIssue) =>
    studies.find((s) => (s.issues || []).some((i) => i.id === issue.id));

  const openSourceForIssue = (issue: ConsistencyIssue) => {
    const study = studyForIssue(issue);
    const file = findSourceFileForCitation(study?.bucketFiles, issue.sourceEvidence);
    if (!file) return;
    setSourceViewer({
      file,
      studyCode: study?.code,
      citationLabel: issue.sourceEvidence,
    });
  };

  const allIssues = studies.flatMap((s) => s.issues || []);
  const openCount = countOpenIssues(allIssues);
  const pendingPropCount = countPendingPropagationIssues(allIssues);

  const filtered = allIssues.filter((iss) => {
    if (severityFilter !== 'all' && iss.severity !== severityFilter) return false;
    if (statusFilter === 'open' && !(isIssueOpen(iss.status) || isIssuePendingPropagation(iss.status))) return false;
    if (statusFilter === 'resolved' && iss.status !== 'resolved') return false;
    return true;
  });

  const openResolveDialog = (issue: ConsistencyIssue) => {
    setResolving(issue);
    setSelectedValue('');
    setRationale('');
    setFormError(null);
  };

  const submitResolution = () => {
    if (!resolving) return;
    if (!selectedValue.trim() || !rationale.trim()) {
      setFormError('Choose a canonical value and add a short rationale. This does not auto-decide clinical truth.');
      return;
    }
    const resolution: IssueResolutionRecord = {
      decision: 'record_decision_demo',
      selectedValue: selectedValue.trim(),
      rationale: rationale.trim(),
      reviewerName: 'Dr. Sophie Laurent',
      reviewerRole: 'COORDINATOR (demo UI only — not server-verified)',
      decidedAt: new Date().toISOString(),
      demoSessionOnly: true,
    };
    // Mark pending_propagation first so counters stay honest until "propagation" is acknowledged
    onResolveIssue(resolving.studyId, resolving.id, 'pending_propagation', resolution);
    setResolving(null);
  };

  const markFullyResolved = (issue: ConsistencyIssue) => {
    onResolveIssue(issue.studyId, issue.id, 'resolved', issue.resolution);
  };

  const reopen = (issue: ConsistencyIssue) => {
    onResolveIssue(issue.studyId, issue.id, 'reopened');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-600" />
            Issues
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Decide mismatches across documents. Choices stay in this demo session only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold">
            {openCount} open
          </span>
          {pendingPropCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-900 font-bold">
              {pendingPropCount} awaiting update
            </span>
          )}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          You choose the value and reason — the app does not decide clinical truth. After a decision, mark documents
          updated before the issue can close.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">Status:</span>
        {(
          [
            { id: 'open' as const, label: 'Open & pending' },
            { id: 'resolved' as const, label: 'Resolved' },
            { id: 'all' as const, label: 'All' },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatusFilter(f.id)}
            className={`px-2.5 py-1 rounded-lg font-medium ${
              statusFilter === f.id ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="text-slate-300 mx-1">|</span>
        <span className="text-slate-400">Severity:</span>
        {(['all', 'high', 'medium', 'low'] as const).map((sev) => (
          <button
            key={sev}
            type="button"
            onClick={() => setSeverityFilter(sev)}
            className={`px-2.5 py-1 rounded-lg font-medium capitalize ${
              severityFilter === sev ? 'bg-teal-700 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-sm font-bold text-slate-900">No issues match these filters</h2>
            <p className="text-xs text-slate-500 mt-1">Try showing all statuses or severities.</p>
          </div>
        )}

        {filtered.map((issue) => {
          const study = studies.find((s) => s.id === issue.studyId);
          const openLike = isIssueOpen(issue.status);

          return (
            <div
              key={issue.id}
              className={`p-5 rounded-2xl border transition-all ${
                issue.status === 'resolved'
                  ? 'bg-slate-50 border-slate-200 opacity-75'
                  : issue.status === 'pending_propagation'
                  ? 'bg-sky-50/40 border-sky-300'
                  : issue.severity === 'high'
                  ? 'bg-white border-red-300 shadow-xs'
                  : 'bg-white border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        issue.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : issue.status === 'pending_propagation'
                          ? 'bg-sky-100 text-sky-800'
                          : issue.severity === 'high'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {issue.status.replace('_', ' ')} · {issue.severity}
                    </span>
                    {issue.issueType && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {issue.issueType}
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                      {study?.code}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{issue.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{issue.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Source evidence
                      </span>
                      {findSourceFileForCitation(studyForIssue(issue)?.bucketFiles, issue.sourceEvidence) ? (
                        <button
                          type="button"
                          onClick={() => openSourceForIssue(issue)}
                          className="text-teal-700 hover:text-teal-900 font-semibold inline-flex items-center gap-1 text-left"
                        >
                          {issue.sourceEvidence}
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </button>
                      ) : (
                        <span className="text-slate-800 font-medium">{issue.sourceEvidence}</span>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        Opens evidence viewer — HTTPS may 403 without GCS IAM.
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-teal-50/60 border border-teal-200">
                      <span className="text-[10px] uppercase font-bold text-teal-700 block mb-0.5">
                        Suggested note
                      </span>
                      <span className="text-teal-900 font-medium">{issue.discrepancyNote}</span>
                    </div>
                  </div>

                  {issue.resolution && (
                    <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-800">Decision recorded (session)</span>
                      <p>
                        Value: <strong>{issue.resolution.selectedValue}</strong>
                      </p>
                      <p>Rationale: {issue.resolution.rationale}</p>
                      <p className="text-slate-500">
                        {issue.resolution.reviewerName} · {issue.resolution.reviewerRole} ·{' '}
                        {new Date(issue.resolution.decidedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col items-stretch gap-2 shrink-0">
                  {issue.status === 'open' || issue.status === 'reopened' || issue.status === 'in_review' ? (
                    <button
                      type="button"
                      onClick={() => openResolveDialog(issue)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Record decision
                    </button>
                  ) : null}
                  {issue.status === 'pending_propagation' && (
                    <button
                      type="button"
                      onClick={() => markFullyResolved(issue)}
                      className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-xs font-semibold"
                    >
                      Mark propagation done
                    </button>
                  )}
                  {(issue.status === 'resolved' || issue.status === 'pending_propagation') && (
                    <button
                      type="button"
                      onClick={() => reopen(issue)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-300"
                    >
                      Reopen
                    </button>
                  )}
                  {study && (
                    <button
                      type="button"
                      onClick={() => onOpenStudy(study.id, 'issues')}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      Open study
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {resolving && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60"
          onClick={() => setResolving(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Record issue decision</h3>
                <p className="text-xs text-slate-500 mt-0.5">{resolving.title}</p>
              </div>
              <button type="button" onClick={() => setResolving(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Demo Mode: this does not update a server audit ledger. Do not treat this as Ethics Committee approval.
            </div>

            {formError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">{formError}</p>
            )}

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 block">Canonical value you are recording *</label>
              <input
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                placeholder='e.g. "3 blood draws (PI-amended local practice)"'
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
              />
              <label className="font-bold text-slate-700 block">Rationale *</label>
              <textarea
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                rows={3}
                placeholder="Why this value should propagate — cite evidence; do not invent clinical truth."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setResolving(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitResolution}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
              >
                Save decision
              </button>
            </div>
          </div>
        </div>
      )}

      <SourceEvidenceViewerModal
        file={sourceViewer?.file ?? null}
        studyCode={sourceViewer?.studyCode}
        citationLabel={sourceViewer?.citationLabel}
        onClose={() => setSourceViewer(null)}
      />
    </div>
  );
};
