import React, { useState } from 'react';
import {
  GitCompare,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ShieldCheck,
  Check,
  X,
  Info,
} from 'lucide-react';

export const UpdateMigrationPreviewView: React.FC = () => {
  const [confirmedDiffs, setConfirmedDiffs] = useState<string[]>([]);

  const migrationItems = [
    {
      id: 'diff-1',
      section: 'Section 3.4 (Data Protection)',
      category: 'CHANGED_BY_TEMPLATE',
      title: 'Sample GDPR retention clause update (demo)',
      oldText:
        'Personal data will be stored under Belgian Privacy Law and standard GDPR guidelines for 15 years.',
      newText:
        'Personal health and genomic data will be archived in the secure Belgian Paediatric Data Hub for 25 years in compliance with EU Clinical Trials Regulation 536/2014 and Belgian Law.',
      impact: '12 documents across all 3 languages will receive the updated regulatory text.',
      requiresReview: false,
    },
    {
      id: 'diff-2',
      section: 'Section 4.3 (Adolescent Assent)',
      category: 'REQUIRES_HUMAN_REVIEW',
      title: 'Cognitive Maturity Assent Threshold Realignment',
      oldText:
        'Participants aged 12 to 18 sign the standard adolescent agreement document alongside parent co-signature.',
      newText:
        'Participants aged 12 to 17 sign the assent booklet; upon reaching 18th birthday during study course, re-consent under Adult Form is legally mandatory.',
      impact: 'Requires PI Dr. De Moerloose confirmation before applying to active patients in maintenance phase.',
      requiresReview: true,
    },
    {
      id: 'diff-3',
      section: 'Section 5.1 (PI Redline Preservation)',
      category: 'PRESERVED',
      title: 'Investigator Clinical Modification Preserved',
      oldText: '3 blood draws (amended by investigator)',
      newText: '3 blood draws (preserved without overwrite)',
      impact: 'Preserved: Never silently overwrite human clinical edits.',
      requiresReview: false,
    },
  ];

  const handleToggleConfirm = (id: string) => {
    if (confirmedDiffs.includes(id)) {
      setConfirmedDiffs(confirmedDiffs.filter((item) => item !== id));
    } else {
      setConfirmedDiffs([...confirmedDiffs, id]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-teal-600" />
          Template Updates
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Sample v2.3 → v2.4 migration preview — confirmations stay in this browser session
        </p>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
        <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5">Demo preview</span>
          Intended rule: never silently overwrite PI edits. This screen shows sample diffs only; it does not publish
          templates or rewrite study documents.
        </div>
      </div>

      {/* Migration Selector Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Baseline Version</span>
            <span className="font-bold text-slate-800 text-sm">BSPHO Template v2.3 (2023)</span>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-400" />
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200">
            <span className="text-[10px] uppercase font-bold text-teal-700 block">Target Standard</span>
            <span className="font-bold text-teal-900 text-sm">BSPHO Template v2.4 (2024)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">Target Study:</span>
          <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded">
            BSPHO-2023-SARCOMA-08 (Euro-Ewing)
          </span>
        </div>
      </div>

      {/* Migration Diffs */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-slate-900">
          Template Migration Preview (4 Outcomes Classification)
        </h3>

        {migrationItems.map((item) => {
          const isConfirmed = confirmedDiffs.includes(item.id);
          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.requiresReview
                  ? 'border-amber-300 bg-amber-50/20'
                  : item.category === 'PRESERVED'
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2 flex-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.category === 'PRESERVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.category === 'REQUIRES_HUMAN_REVIEW'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {item.category.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-slate-500 font-bold">{item.section}</span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{item.title}</h4>
                  <p className="text-slate-600">{item.impact}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Current Template (v2.3)
                      </span>
                      <p className="text-slate-700 italic">"{item.oldText}"</p>
                    </div>

                    <div className="p-3 rounded-lg bg-teal-50/50 border border-teal-200">
                      <span className="text-[10px] uppercase font-bold text-teal-700 block mb-0.5">
                        Proposed New Template (v2.4)
                      </span>
                      <p className="text-teal-950 font-semibold italic">"{item.newText}"</p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleConfirm(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isConfirmed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isConfirmed ? 'Approved for Migration' : 'Review & Approve'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
