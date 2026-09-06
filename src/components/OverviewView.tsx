import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Network,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  BrainCircuit,
  Sliders,
  ExternalLink,
  Code,
} from 'lucide-react';
import type { Project } from '../types';

interface OverviewViewProps {
  project: Project;
  onNavigateTab: (tab: 'overview' | 'analysis' | 'architecture' | 'code' | 'mentor') => void;
  onSelectFile?: (filePath: string, line?: number) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ project, onNavigateTab, onSelectFile }) => {
  const criticalSecCount = project.securityFindings.filter((s) => s.severity === 'critical').length;
  const mediumSecCount = project.securityFindings.filter((s) => s.severity === 'medium' || s.severity === 'high').length;

  return (
    <div className="space-y-4 max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto pb-10">
      {/* Hero 'X-Ray Status Deck' */}
      <section className="bg-[#ffffff] rounded-lg bevel-hairline p-4 sm:p-6 relative overflow-hidden">
        {/* Metallic accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#febf94] via-[#835331] to-[#e6e2db]"></div>

        {/* Header & Diagnostics Readout */}
        <div className="flex items-start justify-between border-b border-[#c8c5cb]/40 pb-3">
          <div>
            <div className="flex items-center space-x-1.5 font-mono text-[10px] text-[#835331] uppercase tracking-wider">
              <span>Static Synthesis</span>
              <span className="text-[#c8c5cb]">•</span>
              <span className="text-[#47464b]">SHA {project.sha || '8f3c4e09'}</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#1c1c18] font-medium tracking-tight mt-0.5">
              Architectural X-Ray
            </h1>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center px-2 py-0.5 rounded border border-[#c8c5cb]/60 bg-[#f7f3ec]">
              <span className="font-mono text-xs font-semibold text-[#1c1c18]">{project.version || 'v4.18.2'}</span>
            </div>
            <p className="font-mono text-[11px] text-[#47464b] mt-0.5">
              {project.analyzedAt ? new Date(project.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '3 min ago'}
            </p>
          </div>
        </div>

        {/* Quantitative Metric Dial & Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 items-center">
          {/* Integrity Index */}
          <div className="bg-[#f7f3ec] rounded p-3 bevel-hairline-subtle flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#47464b] font-semibold">
              SYSTEM INTEGRITY
            </span>
            <div className="flex items-baseline space-x-1 my-1.5">
              <span className="font-serif text-3xl sm:text-4xl font-medium text-[#1c1c18] tracking-tight">
                {project.systemIntegrity}
              </span>
              <span className="font-mono text-xs text-[#78767b]">/100</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0e5138]"></span>
              <span className="font-mono text-[11px] text-[#1c1c18] font-medium">
                {project.integrityClass}
              </span>
            </div>
          </div>

          {/* Architectural Classification */}
          <div className="bg-[#f7f3ec] rounded p-3 bevel-hairline-subtle flex flex-col justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#47464b] font-semibold">
              DETECTED TOPOLOGY
            </span>
            <div className="my-1.5">
              <span className="font-sans text-base sm:text-lg text-[#1c1c18] font-medium leading-snug">
                {project.detectedTopology}
              </span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Network className="w-3.5 h-3.5 text-[#835331]" />
              <span className="font-mono text-[11px] text-[#47464b]">
                {project.topologySubtitle}
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Sub-ribbon */}
        <div className="mt-3 pt-2.5 border-t border-[#c8c5cb]/40 flex justify-between items-center text-[#47464b] font-mono text-[11px]">
          <span>Evidence: lockfile + ast tree</span>
          <span className="flex items-center text-[#835331] font-medium">
            Deterministic Provenance
            <CheckCircle2 className="w-3.5 h-3.5 ml-1 text-[#835331]" />
          </span>
        </div>
      </section>

      {/* Detected Technology Ecosystem (Core Feature) */}
      <section className="bg-[#ffffff] rounded-lg bevel-hairline p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-[#835331] uppercase tracking-widest font-semibold">
              Stack Composition
            </span>
            <h2 className="font-sans text-lg font-semibold text-[#1c1c18]">Technology Ecosystem</h2>
          </div>
          <div className="bg-[#f1ede6] px-2 py-0.5 rounded border border-[#c8c5cb] text-[11px] font-mono text-[#47464b]">
            {project.manifests.map((m) => m.name).slice(0, 2).join(' & ') || 'lockfiles'}
          </div>
        </div>

        {/* Precision Segmented Spectrum */}
        <div className="space-y-1.5">
          <div className="h-2.5 w-full bg-[#e6e2db] rounded-full overflow-hidden flex p-[1px] recessed-well">
            {project.languages.map((lang, idx) => (
              <div
                key={lang.name}
                className="h-full first:rounded-l-full last:rounded-r-full transition-all hover:brightness-110"
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color || (idx === 0 ? '#1c1c18' : idx === 1 ? '#835331' : '#78767b'),
                  marginLeft: idx > 0 ? '1px' : '0px',
                }}
                title={`${lang.name}: ${lang.percentage}% (${lang.loc.toLocaleString()} LOC)`}
              />
            ))}
          </div>
          <div className="flex justify-between font-mono text-[9px] text-[#78767b] tracking-wider">
            <span>0%</span>
            <span>WEIGHTED AST VOLUME ({project.weightedLoc.toLocaleString()} LOC)</span>
            <span>100%</span>
          </div>
        </div>

        {/* Stack Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {project.languages.slice(0, 4).map((lang) => (
            <div
              key={lang.name}
              className="p-2.5 rounded bg-[#f7f3ec] bevel-hairline-subtle flex items-start space-x-2.5"
            >
              <div
                className="w-2.5 h-2.5 rounded-xs mt-1 shrink-0"
                style={{ backgroundColor: lang.color || '#835331' }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-sans text-xs font-semibold text-[#1c1c18] truncate">
                    {lang.name}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#1c1c18]">
                    {lang.percentage}%
                  </span>
                </div>
                <p className="font-mono text-[11px] text-[#47464b] truncate">{lang.role}</p>
                <span className="inline-block mt-1 font-mono text-[9px] text-[#835331] bg-[#ffdcc6]/30 px-1 py-0.2 rounded border border-[#835331]/20">
                  {lang.manifestProof}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture & Security Telemetry Split Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Security Fortress Card */}
        <section className="bg-[#ffffff] rounded-lg bevel-hairline p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#c8c5cb]/40">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-[#835331]" />
                <h3 className="font-sans text-base font-semibold text-[#1c1c18]">Security Fortress</h3>
              </div>
              <div className="flex items-center space-x-1.5 font-mono text-[11px]">
                <span className="text-[#0e5138] bg-[#e6f4ed] px-1.5 py-0.5 rounded border border-[#95d4b3] font-medium">
                  {criticalSecCount} Critical
                </span>
                <span className="text-[#8a3b00] bg-[#fef3eb] px-1.5 py-0.5 rounded border border-[#f8b98f] font-medium">
                  {mediumSecCount} Medium
                </span>
              </div>
            </div>

            {/* Findings List */}
            <div className="mt-3 space-y-2">
              {project.securityFindings.slice(0, 2).map((sec) => (
                <div
                  key={sec.id}
                  onClick={() => {
                    if (onSelectFile) onSelectFile(sec.file, sec.line);
                    onNavigateTab('code');
                  }}
                  className="p-2.5 rounded bg-[#f7f3ec] border border-[#c8c5cb]/50 flex items-start justify-between cursor-pointer hover:border-[#835331] transition-all"
                >
                  <div className="space-y-0.5 pr-2">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8a3b00]"></span>
                      <span className="font-sans text-xs font-medium text-[#1c1c18]">
                        {sec.title}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-[#47464b] line-clamp-1">{sec.description}</p>
                  </div>
                  <span className="font-mono text-[10px] text-[#78767b] uppercase tracking-wider shrink-0">
                    {sec.file}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#c8c5cb]/30 flex justify-end">
            <button
              onClick={() => onNavigateTab('analysis')}
              className="font-mono text-[11px] text-[#835331] hover:underline flex items-center"
            >
              All Security Findings ({project.securityFindings.length}) <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </section>

        {/* Architecture Map Layered Card */}
        <section className="bg-[#ffffff] rounded-lg bevel-hairline p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-[#c8c5cb]/40">
              <div className="flex items-center space-x-1.5">
                <Network className="w-4 h-4 text-[#835331]" />
                <h3 className="font-sans text-base font-semibold text-[#1c1c18]">Architecture Map Preview</h3>
              </div>
              <span className="font-mono text-[10px] text-[#835331] uppercase font-semibold tracking-wider">
                Mesh Graph
              </span>
            </div>

            {/* Layered Physical Pipeline */}
            <div className="mt-3 space-y-1">
              {project.architectureLayers.slice(0, 4).map((layer, idx) => (
                <React.Fragment key={layer.id}>
                  <div
                    onClick={() => onNavigateTab('architecture')}
                    className={`flex items-center justify-between p-2 rounded bg-[#f1ede6] border shadow-xs cursor-pointer hover:bg-[#ece8e1] transition-all ${
                      idx === 1 ? 'border-[#835331]/40' : 'border-[#c8c5cb]/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-[#835331] font-bold">{layer.stepNumber}</span>
                      <span className="font-mono text-xs font-semibold text-[#1c1c18]">{layer.name}</span>
                    </div>
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                        idx === 1
                          ? 'text-[#835331] bg-[#febf94]/20 border-[#835331]/30 font-medium'
                          : 'text-[#47464b] bg-[#ffffff] border-[#c8c5cb]'
                      }`}
                    >
                      {layer.badge}
                    </span>
                  </div>

                  {idx < 3 && (
                    <div className="flex justify-center my-[-2px]">
                      <ChevronDown className="w-3 h-3 text-[#c8c5cb]" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#c8c5cb]/30 flex justify-end">
            <button
              onClick={() => onNavigateTab('architecture')}
              className="font-mono text-[11px] text-[#835331] hover:underline flex items-center"
            >
              Open Full System Map <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          </div>
        </section>
      </div>

      {/* AI Developer Mentor Insight Strip: 'The Mirror' */}
      <section className="bg-[#ece8e1] rounded-lg p-4 sm:p-5 border border-[#835331]/30 relative">
        <div className="flex items-center space-x-2 mb-2">
          <BrainCircuit className="w-4 h-4 text-[#835331]" />
          <span className="font-mono text-[10px] text-[#835331] uppercase font-semibold tracking-wider">
            The Mirror • Mentor Synthesis
          </span>
        </div>

        <blockquote className="font-serif text-[17px] sm:text-lg leading-snug italic text-[#1c1c18] pl-3 border-l-2 border-[#835331] my-2">
          {project.mentorSynthesis?.theMirrorQuote ||
            '"Concurrence anomalies observed in runtime/scheduler.go: unbuffered goroutine spawner may leak contexts during cluster partition recovery."'}
        </blockquote>

        <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-[#c8c5cb]/40 gap-2">
          <span className="font-mono text-[11px] text-[#47464b]">
            Recommendation: Bound pool via <span className="text-[#1c1c18] font-medium">errgroup.WithContext</span>
          </span>
          <button
            onClick={() => onNavigateTab('mentor')}
            className="font-mono text-[11px] font-semibold text-[#835331] hover:text-[#673c1c] flex items-center shrink-0"
          >
            Review Fix <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </section>
    </div>
  );
};
