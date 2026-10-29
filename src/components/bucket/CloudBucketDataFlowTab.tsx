import React, { useState } from 'react';
import {
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  ShieldCheck,
  Layers,
  Sparkles,
  ExternalLink,
  Lock,
  GitBranch,
} from 'lucide-react';
import { Study, BucketDocumentItem } from '../../types';
import { syncCloudBucketContentFlow } from '../../services/cloudBucketService';
import { SourceEvidenceViewerModal } from './SourceEvidenceViewerModal';

interface CloudBucketDataFlowTabProps {
  study: Study;
  onUpdateStudyBucket: (updatedStudy: Study, logs: string[]) => void;
  onOpenSyncModal: () => void;
}

const EVIDENCE_CARDS: {
  id: string;
  label: string;
  match: (f: BucketDocumentItem) => boolean;
  blurb: string;
  tone: string;
}[] = [
  {
    id: 'ev-protocol',
    label: 'Source Document 1',
    match: (f) => f.category === 'protocol' && /protocol/i.test(f.name),
    blurb: 'Sample story: duration, investigational agent, blood-draw schedule.',
    tone: 'bg-slate-50 border-slate-200',
  },
  {
    id: 'ev-markup',
    label: 'Source Document 2 (Investigator Markup)',
    match: (f) => f.category === 'pi_markup',
    blurb: 'Sample discrepancy story: §4.2 shows 3 draws vs protocol 4.',
    tone: 'bg-purple-50/60 border-purple-200',
  },
  {
    id: 'ev-template',
    label: 'Source Document 3 (Templates)',
    match: (f) => f.category === 'template' && /EN|_Master_EN|Master/i.test(f.name),
    blurb: 'Sample template row. Verbatim legal-clause checks are demo-only.',
    tone: 'bg-teal-50/60 border-teal-200',
  },
];

export const CloudBucketDataFlowTab: React.FC<CloudBucketDataFlowTabProps> = ({
  study,
  onUpdateStudyBucket,
  onOpenSyncModal,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<BucketDocumentItem | null>(null);
  const [viewerFile, setViewerFile] = useState<BucketDocumentItem | null>(null);

  const bucket = study.cloudBucket || {
    bucketName: 'bspho-trial-dossiers-belgium',
    bucketUri: `gs://bspho-trial-dossiers-belgium/protocols/${study.code}/`,
    region: 'europe-west1 (Brussels, Belgium)',
    storageClass: 'STANDARD' as const,
    encryption: 'CMEK (Customer Managed)' as const,
    compliance: 'Belgian Law of 7 May 2004 & EU GDPR Compliant',
    isConnected: false,
    lastSyncedAt: '2026-10-29 11:35 CET',
    totalObjects: 8,
    totalSizeMb: 31.8,
  };

  const files = study.bucketFiles || [];

  const handleQuickSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const { syncedStudy, logs } = syncCloudBucketContentFlow(study);
      onUpdateStudyBucket(syncedStudy, logs);
      setIsRefreshing(false);
    }, 900);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Source Documents & Evidence (coordinator-facing) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-2xl p-6 text-white border border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="text-xs font-bold text-amber-200">Demo Mode · synthetic source list</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs text-slate-300">Live GCS/IAM not verified in this build</span>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-400" />
            <span>Source Documents & Evidence</span>
          </h3>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            Study documents used for this consent package (protocol, templates, markups). File names and paths below are
            demonstration data — not proof of real cloud retrieval.
          </p>
          <details className="mt-2 text-[11px] text-slate-400">
            <summary className="cursor-pointer text-teal-300 hover:text-teal-200">Technical details</summary>
            <p className="mt-1 font-mono break-all">{bucket.bucketUri}</p>
            <p>{bucket.region} · last sync label: {bucket.lastSyncedAt}</p>
          </details>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleQuickSync}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.01]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing…' : 'Refresh documents'}</span>
          </button>

          <button
            onClick={onOpenSyncModal}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors"
          >
            Manage document sources
          </button>
        </div>
      </div>

      {/* Study documents & evidence tracking */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 text-sm">
              Study Documents & Evidence Tracking
            </h4>
            <p className="text-slate-500 text-xs mt-0.5">
              Demo pipeline stages — measured processing status is not available yet
            </p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold text-[11px]">
            Demo metrics only
          </span>
        </div>

        {/* 5-Stage Architecture Flow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded">
                1. Sources
              </span>
              <Database className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Register sources</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Intended: attach protocol / templates. Here: demo file names only.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded">
                2. Evidence
              </span>
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Extract facts</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Intended: parse uploads. Here: preseeded sample facts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                3. Templates
              </span>
              <Lock className="w-3.5 h-3.5 text-purple-600" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Apply template rules</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Intended: locked legal blocks. Policy checks not verified here.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-teal-700 bg-teal-100 px-1.5 py-0.2 rounded">
                4. Translation
              </span>
              <GitBranch className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="font-bold text-slate-900 text-xs">NL / FR adapt</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Intended: adapted drafts. No live translation run in this build.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">
                5. Outputs
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="font-bold text-slate-900 text-xs">Document matrix</div>
            <p className="text-[11px] text-slate-500 leading-tight">
              Audience × language cards in the workspace — status is demo state.
            </p>
          </div>
        </div>
      </div>

      {/* Study documents & evidence references */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Study Documents */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">
                Study Documents ({files.length})
              </h4>
              <p className="text-slate-500 text-xs mt-0.5">
                Click a file to open the evidence viewer (demo preview + open links)
              </p>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Demo sources</span>
          </div>

          <div className="space-y-2.5">
            {files.length === 0 && (
              <div className="p-6 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
                No study documents registered for this study yet.
              </div>
            )}
            {files.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedFile(file);
                    setViewerFile(file);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedFile(file);
                      setViewerFile(file);
                    }
                  }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all text-left ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 text-xs truncate">{file.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 mt-0.5 truncate">{file.path}</div>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                        file.category === 'protocol'
                          ? 'bg-blue-100 text-blue-800'
                          : file.category === 'template'
                          ? 'bg-purple-100 text-purple-800'
                          : file.category === 'pi_markup'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {file.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 gap-2">
                    <span>
                      {file.sizeFormatted} • Updated: {file.updatedAt}
                    </span>
                    <span className="font-semibold text-teal-700 inline-flex items-center gap-1 shrink-0">
                      Open source
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Evidence & Source References</h4>
              <p className="text-slate-500 text-xs mt-0.5">Click to open the matching registered file</p>
            </div>
          </div>

          <div className="space-y-3">
            {EVIDENCE_CARDS.map((card) => {
              const matched = files.find(card.match) || null;
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={!matched}
                  onClick={() => matched && setViewerFile(matched)}
                  className={`w-full text-left p-3 rounded-xl border space-y-1 transition-all ${card.tone} ${
                    matched ? 'hover:ring-1 hover:ring-teal-400/40 cursor-pointer' : 'opacity-60 cursor-not-allowed'
                  }`}
                >
                  <span className="font-mono text-[10px] text-slate-500 uppercase font-bold block">
                    {card.label}
                  </span>
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between gap-2">
                    <span className="truncate">{matched?.name || 'Not registered on this study'}</span>
                    {matched && <ExternalLink className="w-3.5 h-3.5 text-teal-700 shrink-0" />}
                  </div>
                  <p className="text-slate-600 text-[11px]">{card.blurb}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <SourceEvidenceViewerModal
        file={viewerFile}
        studyCode={study.code}
        onClose={() => setViewerFile(null)}
      />
    </div>
  );
};
