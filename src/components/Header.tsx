import React from 'react';
import {
  Terminal,
  FolderGit2,
  Sparkles,
  UploadCloud,
  RefreshCw,
  LogOut,
  User as UserIcon,
} from 'lucide-react';
import type { Project, User } from '../types';

interface HeaderProps {
  user: User;
  currentProject: Project | null;
  projects: Project[];
  onSelectProject: (id: string) => void;
  onOpenImport: () => void;
  onOpenChat: () => void;
  onReanalyze: () => void;
  isReanalyzing: boolean;
  onToggleProjectsModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  currentProject,
  projects,
  onSelectProject,
  onOpenImport,
  onOpenChat,
  onReanalyze,
  isReanalyzing,
  onToggleProjectsModal,
  onLogout,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-3 sm:px-6 h-14 bg-[#fdf9f2] border-b border-[#c8c5cb] shadow-xs select-none transition-all">
      {/* Left: Logo & Core badge */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        <button
          onClick={onToggleProjectsModal}
          title="All Projects"
          className="p-1 text-[#1c1c18] hover:bg-[#ece8e1] rounded transition-colors focus:outline-hidden"
        >
          <FolderGit2 className="w-5 h-5 text-[#835331]" />
        </button>

        <div className="flex items-baseline space-x-1.5 cursor-pointer" onClick={() => onToggleProjectsModal()}>
          <span className="font-serif text-xl sm:text-2xl text-[#1c1c18] tracking-tight font-bold">
            DevLens AI
          </span>
          <span className="font-mono text-[10px] bg-[#ece8e1] px-1.5 py-0.5 rounded border border-[#c8c5cb] text-[#47464b] uppercase tracking-widest font-semibold">
            core
          </span>
        </div>
      </div>

      {/* Center/Right: Active Repository Chip & Actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {currentProject ? (
          <>
            {/* Repository Selector Dropdown */}
            <div className="relative group">
              <div className="flex items-center space-x-1.5 bg-[#f1ede6] px-2.5 py-1 rounded bevel-hairline-subtle cursor-pointer hover:bg-[#ece8e1] transition-all">
                <span className="w-1.5 h-1.5 rounded-full bg-[#835331] animate-pulse"></span>
                <span className="font-mono text-xs text-[#1c1c18] font-medium max-w-[120px] sm:max-w-[180px] truncate">
                  {currentProject.name}:{currentProject.version || 'v1.0'}
                </span>
              </div>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#ffffff] border border-[#c8c5cb] rounded shadow-lg py-1.5 hidden group-hover:block z-50">
                <div className="px-3 py-1 text-[10px] font-mono text-[#78767b] uppercase tracking-wider border-b border-[#ece8e1]">
                  Switch Project ({projects.length})
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => onSelectProject(p.id)}
                      className={`w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-[#f7f3ec] transition-colors ${
                        p.id === currentProject.id ? 'bg-[#f1ede6] font-semibold text-[#835331]' : 'text-[#1c1c18]'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span className="text-[10px] text-[#78767b] ml-2">{p.languages?.[0]?.name || 'Polyglot'}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#ece8e1] mt-1 pt-1 px-2">
                  <button
                    onClick={onOpenImport}
                    className="w-full text-left px-2 py-1.5 text-xs text-[#835331] font-mono hover:bg-[#fdf9f2] rounded flex items-center space-x-1"
                  >
                    <UploadCloud className="w-3.5 h-3.5 mr-1" />
                    <span>Import New Workspace...</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Branch Pill */}
            <div className="hidden sm:flex items-center bg-[#ffffff] border border-[#c8c5cb] px-2 py-1 rounded text-[#1c1c18] hover:bg-[#ece8e1] transition-all">
              <Terminal className="w-3.5 h-3.5 mr-1 text-[#835331]" />
              <span className="font-mono text-xs font-semibold">{currentProject.branch || 'main'}</span>
            </div>

            {/* Re-analyze Button */}
            <button
              onClick={onReanalyze}
              disabled={isReanalyzing}
              title="Re-run Static & Architectural Analysis"
              className="p-1.5 text-[#47464b] hover:text-[#1c1c18] hover:bg-[#ece8e1] rounded transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isReanalyzing ? 'animate-spin text-[#835331]' : ''}`} />
            </button>
          </>
        ) : (
          <div className="hidden sm:flex items-center space-x-1 bg-[#ece8e1] px-2 py-0.5 rounded border border-[#c8c5cb] text-[11px] font-mono text-[#78767b]">
            <span>No Repository Connected</span>
          </div>
        )}

        {/* Ask Codebase AI CTA (only if project active) */}
        {currentProject && (
          <button
            onClick={onOpenChat}
            className="flex items-center space-x-1 bg-[#1c1c18] text-[#fdf9f2] px-2.5 py-1 rounded text-xs font-mono hover:bg-[#2b2b30] active:scale-95 transition-all shadow-xs border-t border-[#c5a880]/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#febf94]" />
            <span className="hidden sm:inline">Ask Codebase</span>
            <span className="sm:hidden">Ask</span>
          </button>
        )}

        {/* Import Workspace Button */}
        <button
          onClick={onOpenImport}
          className="flex items-center space-x-1 bg-[#f1ede6] text-[#835331] border border-[#c5a880]/50 px-2 py-1 rounded text-xs font-mono hover:bg-[#ece8e1] transition-all"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Connect</span>
        </button>

        {/* User Profile & Logout */}
        <div className="flex items-center pl-1 sm:pl-2 border-l border-[#c8c5cb] space-x-1.5">
          <div
            title={`Logged in as ${user.name} (${user.email})`}
            className="flex items-center space-x-1.5 bg-[#ffffff] border border-[#c8c5cb] px-2 py-1 rounded text-xs font-mono text-[#1c1c18]"
          >
            <div className="w-4 h-4 rounded-full bg-[#835331] text-[#fdf9f2] flex items-center justify-center text-[10px] font-bold">
              {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
            </div>
            <span className="max-w-[70px] sm:max-w-[100px] truncate hidden sm:inline">
              {user.name || user.email.split('@')[0]}
            </span>
          </div>

          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 text-[#78767b] hover:text-[#ba1a1a] hover:bg-[#ece8e1] rounded transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
