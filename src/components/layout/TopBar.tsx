import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronRight,
  ShieldCheck,
  Plus,
  AlertTriangle,
  UserCheck,
  FileText,
  Info,
} from 'lucide-react';
import { ActionItem } from '../../types';

interface TopBarProps {
  currentSectionTitle: string;
  breadcrumbs: { label: string; onClick?: () => void }[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenCreateWizard: () => void;
  actionItems: ActionItem[];
  onSelectActionItem?: (item: ActionItem) => void;
  /** Where study payloads came from: database | mock_memory | local_fallback | loading */
  dataSource?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentSectionTitle,
  breadcrumbs,
  searchQuery,
  onSearchChange,
  onOpenCreateWizard,
  actionItems,
  onSelectActionItem,
  dataSource = 'loading',
}) => {
  const fromDb = dataSource === 'database';
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 z-20 shrink-0">
      {/* Left: Breadcrumbs & Page Title */}
      <div className="flex items-center gap-2">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <span className="text-slate-400">BSPHO Workbench</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="hover:text-teal-700 hover:underline transition-colors focus:outline-none"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-slate-800 font-semibold">{crumb.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Middle: Global Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search studies…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Actions & Profile */}
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium cursor-help ${
            fromDb
              ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
              : 'bg-amber-50 border-amber-200/80 text-amber-800'
          }`}
          title={
            fromDb
              ? 'Studies loaded from PostgreSQL. Content is still synthetic seed data — not Ethics Committee approval.'
              : `Studies source: ${dataSource}. UI is using fallback/mock data until the API+DB are connected.`
          }
        >
          <span className={`w-2 h-2 rounded-full ${fromDb ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          <span>{fromDb ? 'DB connected' : 'Demo Mode'}</span>
          <span
            className={`hidden xl:inline text-[10px] border-l pl-1.5 ml-0.5 ${
              fromDb ? 'text-emerald-700 border-emerald-300' : 'text-amber-600 border-amber-300'
            }`}
          >
            {fromDb ? 'PostgreSQL seed' : 'Synthetic fallback'}
          </span>
        </div>

        {/* Create New Study CTA */}
        <button
          onClick={onOpenCreateWizard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-colors focus:ring-2 focus:ring-teal-500/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Study</span>
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            aria-label="View notifications"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {actionItems.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-800">Needs attention</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full">
                  {actionItems.length}
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowNotifications(false);
                      onSelectActionItem?.(item);
                    }}
                    className="p-2 rounded-lg border border-slate-100 hover:bg-slate-50 hover:border-slate-200 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-800 truncate max-w-[190px]">{item.title}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          item.priority === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                    <span className="text-[10px] text-teal-600 font-medium mt-1 inline-block">
                      {item.studyName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            aria-label="User profile menu"
            className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs border border-teal-200">
              SL
            </div>
            <div className="hidden sm:block text-xs leading-tight">
              <span className="font-semibold text-slate-800 block">Dr. Sophie Laurent</span>
              <span className="text-[10px] text-slate-400">BSPHO Coordinator</span>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 text-xs">
              <div className="pb-2.5 mb-2.5 border-b border-slate-100">
                <p className="font-semibold text-slate-900">Dr. Sophie Laurent</p>
                <p className="text-slate-500 text-[11px]">s.laurent@bspho.be</p>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] text-amber-800 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>Demo persona — not authenticated</span>
                </div>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="px-2 py-1.5 rounded hover:bg-slate-50 flex items-center justify-between">
                  <span>Role (UI label)</span>
                  <span className="font-semibold text-slate-800">Coordinator</span>
                </div>
                <div className="px-2 py-1.5 rounded hover:bg-slate-50 flex items-center justify-between">
                  <span>Server auth</span>
                  <span className="font-semibold text-amber-800">Not verified</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
