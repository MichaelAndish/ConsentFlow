import React, { useEffect, useMemo, useState } from 'react';
import {
  Languages,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  Info,
  ExternalLink,
  Pencil,
  Save,
  RotateCcw,
  Database,
  ArrowRight,
} from 'lucide-react';
import { DocumentAudience, DocumentBlock, Study } from '../../types';
import { getBlockPolicyLabel } from '../../utils/studyLogic';

interface TranslationPreviewViewProps {
  studies: Study[];
  onOpenStudyWorkspace: (studyId: string, tab?: string) => void;
}

const AUDIENCES: { id: DocumentAudience; label: string }[] = [
  { id: 'parent', label: 'Parent / Legal Guardian' },
  { id: 'adolescent', label: 'Adolescent (12–17y)' },
  { id: 'child', label: 'Child (8–11y)' },
  { id: 'adult', label: 'Adult' },
];

/** Demo NL/FR adaptations keyed by EN block id — not a live MT engine. */
const DEMO_TARGET_TEXT: Record<
  string,
  { NL: { title: string; content: string }; FR: { title: string; content: string } }
> = {
  'blk-001': {
    NL: {
      title: 'Titel van de klinische studie en regelgevende identificatie',
      content:
        'Officiële titel: ALL-Together1: Behandelingsprotocol voor pediatrische acute lymfatische leukemie.\nEudraCT / CTIS: 2024-500293-18-00 | Belgische protocolcode: BSPHO-2024-LEUK-01.\nSponsor: European Leukaemia Network & BSPHO Working Group.',
    },
    FR: {
      title: 'Titre de l’étude clinique et identification réglementaire',
      content:
        'Titre officiel : ALL-Together1 : Protocole de traitement pour la leucémie aiguë lymphoblastique pédiatrique.\nEudraCT / CTIS : 2024-500293-18-00 | Code protocole belge : BSPHO-2024-LEUK-01.\nPromoteur : European Leukaemia Network & BSPHO Working Group.',
    },
  },
  'blk-002': {
    NL: {
      title: 'Doel van dit onderzoek',
      content:
        'Uw kind wordt uitgenodigd om deel te nemen aan een medisch onderzoek naar acute lymfatische leukemie (ALL). Het doel is na te gaan of risicogestratificeerde therapie met PEG-Asparaginase het risico op herval vermindert en behandelingstoxiciteit beperkt.',
    },
    FR: {
      title: 'Objectif de cette étude',
      content:
        'Votre enfant est invité à participer à une étude médicale sur la leucémie aiguë lymphoblastique (LAL). L’objectif est d’évaluer si une thérapie stratifiée par risque avec PEG-Asparaginase réduit le risque de rechute tout en limitant la toxicité.',
    },
  },
  'blk-003': {
    NL: {
      title: 'Vrijwillige deelname (Art. 6 Belgische wet)',
      content:
        'Deelname aan dit klinisch experiment is volkomen vrijwillig. Weigering om deel te nemen of de beslissing om op enig moment te stoppen, zal op geen enkele wijze de kwaliteit van de verdere medische verzorging of de verstandhouding met de behandelende artsen beïnvloeden, conform de Belgische wet van 7 mei 2004.',
    },
    FR: {
      title: 'Participation volontaire (Art. 6 loi belge)',
      content:
        'La participation à cette expérience clinique est entièrement volontaire. Le refus de participer ou la décision de vous retirer à tout moment n’affectera en aucune manière la qualité des soins médicaux continus ni les relations avec les médecins traitants, conformément à la loi belge du 7 mai 2004.',
    },
  },
  'blk-004': {
    NL: {
      title: 'Onderzoeksprocedures en bloedafnames',
      content:
        'Tijdens de 6 weken durende inductiefase zal er bij uw kind 3 bloedafnames (ongeveer 5 ml per afname) plaatsvinden tijdens routinematige veneuze kathetertoegang om prikangst te minimaliseren. Daarnaast worden 2 beenmergpuncties uitgevoerd onder standaard pediatrische procedurele sedatie.',
    },
    FR: {
      title: 'Procédures de l’étude et prélèvements sanguins',
      content:
        'Pendant la phase d’induction de 6 semaines, votre enfant bénéficiera de 3 prélèvements sanguins (environ 5 ml chacun) programmés lors d’un accès veineux de routine pour limiter la douleur. En outre, 2 ponctions de moelle osseuse seront réalisées sous sédation pédiatrique standard.',
    },
  },
  'blk-005': {
    NL: {
      title: 'Verzekering zonder schuld (Belgische wet)',
      content:
        'Zelfs bij afwezigheid van fout is de sponsor aansprakelijk voor schade die de deelnemer rechtstreeks oploopt door de klinische proef, overeenkomstig artikel 29 van de Belgische wet van 7 mei 2004. Verzekering: Chubb European Group SE, polis BEL-CLIN-2024-9982.',
    },
    FR: {
      title: 'Assurance sans faute (loi belge)',
      content:
        'Même en l’absence de faute, le promoteur est responsable des dommages subis par le participant directement liés à l’essai clinique, conformément à l’article 29 de la loi belge du 7 mai 2004. Assurance : Chubb European Group SE, police BEL-CLIN-2024-9982.',
    },
  },
  'blk-006': {
    NL: {
      title: 'Contactgegevens site (nood)',
      content:
        '24/7 pediatrische oncologie wachtdienst: Demo Site Clinic, Campus Demo Lane 1, 9000 Demo-City. Tel: +32 00 000 00 00 (synthetisch). Behandelend onderzoeker: Prof. Dr. Barbara De Moerloose (demo).',
    },
    FR: {
      title: 'Coordonnées du site (urgence)',
      content:
        'Service d’oncologie pédiatrique 24/7 : Demo Site Clinic, Campus Demo Lane 1, 9000 Demo-City. Tél. : +32 00 000 00 00 (synthétique). Investigateur : Prof. Dr. Barbara De Moerloose (démo).',
    },
  },
};

