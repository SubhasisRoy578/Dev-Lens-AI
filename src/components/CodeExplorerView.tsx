import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Search,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  Maximize2,
} from 'lucide-react';
import type { FileNode, Project } from '../types';
import { apiFetch } from '../services/api';

interface CodeExplorerViewProps {
  project: Project;
  initialFile?: string;
  initialLine?: number;
}

export const CodeExplorerView: React.FC<CodeExplorerViewProps> = ({
  project,
  initialFile,
  initialLine,
}) => {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>(
    initialFile || (project.rawFiles ? Object.keys(project.rawFiles)[0] : '')
  );
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoadingContent, setIsLoadingContent] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    rpc: true,
    auth: true,
    runtime: true,
    engine: true,
    consensus: true,
    gateway: true,
    proto: true,
  });

  // Load tree
  useEffect(() => {
    apiFetch(`/api/projects/${project.id}/files`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setFileTree(data);
      })
      .catch((err) => console.error('Failed to load file tree:', err));
  }, [project.id]);

  // Load file content when selectedFile changes
  useEffect(() => {
    if (!selectedFile) return;

    if (project.rawFiles && selectedFile in project.rawFiles) {
      setFileContent(project.rawFiles[selectedFile]);
      setAiExplanation(null);
      return;
    }

    setIsLoadingContent(true);
    apiFetch(`/api/projects/${project.id}/file-content?path=${encodeURIComponent(selectedFile)}`)
      .then((res) => res.json())
      .then((data) => {
        setFileContent(data.content || '');
        setAiExplanation(null);
      })
      .catch((err) => console.error('Failed to fetch file content:', err))
      .finally(() => setIsLoadingContent(false));
  }, [selectedFile, project.id, project.rawFiles]);

  // When initialFile changes from outside
  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExplain = async () => {
    if (!selectedFile || !fileContent) return;
    setIsExplaining(true);
    try {
      const res = await apiFetch(`/api/projects/${project.id}/explain-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: selectedFile,
          startLine: 1,
          endLine: Math.min(fileContent.split('\n').length, 80),
          code: fileContent.slice(0, 3000),
        }),
      });
      const data = await res.json();
      setAiExplanation(data.explanation || 'No explanation generated.');
    } catch (e) {
      setAiExplanation('Error communicating with Gemini intelligence engine.');
    } finally {
      setIsExplaining(false);
    }
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderPath]: !prev[folderPath],
    }));
  };

  // Findings for the current file
  const fileFindings = [
    ...project.qualityFindings.filter((q) => q.file === selectedFile).map((q) => ({ type: 'quality', ...q })),
    ...project.securityFindings.filter((s) => s.file === selectedFile).map((s) => ({ type: 'security', ...s })),
  ];

  // Render tree node recursive
  const renderNode = (node: FileNode, depth = 0) => {
    if (node.type === 'directory') {
      const isExpanded = expandedFolders[node.path] !== false; // default expanded
      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center space-x-1 px-2 py-1 rounded text-xs font-mono text-[#47464b] hover:bg-[#ece8e1] cursor-pointer"
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-[#78767b]" />
            ) : (
              <ChevronRight className="w-3 h-3 text-[#78767b]" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-[#835331]" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-[#835331]" />
            )}
            <span className="truncate font-medium">{node.name}</span>
          </div>
          {isExpanded && node.children && (
            <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    // File
    const isSelected = selectedFile === node.path;
    const hasFinding = project.qualityFindings.some((q) => q.file === node.path) || project.securityFindings.some((s) => s.file === node.path);

    return (
      <div
        key={node.path}
        onClick={() => setSelectedFile(node.path)}
        className={`flex items-center justify-between px-2 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${
          isSelected
            ? 'bg-[#1c1c18] text-[#ffffff] font-semibold'
            : 'text-[#1c1c18] hover:bg-[#f1ede6]'
        }`}
        style={{ paddingLeft: `${depth * 14 + 20}px` }}
      >
        <div className="flex items-center space-x-1.5 truncate">
          <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#febf94]' : 'text-[#835331]'}`} />
          <span className="truncate">{node.name}</span>
        </div>
        {hasFinding && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isSelected ? 'bg-[#febf94]' : 'bg-[#ba1a1a]'
            }`}
          />
        )}
      </div>
    );
  };

  const lines = fileContent ? fileContent.split('\n') : [];

  return (
    <div className="space-y-4 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#c8c5cb]/50 pb-3">
        <div>
          <span className="font-mono text-[10px] text-[#835331] uppercase tracking-widest font-semibold">
            Repository Browser &bull; The Source
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1c1c18] tracking-tight">
            Code Explorer &amp; Static Inspector
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExplain}
            disabled={isExplaining}
            className="flex items-center space-x-1.5 bg-[#1c1c18] text-[#fdf9f2] px-3 py-1.5 rounded text-xs font-mono hover:bg-[#2b2b30] transition-all border-t border-[#c5a880]/40 disabled:opacity-50"
          >
            {isExplaining ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#febf94]" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[#febf94]" />
            )}
            <span>Explain with Gemini</span>
          </button>
        </div>
      </div>

      {/* Explorer Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left 3 Columns: File Tree */}
        <div className="lg:col-span-4 bg-[#ffffff] rounded-lg bevel-hairline p-3 space-y-2.5">
          <div className="flex items-center justify-between border-b border-[#c8c5cb]/40 pb-2">
            <span className="font-mono text-xs font-semibold text-[#1c1c18] uppercase tracking-wider">
              Files ({project.totalFiles})
            </span>
            <span className="font-mono text-[10px] text-[#78767b]">{project.name}</span>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#78767b] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filter file path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f7f3ec] border border-[#c8c5cb] pl-8 pr-2.5 py-1 text-xs font-mono rounded focus:border-[#835331] focus:outline-hidden"
            />
          </div>

          {/* File list */}
          <div className="max-h-[520px] overflow-y-auto space-y-0.5 pr-1">
            {searchQuery ? (
              Object.keys(project.rawFiles || {})
                .filter((p) => p.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((p) => (
                  <div
                    key={p}
                    onClick={() => setSelectedFile(p)}
                    className={`px-2 py-1.5 text-xs font-mono rounded cursor-pointer truncate ${
                      selectedFile === p ? 'bg-[#1c1c18] text-[#ffffff]' : 'text-[#1c1c18] hover:bg-[#f1ede6]'
                    }`}
                  >
                    {p}
                  </div>
                ))
            ) : (
              fileTree.map((node) => renderNode(node))
            )}
          </div>
        </div>

        {/* Center / Right 8 Columns: Source Code Viewer & AI Context */}
        <div className="lg:col-span-8 space-y-3">
          {/* File breadcrumb & actions */}
          <div className="bg-[#f7f3ec] border border-[#c8c5cb] rounded px-3 py-2 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center space-x-2 truncate">
              <span className="text-[#78767b]">{project.name} /</span>
              <span className="font-semibold text-[#1c1c18] truncate">{selectedFile}</span>
              <span className="text-[10px] bg-[#ece8e1] px-1.5 py-0.2 rounded border border-[#c8c5cb] text-[#47464b]">
                {lines.length} lines
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="p-1 text-[#47464b] hover:text-[#1c1c18] rounded transition-colors flex items-center space-x-1"
              title="Copy source"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#0e5138]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Code Viewer Panel */}
          <div className="bg-[#ffffff] rounded-lg bevel-hairline overflow-hidden">
            {isLoadingContent ? (
              <div className="p-12 text-center font-mono text-xs text-[#78767b] flex items-center justify-center space-x-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#835331]" />
                <span>Loading source code...</span>
              </div>
            ) : (
              <div className="max-h-[520px] overflow-y-auto font-mono text-xs flex">
                {/* Line Numbers */}
                <div className="bg-[#f7f3ec] border-r border-[#c8c5cb]/40 py-3 px-2.5 text-right select-none text-[#78767b] shrink-0 min-w-[42px]">
                  {lines.map((_, i) => (
                    <div
                      key={i}
                      className={`leading-5 text-[11px] ${
                        initialLine === i + 1 ? 'text-[#835331] font-bold bg-[#febf94]/40 px-1 rounded-xs' : ''
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Code Lines */}
                <div className="py-3 px-4 overflow-x-auto w-full">
                  {lines.map((lineText, i) => (
                    <div
                      key={i}
                      className={`leading-5 whitespace-pre font-mono text-[11.5px] ${
                        initialLine === i + 1 ? 'bg-[#ffdcc6]/50 rounded-xs' : ''
                      }`}
                    >
                      <span className="text-[#1c1c18]">{lineText || ' '}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Explanation Drawer / Output */}
          {aiExplanation && (
            <div className="bg-[#ffffff] rounded-lg bevel-hairline p-4 space-y-2 border-l-4 border-l-[#835331]">
              <div className="flex items-center space-x-2 text-[#835331] font-mono text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>Gemini Architectural Review for {selectedFile}</span>
              </div>
              <div className="font-sans text-xs text-[#1c1c18] leading-relaxed whitespace-pre-wrap bg-[#f7f3ec] p-3 rounded border border-[#c8c5cb]/50">
                {aiExplanation}
              </div>
            </div>
          )}

          {/* Findings in this file */}
          {fileFindings.length > 0 && (
            <div className="bg-[#f7f3ec] rounded-lg border border-[#c8c5cb] p-3 space-y-2">
              <div className="font-mono text-xs font-semibold text-[#1c1c18] flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#8a3b00]" />
                <span>Active Findings in this File ({fileFindings.length})</span>
              </div>
              <div className="space-y-1.5">
                {fileFindings.map((f, i) => (
                  <div
                    key={i}
                    className="p-2 bg-[#ffffff] rounded border border-[#c8c5cb]/50 text-xs font-mono flex items-start justify-between"
                  >
                    <div>
                      <span
                        className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold mr-1.5 ${
                          f.type === 'security' ? 'bg-[#ffdad6] text-[#ba1a1a]' : 'bg-[#fef3eb] text-[#8a3b00]'
                        }`}
                      >
                        {f.severity}
                      </span>
                      <span className="font-medium text-[#1c1c18]">{f.title}</span>
                      <p className="text-[11px] text-[#47464b] font-sans mt-0.5">{f.description}</p>
                    </div>
                    <span className="text-[10px] text-[#78767b] shrink-0 ml-2">Line {f.line}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
