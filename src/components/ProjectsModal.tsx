import React from 'react';
import { X, Trash2, FolderGit2, UploadCloud, Terminal, ChevronRight, Check } from 'lucide-react';
import type { Project } from '../types';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenImport: () => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onDeleteProject,
  onOpenImport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1c18]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#ffffff] rounded-lg border border-[#c8c5cb] shadow-2xl overflow-hidden bevel-hairline flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#c8c5cb]/50 bg-[#fdf9f2]">
          <div className="flex items-center space-x-2">
            <FolderGit2 className="w-5 h-5 text-[#835331]" />
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1c1c18]">Active Projects &amp; Repositories</h2>
              <p className="font-mono text-xs text-[#78767b]">
                {projects.length} repository workspace{projects.length === 1 ? '' : 's'} indexed in DevLens
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#47464b] hover:text-[#1c1c18] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {projects.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FolderGit2 className="w-10 h-10 text-[#78767b] mx-auto opacity-50" />
              <p className="font-serif text-base text-[#1c1c18] font-bold">No repositories indexed yet</p>
              <p className="font-mono text-xs text-[#78767b] max-w-sm mx-auto">
                Your workspace is empty. Connect a GitHub repository or upload a .zip folder to start AST analysis.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#1c1c18] text-[#ffffff] rounded font-mono text-xs font-semibold hover:bg-[#2b2b30]"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#febf94]" />
                <span>Connect Codebase Now</span>
              </button>
            </div>
          ) : (
            projects.map((p) => {
              const isActive = p.id === activeProjectId;
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                    isActive
                      ? 'bg-[#f7f3ec] border-[#835331] ring-1 ring-[#835331]'
                      : 'bg-[#ffffff] border-[#c8c5cb]/60 hover:border-[#835331]/40'
                  }`}
                >
                  <div
                    onClick={() => {
                      onSelectProject(p.id);
                      onClose();
                    }}
                    className="cursor-pointer flex-1 space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-serif text-base font-bold text-[#1c1c18]">{p.name}</span>
                      <span className="font-mono text-xs text-[#78767b]">({p.version || 'v1.0'})</span>
                      {isActive && (
                        <span className="font-mono text-[9px] bg-[#0e5138] text-[#ffffff] px-1.5 py-0.2 rounded font-semibold uppercase">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="font-sans text-xs text-[#47464b] line-clamp-2">{p.description}</p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px] text-[#78767b]">
                      <span className="flex items-center text-[#1c1c18]">
                        <Terminal className="w-3 h-3 mr-1 text-[#835331]" /> {p.branch || 'main'}
                      </span>
                      <span>&bull;</span>
                      <span>{p.totalFiles} files</span>
                      <span>&bull;</span>
                      <span>{p.totalLines.toLocaleString()} LOC</span>
                      <span>&bull;</span>
                      <span className="text-[#835331]">
                        {p.languages?.slice(0, 3).map((l) => l.name).join(', ') || 'Polyglot'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onDeleteProject(p.id)}
                      className="p-1.5 text-[#78767b] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 rounded transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        onSelectProject(p.id);
                        onClose();
                      }}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all ${
                        isActive
                          ? 'bg-[#835331] text-[#ffffff]'
                          : 'bg-[#f1ede6] text-[#1c1c18] hover:bg-[#ece8e1]'
                      }`}
                    >
                      {isActive ? 'Active' : 'Switch'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#c8c5cb]/50 bg-[#fdf9f2] flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onOpenImport();
            }}
            className="flex items-center space-x-1.5 font-mono text-xs text-[#835331] hover:underline font-semibold"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import Another Repository...</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1c1c18] text-[#ffffff] rounded font-mono text-xs hover:bg-[#2b2b30] transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
