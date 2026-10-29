import React, { useState } from 'react';
import {
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Languages,
  Users,
  ShieldCheck,
  History,
  FileCheck,
  Edit3,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';
import { ICFDocument, DocumentBlock, BlockPolicy } from '../../types';
import {
  AUDIENCE_CONFIG,
  LANGUAGE_CONFIG,
  getDocumentStatusMeta,
  getBlockPolicyLabel,
  getNextDocumentStatus,
  getDocumentStatusActionLabel,
} from '../../utils/studyLogic';

interface DocumentDetailModalProps {
  document: ICFDocument | null;
  studyCode: string;
  onClose: () => void;
  onUpdateStatus?: (docId: string, newStatus: ICFDocument['status']) => void;
  /** Study-level high-severity open issues (UI gate — not server auth) */
  hasBlockingIssues?: boolean;
}

export const DocumentDetailModal: React.FC<DocumentDetailModalProps> = ({
  document,
  studyCode,
  onClose,
  onUpdateStatus,
  hasBlockingIssues = false,
}) => {
  if (!document) return null;

  const audMeta = AUDIENCE_CONFIG[document.audience];
  const langMeta = LANGUAGE_CONFIG[document.language];
  const statusMeta = getDocumentStatusMeta(document.status);

  const [activeTab, setActiveTab] = useState<'preview' | 'changes' | 'blocks' | 'compliance'>('preview');
  const approvalBlocked =
    hasBlockingIssues || document.issueCount > 0;

  const getPolicyBadge = (policy: BlockPolicy) => {
    const meta = getBlockPolicyLabel(policy);
    const colorByPolicy: Record<BlockPolicy, string> = {
      REQUIRED_VERBATIM: 'bg-purple-100 text-purple-800 border-purple-200',
      ADAPTABLE_REQUIRED: 'bg-blue-100 text-blue-800 border-blue-200',
      INSTRUCTION: 'bg-amber-100 text-amber-800 border-amber-200',
      PLACEHOLDER: 'bg-orange-100 text-orange-800 border-orange-200',
      OPTIONAL: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colorByPolicy[policy]}`}
        title={meta.hint}
      >
        {meta.label}
      </span>
    );
  };

  const nextStatus = getNextDocumentStatus(document.status);
  const nextActionLabel = getDocumentStatusActionLabel(document.status);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded">
                {studyCode}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">
                {langMeta.name} ({document.language})
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-600 font-medium">
                {audMeta.label} ({audMeta.ageRange})
              </span>
            </div>
            <h2 id="doc-modal-title" className="text-lg font-bold text-slate-900">
              {document.title}
            </h2>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold border ${statusMeta.badgeClass}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.indicatorColor}`}></span>
                {statusMeta.label}
              </span>
              <span className="text-slate-500">Version: {document.version}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-500">~{document.wordCount.toLocaleString()} words</span>
              {document.issueCount > 0 && (
                <span className="inline-flex items-center gap-1 text-red-600 font-semibold bg-red-50 px-2 py-0.5 rounded-md border border-red-200 text-[11px]">
                  <AlertTriangle className="w-3 h-3" />
                  {document.issueCount} Open Issue{document.issueCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher — preview first (CF-030) */}
        <div className="px-5 border-b border-slate-200 bg-white flex items-center gap-4 text-xs font-semibold overflow-x-auto">
          {(
            [
              { id: 'preview' as const, label: 'Document preview' },
              { id: 'changes' as const, label: 'Changes & issues' },
              { id: 'compliance' as const, label: 'Sources & compliance' },
              { id: 'blocks' as const, label: 'Advanced blocks' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-teal-600 text-teal-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Readable preview of demo content. This is <strong>not</strong> an Ethics Committee–approved PDF.
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-sm text-slate-800 leading-relaxed">
                <h3 className="text-base font-bold text-slate-900">{document.title}</h3>
                <p className="text-xs text-slate-500">
                  {audMeta.label} · {langMeta.name} · {document.version}
                </p>
                {(document.blocks && document.blocks.length > 0
                  ? document.blocks
                  : [
                      {
                        id: 'preview-fallback',
                        sectionNumber: '—',
                        title: 'Summary',
                        content:
                          'Structured blocks for this language variant are not expanded in the demo. English master documents show full sample sections.',
                        policy: 'INSTRUCTION' as const,
                      },
                    ]
                ).map((block) => (
                  <section key={block.id} className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-900">
                      {block.sectionNumber !== '—' ? `§ ${block.sectionNumber} · ` : ''}
                      {block.title}
                    </h4>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{block.content}</p>
                  </section>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'changes' && (
            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <History className="w-4 h-4 text-teal-600" />
                Changes & issues
              </h4>
              {document.issueCount > 0 && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-900 flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    This document reports {document.issueCount} linked issue
                    {document.issueCount > 1 ? 's' : ''}. Resolve high-severity study issues before clinical approval.
                  </span>
                </div>
              )}
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">PI markup (demo)</span>
                  <span className="text-[11px] text-slate-500">2026-10-28</span>
                </div>
                <p className="text-slate-600">
                  Before: 4 venous blood draws · After: 3 draws (local protocol amendment).
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <span className="font-semibold text-slate-800">Initial draft (demo)</span>
                <p className="text-slate-600">Generated from sponsor protocol using BSPHO template profile.</p>
              </div>
            </div>
          )}

          {activeTab === 'blocks' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-teal-50/80 border border-teal-200 text-xs text-teal-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
                  <span>
                    <strong>Locked legal text</strong> cannot be changed. Editable clinical sections can be adapted for age
                    and language while staying medically accurate.
                  </span>
                </div>
              </div>

              {document.blocks && document.blocks.length > 0 ? (
                document.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          § {block.sectionNumber}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{block.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {block.isEditedByPI && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <Edit3 className="w-3 h-3" />
                            PI Modified
                          </span>
                        )}
                        {getPolicyBadge(block.policy)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {block.content}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span>Source: {block.sourceReference || 'BSPHO Standard Template'}</span>
                      {block.notes && (
                        <span className="text-amber-800 font-medium">Note: {block.notes}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center bg-white rounded-xl border border-slate-200">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-700 font-semibold">
                    Full section detail is available after English master review
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    This {langMeta.name} {audMeta.label.toLowerCase()} form follows the BSPHO template. Open an English
                    master document to inspect editable vs locked blocks.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 mb-2">Sources & compliance (demo metadata)</h4>
              <p className="text-slate-500">
                Template policy and legal framework labels below are for demonstration. They are not a certificate of
                Ethics Committee or FAMHP approval.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Legal Framework
                  </span>
                  <span className="font-medium text-slate-800">Belgian Law of 7 May 2004</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Template Standard
                  </span>
                  <span className="font-medium text-slate-800">{document.templateVersion}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Audience Target
                  </span>
                  <span className="font-medium text-slate-800">{audMeta.label} ({audMeta.ageRange})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    Last Modifier
                  </span>
                  <span className="font-medium text-slate-800">{document.updatedBy}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 space-y-1">
            <p>Demo Mode: status changes stay in this browser session — not a server audit trail.</p>
            {approvalBlocked && (
              <p className="text-red-700 font-medium">
                Approval blocked while high-severity / document issues remain open.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {onUpdateStatus && nextStatus && nextActionLabel && !(nextStatus === 'approved' && approvalBlocked) && (
              <button
                onClick={() => {
                  if (nextStatus === 'approved' && approvalBlocked) return;
                  onUpdateStatus(document.id, nextStatus);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{nextActionLabel}</span>
              </button>
            )}
            {onUpdateStatus &&
              document.status !== 'approved' &&
              document.status !== 'exported' &&
              nextStatus !== 'approved' && (
                <button
                  onClick={() => {
                    if (approvalBlocked) return;
                    onUpdateStatus(document.id, 'approved');
                    onClose();
                  }}
                  disabled={approvalBlocked}
                  title={
                    approvalBlocked
                      ? 'Resolve blocking issues first'
                      : `Approve ${document.version} for clinical submission (demo) — not Ethics Committee approval`
                  }
                  className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 font-semibold text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Approve {document.version} (clinical)
                </button>
              )}
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
