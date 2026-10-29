import React, { useState } from 'react';
import {
  X,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
  Globe,
  HardDrive,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Study, BucketDocumentItem, CloudBucketConfig } from '../../types';
import {
  OFFICIAL_GCS_BUCKETS,
  validateBucketUri,
  syncCloudBucketContentFlow,
} from '../../services/cloudBucketService';

interface CloudBucketSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  study: Study;
  onUpdateStudyBucket: (updatedStudy: Study, logs: string[]) => void;
}

export const CloudBucketSyncModal: React.FC<CloudBucketSyncModalProps> = ({
  isOpen,
  onClose,
  study,
  onUpdateStudyBucket,
}) => {
  if (!isOpen) return null;

  const currentBucket: CloudBucketConfig = study.cloudBucket || OFFICIAL_GCS_BUCKETS[0];
  const [bucketUriInput, setBucketUriInput] = useState(currentBucket.bucketUri);
  const [selectedPredefined, setSelectedPredefined] = useState(currentBucket.bucketName);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStep, setSyncStep] = useState<number>(0);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const files: BucketDocumentItem[] = study.bucketFiles || [];

  const handleSelectPredefined = (b: CloudBucketConfig) => {
    setSelectedPredefined(b.bucketName);
    setBucketUriInput(b.bucketUri);
    setErrorMessage(null);
  };

  const handleStartSync = () => {
    const validation = validateBucketUri(bucketUriInput);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid Google Cloud Storage URI.');
      return;
    }
    setErrorMessage(null);
    setIsSyncing(true);
    setSyncStep(1);
    setSyncLogs([`Demo: validating URI format for ${bucketUriInput}`]);

    setTimeout(() => {
      setSyncStep(2);
      setSyncLogs((prev) => [
        ...prev,
        `URI parses as bucket “${validation.bucketName}” — no live GCS call.`,
      ]);
    }, 400);

    setTimeout(() => {
      setSyncStep(3);
      setSyncLogs((prev) => [
        ...prev,
        'Loading the synthetic document list already shipped with this demo.',
      ]);
    }, 900);

    setTimeout(() => {
      setSyncStep(4);
      const { syncedStudy, logs } = syncCloudBucketContentFlow(study);
      setSyncLogs((prev) => [...prev, ...logs]);
      const updatedStudyWithUri: Study = {
        ...syncedStudy,
        cloudBucket: {
          ...syncedStudy.cloudBucket!,
          bucketName: validation.bucketName,
          bucketUri: bucketUriInput,
        },
      };

      setIsSyncing(false);
      onUpdateStudyBucket(updatedStudyWithUri, logs);
    }, 1400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gcs-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-200 bg-amber-900/40 px-2 py-0.5 rounded border border-amber-700/40">
                  Demo sources
                </span>
                <span className="text-xs text-slate-400">URI labels only</span>
              </div>
              <h2 id="gcs-modal-title" className="text-lg font-bold text-white mt-0.5">
                Manage Document Sources (demo)
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 text-xs bg-slate-50/50">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 leading-relaxed">
              <span className="font-bold block text-amber-900">Demo document sources</span>
              <p className="text-amber-800 text-[11px]">
                This dialog only stores a URI label and refreshes the synthetic file list. It does not connect to GCS,
                verify IAM, parse PDFs/DOCX, or prove encryption or Belgian hosting.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Connection</span>
              <div className="flex items-center gap-1.5 mt-1 font-bold text-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>Demo only</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Region label</span>
              <span className="font-semibold text-slate-800 mt-1 block truncate">
                {currentBucket.region || '—'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Encryption</span>
              <span className="font-semibold text-slate-800 mt-1 block">Not verified</span>
            </div>

            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Last demo refresh</span>
              <span className="font-semibold text-slate-800 mt-1 block truncate">
                {currentBucket.lastSyncedAt || '—'}
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 text-xs block">
              Sample URI presets (or enter any gs:// label):
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {OFFICIAL_GCS_BUCKETS.map((b) => {
                const isSelected = selectedPredefined === b.bucketName;
                return (
                  <div
                    key={b.bucketName}
                    onClick={() => handleSelectPredefined(b)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/60 shadow-xs ring-1 ring-teal-500/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[11px] font-bold text-slate-800 truncate">
                        {b.bucketName}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-teal-600" />}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{b.compliance}</p>
                    <span className="text-[10px] font-mono text-teal-800 block mt-1">{b.bucketUri}</span>
                  </div>
                );
              })}
            </div>

            {/* Custom Bucket URI input */}
            <div className="pt-2">
              <label className="block text-slate-700 font-semibold mb-1">Google Cloud Storage URI (gs://):</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={bucketUriInput}
                  onChange={(e) => {
                    setBucketUriInput(e.target.value);
                    setSelectedPredefined('');
                  }}
                  placeholder="gs://my-hospital-bucket/trial-protocols/"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
                <button
                  onClick={handleStartSync}
                  disabled={isSyncing}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Refreshing…' : 'Refresh demo sources'}</span>
                </button>
              </div>
              {errorMessage && <p className="text-red-600 text-[11px] mt-1 font-medium">{errorMessage}</p>}
            </div>
          </div>

          {/* Sync Progress & Pipeline Step Indicators */}
          {isSyncing && (
            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-400 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Demo refresh (step {syncStep} of 4)
                </span>
                <span className="text-[10px] text-slate-400">No live API</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                {syncLogs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-teal-400">›</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bucket Files Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs">
                  Study documents ({files.length} demo rows)
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Synthetic names and sizes — checksums are placeholders, not verified hashes
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px]">
                DEMO LIST
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/60 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Document Object</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Size (demo)</th>
                    <th className="py-2.5 px-3">Target Audiences</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 block">{file.name}</span>
                            <span className="font-mono text-[10px] text-slate-400 truncate max-w-xs block">
                              {file.path}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
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
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-800">{file.sizeFormatted}</span>
                        <span className="font-mono text-[10px] text-slate-400 block">
                          Placeholder hash: {file.checksumMd5}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {file.targetAudiences?.map((aud) => (
                            <span
                              key={aud}
                              className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono text-[9px]"
                            >
                              {aud}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" />
                          Ingested & Linked
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            Demo Mode: URI labels and file rows stay in this browser session only.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
