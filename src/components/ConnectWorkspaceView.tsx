import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Github,
  FileArchive,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { Project, User } from '../types';
import { apiFetch } from '../services/api';

interface ConnectWorkspaceViewProps {
  user: User;
  onProjectImported: (project: Project) => void;
}

export const ConnectWorkspaceView: React.FC<ConnectWorkspaceViewProps> = ({
  user,
  onProjectImported,
}) => {
  const [activeMode, setActiveMode] = useState<'zip' | 'github'>('zip');

  // ZIP state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zipProjectName, setZipProjectName] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // GitHub state
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('INGEST');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const steps = [
    'INGEST',
    'SCAN',
    'AST INDEX',
    'DETECT VULNERABILITIES',
    'TOPOLOGY MAPPING',
    'CODEBASE SYNTHESIS',
  ];

  const cycleProcessingSteps = () => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % steps.length;
      setProcessingStep(steps[i]);
    }, 650);
    return interval;
  };

  // Upload ZIP
  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Please select a .zip archive of your codebase.');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setErrorMessage('File must be a .zip archive.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const interval = cycleProcessingSteps();

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const res = await apiFetch('/api/projects/upload-zip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: zipProjectName || selectedFile.name.replace(/\.zip$/i, ''),
              base64Zip: base64,
              filename: selectedFile.name,
            }),
          });

          clearInterval(interval);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errData.error || 'Failed to analyze archive.');
          }

          const project = await res.json();
          onProjectImported(project);
        } catch (err: unknown) {
          clearInterval(interval);
          setIsProcessing(false);
          setErrorMessage(err instanceof Error ? err.message : 'Error processing ZIP file.');
        }
      };

      reader.onerror = () => {
        clearInterval(interval);
        setIsProcessing(false);
        setErrorMessage('Error reading file from disk.');
      };

      reader.readAsDataURL(selectedFile);
    } catch (err: unknown) {
      clearInterval(interval);
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  // GitHub Import
  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      setErrorMessage('Please enter a GitHub repository URL or owner/repo format.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const interval = cycleProcessingSteps();

    try {
      const res = await apiFetch('/api/projects/import-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: githubUrl.trim(),
          branch: githubBranch.trim() || 'main',
        }),
      });

      clearInterval(interval);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Import failed' }));
        throw new Error(errData.error || 'Failed to import GitHub repository.');
      }

      const project = await res.json();
      onProjectImported(project);
    } catch (err: unknown) {
      clearInterval(interval);
      setIsProcessing(false);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to import GitHub repository.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 sm:py-12 px-4 space-y-8">
      {/* Welcome Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-[#ece8e1] px-3 py-1 rounded-full border border-[#c8c5cb] text-xs font-mono text-[#47464b]">
          <span className="w-2 h-2 rounded-full bg-[#835331] animate-pulse"></span>
          <span>Workspace Authenticated // {user.email}</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#1c1c18]">
          Connect Repository to Begin Analysis
        </h1>
        <p className="font-mono text-xs sm:text-sm text-[#78767b] max-w-xl mx-auto">
          No demo repositories loaded. Connect your codebase via public GitHub repository or upload a local .zip archive to initiate deterministic AST extraction, security scans, and architectural synthesis.
        </p>
      </div>

      {/* Main Connection Container */}
      <div className="bg-[#ffffff] border border-[#c8c5cb] rounded-lg shadow-sm overflow-hidden">
        {/* Method Selector Tabs */}
        <div className="grid grid-cols-2 border-b border-[#ece8e1] bg-[#f7f3ec]">
          <button
            type="button"
            onClick={() => {
              setActiveMode('zip');
              setErrorMessage(null);
            }}
            className={`py-3.5 px-4 flex items-center justify-center space-x-2 font-mono text-xs font-semibold tracking-wider transition-all border-b-2 ${
              activeMode === 'zip'
                ? 'border-[#835331] bg-[#ffffff] text-[#835331]'
                : 'border-transparent text-[#78767b] hover:text-[#1c1c18]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload .ZIP Archive</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('github');
              setErrorMessage(null);
            }}
            className={`py-3.5 px-4 flex items-center justify-center space-x-2 font-mono text-xs font-semibold tracking-wider transition-all border-b-2 ${
              activeMode === 'github'
                ? 'border-[#835331] bg-[#ffffff] text-[#835331]'
                : 'border-transparent text-[#78767b] hover:text-[#1c1c18]'
            }`}
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub Repo</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-6 p-3.5 bg-[#fff0f0] border border-[#ba1a1a]/30 rounded text-[#ba1a1a] flex items-start space-x-2.5 text-xs font-mono">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Analysis Ingestion Error</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Processing State Overlay / Display */}
        {isProcessing ? (
          <div className="py-16 px-6 text-center space-y-6">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-2 border-[#835331]/20 border-t-[#835331] animate-spin"></div>
              <Cpu className="w-6 h-6 text-[#835331] absolute" />
            </div>

            <div className="space-y-2">
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-[#835331] bg-[#fed3b8]/40 px-3 py-1 rounded border border-[#835331]/30">
                PIPELINE STEP: {processingStep}
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1c1c18]">
                Analyzing Repository Architecture
              </h3>
              <p className="font-mono text-xs text-[#78767b] max-w-md mx-auto">
                Parsing source code tree, compiling AST metrics, computing system integrity, and mapping protocol tiers...
              </p>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto pt-2">
              {steps.map((s) => (
                <span
                  key={s}
                  className={`font-mono text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    s === processingStep
                      ? 'bg-[#1c1c18] text-[#ffffff] border-[#1c1c18]'
                      : 'bg-[#f7f3ec] text-[#78767b] border-[#c8c5cb]'
                  }`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 sm:p-8">
            {/* MODE 1: ZIP Archive Upload */}
            {activeMode === 'zip' && (
              <form onSubmit={handleZipSubmit} className="space-y-6">
                {/* Drag and drop area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      setSelectedFile(e.dataTransfer.files[0]);
                      setErrorMessage(null);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? 'border-[#835331] bg-[#fed3b8]/20'
                      : selectedFile
                      ? 'border-[#835331] bg-[#fdf9f2]'
                      : 'border-[#c8c5cb] hover:border-[#835331] bg-[#fbf8f2]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setErrorMessage(null);
                      }
                    }}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-12 h-12 rounded-full bg-[#835331]/10 text-[#835331] flex items-center justify-center">
                        <FileArchive className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-sm font-bold text-[#1c1c18]">
                        {selectedFile.name}
                      </span>
                      <span className="font-mono text-xs text-[#78767b]">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB archive selected
                      </span>
                      <span className="text-xs font-mono text-[#835331] underline pt-1">
                        Click or drag to choose another file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#ece8e1] text-[#835331] flex items-center justify-center border border-[#c8c5cb]">
                        <UploadCloud className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-serif text-lg font-bold text-[#1c1c18]">
                          Drop your source code .zip archive here
                        </p>
                        <p className="font-mono text-xs text-[#78767b]">
                          Supports Go, TypeScript, Rust, Python, Java, C++, and Protobuf projects
                        </p>
                      </div>
                      <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-[#ffffff] border border-[#c8c5cb] rounded text-xs font-mono text-[#1c1c18] shadow-2xs hover:bg-[#ece8e1]">
                        <span>Browse from Computer</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Project Name (Optional) */}
                <div>
                  <label className="block font-mono text-xs font-medium text-[#47464b] uppercase tracking-wider mb-1">
                    Workspace Identifier (Optional)
                  </label>
                  <input
                    type="text"
                    value={zipProjectName}
                    onChange={(e) => setZipProjectName(e.target.value)}
                    placeholder={selectedFile ? selectedFile.name.replace(/\.zip$/i, '') : 'e.g. backend-core-v2'}
                    className="block w-full px-3 py-2 bg-[#fdf9f2] border border-[#c8c5cb] rounded text-xs font-mono text-[#1c1c18] placeholder-[#78767b]/60 focus:outline-none focus:border-[#835331]"
                  />
                  <span className="font-mono text-[10px] text-[#78767b] mt-1 block">
                    node_modules, .git, and binary artifacts are automatically excluded during ingestion.
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!selectedFile}
                  className="w-full py-3 px-4 bg-[#1c1c18] text-[#fdf9f2] hover:bg-[#2b2b30] rounded text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-[#febf94]" />
                  <span>Begin Full Codebase Analysis</span>
                  <ArrowRight className="w-4 h-4 text-[#febf94]" />
                </button>
              </form>
            )}

            {/* MODE 2: GitHub Repository Import */}
            {activeMode === 'github' && (
              <form onSubmit={handleGithubSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block font-mono text-xs font-medium text-[#47464b] uppercase tracking-wider mb-1">
                      GitHub Repository URL or Owner/Repo
                    </label>
                    <div className="relative rounded">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#78767b]">
                        <Github className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/facebook/react or gin-gonic/gin"
                        className="block w-full pl-9 pr-3 py-2.5 bg-[#fdf9f2] border border-[#c8c5cb] rounded text-xs font-mono text-[#1c1c18] placeholder-[#78767b]/60 focus:outline-none focus:border-[#835331]"
                      />
                    </div>
                    <span className="font-mono text-[10px] text-[#78767b] mt-1 block">
                      Directly downloads and parses the latest zipball snapshot from GitHub API.
                    </span>
                  </div>

                  <div>
                    <label className="block font-mono text-xs font-medium text-[#47464b] uppercase tracking-wider mb-1">
                      Git Branch
                    </label>
                    <div className="relative rounded">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#78767b]">
                        <Terminal className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        placeholder="main (falls back to master if not found)"
                        className="block w-full pl-9 pr-3 py-2 bg-[#fdf9f2] border border-[#c8c5cb] rounded text-xs font-mono text-[#1c1c18] placeholder-[#78767b]/60 focus:outline-none focus:border-[#835331]"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={!githubUrl.trim()}
                  className="w-full py-3 px-4 bg-[#1c1c18] text-[#fdf9f2] hover:bg-[#2b2b30] rounded text-xs font-mono font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-[#febf94]" />
                  <span>Connect &amp; Start Analysis</span>
                  <ArrowRight className="w-4 h-4 text-[#febf94]" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Feature Grid / What happens next */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs text-[#47464b]">
        <div className="bg-[#ffffff] p-4 rounded border border-[#c8c5cb] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#835331] font-semibold">
            <Cpu className="w-4 h-4" />
            <span>AST Static Analysis</span>
          </div>
          <p className="text-[11px] text-[#78767b]">
            Multi-language AST metrics, cyclomatic bottlenecks, code quality scans, and weighted LOC.
          </p>
        </div>

        <div className="bg-[#ffffff] p-4 rounded border border-[#c8c5cb] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#835331] font-semibold">
            <Layers className="w-4 h-4" />
            <span>Topology Mapping</span>
          </div>
          <p className="text-[11px] text-[#78767b]">
            Reverse-engineers architectural tiers, ingress routes, consensus cores, and execution engines.
          </p>
        </div>

        <div className="bg-[#ffffff] p-4 rounded border border-[#c8c5cb] space-y-1.5">
          <div className="flex items-center space-x-2 text-[#835331] font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Fortress Security</span>
          </div>
          <p className="text-[11px] text-[#78767b]">
            Pattern-matched vulnerability detection for insecure TLS, token flaws, and concurrency leaks.
          </p>
        </div>
      </div>
    </div>
  );
};
