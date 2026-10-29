import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  User,
  ShieldCheck,
  Calendar,
  ExternalLink,
} from 'lucide-react';

interface AuditRecord {
  id: string;
  studyCode: string;
  document: string;
  section: string;
  changeType: 'PI_EDIT' | 'SOURCE_PROPAGATION' | 'LEGAL_UPDATE' | 'TRANSLATION_ADAPT';
  originalValue: string;
  newValue: string;
  sourceReference: string;
  reason: string;
  reviewer: string;
  timestamp: string;
  status: 'APPROVED' | 'IN_REVIEW' | 'FLAGGED';
}

export const TraceabilityLedgerPreviewView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const records: AuditRecord[] = [
    {
      id: 'aud-001',
      studyCode: 'BSPHO-2024-LEUK-01',
      document: 'Parent / Legal Guardian ICF (EN)',
      section: '§ 4.2 Study Procedures',
      changeType: 'PI_EDIT',
      originalValue: '4 blood draws scheduled during routine venous access',
      newValue: '3 blood draws scheduled during routine venous access',
      sourceReference: 'Investigator Word Markup p.12',
      reason: 'Amended to conform with UZ Gent paediatric central venous cannula access routines.',
      reviewer: 'Prof. Dr. Barbara De Moerloose',
      timestamp: '2026-10-28 14:15 CET',
      status: 'APPROVED',
    },
    {
      id: 'aud-002',
      studyCode: 'BSPHO-2024-LEUK-01',
      document: 'Parent / Legal Guardian ICF (NL)',
      section: '§ 4.2 Onderzoeksprocedures',
      changeType: 'TRANSLATION_ADAPT',
      originalValue: '4 bloedafnames tijdens routinematige toegang',
      newValue: '3 bloedafnames tijdens routinematige veneuze toegang',
      sourceReference: 'Synchronized from Master EN (§ 4.2)',
      reason: 'Cross-language propagation of investigator amendment.',
      reviewer: 'Elena Vanderberghe (BSPHO)',
      timestamp: '2026-10-28 15:30 CET',
      status: 'APPROVED',
    },
    {
      id: 'aud-003',
      studyCode: 'BSPHO-2024-LEUK-01',
      document: 'Adult Participant ICF (EN)',
      section: '§ 5.0 No-Fault Insurance',
      changeType: 'LEGAL_UPDATE',
      originalValue: 'Chubb Insurance Policy BEL-CLIN-2023-8812',
      newValue: 'Chubb European Group SE - Policy BEL-CLIN-2024-9982',
      sourceReference: 'Central Ethics Dossier Annex 4',
      reason: 'Annual renewal of Belgian Law 7 May 2004 Art. 29 no-fault insurance policy.',
      reviewer: 'Dr. Sophie Laurent',
      timestamp: '2026-10-27 11:20 CET',
      status: 'APPROVED',
    },
    {
      id: 'aud-004',
      studyCode: 'BSPHO-2024-LEUK-01',
      document: 'Parent ICF (FR)',
      section: '§ 6.1 Contacts locaux',
      changeType: 'SOURCE_PROPAGATION',
      originalValue: '[Cliniques universitaires Saint-Luc contact placeholder]',
      newValue: 'Dr. Marc Henrion, Service d\'Hémato-Oncologie Pédiatrique, Saint-Luc (+32 2 764 11 11)',
      sourceReference: 'Site Information Form Annex 1',
      reason: 'Site-specific coordinator details integrated into template placeholder.',
      reviewer: 'Dr. Marc Henrion',
      timestamp: '2026-10-26 16:45 CET',
      status: 'APPROVED',
    },
  ];

  const filtered = records.filter((r) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      r.studyCode.toLowerCase().includes(q) ||
      r.document.toLowerCase().includes(q) ||
      r.section.toLowerCase().includes(q) ||
      r.reviewer.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q);

    const matchesType = typeFilter === 'all' || r.changeType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-teal-600" />
            Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Sample change history for demos — not an immutable or FAMHP-ready ledger
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-amber-900 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          <span>Demo records only</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search study, section, reviewer, text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-slate-400 text-xs">Change Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
          >
            <option value="all">All Change Types</option>
            <option value="PI_EDIT">PI Redline Edits</option>
            <option value="TRANSLATION_ADAPT">Translation Adaptations</option>
            <option value="LEGAL_UPDATE">Legal & Insurance Updates</option>
            <option value="SOURCE_PROPAGATION">Site Data Propagations</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Study & Target Document</th>
                <th className="py-3 px-4">Section / Block</th>
                <th className="py-3 px-4">Change Type</th>
                <th className="py-3 px-4">Original vs New Content</th>
                <th className="py-3 px-4">Reviewer & Source</th>
                <th className="py-3 px-4">Timestamp & Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-mono text-teal-800 font-bold block">{item.studyCode}</span>
                    <span className="text-slate-600 font-semibold">{item.document}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.section}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        item.changeType === 'PI_EDIT'
                          ? 'bg-purple-100 text-purple-800'
                          : item.changeType === 'LEGAL_UPDATE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {item.changeType.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 max-w-sm">
                    <div className="line-through text-red-600 text-[11px] mb-1 font-mono">
                      "{item.originalValue}"
                    </div>
                    <div className="text-emerald-700 text-[11px] font-semibold font-mono">
                      "{item.newValue}"
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 italic leading-tight">
                      Reason: {item.reason}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.reviewer}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Ref: {item.sourceReference}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-slate-600">{item.timestamp}</div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
