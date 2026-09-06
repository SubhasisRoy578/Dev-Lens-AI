import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Github,
  FileArchive,
  Loader2,
  AlertCircle,
  Cpu,
  ArrowRight,
  Terminal,
  Sparkles,
} from 'lucide-react';
import type { Project } from '../types';
import { apiFetch } from '../services/api';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectImported: (project: Project) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onProjectImported,
}) => {
  const [importMode, setImportMode] = useState<'zip' | 'github'>('zip');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [projectName, setProjectName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('INGEST');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const steps = ['INGEST', 'SCAN', 'AST INDEX', 'DETECT', 'TOPOLOGY', 'MENTOR SYNTHESIS'];

  const cycleProcessingSteps = () => {
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % steps.length;
      setProcessingStep(steps[i]);
    }, 600);
    return interval;
  };

  // Upload ZIP
  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMsg('Please select a valid .zip source archive file.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
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
              name: projectName || file.name.replace(/\.zip$/i, ''),
              base64Zip: base64,
              filename: file.name,
            }),
          });

          clearInterval(interval);
          if (!res.ok) {
            const errData = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errData.error || 'Failed to analyze archive.');
          }

          const project = await res.json();
          onProjectImported(project);
          onClose();
        } catch (err: unknown) {
          clearInterval(interval);
          setIsProcessing(false);
          setErrorMsg(err instanceof Error ? err.message : 'Error processing ZIP file.');
        }
      };

      reader.onerror = () => {
        clearInterval(interval);
        setIsProcessing(false);
        setErrorMsg('Error reading file from disk.');
      };

      reader.readAsDataURL(file);
    } catch (e: unknown) {
      clearInterval(interval);
      setIsProcessing(false);
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  // GitHub Import
  const handleGithubImport = async () => {
    if (!githubUrl.trim()) {
      setErrorMsg('Please specify a GitHub repository name or URL.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    const interval = cycleProcessingSteps();

    try {
      const res = await apiFetch('/api/projects/import-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: githubUrl,
          branch: githubBranch || 'main',
        }),
      });

      clearInterval(interval);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Import failed' }));
        throw new Error(errData.error || 'Failed to import GitHub repository.');
      }

      const project = await res.json();
      onProjectImported(project);
      onClose();
    } catch (err: unknown) {
      clearInterval(interval);
      setIsProcessing(false);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to import repository from GitHub.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1c1c18]/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-[#ffffff] rounded-lg border border-[#c8c5cb] shadow-2xl overflow-hidden bevel-hairline">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#c8c5cb]/50 bg-[#fdf9f2]">
          <div className="flex items-center space-x-2">
            <UploadCloud className="w-5 h-5 text-[#835331]" />
            <div>
              <h2 className="font-serif text-xl font-bold text-[#1c1c18]">Connect Codebase</h2>
              <p className="font-mono text-xs text-[#78767b]">Real AST parsing &amp; architectural intelligence</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 text-[#47464b] hover:text-[#1c1c18] rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Processing State */}
        {isProcessing ? (
          <div className="p-10 text-center space-y-5">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-[#835331]/20 border-t-[#835331] animate-spin" />
                <Cpu className="w-6 h-6 text-[#835331] absolute inset-0 m-auto" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-xs text-[#835331] font-bold tracking-widest uppercase">
                {processingStep}
              </span>
              <p className="font-serif text-lg font-medium text-[#1c1c18]">
                Synthesizing Codebase Intelligence...
              </p>
              <p className="font-sans text-xs text-[#78767b]">
                Extracting AST manifests, calculating language ratios, scanning security vulnerabilities, and mapping topology tiers.
              </p>
            </div>

            {/* Stepper progress */}
            <div className="flex justify-center items-center space-x-1 font-mono text-[9px] text-[#78767b]">
              {steps.map((s, idx) => (
                <React.Fragment key={s}>
                  <span className={s === processingStep ? 'text-[#835331] font-bold' : ''}>{s}</span>
                  {idx < steps.length - 1 && <span>&bull;</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5">
            {/* Mode Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#f1ede6] rounded border border-[#c5a880]/40 font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setImportMode('zip');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2 rounded font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  importMode === 'zip'
                    ? 'bg-[#ffffff] text-[#835331] shadow-xs'
                    : 'text-[#47464b] hover:text-[#1c1c18]'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload .ZIP Archive</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportMode('github');
                  setErrorMsg(null);
                }}
                className={`py-2 px-2 rounded font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                  importMode === 'github'
                    ? 'bg-[#ffffff] text-[#835331] shadow-xs'
                    : 'text-[#47464b] hover:text-[#1c1c18]'
                }`}
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#ffdad6] border border-[#ba1a1a]/40 rounded text-xs font-mono text-[#ba1a1a] flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Option A: ZIP Upload */}
            {importMode === 'zip' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#47464b] mb-1">
                    Workspace Identifier (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. core-engine-api"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full bg-[#f7f3ec] border border-[#c8c5cb] rounded px-3 py-2 text-xs font-mono focus:border-[#835331] focus:outline-hidden"
                  />
                </div>

                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    if (e.dataTransfer.files?.[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                    dragOver
                      ? 'border-[#835331] bg-[#ffdcc6]/20'
                      : 'border-[#c8c5cb] hover:border-[#835331]/60 bg-[#fdf9f2]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <FileArchive className="w-10 h-10 text-[#835331] mx-auto mb-2 opacity-80" />
                  <p className="font-serif text-base text-[#1c1c18] font-medium">
                    Drag and drop your codebase .zip archive here
                  </p>
                  <p className="font-mono text-xs text-[#78767b] mt-1">
                    or click to browse local files (.zip format)
                  </p>
                  <p className="font-mono text-[10px] text-[#835331] mt-3">
                    Automatically filters node_modules, .git, and binaries.
                  </p>
                </div>
              </div>
            )}

            {/* Option B: GitHub Import */}
            {importMode === 'github' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#47464b]">
                    GitHub Repository (Public)
                  </label>
                  <div className="relative">
                    <Github className="w-4 h-4 text-[#78767b] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g. facebook/react or gin-gonic/gin"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="w-full bg-[#f7f3ec] border border-[#c8c5cb] rounded pl-9 pr-3 py-2 text-xs font-mono focus:border-[#835331] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-mono text-[#47464b]">
                    Branch (Defaults to main)
                  </label>
                  <div className="relative">
                    <Terminal className="w-4 h-4 text-[#78767b] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="main"
                      value={githubBranch}
                      onChange={(e) => setGithubBranch(e.target.value)}
                      className="w-full bg-[#f7f3ec] border border-[#c8c5cb] rounded pl-9 pr-3 py-2 text-xs font-mono focus:border-[#835331] focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGithubImport}
                  disabled={!githubUrl.trim()}
                  className="w-full py-2.5 bg-[#1c1c18] text-[#ffffff] rounded font-mono text-xs font-semibold hover:bg-[#2b2b30] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs border-t border-[#c5a880]/40 disabled:opacity-40"
                >
                  <Sparkles className="w-4 h-4 text-[#febf94]" />
                  <span>Fetch &amp; Synthesize GitHub Repository</span>
                  <ArrowRight className="w-4 h-4 text-[#febf94]" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
