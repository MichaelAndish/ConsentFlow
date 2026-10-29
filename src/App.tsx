import React, { useEffect, useState } from 'react';
import { Sidebar, NavSection } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { StudiesListView } from './components/studies/StudiesListView';
import { StudyWorkspaceView } from './components/study/StudyWorkspaceView';
import { CreateStudyWizardModal } from './components/wizard/CreateStudyWizardModal';
import { TranslationPreviewView } from './components/views/TranslationPreviewView';
import { TemplateLibraryPreviewView } from './components/views/TemplateLibraryPreviewView';
import { ConsistencyCenterPreviewView } from './components/views/ConsistencyCenterPreviewView';
import { TraceabilityLedgerPreviewView } from './components/views/TraceabilityLedgerPreviewView';
import { UpdateMigrationPreviewView } from './components/views/UpdateMigrationPreviewView';
import { SettingsView } from './components/views/SettingsView';
import { INITIAL_STUDIES, MOCK_ACTION_ITEMS } from './data/mockData';
import { Study, ActionItem, DocumentStatus, ConsistencyIssueStatus, IssueResolutionRecord } from './types';
import { CheckCircle2 } from 'lucide-react';
import { AppRoute, parseHashRoute, setHashRoute } from './utils/appUrl';
import { countOpenIssues, computeDocumentProgress, hasBlockingIssues } from './utils/studyLogic';
import {
  fetchStudies,
  fetchActionItems,
  persistDocumentStatus,
  persistStudyWorkflow,
  persistCustomTemplate,
} from './services/apiService';

type WorkspaceTab = 'matrix' | 'facts' | 'issues' | 'sites' | 'bucket' | 'template';

const WORKSPACE_TABS: WorkspaceTab[] = ['matrix', 'facts', 'issues', 'sites', 'bucket', 'template'];

function toWorkspaceTab(tab?: string): WorkspaceTab {
  return WORKSPACE_TABS.includes(tab as WorkspaceTab) ? (tab as WorkspaceTab) : 'matrix';
}

