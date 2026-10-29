import React, { useState } from 'react';
import {
  BookOpen,
  Info,
  Plus,
  X,
  Check,
  ArrowRight,
  FilePlus2,
  Layers,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { BlockPolicy } from '../../types';
import { DEFAULT_TEMPLATE_SECTIONS, getBlockPolicyLabel } from '../../utils/studyLogic';

interface TemplateBlockItem {
  id: string;
  section: string;
  name: string;
  policy: BlockPolicy;
  language: string;
  sampleText: string;
  guidanceNote: string;
}

interface LibraryTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  profile: 'interventional' | 'observational' | 'custom';
  status: 'active' | 'modular' | 'legacy' | 'draft';
  documentCount: number;
  excludeInsurance: boolean;
  excludeContraception: boolean;
  excludeBiobanking: boolean;
  createdDate: string;
}

const INITIAL_TEMPLATES: LibraryTemplate[] = [
  {
    id: 'tmpl-v24',
    code: 'v2.4',
    name: 'BSPHO Paediatric Master Suite (2024)',
    description:
      'Full interventional baseline with Belgian Law Art. 6 & Art. 29, GDPR, and 4 audience × 3 language variants.',
    profile: 'interventional',
    status: 'active',
    documentCount: 12,
    excludeInsurance: false,
    excludeContraception: false,
    excludeBiobanking: false,
    createdDate: '2024-06-15',
  },
  {
    id: 'tmpl-hiruz',
    code: 'HIRUZ',
    name: 'Observational & Registry Profile',
    description:
      'Non-drug / registry studies. Insurance and contraception sections excluded by default.',
    profile: 'observational',
    status: 'modular',
    documentCount: 12,
    excludeInsurance: true,
    excludeContraception: true,
    excludeBiobanking: false,
    createdDate: '2024-08-01',
  },
  {
    id: 'tmpl-v23',
    code: 'v2.3',
    name: 'BSPHO Legacy Baseline (2023)',
    description: 'Earlier standard still used by ongoing trials. Eligible for migration to v2.4.',
    profile: 'interventional',
    status: 'legacy',
    documentCount: 12,
    excludeInsurance: false,
    excludeContraception: false,
    excludeBiobanking: false,
    createdDate: '2023-03-10',
  },
];

const INITIAL_BLOCKS: TemplateBlockItem[] = [
  {
    id: 'blk-pol-1',
    section: '3.1',
    name: 'Voluntary Consent & Withdrawal Protection',
    policy: 'REQUIRED_VERBATIM',
    language: 'NL / FR / EN',
    sampleText:
      'Participation in this clinical experiment is voluntary. Refusal or decision to stop will never affect the quality of continuing healthcare or relations with treating clinicians.',
    guidanceNote: 'Mandatory under Belgian Law of 7 May 2004 Art. 6.',
  },
  {
    id: 'blk-pol-2',
    section: '5.0',
    name: 'No-Fault Clinical Trial Insurance (Belgian Law Art. 29)',
    policy: 'REQUIRED_VERBATIM',
    language: 'NL / FR / EN',
    sampleText:
      'Even in the absence of fault, the sponsor is liable for damages sustained by the participant directly linked to the clinical trial, pursuant to Article 29 of the Belgian Law of 7 May 2004.',
    guidanceNote: 'Keep exact wording across all Belgian sites and languages.',
  },
  {
    id: 'blk-pol-3',
    section: '4.1',
    name: 'Treatment Schedule & Investigational Dosing',
    policy: 'ADAPTABLE_REQUIRED',
    language: 'EN (translated to NL/FR)',
    sampleText:
      'Your child will receive [investigational_agent] in combination with standard therapy for a duration of [study_duration].',
    guidanceNote: 'Filled from protocol facts; adapt wording by age group.',
  },
  {
    id: 'blk-pol-4',
    section: '6.2',
    name: 'Site Emergency Contacts & 24/7 Ward Pager',
    policy: 'PLACEHOLDER',
    language: 'Site-specific',
    sampleText:
      '[Insert Hospital Site Emergency Telephone, Treating On-Call Oncologist, and Hospital Ward Floor].',
    guidanceNote: 'Populate from each participating hospital annex.',
  },
  {
    id: 'blk-pol-5',
    section: '7.3',
    name: 'Optional Genetic Biobanking for Future Paediatric Research',
    policy: 'OPTIONAL',
    language: 'NL / FR / EN',
    sampleText:
      'I consent / do not consent to residual blood and bone marrow samples being stored in the Belgian Paediatric Tumour Biobank for future cancer research.',
    guidanceNote: 'Requires a separate opt-in checkbox in the signature block.',
  },
  {
    id: 'blk-pol-6',
    section: '0.1',
    name: 'Investigator Guidance Note (Template Instructions)',
    policy: 'INSTRUCTION',
    language: 'Investigator only',
    sampleText:
      'INSTRUCTION TO INVESTIGATOR: Replace bracketed text with patient-friendly terms. Ensure adolescent assent is signed in addition to parent consent if patient is >= 12 years.',
    guidanceNote: 'Intended to be omitted from ethics export when excluded.',
  },
];

