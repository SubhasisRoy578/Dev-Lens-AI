import React, { useState } from 'react';
import {
  ShieldAlert,
  Sliders,
  CheckCircle2,
  FileCode2,
  PackageCheck,
  Database,
  Cpu,
  Terminal,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { Project, QualityFinding, SecurityFinding } from '../types';

interface AnalysisViewProps {
  project: Project;
  onSelectFile?: (filePath: string, line?: number) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ project, onSelectFile }) => {
  const [subSection, setSubSection] = useState<'all' | 'tech' | 'quality' | 'security'>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredQuality = project.qualityFindings.filter((q) => {
    if (severityFilter === 'all') return true;
    return q.severity === severityFilter;
  });

  const filteredSecurity = project.securityFindings.filter((s) => {
    if (severityFilter === 'all') return true;
    return s.severity === severityFilter;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header & Sub-section filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c8c5cb]/50 pb-4">
        <div>
          <span className="font-mono text-[10px] text-[#835331] uppercase tracking-widest font-semibold">
            Telemetry &amp; Static Synthesis
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1c1c18] tracking-tight">
            Codebase Diagnostics &amp; Security Fortress
          </h1>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1 bg-[#f1ede6] p-1 rounded border border-[#c5a880]/40 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setSubSection('all')}
            className={`px-3 py-1 rounded transition-all ${
              subSection === 'all' ? 'bg-[#ffffff] font-bold text-[#1c1c18] shadow-xs' : 'text-[#47464b] hover:text-[#1c1c18]'
            }`}
          >
            All Sections
          </button>
          <button
            onClick={() => setSubSection('tech')}
            className={`px-3 py-1 rounded transition-all ${
              subSection === 'tech' ? 'bg-[#ffffff] font-bold text-[#1c1c18] shadow-xs' : 'text-[#47464b] hover:text-[#1c1c18]'
            }`}
          >
            Stack &amp; Manifests
          </button>
          <button
            onClick={() => setSubSection('quality')}
            className={`px-3 py-1 rounded transition-all ${
              subSection === 'quality' ? 'bg-[#ffffff] font-bold text-[#1c1c18] shadow-xs' : 'text-[#47464b] hover:text-[#1c1c18]'
            }`}
          >
            Quality ({project.qualityFindings.length})
          </button>
          <button
            onClick={() => setSubSection('security')}
            className={`px-3 py-1 rounded transition-all ${
              subSection === 'security' ? 'bg-[#ffffff] font-bold text-[#1c1c18] shadow-xs' : 'text-[#47464b] hover:text-[#1c1c18]'
            }`}
          >
            Fortress ({project.securityFindings.length})
          </button>
        </div>
      </div>

      {/* 1. Technology & Language Profile Section */}
      {(subSection === 'all' || subSection === 'tech') && (
        <section className="bg-[#ffffff] rounded-lg bevel-hairline p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#c8c5cb]/40 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#835331]" />
              <h2 className="font-serif text-xl font-medium text-[#1c1c18]">
                Technology &amp; Language Profile
              </h2>
            </div>
            <span className="font-mono text-xs text-[#78767b]">
              Total LOC: {project.totalLines.toLocaleString()}
            </span>
          </div>

          {/* Languages Table Grid */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono text-[#835331] uppercase tracking-wider font-semibold">
              Detected Programming Languages
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {project.languages.map((lang) => (
                <div
                  key={lang.name}
                  className="p-3 rounded bg-[#f7f3ec] border border-[#c8c5cb]/50 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: lang.color || '#835331' }}
                      />
                      <span className="font-sans text-sm font-semibold text-[#1c1c18]">
                        {lang.name}
                      </span>
                      <span className="font-mono text-xs text-[#78767b]">
                        ({lang.loc.toLocaleString()} lines)
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#47464b]">{lang.role}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-serif text-xl font-medium text-[#1c1c18]">
                      {lang.percentage}%
                    </span>
                    <div className="font-mono text-[10px] text-[#835331]">{lang.manifestProof}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ecosystem Evidence Matrices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {/* Frameworks */}
            <div className="p-3 rounded bg-[#f1ede6] border border-[#c8c5cb]/60 space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#835331] font-semibold tracking-wider flex items-center">
                <FileCode2 className="w-3.5 h-3.5 mr-1" /> Frameworks
              </span>
              <div className="flex flex-wrap gap-1">
                {project.frameworks.length > 0 ? (
                  project.frameworks.map((fw) => (
                    <span
                      key={fw}
                      className="font-mono text-xs bg-[#ffffff] px-2 py-0.5 rounded border border-[#c8c5cb] text-[#1c1c18]"
                    >
                      {fw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#78767b] font-mono">None detected</span>
                )}
              </div>
            </div>

            {/* Libraries */}
            <div className="p-3 rounded bg-[#f1ede6] border border-[#c8c5cb]/60 space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#835331] font-semibold tracking-wider flex items-center">
                <PackageCheck className="w-3.5 h-3.5 mr-1" /> Libraries
              </span>
              <div className="flex flex-wrap gap-1">
                {project.libraries.length > 0 ? (
                  project.libraries.map((lib) => (
                    <span
                      key={lib}
                      className="font-mono text-xs bg-[#ffffff] px-2 py-0.5 rounded border border-[#c8c5cb] text-[#1c1c18]"
                    >
                      {lib}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#78767b] font-mono">Standard library</span>
                )}
              </div>
            </div>

            {/* Package Managers */}
            <div className="p-3 rounded bg-[#f1ede6] border border-[#c8c5cb]/60 space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#835331] font-semibold tracking-wider flex items-center">
                <Terminal className="w-3.5 h-3.5 mr-1" /> Package Managers
              </span>
              <div className="flex flex-wrap gap-1">
                {project.packageManagers.length > 0 ? (
                  project.packageManagers.map((pm) => (
                    <span
                      key={pm}
                      className="font-mono text-xs bg-[#ffffff] px-2 py-0.5 rounded border border-[#c8c5cb] text-[#1c1c18]"
                    >
                      {pm}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#78767b] font-mono">None</span>
                )}
              </div>
            </div>

            {/* Databases */}
            <div className="p-3 rounded bg-[#f1ede6] border border-[#c8c5cb]/60 space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#835331] font-semibold tracking-wider flex items-center">
                <Database className="w-3.5 h-3.5 mr-1" /> Databases
              </span>
              <div className="flex flex-wrap gap-1">
                {project.databases.length > 0 ? (
                  project.databases.map((db) => (
                    <span
                      key={db}
                      className="font-mono text-xs bg-[#ffffff] px-2 py-0.5 rounded border border-[#c8c5cb] text-[#1c1c18]"
                    >
                      {db}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#78767b] font-mono">In-memory / FFI</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Code Quality Analysis ("Precision") */}
      {(subSection === 'all' || subSection === 'quality') && (
        <section className="bg-[#ffffff] rounded-lg bevel-hairline p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#c8c5cb]/40 pb-3">
            <div className="flex items-center space-x-2">
              <Sliders className="w-5 h-5 text-[#835331]" />
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1c1c18]">
                  Code Quality &amp; Precision Diagnostics
                </h2>
                <p className="font-mono text-xs text-[#78767b]">
                  AST pattern matching &amp; cyclomatic static analysis
                </p>
              </div>
            </div>

            <span className="font-mono text-xs bg-[#f1ede6] px-2 py-0.5 rounded border border-[#c8c5cb] text-[#47464b]">
              {project.qualityFindings.length} Items Detected
            </span>
          </div>

          <div className="space-y-3">
            {filteredQuality.length > 0 ? (
              filteredQuality.map((finding) => (
                <div
                  key={finding.id}
                  className="p-3.5 rounded bg-[#f7f3ec] border border-[#c8c5cb]/60 space-y-2 hover:border-[#835331]/60 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                            finding.severity === 'high'
                              ? 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/30'
                              : finding.severity === 'medium'
                                ? 'bg-[#fef3eb] text-[#8a3b00] border-[#f8b98f]'
                                : 'bg-[#e6f4ed] text-[#0e5138] border-[#95d4b3]'
                          }`}
                        >
                          {finding.severity}
                        </span>
                        <h4 className="font-sans text-sm font-semibold text-[#1c1c18]">
                          {finding.title}
                        </h4>
                      </div>
                      <p className="font-sans text-xs text-[#47464b] leading-relaxed">
                        {finding.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectFile && onSelectFile(finding.file, finding.line)}
                      className="font-mono text-xs text-[#835331] hover:underline flex items-center shrink-0 ml-2"
                    >
                      <span>
                        {finding.file}:{finding.line}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>

                  {/* Code Snippet Evidence */}
                  {finding.codeSnippet && (
                    <div className="bg-[#1c1c18] text-[#fdf9f2] p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                      <div className="text-[9px] text-[#c8c5cb] mb-1">
                        EVIDENCE LINE {finding.line}:
                      </div>
                      <code>{finding.codeSnippet}</code>
                    </div>
                  )}

                  <div className="bg-[#f1ede6] p-2 rounded text-xs font-mono text-[#1c1c18]">
                    <strong className="text-[#835331]">Recommendation:</strong> {finding.recommendation}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm font-mono text-[#78767b]">
                No code quality findings match the selected filter.
              </div>
            )}
          </div>
        </section>
      )}

      {/* 3. Security Analysis ("Fortress") */}
      {(subSection === 'all' || subSection === 'security') && (
        <section className="bg-[#ffffff] rounded-lg bevel-hairline p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#c8c5cb]/40 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-[#5c2434]" />
              <div>
                <h2 className="font-serif text-xl font-medium text-[#1c1c18]">
                  Security Fortress
                </h2>
                <p className="font-mono text-xs text-[#78767b]">
                  Evidence-based vulnerability scanning &amp; token validation checks
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-[#0e5138] bg-[#e6f4ed] px-2 py-0.5 rounded border border-[#95d4b3]">
                0 Critical
              </span>
              <span className="font-mono text-xs text-[#8a3b00] bg-[#fef3eb] px-2 py-0.5 rounded border border-[#f8b98f]">
                {project.securityFindings.length} Medium/High
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSecurity.length > 0 ? (
              filteredSecurity.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3.5 rounded bg-[#fbebee] border border-[#f3b9c6] space-y-2 hover:border-[#5c2434] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`font-mono text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${
                            sec.severity === 'critical'
                              ? 'bg-[#ba1a1a] text-[#ffffff] border-[#ba1a1a]'
                              : 'bg-[#ffdad6] text-[#ba1a1a] border-[#ba1a1a]/40'
                          }`}
                        >
                          {sec.severity}
                        </span>
                        <h4 className="font-sans text-sm font-semibold text-[#1c1c18]">
                          {sec.title}
                        </h4>
                      </div>
                      <p className="font-sans text-xs text-[#47464b] leading-relaxed">
                        {sec.description}
                      </p>
                    </div>

                    <button
                      onClick={() => onSelectFile && onSelectFile(sec.file, sec.line)}
                      className="font-mono text-xs text-[#5c2434] hover:underline flex items-center shrink-0 ml-2"
                    >
                      <span>
                        {sec.file}:{sec.line}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>

                  {/* Code snippet */}
                  <div className="bg-[#1c1c18] text-[#fdf9f2] p-2.5 rounded font-mono text-[11px] overflow-x-auto">
                    <div className="text-[9px] text-[#febf94] mb-1">
                      {sec.cweOrPattern} • AT LINE {sec.line}:
                    </div>
                    <code>{sec.codeSnippet}</code>
                  </div>

                  <div className="bg-[#ffffff] p-2 rounded text-xs font-mono text-[#1c1c18] border border-[#f3b9c6]">
                    <strong className="text-[#5c2434]">Remediation:</strong> {sec.recommendation}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm font-mono text-[#78767b]">
                No security vulnerabilities detected in repository.
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