export default function App() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>(MOCK_ACTION_ITEMS);
  const [dataSource, setDataSource] = useState<string>('loading');
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('matrix');
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const applyRoute = (route: AppRoute) => {
    if (route.section === 'create_wizard') {
      setIsWizardOpen(true);
      setSelectedStudyId(null);
      setActiveSection('dashboard');
      return;
    }
    if (route.section === 'study') {
      setSelectedStudyId(route.studyId);
      setWorkspaceTab(toWorkspaceTab(route.tab));
      setActiveSection('studies');
      return;
    }
    setSelectedStudyId(null);
    setWorkspaceTab('matrix');
    setActiveSection(route.section);
  };

  useEffect(() => {
    const syncFromHash = () => applyRoute(parseHashRoute(window.location.hash));
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedStudyId) {
      setHashRoute({ section: 'study', studyId: selectedStudyId, tab: workspaceTab });
      return;
    }
    if (isWizardOpen) {
      setHashRoute({ section: 'create_wizard' });
      return;
    }
    setHashRoute({ section: activeSection === 'create_wizard' ? 'dashboard' : activeSection });
  }, [activeSection, selectedStudyId, workspaceTab, isWizardOpen]);

  useEffect(() => {
    Promise.all([fetchStudies(), fetchActionItems()]).then(([studyRes, actionRes]) => {
      setDataSource(studyRes.source);
      if (studyRes.studies && studyRes.studies.length > 0) {
        setStudies(studyRes.studies);
      } else {
        // Last-resort UI continuity if API/DB empty — still label the source honestly
        setStudies(INITIAL_STUDIES);
        setDataSource(
          studyRes.source === 'local_fallback' ? 'local_fallback' : `${studyRes.source}_empty_fallback`
        );
      }
      if (actionRes.actionItems?.length) {
        setActionItems(actionRes.actionItems);
      }
    });
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSelectSection = (section: NavSection) => {
    if (section === 'create_wizard') {
      setIsWizardOpen(true);
      return;
    }
    setActiveSection(section);
    setSelectedStudyId(null);
  };

  const handleOpenStudy = (studyId: string, tab: string = 'matrix') => {
    setWorkspaceTab(toWorkspaceTab(tab));
    setSelectedStudyId(studyId);
  };

  const handleBackToStudies = () => {
    setSelectedStudyId(null);
    setWorkspaceTab('matrix');
    setActiveSection('studies');
  };

  const handleCreateStudy = (newStudy: Study) => {
    setStudies([newStudy, ...studies]);
    setWorkspaceTab('matrix');
    setSelectedStudyId(newStudy.id);
    showToast(`Study ${newStudy.code} created. Follow the workflow steps to finish the package.`);
  };

  const handleUpdateStudy = (updatedStudy: Study) => {
    setStudies((prev) => prev.map((s) => (s.id === updatedStudy.id ? updatedStudy : s)));
    // Persist workflow changes and template changes if available
    persistStudyWorkflow(updatedStudy.id, updatedStudy.currentWorkflowStage, updatedStudy.currentStepIndex);
    if (updatedStudy.customTemplate) {
      persistCustomTemplate(updatedStudy.id, updatedStudy.customTemplate);
    }
  };

  const handleUpdateDocumentStatus = (studyId: string, docId: string, newStatus: DocumentStatus) => {
    setStudies((prev) =>
      prev.map((s) => {
        if (s.id !== studyId) return s;
        if (
          (newStatus === 'approved' || newStatus === 'exported') &&
          hasBlockingIssues(s.issues)
        ) {
          showToast('Blocked: resolve high-severity open issues before approving.');
          return s;
        }
        const updatedDocs = s.documents.map((d) => (d.id === docId ? { ...d, status: newStatus } : d));
        const progress = computeDocumentProgress(updatedDocs);
        return {
          ...s,
          documents: updatedDocs,
          readyDocumentsCount: progress.approvedForSubmission,
          completionPercentage:
            progress.total === 0 ? 0 : Math.round((progress.approvedForSubmission / progress.total) * 100),
        };
      })
    );
    persistDocumentStatus(studyId, docId, newStatus);
    showToast('Document status updated and recorded.');
  };

  const handleResolveIssue = (
    studyId: string,
    issueId: string,
    nextStatus: ConsistencyIssueStatus,
    resolution?: IssueResolutionRecord
  ) => {
    setStudies((prev) =>
      prev.map((s) => {
        if (s.id !== studyId) return s;
        return {
          ...s,
          issues: s.issues.map((iss) =>
            iss.id === issueId
              ? {
                  ...iss,
                  status: nextStatus,
                  resolution: resolution ?? iss.resolution,
                }
              : iss
          ),
          lastUpdated: '2026-10-29',
        };
      })
    );
    if (nextStatus === 'pending_propagation') {
      showToast('Decision recorded — still pending document propagation.');
    } else if (nextStatus === 'resolved') {
      showToast('Issue marked resolved. Open counters updated across views.');
    } else if (nextStatus === 'reopened') {
      showToast('Issue reopened.');
    }
  };

  const handleSelectActionItem = (item: ActionItem) => {
    const tabByType: Record<ActionItem['type'], WorkspaceTab> = {
      missing_info: 'facts',
      pi_review: 'matrix',
      discrepancy: 'issues',
      template_update: 'template',
    };
    setWorkspaceTab(tabByType[item.type] || 'matrix');
    setSelectedStudyId(item.studyId);
    showToast(`Opened ${item.studyName}: ${item.title}`);
  };

  // Resolve current active study object
  const currentStudy = selectedStudyId ? studies.find((s) => s.id === selectedStudyId) : null;

  // Breadcrumbs calculation
  const breadcrumbs: { label: string; onClick?: () => void }[] = [];
  if (selectedStudyId && currentStudy) {
    breadcrumbs.push({
      label: 'Studies',
      onClick: handleBackToStudies,
    });
    breadcrumbs.push({
      label: currentStudy.code,
    });
  } else {
    const titles: Record<NavSection, string> = {
      dashboard: 'Dashboard',
      studies: 'Studies',
      create_wizard: 'New Study',
      translation: 'Translation',
      template_library: 'Templates',
      consistency_center: 'Issues',
      update_migration: 'Updates',
      traceability_ledger: 'History',
      settings: 'Settings',
    };
    breadcrumbs.push({
      label: titles[activeSection] || 'Overview',
    });
  }

  // Open / pending issues only (resolved do not count) — shared across Dashboard, Sidebar, Consistency
  const openIssuesCount = studies.reduce((acc, s) => acc + countOpenIssues(s.issues), 0);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-800 antialiased">
      {/* Persistent Left Sidebar */}
      <Sidebar
        activeSection={selectedStudyId ? 'studies' : activeSection}
        onSelectSection={handleSelectSection}
        openIssuesCount={openIssuesCount}
        activeStudiesCount={studies.length}
      />

      {/* Main App Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar */}
        <TopBar
          currentSectionTitle={currentStudy ? currentStudy.code : activeSection}
          breadcrumbs={breadcrumbs}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (q.trim().length > 0 && activeSection !== 'studies' && !selectedStudyId) {
              setActiveSection('studies');
            }
          }}
          onOpenCreateWizard={() => setIsWizardOpen(true)}
          actionItems={actionItems}
          onSelectActionItem={handleSelectActionItem}
          dataSource={dataSource}
        />

        {/* Workspace Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8" tabIndex={-1}>
          {/* Study Workspace View (Screen C) */}
          {currentStudy ? (
            <StudyWorkspaceView
              key={`${currentStudy.id}-${workspaceTab}`}
              study={currentStudy}
              onBackToStudies={handleBackToStudies}
              onUpdateDocumentStatus={handleUpdateDocumentStatus}
              onUpdateStudy={handleUpdateStudy}
              onResolveIssue={handleResolveIssue}
              onOpenWizard={() => setIsWizardOpen(true)}
              onNavigateToSection={handleSelectSection}
              initialTab={workspaceTab}
            />
          ) : activeSection === 'dashboard' ? (
            <DashboardView
              studies={studies}
              actionItems={actionItems}
              onOpenStudy={handleOpenStudy}
              onOpenCreateWizard={() => setIsWizardOpen(true)}
              onSelectActionItem={handleSelectActionItem}
              onNavigateToSection={handleSelectSection}
            />
          ) : activeSection === 'studies' ? (
            <StudiesListView
              studies={studies}
              onOpenStudy={handleOpenStudy}
              onOpenCreateWizard={() => setIsWizardOpen(true)}
              searchFilter={globalSearch}
            />
          ) : activeSection === 'translation' ? (
            <TranslationPreviewView studies={studies} onOpenStudyWorkspace={handleOpenStudy} />
          ) : activeSection === 'template_library' ? (
            <TemplateLibraryPreviewView />
          ) : activeSection === 'consistency_center' ? (
            <ConsistencyCenterPreviewView
              studies={studies}
              onOpenStudy={handleOpenStudy}
              onResolveIssue={handleResolveIssue}
            />
          ) : activeSection === 'update_migration' ? (
            <UpdateMigrationPreviewView />
          ) : activeSection === 'traceability_ledger' ? (
            <TraceabilityLedgerPreviewView />
          ) : activeSection === 'settings' ? (
            <SettingsView />
          ) : null}
        </main>
      </div>

      {/* Multi-step Creation Wizard Modal */}
      <CreateStudyWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCreateStudy={handleCreateStudy}
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