export const TemplateLibraryPreviewView: React.FC = () => {
  const [selectedPolicyFilter, setSelectedPolicyFilter] = useState<string>('all');
  const [blocks, setBlocks] = useState<TemplateBlockItem[]>(INITIAL_BLOCKS);
  const [templates, setTemplates] = useState<LibraryTemplate[]>(INITIAL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(INITIAL_TEMPLATES[0].id);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createStep, setCreateStep] = useState<1 | 2 | 3>(1);
  const [toast, setToast] = useState<string | null>(null);

  // Editor form state
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProfile, setNewProfile] = useState<'interventional' | 'observational' | 'custom'>(
    'custom'
  );
  const [excludeInsurance, setExcludeInsurance] = useState(false);
  const [excludeContraception, setExcludeContraception] = useState(false);
  const [excludeBiobanking, setExcludeBiobanking] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];
  const isEditMode = editorMode === 'edit';

  const filteredBlocks = blocks.filter((b) => {
    if (selectedPolicyFilter === 'all') return true;
    return b.policy === selectedPolicyFilter;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const fillFormFromTemplate = (tmpl: LibraryTemplate, asDuplicate = false) => {
    setCreateStep(1);
    setNewName(asDuplicate ? `${tmpl.name} (copy)` : tmpl.name);
    setNewCode(asDuplicate ? `${tmpl.code}-COPY` : tmpl.code);
    setNewDescription(tmpl.description);
    setNewProfile(tmpl.profile);
    setExcludeInsurance(tmpl.excludeInsurance);
    setExcludeContraception(tmpl.excludeContraception);
    setExcludeBiobanking(tmpl.excludeBiobanking);
    setFormError(null);
  };

  const resetCreateForm = () => {
    setCreateStep(1);
    setNewName('');
    setNewCode('');
    setNewDescription('');
    setNewProfile('custom');
    setExcludeInsurance(false);
    setExcludeContraception(false);
    setExcludeBiobanking(false);
    setFormError(null);
    setEditingId(null);
  };

  const openCreatePanel = () => {
    setEditorMode('create');
    resetCreateForm();
    setIsEditorOpen(true);
  };

  const openEditPanel = (tmpl: LibraryTemplate, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTemplateId(tmpl.id);
    setEditorMode('edit');
    setEditingId(tmpl.id);
    fillFormFromTemplate(tmpl);
    setIsEditorOpen(true);
  };

  const openDuplicatePanel = (tmpl: LibraryTemplate) => {
    setEditorMode('create');
    setEditingId(null);
    fillFormFromTemplate(tmpl, true);
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    resetCreateForm();
    setEditorMode('create');
  };

  const handleProfilePick = (profile: 'interventional' | 'observational' | 'custom') => {
    setNewProfile(profile);
    if (profile === 'interventional') {
      setExcludeInsurance(false);
      setExcludeContraception(false);
      setExcludeBiobanking(false);
    } else if (profile === 'observational') {
      setExcludeInsurance(true);
      setExcludeContraception(true);
      setExcludeBiobanking(false);
    }
  };

  const handleCreateContinue = () => {
    if (createStep === 1) {
      if (!newName.trim() || !newCode.trim()) {
        setFormError('Name and short code are required.');
        return;
      }
      setFormError(null);
      setCreateStep(2);
      return;
    }
    if (createStep === 2) {
      setFormError(null);
      setCreateStep(3);
    }
  };

  const handleEditorSubmit = () => {
    if (isEditMode && editingId) {
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === editingId
            ? {
                ...t,
                code: newCode.trim().toUpperCase(),
                name: newName.trim(),
                description:
                  newDescription.trim() ||
                  t.description ||
                  'Custom modular template from the Templates library.',
                profile: newProfile,
                excludeInsurance,
                excludeContraception,
                excludeBiobanking,
                status: t.status === 'legacy' ? 'modular' : t.status === 'active' ? 'active' : 'draft',
              }
            : t
        )
      );
      setSelectedTemplateId(editingId);
      closeEditor();
      showToast(`Template “${newName.trim()}” updated.`);
      return;
    }

    const id = `tmpl-custom-${Date.now()}`;
    const created: LibraryTemplate = {
      id,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      description:
        newDescription.trim() ||
        'Custom modular template created from the Templates library.',
      profile: newProfile,
      status: 'draft',
      documentCount: 12,
      excludeInsurance,
      excludeContraception,
      excludeBiobanking,
      createdDate: '2026-10-29',
    };
    setTemplates([created, ...templates]);
    setSelectedTemplateId(id);
    closeEditor();
    showToast(`Template “${created.name}” created. Select it when starting a new study.`);
  };

  const handleTogglePolicy = (blockId: string, newPolicy: BlockPolicy) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, policy: newPolicy } : b)));
  };

  const statusBadge = (status: LibraryTemplate['status']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800';
      case 'modular':
        return 'bg-purple-100 text-purple-800';
      case 'legacy':
        return 'bg-slate-100 text-slate-600';
      case 'draft':
        return 'bg-amber-100 text-amber-800';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header + CTA */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-600" />
            Templates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Official section policies and study-specific template profiles
          </p>
        </div>
        <button
          type="button"
          onClick={openCreatePanel}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-800">New Template</strong> creates a profile. Select a card and click{' '}
          <strong className="text-slate-800">Edit</strong> to change sections. Use the profile in New Study or a study’s
          Template tab.
        </p>
      </div>

      {/* Template cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-600" />
            Template library ({templates.length})
          </h2>
          <p className="text-[11px] text-slate-500">Select a card, then Edit — or edit directly from the card</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <div
                key={tmpl.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedTemplateId(tmpl.id);
                  }
                }}
                className={`p-5 rounded-2xl bg-white border text-left space-y-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-500 shadow-md ring-1 ring-teal-500/20'
                    : 'border-slate-200 shadow-xs hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                    {tmpl.code}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${statusBadge(tmpl.status)}`}>
                    {tmpl.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900">{tmpl.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{tmpl.description}</p>
                <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="capitalize">{tmpl.profile}</span>
                  <span className="font-semibold text-teal-700">{tmpl.documentCount} docs</span>
                </div>
                {(tmpl.excludeInsurance || tmpl.excludeContraception || tmpl.excludeBiobanking) && (
                  <div className="flex flex-wrap gap-1">
                    {tmpl.excludeInsurance && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                        Insurance excluded
                      </span>
                    )}
                    {tmpl.excludeContraception && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                        Contraception excluded
                      </span>
                    )}
                    {tmpl.excludeBiobanking && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] font-medium border border-amber-200">
                        Biobank excluded
                      </span>
                    )}
                  </div>
                )}
                <div className="pt-1 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => openEditPanel(tmpl, e)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDuplicatePanel(tmpl);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold inline-flex items-center gap-1"
                    title="Duplicate as new"
                  >
                    <FilePlus2 className="w-3 h-3" />
                    Copy
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected template → next actions */}
      {selectedTemplate && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold block">Selected: {selectedTemplate.name}</span>
            <span className="text-teal-800/80">
              Edit this profile, duplicate it, or apply it in New Study → Template profile / study Template tab.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openEditPanel(selectedTemplate)}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold inline-flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit template
            </button>
            <button
              type="button"
              onClick={() => openDuplicatePanel(selectedTemplate)}
              className="px-3 py-1.5 rounded-lg bg-white border border-teal-300 text-teal-800 font-semibold hover:bg-teal-50 inline-flex items-center gap-1.5"
            >
              <FilePlus2 className="w-3.5 h-3.5" />
              Duplicate as new
            </button>
          </div>
        </div>
      )}

      {/* Block Classification Explorer */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-teal-600" />
              Block policies for {selectedTemplate?.code || 'template'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Locked legal text vs editable clinical sections — adjust classification for demos
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'REQUIRED_VERBATIM', label: 'Locked legal' },
              { id: 'ADAPTABLE_REQUIRED', label: 'Editable' },
              { id: 'INSTRUCTION', label: 'Instruction' },
              { id: 'PLACEHOLDER', label: 'Site-specific' },
              { id: 'OPTIONAL', label: 'Optional' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedPolicyFilter(f.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                  selectedPolicyFilter === f.id
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filteredBlocks.map((blk) => {
            const policyMeta = getBlockPolicyLabel(blk.policy);
            return (
              <div
                key={blk.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      § {blk.section}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs">{blk.name}</h4>
                    <span className="text-[10px] text-slate-400">({blk.language})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400" title={policyMeta.hint}>
                      {policyMeta.label}
                    </span>
                    <select
                      value={blk.policy}
                      onChange={(e) => handleTogglePolicy(blk.id, e.target.value as BlockPolicy)}
                      className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-[11px] font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="REQUIRED_VERBATIM">Locked legal</option>
                      <option value="ADAPTABLE_REQUIRED">Editable clinical</option>
                      <option value="INSTRUCTION">Instruction</option>
                      <option value="PLACEHOLDER">Site-specific</option>
                      <option value="OPTIONAL">Optional</option>
                    </select>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700 leading-relaxed">
                  “{blk.sampleText}”
                </div>

                <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 gap-2">
                  <span>{blk.guidanceNote}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Template Panel */}
      {isEditorOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-template-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
          onClick={closeEditor}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                  {isEditMode ? 'Edit template' : 'New template'} · Step {createStep} of 3
                </span>
                <h2 id="create-template-title" className="text-lg font-bold text-slate-900 mt-1">
                  {createStep === 1 && (isEditMode ? 'Update name & code' : 'Name your template')}
                  {createStep === 2 && 'Choose base profile'}
                  {createStep === 3 && 'Section exclusions'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {createStep === 1 &&
                    (isEditMode
                      ? 'Change how this template appears in the library and New Study wizard.'
                      : 'Give coordinators a clear name they will recognize in New Study.')}
                  {createStep === 2 && 'Start from a known BSPHO profile, then customize.'}
                  {createStep === 3 && 'Turn off sections that do not apply to this study type.'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                aria-label="Close"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {formError}
                </div>
              )}

              {createStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Template name *</label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. BSPHO Imaging Cohort Modular"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Short code *</label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="e.g. IMG-01"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      placeholder="When should teams use this template?"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                    />
                  </div>
                </div>
              )}

              {createStep === 2 && (
                <div className="space-y-2">
                  {(
                    [
                      {
                        id: 'interventional' as const,
                        title: 'Interventional (full)',
                        detail: 'Includes Art. 29 insurance and all standard clinical sections.',
                      },
                      {
                        id: 'observational' as const,
                        title: 'Observational / registry',
                        detail: 'Insurance and contraception excluded by default.',
                      },
                      {
                        id: 'custom' as const,
                        title: 'Custom modular',
                        detail: 'Pick section exclusions yourself on the next step.',
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => handleProfilePick(opt.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                        newProfile === opt.id
                          ? 'border-teal-500 bg-teal-50/70'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{opt.title}</span>
                        {newProfile === opt.id && <Check className="w-4 h-4 text-teal-600" />}
                      </div>
                      <p className="text-slate-500 mt-1">{opt.detail}</p>
                    </button>
                  ))}
                </div>
              )}

              {createStep === 3 && (
                <div className="space-y-3">
                  <p className="text-slate-600">
                    Sections that stay on apply to all 12 document variants. Mandatory legal text cannot be removed.
                  </p>
                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    {DEFAULT_TEMPLATE_SECTIONS.map((sec) => {
                      const excluded =
                        (sec.key === 'insurance_liability' && excludeInsurance) ||
                        (sec.key === 'contraception_guidance' && excludeContraception) ||
                        (sec.key === 'optional_biobanking' && excludeBiobanking);
                      const canToggle = sec.canExclude;
                      return (
                        <label
                          key={sec.id}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border bg-white ${
                            canToggle ? 'cursor-pointer border-slate-200' : 'opacity-70 border-slate-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={!excluded}
                            disabled={!canToggle}
                            onChange={() => {
                              if (sec.key === 'insurance_liability') setExcludeInsurance(!excludeInsurance);
                              if (sec.key === 'contraception_guidance')
                                setExcludeContraception(!excludeContraception);
                              if (sec.key === 'optional_biobanking') setExcludeBiobanking(!excludeBiobanking);
                            }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{sec.title}</span>
                            <span className="text-slate-500">{sec.description}</span>
                            {!canToggle && (
                              <span className="block text-[10px] text-teal-700 font-semibold mt-0.5">
                                Always included
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              {createStep > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setFormError(null);
                    setCreateStep((s) => (s === 3 ? 2 : 1));
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-100"
                >
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={closeEditor}
                  className="px-3 py-1.5 text-slate-600 font-semibold text-xs hover:text-slate-800"
                >
                  Cancel
                </button>
              )}

              {createStep < 3 ? (
                <button
                  type="button"
                  onClick={handleCreateContinue}
                  className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs inline-flex items-center gap-1"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEditorSubmit}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isEditMode ? 'Save changes' : 'Create template'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};