function isLockedPolicy(policy: string): boolean {
  return policy === 'REQUIRED_VERBATIM';
}

function isEditablePolicy(policy: string): boolean {
  return policy === 'ADAPTABLE_REQUIRED' || policy === 'PLACEHOLDER' || policy === 'OPTIONAL';
}

export const TranslationPreviewView: React.FC<TranslationPreviewViewProps> = ({
  studies,
  onOpenStudyWorkspace,
}) => {
  const leuk = studies.find((s) => s.code === 'BSPHO-2024-LEUK-01') || studies[0];
  const [studyId, setStudyId] = useState(leuk?.id || '');
  const [selectedTargetLang, setSelectedTargetLang] = useState<'NL' | 'FR'>('NL');
  const [selectedAudience, setSelectedAudience] = useState<DocumentAudience>('parent');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const study = studies.find((s) => s.id === studyId) || leuk;

  useEffect(() => {
    if (leuk && !studyId) setStudyId(leuk.id);
  }, [leuk, studyId]);

  const enDoc = useMemo(() => {
    if (!study) return null;
    return (
      study.documents.find((d) => d.audience === selectedAudience && d.language === 'EN') ||
      study.documents.find((d) => d.language === 'EN') ||
      null
    );
  }, [study, selectedAudience]);

  const targetDoc = useMemo(() => {
    if (!study) return null;
    return (
      study.documents.find((d) => d.audience === selectedAudience && d.language === selectedTargetLang) ||
      null
    );
  }, [study, selectedAudience, selectedTargetLang]);

  const masterBlocks: DocumentBlock[] = useMemo(() => {
    const fromDoc = enDoc?.blocks?.length ? enDoc.blocks : [];
    if (fromDoc.length) return fromDoc;
    // Fallback when selected audience has no seeded blocks (only parent EN has blocks in seed)
    const parentEn = study?.documents.find((d) => d.audience === 'parent' && d.language === 'EN');
    return parentEn?.blocks || [];
  }, [enDoc, study]);

  const editableCount = masterBlocks.filter((b) => isEditablePolicy(b.policy)).length;
  const lockedCount = masterBlocks.filter((b) => isLockedPolicy(b.policy)).length;

  const targetKey = (blockId: string) => `${selectedTargetLang}:${blockId}`;

  const getTargetContent = (block: DocumentBlock) => {
    const key = targetKey(block.id);
    if (draftEdits[key] != null) return draftEdits[key];
    const demo = DEMO_TARGET_TEXT[block.id]?.[selectedTargetLang];
    return demo?.content || `[Demo] No ${selectedTargetLang} adaptation seeded for “${block.title}”.`;
  };

  const getTargetTitle = (block: DocumentBlock) => {
    return DEMO_TARGET_TEXT[block.id]?.[selectedTargetLang]?.title || block.title;
  };

  const startEdit = (block: DocumentBlock) => {
    if (!isEditablePolicy(block.policy)) return;
    const key = targetKey(block.id);
    setDraftEdits((prev) => ({ ...prev, [key]: prev[key] ?? getTargetContent(block) }));
    setEditingBlockId(block.id);
  };

  const saveEdit = (blockId: string) => {
    setEditingBlockId(null);
    setSavedFlash(blockId);
    setTimeout(() => setSavedFlash(null), 2000);
  };

  const resetEdit = (block: DocumentBlock) => {
    const key = targetKey(block.id);
    setDraftEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setEditingBlockId(null);
  };

  if (!study) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-sm text-slate-600">
        No studies loaded from the database yet. Open the app after Postgres seed completes.
      </div>
    );
  }

  const blocksFromDb = Boolean(enDoc?.blocks?.length) || Boolean(
    study.documents.find((d) => d.audience === 'parent' && d.language === 'EN')?.blocks?.length
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Languages className="w-5 h-5 text-teal-600" />
            Translation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Adapt investigator-approved English clinical wording into Belgian NL/FR templates — without re-translating
            locked legal clauses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Target:</span>
          {(['NL', 'FR'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                setSelectedTargetLang(lang);
                setEditingBlockId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedTargetLang === lang
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {lang === 'NL' ? 'Dutch / Nederlands' : 'French / Français'}
            </button>
          ))}
        </div>
      </div>

      {/* How it works — concrete steps */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            How translation works (3 rules)
          </h2>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
            Demo adaptation studio — not a live machine-translation job
          </span>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <li className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
            <span className="font-mono text-[10px] font-bold text-slate-500">1 · Load</span>
            <p className="font-semibold text-slate-900">English master from the study DB</p>
            <p className="text-slate-600 leading-relaxed">
              Blocks come from the EN document for the selected audience (seeded on{' '}
              <span className="font-mono">icf_documents.blocks</span>). NL/FR sample wording is demo text mapped to
              those block IDs.
            </p>
          </li>
          <li className="p-3 rounded-xl border border-purple-200 bg-purple-50/40 space-y-1">
            <span className="font-mono text-[10px] font-bold text-purple-700">2 · Lock</span>
            <p className="font-semibold text-slate-900">Purple = locked legal</p>
            <p className="text-slate-600 leading-relaxed">
              Look for the <Lock className="w-3 h-3 inline text-purple-600" /> badge{' '}
              <strong>Locked legal text</strong>. Official Belgian wording stays read-only — no edit button.
            </p>
          </li>
          <li className="p-3 rounded-xl border border-teal-200 bg-teal-50/40 space-y-1">
            <span className="font-mono text-[10px] font-bold text-teal-700">3 · Edit</span>
            <p className="font-semibold text-slate-900">Teal = editable clinical</p>
            <p className="text-slate-600 leading-relaxed">
              Look for <Unlock className="w-3 h-3 inline text-teal-600" />{' '}
              <strong>Editable clinical text</strong>. Click <em>Edit NL/FR</em> on the right card, change the text,
              then Save (session only).
            </p>
          </li>
        </ol>
      </div>

      {/* Study / audience / load path */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3 text-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">Study:</span>
            <select
              value={study.id}
              onChange={(e) => {
                setStudyId(e.target.value);
                setEditingBlockId(null);
                setDraftEdits({});
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 font-semibold text-slate-800"
            >
              {studies.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} · step {s.currentStepIndex}/8
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onOpenStudyWorkspace(study.id, 'matrix')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-teal-200 bg-teal-50 text-teal-800 font-semibold hover:bg-teal-100"
            >
              Open document matrix
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Database className="w-3.5 h-3.5 text-teal-600" />
            <span>
              EN master:{' '}
              <strong className="text-slate-800">
                {blocksFromDb ? 'loaded from DB blocks' : 'no blocks on this document'}
              </strong>
              {enDoc ? ` · ${enDoc.title} (${enDoc.status})` : ''}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-500 font-medium">Audience:</span>
          {AUDIENCES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSelectedAudience(item.id);
                setEditingBlockId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedAudience === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-slate-500">
            {lockedCount} locked · {editableCount} editable
            {targetDoc ? (
              <>
                {' '}
                · Target doc status: <strong className="text-slate-800">{targetDoc.status.replace(/_/g, ' ')}</strong>
              </>
            ) : null}
          </span>
        </div>

        {selectedAudience !== 'parent' && (
          <div className="flex gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <p>
              Seeded block text exists on the <strong>Parent EN</strong> document in the DB. Other audiences reuse that
              master layout for this demo so you can still practice locked vs editable behaviour.
            </p>
          </div>
        )}
      </div>

      {/* Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                1 · MASTER SOURCE (EN)
              </span>
              <h3 className="font-bold text-sm text-slate-900 mt-1">
                {enDoc?.title || 'English draft'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                From Postgres · read-only here · PI markups show on edited blocks
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 hidden lg:block mt-2" />
          </div>

          {masterBlocks.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl">
              No document blocks found for this study. Re-run seed or open Documents in the study workspace.
            </div>
          ) : (
            masterBlocks.map((block) => {
              const locked = isLockedPolicy(block.policy);
              const editable = isEditablePolicy(block.policy);
              const policy = getBlockPolicyLabel(block.policy);
              return (
                <div
                  key={block.id}
                  className={`p-4 rounded-xl border space-y-2 text-xs ${
                    locked
                      ? 'border-purple-200 bg-purple-50/30'
                      : editable
                      ? 'border-teal-200 bg-teal-50/20'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {locked ? (
                        <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      )}
                      §{block.sectionNumber} {block.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        locked ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
                      }`}
                      title={policy.hint}
                    >
                      {policy.label}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-serif">{block.content}</p>
                  {block.isEditedByPI && block.notes && (
                    <div className="text-[11px] text-purple-800 font-medium pt-1 border-t border-purple-100">
                      PI note: {block.notes}
                    </div>
                  )}
                  {block.sourceReference && (
                    <p className="text-[10px] text-slate-400">Source: {block.sourceReference}</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <span className="font-mono text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded">
                2 · TARGET ({selectedTargetLang})
              </span>
              <h3 className="font-bold text-sm text-slate-900 mt-1">
                {targetDoc?.title || `Belgian ${selectedTargetLang} adaptation`}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Locked rows = official template · Teal rows = edit here
              </p>
            </div>
            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Legal preserved
            </span>
          </div>

          {masterBlocks.map((block) => {
            const locked = isLockedPolicy(block.policy);
            const editable = isEditablePolicy(block.policy);
            const isEditing = editingBlockId === block.id;
            const key = targetKey(block.id);
            const content = getTargetContent(block);
            const justSaved = savedFlash === block.id;

            return (
              <div
                key={`t-${block.id}`}
                className={`p-4 rounded-xl border space-y-2 text-xs ${
                  locked
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : editable
                    ? 'border-teal-300 bg-teal-50/40 ring-1 ring-teal-500/10'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    {locked ? (
                      <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Unlock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    )}
                    §{block.sectionNumber} {getTargetTitle(block)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      locked ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {locked ? 'Official template (locked)' : 'Editable clinical'}
                  </span>
                </div>

                {isEditing ? (
                  <textarea
                    value={draftEdits[key] ?? content}
                    onChange={(e) => setDraftEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                    rows={5}
                    className="w-full rounded-lg border border-teal-300 bg-white p-2.5 text-slate-800 font-serif leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                  />
                ) : (
                  <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-serif">{content}</p>
                )}

                {locked ? (
                  <p className="text-[11px] text-emerald-700 font-medium pt-1 border-t border-emerald-100">
                    Locked — official Belgian wording. No edit control by design.
                  </p>
                ) : editable ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-teal-100">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => saveEdit(block.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-600 text-white font-semibold hover:bg-teal-700"
                        >
                          <Save className="w-3 h-3" />
                          Save session edit
                        </button>
                        <button
                          type="button"
                          onClick={() => resetEdit(block)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 font-semibold hover:bg-slate-50"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reset
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(block)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-teal-300 bg-white text-teal-800 font-semibold hover:bg-teal-50"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit {selectedTargetLang} text
                      </button>
                    )}
                    {justSaved && (
                      <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Saved in this browser session only
                      </span>
                    )}
                    {draftEdits[key] != null && !isEditing && !justSaved && (
                      <span className="text-amber-800 text-[10px] font-semibold">Modified (session)</span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    Instruction / non-patient block — not edited in translation.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex gap-2">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-800">Where to continue for real package work:</strong> open the study →{' '}
          <em>Documents</em> matrix → open a NL/FR card. This Translation page is the constrained EN→NL/FR adaptation
          studio. Edits here are session-only demos and are not written back to Postgres yet.
        </p>
      </div>
    </div>
  );
};
