import React, { useState } from 'react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  FileText,
  Trash2,
  AlertCircle,
  Building,
  User,
  ShieldCheck,
  Languages,
  CheckCircle2,
  FolderPlus,
  Database,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { Study, DocumentAudience, DocumentLanguage, ICFDocument } from '../../types';
import { AUDIENCE_CONFIG, LANGUAGE_CONFIG, createCustomTemplateConfig } from '../../utils/studyLogic';
import { OFFICIAL_GCS_BUCKETS, MOCK_BUCKET_FILES_LEUK_01 } from '../../services/cloudBucketService';

interface CreateStudyWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStudy: (newStudy: Study) => void;
}

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  type: string;
  category: 'protocol' | 'template' | 'site_info' | 'supplementary';
}

export const CreateStudyWizardModal: React.FC<CreateStudyWizardModalProps> = ({
  isOpen,
  onClose,
  onCreateStudy,
}) => {
  if (!isOpen) return null;

  const [step, setStep] = useState<number>(1);
  const [stepError, setStepError] = useState<string | null>(null);

  // Step 1: Study details
  const [title, setTitle] = useState('BE-PEDS-2024-HODGKIN: Nivolumab in Relapsed Paediatric Hodgkin Lymphoma');
  const [code, setCode] = useState('BSPHO-2024-HODG-04');
  const [sponsor, setSponsor] = useState('BSPHO Lymphoma Study Committee & EORTC');
  const [studyType, setStudyType] = useState<Study['studyType']>('Phase I/II Paediatric Trial');
  const [phase, setPhase] = useState('Phase II Multicentric');
  const [responsiblePI, setResponsiblePI] = useState('Prof. Dr. Jutte van der Werff ten Bosch');
  const [leadSite, setLeadSite] = useState('UZ Brussel (VUB) - Paediatric Oncology');

  // Step 2: Uploaded mock files
  const [files, setFiles] = useState<UploadedFile[]>([
    {
      id: 'f-1',
      name: 'Nivolumab_Paediatric_Hodgkin_Protocol_v2.1.pdf',
      size: '4.8 MB',
      type: 'PDF Document',
      category: 'protocol',
    },
    {
      id: 'f-2',
      name: 'BSPHO_ICF_Standard_Template_v2.4_Master_EN.docx',
      size: '1.2 MB',
      type: 'Word Template',
      category: 'template',
    },
    {
      id: 'f-3',
      name: 'Site_Specification_Form_UZ_Brussel.docx',
      size: '640 KB',
      type: 'Site Annex',
      category: 'site_info',
    },
  ]);

  // Source Ingestion Mode
  const [sourceMode, setSourceMode] = useState<'cloud_bucket' | 'local'>('cloud_bucket');
  const [selectedBucketUri, setSelectedBucketUri] = useState<string>(OFFICIAL_GCS_BUCKETS[0].bucketUri);

  // Step 3: Required document types
  const [selectedAudiences, setSelectedAudiences] = useState<DocumentAudience[]>([
    'adult',
    'parent',
    'adolescent',
    'child',
  ]);
  const [selectedLanguages, setSelectedLanguages] = useState<DocumentLanguage[]>(['EN', 'NL', 'FR']);

  // Custom Template & Modular Section Exclusion Settings
  const [templateProfile, setTemplateProfile] = useState<'standard' | 'observational' | 'custom'>('standard');
  const [excludeInsurance, setExcludeInsurance] = useState<boolean>(false);
  const [excludeContraception, setExcludeContraception] = useState<boolean>(false);
  const [excludeBiobanking, setExcludeBiobanking] = useState<boolean>(false);
  const [customRationale, setCustomRationale] = useState<string>('');

  const toggleAudience = (aud: DocumentAudience) => {
    if (selectedAudiences.includes(aud)) {
      if (selectedAudiences.length > 1) {
        setSelectedAudiences(selectedAudiences.filter((a) => a !== aud));
      }
    } else {
      setSelectedAudiences([...selectedAudiences, aud]);
    }
  };

  const toggleLanguage = (lang: DocumentLanguage) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const handleSimulateAddFile = (category: UploadedFile['category']) => {
    const dummyNames: Record<UploadedFile['category'], string> = {
      protocol: 'Investigator_Brochure_Nivolumab_v3.pdf',
      template: 'BSPHO_Template_NL_BE_v2.4.docx',
      site_info: 'Ethics_Approval_Dossier_Annex.pdf',
      supplementary: 'Paediatric_Assent_Illustration_Guide.pdf',
    };
    const newFile: UploadedFile = {
      id: `f-${Date.now()}`,
      name: dummyNames[category],
      size: '2.1 MB',
      type: dummyNames[category].endsWith('.pdf') ? 'PDF Document' : 'Word Document',
      category,
    };
    setFiles([...files, newFile]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles(files.filter((f) => f.id !== id));
  };

  const handleCreate = () => {
    const studyId = `study-${Date.now()}`;
    const generatedDocs: ICFDocument[] = [];

    const audienceTitles: Record<DocumentAudience, string> = {
      adult: 'Adult Participant Information & Consent Form',
      parent: 'Parent / Legal Guardian Informed Consent Form',
      adolescent: 'Adolescent Information & Assent Form (12–17y)',
      child: 'Children Information & Assent Booklet (8–11y)',
    };

    for (const aud of selectedAudiences) {
      for (const lang of selectedLanguages) {
        generatedDocs.push({
          id: `doc-${studyId}-${aud}-${lang.toLowerCase()}`,
          studyId,
          audience: aud,
          language: lang,
          title: `${audienceTitles[aud]} (${lang})`,
          version: 'v1.0',
          status: 'draft_generated',
          issueCount: 0,
          wordCount: aud === 'child' ? 1400 : aud === 'adolescent' ? 2600 : 4200,
          lastUpdated: '2026-10-29',
          updatedBy: 'Elena Vanderberghe (BSPHO)',
          templateVersion: 'BSPHO ICF Template v2.4 (2024)',
        });
      }
    }

    const newStudy: Study = {
      id: studyId,
      code,
      title,
      shortTitle: title.split(':')[0] || title,
      sponsor,
      studyType,
      phase,
      responsiblePI,
      leadSite,
      assignedCoordinator: 'Dr. Sophie Laurent',
      participatingSites: [
        {
          id: `site-lead-${Date.now()}`,
          name: leadSite,
          city: 'Brussels',
          country: 'Belgium',
          localCoordinator: responsiblePI,
          ethicsCommitteeApprovalDate: '2024-09-01',
          insurancePolicyId: 'BEL-HODG-2024-012',
        },
      ],
      currentWorkflowStage: 'input_setup',
      currentStepIndex: 1,
      templateVersion:
        templateProfile === 'observational'
          ? 'HIRUZ Observational (No Insurance)'
          : templateProfile === 'custom'
          ? 'BSPHO Custom Modular Template'
          : 'BSPHO ICF Template v2.4 (2024)',
      customTemplate: createCustomTemplateConfig(
        templateProfile === 'observational'
          ? 'HIRUZ Observational (Insurance Excluded)'
          : templateProfile === 'custom'
          ? 'BSPHO Custom Modular Template'
          : 'BSPHO Interventional v2.4 (Standard)',
        'BSPHO ICF Template v2.4 (2024)',
        {
          excludeInsurance,
          excludeContraception,
          excludeBiobanking,
          rationale: customRationale || (excludeInsurance ? 'Article 29 no-fault insurance excluded per study protocol.' : undefined),
        }
      ),
      targetAudiences: selectedAudiences,
      targetLanguages: selectedLanguages,
      documents: generatedDocs,
      facts: [
        {
          id: `fact-init-1`,
          studyId,
          key: 'study_duration',
          label: 'Study Duration',
          value: '12 months treatment + 24 months observational survival tracking',
          sourceDoc: files[0]?.name || 'Sponsor Protocol',
          confidence: 0.95,
          status: 'extracted',
          affectedAudiences: selectedAudiences,
        },
      ],
      issues: [],
      createdDate: '2026-10-29',
      lastUpdated: '2026-10-29',
      readyDocumentsCount: 0,
      totalDocumentsCount: generatedDocs.length,
      completionPercentage: 0,
      cloudBucket: {
        bucketName: 'bspho-trial-dossiers-belgium',
        bucketUri: selectedBucketUri,
        region: 'europe-west1 (Brussels, Belgium)',
        storageClass: 'STANDARD',
        encryption: 'CMEK (Customer Managed)',
        compliance: 'Belgian Law of 7 May 2004 & EU GDPR Compliant',
        isConnected: false,
        lastSyncedAt: '2026-10-29 11:35 CET',
        totalObjects: files.length,
        totalSizeMb: 31.8,
      },
      bucketFiles: MOCK_BUCKET_FILES_LEUK_01,
    };

    onCreateStudy(newStudy);
    onClose();
  };

  const totalPossibleDocs = selectedAudiences.length * selectedLanguages.length;

  const canContinueStep1 =
    title.trim().length > 0 &&
    code.trim().length > 0 &&
    sponsor.trim().length > 0 &&
    responsiblePI.trim().length > 0 &&
    leadSite.trim().length > 0;

  const handleContinue = () => {
    if (step === 1 && !canContinueStep1) {
      setStepError('Please fill in all required fields marked with * before continuing.');
      return;
    }
    if (step === 2 && files.length === 0) {
      setStepError('Add at least one source document before continuing.');
      return;
    }
    if (step === 3 && (selectedAudiences.length === 0 || selectedLanguages.length === 0)) {
      setStepError('Select at least one audience and one language.');
      return;
    }
    setStepError(null);
    setStep(step + 1);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Wizard Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-100 px-2 py-0.5 rounded">
                Step {step} of 4
              </span>
              <span className="text-xs text-slate-500 font-medium">Create a new consent package</span>
            </div>
            <h2 id="wizard-modal-title" className="text-lg font-bold text-slate-900">
              {step === 1 && 'Study details'}
              {step === 2 && 'Add source documents'}
              {step === 3 && 'Choose audiences & languages'}
              {step === 4 && 'Review & create'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {step === 1 && 'Identify the trial and Belgian lead site.'}
              {step === 2 && 'Register the protocol and templates used for this package (demo upload).'}
              {step === 3 && 'Build the document matrix: who needs a form, and in which languages.'}
              {step === 4 && 'Confirm the setup, then open the study workspace.'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close wizard"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
          {[
            { num: 1, label: 'Details' },
            { num: 2, label: 'Sources' },
            { num: 3, label: 'Matrix' },
            { num: 4, label: 'Create' },
          ].map((st) => (
            <div key={st.num} className="flex items-center gap-2">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === st.num
                    ? 'bg-teal-600 text-white'
                    : step > st.num
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {step > st.num ? <Check className="w-3.5 h-3.5" /> : st.num}
              </span>
              <span
                className={`font-medium ${
                  step === st.num ? 'text-slate-900 font-bold' : 'text-slate-500'
                }`}
              >
                {st.label}
              </span>
              {st.num < 4 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-2" />}
            </div>
          ))}
        </div>

        {/* Wizard Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {stepError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{stepError}</span>
            </div>
          )}

          {/* STEP 1: Study Details */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Official Clinical Study Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="e.g. ALL-Together1: A Treatment Study Protocol for Paediatric Acute Lymphoblastic Leukaemia"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Study Identifier / Code *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="e.g. BSPHO-2024-HODG-04"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Study Sponsor *</label>
                  <input
                    type="text"
                    value={sponsor}
                    onChange={(e) => setSponsor(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="e.g. European Leukaemia Network"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Study Type</label>
                  <select
                    value={studyType}
                    onChange={(e) => setStudyType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  >
                    <option value="Phase I/II Paediatric Trial">Phase I/II Paediatric Trial</option>
                    <option value="Interventional">Interventional Clinical Study</option>
                    <option value="Observational">Observational Paediatric Cohort</option>
                    <option value="Expanded Access">Expanded Access / Compassionate Use</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Trial Phase</label>
                  <input
                    type="text"
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="e.g. Phase II Multicentric"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Responsible Belgian PI *</label>
                  <input
                    type="text"
                    value={responsiblePI}
                    onChange={(e) => setResponsiblePI(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="e.g. Prof. Dr. Jutte van der Werff ten Bosch"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Lead Belgian Site / Hospital *</label>
                  <input
                    type="text"
                    value={leadSite}
                    onChange={(e) => setLeadSite(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    placeholder="e.g. UZ Brussel (VUB)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Upload Documents */}
          {step === 2 && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
                <span className="font-semibold block mb-0.5">Demo Mode — simulated upload</span>
                Use the buttons below to register sample protocol and template files. Real file picking will ship in a
                later release; these entries still drive the study workspace.
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-teal-500 bg-slate-50/50 transition-colors">
                <Upload className="w-8 h-8 text-teal-600 mx-auto mb-2" />
                <p className="font-bold text-slate-800 text-xs">
                  Add the protocol and BSPHO templates for this study
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Click a button to attach a demo PDF or DOCX to the package
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSimulateAddFile('protocol')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-xs"
                  >
                    + Add Protocol Doc
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateAddFile('template')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-xs"
                  >
                    + Add BSPHO Template
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSimulateAddFile('site_info')}
                    className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs shadow-xs"
                  >
                    + Add Site Annex
                  </button>
                </div>
              </div>

              {/* Files List */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-xs block">
                  Registered Documents ({files.length}):
                </span>
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-slate-900 block">{f.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {f.type} • {f.size} • Category: {f.category}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(f.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Audiences & Languages */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 text-xs mb-1">
                  Required Paediatric Document Audiences (Select all applicable)
                </h4>
                <p className="text-slate-500 text-[11px] mb-3">
                  BSPHO guidelines require distinct variants based on legal majority and cognitive maturity.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(['adult', 'parent', 'adolescent', 'child'] as DocumentAudience[]).map((aud) => {
                    const cfg = AUDIENCE_CONFIG[aud];
                    const isSelected = selectedAudiences.includes(aud);
                    return (
                      <div
                        key={aud}
                        onClick={() => toggleAudience(aud)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/60 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-900">{cfg.label}</span>
                          <span
                            className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                              isSelected
                                ? 'bg-teal-600 border-teal-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-teal-800 bg-white px-1.5 py-0.2 rounded border border-slate-200 inline-block mb-1">
                          {cfg.ageRange}
                        </span>
                        <p className="text-[11px] text-slate-500">{cfg.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200">
                <h4 className="font-bold text-slate-900 text-xs mb-1">
                  Belgian Regulatory National Languages
                </h4>
                <p className="text-slate-500 text-[11px] mb-3">
                  English is the master investigator draft; Dutch and French are populated into approved Belgian
                  templates.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {(['EN', 'NL', 'FR'] as DocumentLanguage[]).map((lang) => {
                    const cfg = LANGUAGE_CONFIG[lang];
                    const isSelected = selectedLanguages.includes(lang);
                    return (
                      <div
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/70 shadow-xs'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="font-bold text-sm text-slate-900">{lang}</div>
                        <div className="text-[11px] text-slate-600">{cfg.name}</div>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{cfg.nativeName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Template & Section Exclusions */}
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs mb-0.5 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-teal-600" />
                      <span>ICF Template Profile & Section Exclusions</span>
                    </h4>
                    <p className="text-slate-500 text-[11px]">
                      Customize modular sections (e.g. exclude insurance for observational trials or non-interventional protocols).
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-semibold">
                    Modular Customization
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div
                    onClick={() => {
                      setTemplateProfile('standard');
                      setExcludeInsurance(false);
                      setExcludeBiobanking(false);
                      setExcludeContraception(false);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      templateProfile === 'standard'
                        ? 'border-teal-500 bg-teal-50/70 font-semibold text-teal-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Standard Interventional</span>
                      {templateProfile === 'standard' && <Check className="w-3 h-3 text-teal-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Full 12-doc matrix with Article 29 Insurance</span>
                  </div>

                  <div
                    onClick={() => {
                      setTemplateProfile('observational');
                      setExcludeInsurance(true);
                      setExcludeContraception(true);
                    }}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      templateProfile === 'observational'
                        ? 'border-teal-500 bg-teal-50/70 font-semibold text-teal-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Observational (No Insurance)</span>
                      {templateProfile === 'observational' && <Check className="w-3 h-3 text-teal-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Excludes insurance and contraception</span>
                  </div>

                  <div
                    onClick={() => setTemplateProfile('custom')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                      templateProfile === 'custom'
                        ? 'border-teal-500 bg-teal-50/70 font-semibold text-teal-900'
                        : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Custom Modular Template</span>
                      {templateProfile === 'custom' && <Check className="w-3 h-3 text-teal-600" />}
                    </div>
                    <span className="text-[10px] text-slate-500 block mt-1">Selectively exclude or include sections</span>
                  </div>
                </div>

                {/* Section Exclusion Checkboxes */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-800 text-[11px] block">
                    Modular Section Exclusions (Applied across all 12 document variants):
                  </span>

                  <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={excludeInsurance}
                      onChange={(e) => setExcludeInsurance(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Exclude Article 29 No-Fault Insurance Clause
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Omit sponsor liability insurance from templates & suppress missing insurance warnings in consistency checks (e.g. for non-interventional studies or when covered under international sponsor terms).
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={excludeContraception}
                      onChange={(e) => setExcludeContraception(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Exclude Adolescent Contraception Guidance
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Omit reproductive risk text when the trial regimen does not involve teratogenic pharmaceuticals.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer p-1.5 rounded hover:bg-slate-100/70 transition-colors">
                    <input
                      type="checkbox"
                      checked={excludeBiobanking}
                      onChange={(e) => setExcludeBiobanking(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">
                        Exclude Optional Biobanking / Pharmacogenomics
                      </span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Omit residual tissue preservation clauses when no secondary biological research is planned.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Total Document Variants in Matrix:</span>
                <span className="font-bold text-teal-800 text-sm">{totalPossibleDocs} Documents</span>
              </div>
            </div>
          )}

          {/* STEP 4: Review Setup */}
          {step === 4 && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Study Configuration Summary</h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Study Identifier</span>
                    <span className="font-mono font-bold text-slate-800">{code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lead Site</span>
                    <span className="font-semibold text-slate-800">{leadSite}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Investigator (PI)</span>
                    <span className="font-semibold text-slate-800">{responsiblePI}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Template Version</span>
                    <span className="font-semibold text-slate-800">BSPHO Template v2.4 (2024)</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">
                    Document Matrix Target
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAudiences.map((aud) => (
                      <span key={aud} className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                        {AUDIENCE_CONFIG[aud].label}
                      </span>
                    ))}
                    <span className="text-slate-400 self-center">×</span>
                    {selectedLanguages.map((l) => (
                      <span key={l} className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Honest preflight — registration ≠ legal validation (CF-011) */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 block">Preflight checklist (honest):</span>
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Study details &amp; source file <strong>names</strong> registered in this demo session</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Not verified here: PDF/DOCX parsing, official wording certification, or Ethics Committee approval
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>
                    Matrix will open with {totalPossibleDocs} selected audience × language slots (template locks apply
                    later in the workspace)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div></div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-800 text-xs font-semibold"
            >
              Cancel
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1 shadow-xs transition-colors"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCreate}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Create study & open workspace</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
