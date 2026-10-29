import React, { useEffect, useState } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Copy,
  BookOpen,
} from 'lucide-react';
import { BucketDocumentItem } from '../../types';
import {
  getDemoSourceExcerpt,
  getSourceOpenability,
} from '../../services/cloudBucketService';

interface SourceEvidenceViewerModalProps {
  file: BucketDocumentItem | null;
  studyCode?: string;
  citationLabel?: string;
  pageHint?: number | string;
  onClose: () => void;
}

export const SourceEvidenceViewerModal: React.FC<SourceEvidenceViewerModalProps> = ({
  file,
  studyCode,
  citationLabel,
  pageHint,
  onClose,
}) => {
  const [httpsStatus, setHttpsStatus] = useState<'idle' | 'checking' | 'reachable' | 'blocked'>('idle');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!file) return;
    const open = getSourceOpenability(file);
    if (!open.httpsUrl) {
      setHttpsStatus('blocked');
      return;
    }
    let cancelled = false;
    setHttpsStatus('checking');
    // HEAD often blocked by CORS; a no-cors fetch only proves the browser accepted the request, not 200.
    // We attempt a lightweight probe and treat failures/opaque as "may be blocked".
    fetch(open.httpsUrl, { method: 'GET', mode: 'no-cors' })
      .then(() => {
        if (!cancelled) setHttpsStatus('reachable');
      })
      .catch(() => {
        if (!cancelled) setHttpsStatus('blocked');
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) return null;

  const open = getSourceOpenability(file);
  const excerpt = getDemoSourceExcerpt(file);

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(file.path);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-viewer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {studyCode && (
                <span className="font-mono text-[10px] font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  {studyCode}
                </span>
              )}
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                {file.category.replace('_', ' ')}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                Evidence viewer
              </span>
            </div>
            <h2 id="source-viewer-title" className="text-base font-bold text-slate-900 truncate">
              {file.name}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono break-all">{file.path}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close source viewer"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>{open.note}</p>
          </div>

          {(citationLabel || pageHint != null) && (
            <div className="p-3 rounded-xl border border-slate-200 bg-slate-50">
              <p className="text-[10px] font-bold uppercase text-slate-400 mb-1">Citation</p>
              {citationLabel && <p className="font-semibold text-slate-800">{citationLabel}</p>}
              <p className="text-slate-500 mt-0.5">
                {pageHint != null
                  ? `Referenced page / section: ${pageHint}`
                  : excerpt.pageHint || 'Page not specified'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Size</span>
              <span className="font-semibold text-slate-800">{file.sizeFormatted}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Updated</span>
              <span className="font-semibold text-slate-800">{file.updatedAt}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Type</span>
              <span className="font-semibold text-slate-800 truncate" title={file.contentType}>
                {file.contentType.includes('pdf')
                  ? 'PDF'
                  : file.contentType.includes('word')
                  ? 'DOCX'
                  : file.contentType}
              </span>
            </div>
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Ingestion</span>
              <span className="font-semibold text-slate-800">{file.ingestionStatus}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <BookOpen className="w-4 h-4 text-teal-600" />
              {excerpt.heading}
            </div>
            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{excerpt.body}</p>
            {excerpt.pageHint && <p className="text-[10px] text-slate-400">{excerpt.pageHint}</p>}
          </div>

          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <p className="font-semibold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Live object access
            </p>
            <p className="text-slate-600">
              {httpsStatus === 'checking' && 'Checking browser reachability…'}
              {httpsStatus === 'reachable' &&
                'Browser accepted a request to the HTTPS object URL (response may still be opaque/403).'}
              {httpsStatus === 'blocked' &&
                'Direct HTTPS open is unavailable or blocked in this browser (expected without GCS IAM).'}
              {httpsStatus === 'idle' && 'Not checked yet.'}
            </p>
            {httpsStatus === 'reachable' ? (
              <p className="text-emerald-700 flex items-center gap-1 text-[11px] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Probe completed — open links below to verify
              </p>
            ) : null}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={copyPath}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 inline-flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5" />
            {copied ? 'Copied path' : 'Copy gs:// path'}
          </button>
          <div className="flex items-center gap-2">
            {open.consoleUrl && (
              <a
                href={open.consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                GCP Console
              </a>
            )}
            {open.httpsUrl && (
              <a
                href={open.httpsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open HTTPS URL
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
