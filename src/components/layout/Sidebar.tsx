import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Languages,
  BookOpen,
  CheckCircle2,
  GitCompare,
  History,
  Settings,
  ShieldAlert,
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'studies'
  | 'create_wizard'
  | 'translation'
  | 'template_library'
  | 'consistency_center'
  | 'update_migration'
  | 'traceability_ledger'
  | 'settings';

interface SidebarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  openIssuesCount: number;
  activeStudiesCount: number;
}

type NavItem = {
  id: NavSection;
  label: string;
  title?: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  openIssuesCount,
  activeStudiesCount,
}) => {
  const primaryNav: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', title: 'Priorities and study overview', icon: LayoutDashboard },
    {
      id: 'studies',
      label: 'Studies',
      title: 'Mine, network, and review queues',
      icon: FolderKanban,
      badge: activeStudiesCount,
      badgeColor: 'bg-slate-200 text-slate-700',
    },
  ];

  const toolsNav: NavItem[] = [
    { id: 'template_library', label: 'Templates', title: 'BSPHO template sections', icon: BookOpen },
    {
      id: 'consistency_center',
      label: 'Issues',
      title: 'Cross-document mismatches',
      icon: CheckCircle2,
      badge: openIssuesCount > 0 ? openIssuesCount : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'translation', label: 'Translation', title: 'EN → NL / FR overview', icon: Languages },
    { id: 'update_migration', label: 'Updates', title: 'Template version changes', icon: GitCompare },
    { id: 'traceability_ledger', label: 'History', title: 'Sample change history', icon: History },
  ];

  const systemNav: NavItem[] = [
    { id: 'settings', label: 'Settings', title: 'Demo environment info', icon: Settings },
  ];

  const renderNavGroup = (label: string, items: NavItem[]) => (
    <div className="space-y-0.5">
      <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeSection === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectSection(item.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
            aria-current={isActive ? 'page' : undefined}
            title={item.title}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </div>
            {item.badge !== undefined && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : item.badgeColor || 'bg-slate-700 text-slate-300'
                }`}
              >
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <aside className="w-56 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 select-none">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 font-bold text-sm">
          CF
        </div>
        <div className="min-w-0">
          <h1 className="font-semibold text-white tracking-tight text-sm truncate">ConsentFlow</h1>
          <p className="text-[11px] text-slate-400 truncate">BSPHO consent workbench</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto" aria-label="Main">
        {renderNavGroup('Work', primaryNav)}
        {renderNavGroup('Tools', toolsNav)}
        {renderNavGroup('System', systemNav)}
      </nav>

      <div className="p-3 border-t border-slate-800">
        <div className="flex items-start gap-2 px-2 py-1.5 text-[11px] text-slate-400 leading-snug">
          <ShieldAlert className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
          <span>Official legal clauses stay locked when adapting languages.</span>
        </div>
      </div>
    </aside>
  );
};
