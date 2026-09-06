import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { ConnectWorkspaceView } from './components/ConnectWorkspaceView';
import { Header } from './components/Header';
import { BottomNav, type TabType } from './components/BottomNav';
import { OverviewView } from './components/OverviewView';
import { AnalysisView } from './components/AnalysisView';
import { ArchitectureView } from './components/ArchitectureView';
import { CodeExplorerView } from './components/CodeExplorerView';
import { MentorView } from './components/MentorView';
import { ChatDrawer } from './components/ChatDrawer';
import { ImportModal } from './components/ImportModal';
import { ProjectsModal } from './components/ProjectsModal';
import type { Project } from './types';
import { apiFetch } from './services/api';
import { Loader2 } from 'lucide-react';

function DevLensWorkspace() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(true);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Deep linking to file/line in Code Explorer
  const [explorerTarget, setExplorerTarget] = useState<{ file: string; line?: number } | null>(null);

  // Modals & Drawers
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState<boolean>(false);
  const [isReanalyzing, setIsReanalyzing] = useState<boolean>(false);
  const [isRefreshingMentor, setIsRefreshingMentor] = useState<boolean>(false);

  // Load single project detail
  const loadProjectDetail = useCallback(async (id: string) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error('Failed to load project details');
      const detail: Project = await res.json();
      setCurrentProject(detail);
    } catch (err: unknown) {
      console.error('Error loading detail:', err);
    }
  }, []);

  // Fetch projects list for authenticated user
  const fetchProjects = useCallback(async (selectId?: string) => {
    if (!isAuthenticated) return;
    try {
      setIsProjectsLoading(true);
      const res = await apiFetch('/api/projects');
      if (!res.ok) {
        setProjects([]);
        setCurrentProject(null);
        return;
      }
      const list: Project[] = await res.json();
      setProjects(list);

      if (list.length > 0) {
        const targetId = selectId || list[0].id;
        await loadProjectDetail(targetId);
      } else {
        setCurrentProject(null);
      }
    } catch (err: unknown) {
      console.error('Error fetching projects:', err);
      setProjects([]);
      setCurrentProject(null);
    } finally {
      setIsProjectsLoading(false);
    }
  }, [isAuthenticated, loadProjectDetail]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setIsProjectsLoading(false);
    }
  }, [isAuthenticated, fetchProjects]);

  const handleSelectProject = (id: string) => {
    loadProjectDetail(id);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const remaining = projects.filter((p) => p.id !== id);
        setProjects(remaining);
        if (currentProject?.id === id) {
          if (remaining.length > 0) {
            loadProjectDetail(remaining[0].id);
          } else {
            setCurrentProject(null);
          }
        }
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleReanalyze = async () => {
    if (!currentProject) return;
    setIsReanalyzing(true);
    try {
      const res = await apiFetch(`/api/projects/${currentProject.id}/reanalyze`, { method: 'POST' });
      if (res.ok) {
        const updated = await res.json();
        setCurrentProject(updated);
        setProjects((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
      }
    } catch (e) {
      console.error('Re-analysis error:', e);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleRefreshMentor = async () => {
    if (!currentProject) return;
    setIsRefreshingMentor(true);
    try {
      const res = await apiFetch(`/api/projects/${currentProject.id}/mentor`, { method: 'POST' });
      if (res.ok) {
        const mentor = await res.json();
        setCurrentProject((prev) => (prev ? { ...prev, mentorSynthesis: mentor } : null));
      }
    } catch (e) {
      console.error('Mentor refresh error:', e);
    } finally {
      setIsRefreshingMentor(false);
    }
  };

  const handleNavigateToFile = (filePath: string, line?: number) => {
    setExplorerTarget({ file: filePath, line });
    setActiveTab('code');
  };

  // 1. Initial Authentication Loading State
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#fdf9f2] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#835331] animate-spin" />
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-[#1c1c18]">DevLens AI</h2>
          <p className="font-mono text-xs text-[#78767b]">
            Verifying secure session tokens and cryptographic credentials...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state: Render login / registration portal
  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // 3. User authenticated, fetching project list
  if (isProjectsLoading) {
    return (
      <div className="min-h-screen bg-[#fdf9f2] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#835331] animate-spin" />
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-bold text-[#1c1c18]">DevLens AI</h2>
          <p className="font-mono text-xs text-[#78767b]">
            Retrieving authenticated repositories for {user.name || user.email}...
          </p>
        </div>
      </div>
    );
  }

  // 4. Authenticated, but zero repositories connected yet (Zero Demo State)
  if (projects.length === 0 || !currentProject) {
    return (
      <div className="min-h-screen bg-[#fdf9f2] text-[#1c1c18] flex flex-col selection:bg-[#fed3b8] selection:text-[#1c1c18]">
        <Header
          user={user}
          currentProject={null}
          projects={[]}
          onSelectProject={() => {}}
          onOpenImport={() => setIsImportOpen(true)}
          onOpenChat={() => {}}
          onReanalyze={() => {}}
          isReanalyzing={false}
          onToggleProjectsModal={() => setIsProjectsModalOpen(true)}
          onLogout={logout}
        />

        <main className="flex-1 pt-18 sm:pt-22 px-4 pb-16 max-w-5xl mx-auto w-full">
          <ConnectWorkspaceView
            user={user}
            onProjectImported={(newProj) => {
              setProjects([newProj]);
              setCurrentProject(newProj);
              setActiveTab('overview');
            }}
          />
        </main>

        {/* Modal for importing project */}
        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onProjectImported={(newProj) => {
            setProjects([newProj]);
            setCurrentProject(newProj);
            setActiveTab('overview');
          }}
        />

        {/* Modal for viewing all projects */}
        <ProjectsModal
          isOpen={isProjectsModalOpen}
          onClose={() => setIsProjectsModalOpen(false)}
          projects={[]}
          activeProjectId={null}
          onSelectProject={() => {}}
          onDeleteProject={() => {}}
          onOpenImport={() => setIsImportOpen(true)}
        />
      </div>
    );
  }

  // 5. Authenticated with an active repository analyzed: Render full DevLens intelligence suite
  return (
    <div className="min-h-screen bg-[#fdf9f2] text-[#1c1c18] flex flex-col selection:bg-[#fed3b8] selection:text-[#1c1c18]">
      {/* Top Fixed Header */}
      <Header
        user={user}
        currentProject={currentProject}
        projects={projects}
        onSelectProject={handleSelectProject}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onReanalyze={handleReanalyze}
        isReanalyzing={isReanalyzing}
        onToggleProjectsModal={() => setIsProjectsModalOpen(true)}
        onLogout={logout}
      />

      {/* Main Content Area */}
      <main className="flex-1 pt-18 md:pt-26 px-3 sm:px-6 pb-20 md:pb-12 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <OverviewView
            project={currentProject}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onSelectFile={handleNavigateToFile}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisView
            project={currentProject}
            onSelectFile={handleNavigateToFile}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView
            project={currentProject}
            onSelectFile={handleNavigateToFile}
          />
        )}

        {activeTab === 'code' && (
          <CodeExplorerView
            project={currentProject}
            initialFile={explorerTarget?.file}
            initialLine={explorerTarget?.line}
          />
        )}

        {activeTab === 'mentor' && (
          <MentorView
            project={currentProject}
            onRefreshMentor={handleRefreshMentor}
            isRefreshing={isRefreshingMentor}
            onSelectFile={handleNavigateToFile}
          />
        )}
      </main>

      {/* Navigation (Bottom on mobile, sub-rail on desktop) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        securityAlertCount={currentProject.securityFindings?.length || 0}
      />

      {/* RAG Codebase AI Chat Drawer */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        project={currentProject}
        onSelectFile={handleNavigateToFile}
      />

      {/* Import Workspace Modal (ZIP / GitHub) */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onProjectImported={(newProj) => {
          setProjects((prev) => [newProj, ...prev]);
          setCurrentProject(newProj);
          setActiveTab('overview');
        }}
      />

      {/* All Projects Management Modal */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        activeProjectId={currentProject.id}
        onSelectProject={handleSelectProject}
        onDeleteProject={handleDeleteProject}
        onOpenImport={() => setIsImportOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DevLensWorkspace />
    </AuthProvider>
  );
}
