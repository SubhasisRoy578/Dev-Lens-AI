import React, { useState } from 'react';
import {
  BrainCircuit,
  Compass,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Award,
  Layers,
  FileCode,
} from 'lucide-react';
import type { Project, RoadmapMilestone, RoadmapStage } from '../types';

interface MentorViewProps {
  project: Project;
  onRefreshMentor: () => void;
  isRefreshing: boolean;
  onSelectFile?: (filePath: string, line?: number) => void;
}

export const MentorView: React.FC<MentorViewProps> = ({
  project,
  onRefreshMentor,
  isRefreshing,
  onSelectFile,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'mirror' | 'roadmap'>('mirror');
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>({});

  const toggleMilestone = (key: string) => {
    setCompletedMilestones((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const mentor = project.mentorSynthesis;
  const roadmap = project.roadmap || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#c8c5cb]/50 pb-4">
        <div>
          <span className="font-mono text-[10px] text-[#835331] uppercase tracking-widest font-semibold">
            Senior Engineering Critique &amp; Growth
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1c1c18] tracking-tight">
            Developer Mentor &amp; Personalized Ascent
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub-tab pills */}
          <div className="flex items-center space-x-1 bg-[#f1ede6] p-1 rounded border border-[#c5a880]/40 font-mono text-xs">
            <button
              onClick={() => setActiveSubTab('mirror')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
                activeSubTab === 'mirror'
                  ? 'bg-[#ffffff] font-bold text-[#1c1c18] shadow-xs'
                  : 'text-[#47464b] hover:text-[#1c1c18]'
              }`}
            >
              <BrainCircuit className="w-3.5 h-3.5 text-[#835331]" />
              <span>The Mirror</span>
            </button>
            <button
              onClick={() => setActiveSubTab('roadmap')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-all ${
                activeSubTab === 'roadmap'
                  ? 'bg-[#ffffff] font-bold text-[#1c1c18] shadow-xs'
                  : 'text-[#47464b] hover:text-[#1c1c18]'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#835331]" />
              <span>Ascent Roadmap</span>
            </button>
          </div>

          <button
            onClick={onRefreshMentor}
            disabled={isRefreshing}
            title="Regenerate with Gemini"
            className="p-1.5 rounded bg-[#ffffff] border border-[#c8c5cb] text-[#47464b] hover:text-[#1c1c18] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#835331]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. The Mirror View */}
      {activeSubTab === 'mirror' && (
        <div className="space-y-6">
          {/* Hero Editorial Blockquote */}
          <section className="bg-[#ffffff] rounded-lg bevel-hairline p-6 relative overflow-hidden space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#835331] animate-pulse"></span>
              <span className="font-mono text-xs text-[#835331] uppercase tracking-wider font-semibold">
                Principal Engineer Executive Synthesis
              </span>
            </div>

            <blockquote className="font-serif text-xl sm:text-2xl leading-relaxed italic text-[#1c1c18] pl-4 border-l-3 border-[#835331]">
              {mentor?.theMirrorQuote ||
                `"Concurrence anomalies observed in runtime/scheduler.go: unbuffered goroutine spawner may leak contexts during cluster partition recovery."`}
            </blockquote>

            <div className="pt-3 border-t border-[#c8c5cb]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs text-[#47464b]">
              <div>
                Anomaly Focus:{' '}
                <button
                  onClick={() => onSelectFile && onSelectFile(mentor?.anomalyFile || 'runtime/scheduler.go', mentor?.anomalyLine)}
                  className="text-[#835331] font-semibold hover:underline"
                >
                  {mentor?.anomalyFile || 'runtime/scheduler.go'}
                  {mentor?.anomalyLine ? `:${mentor.anomalyLine}` : ''}
                </button>
              </div>
              <div className="text-[#0e5138] bg-[#e6f4ed] px-2 py-0.5 rounded border border-[#95d4b3] font-medium self-start sm:self-auto">
                Action: {mentor?.recommendation || 'Bound pool via errgroup.WithContext'}
              </div>
            </div>
          </section>

          {/* Code Fix Diff Card */}
          {mentor?.codeFixDiff && (
            <section className="bg-[#ffffff] rounded-lg bevel-hairline p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-[#c8c5cb]/40 pb-2">
                <span className="font-mono text-xs uppercase text-[#835331] font-semibold tracking-wider flex items-center">
                  <FileCode className="w-4 h-4 mr-1.5" /> Concrete Hardening Patch
                </span>
                <span className="font-mono text-[10px] text-[#78767b]">Grounded in repository source</span>
              </div>
              <pre className="bg-[#1c1c18] text-[#fdf9f2] p-4 rounded font-mono text-xs overflow-x-auto leading-relaxed">
                <code>{mentor.codeFixDiff}</code>
              </pre>
            </section>
          )}

          {/* Tri-Column Feedback Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Strengths */}
            <div className="bg-[#ffffff] rounded-lg bevel-hairline p-4 space-y-2.5">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-[#c8c5cb]/40 text-[#0e5138]">
                <ShieldCheck className="w-4 h-4" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">
                  Demonstrated Strengths
                </h3>
              </div>
              <ul className="space-y-2 font-sans text-xs text-[#1c1c18]">
                {(mentor?.strengths || [
                  'High-throughput SIMD vector math primitives',
                  'Clean isolation between consensus protocol & serialization',
                  'Strict schema contracts with Protobuf v3',
                ]).map((s, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-[#0e5138] shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Architectural Weaknesses */}
            <div className="bg-[#ffffff] rounded-lg bevel-hairline p-4 space-y-2.5">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-[#c8c5cb]/40 text-[#8a3b00]">
                <AlertCircle className="w-4 h-4" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">
                  Architectural Gaps
                </h3>
              </div>
              <ul className="space-y-2 font-sans text-xs text-[#1c1c18]">
                {(mentor?.weaknesses || [
                  'Unbounded goroutine spawning without context lifecycles',
                  'Missing token whitelist algorithm verification in JWT decoder',
                  'Insufficient chaos partition testing around raft quorums',
                ]).map((w, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8a3b00] shrink-0 mt-1.5"></span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missing Practices */}
            <div className="bg-[#ffffff] rounded-lg bevel-hairline p-4 space-y-2.5">
              <div className="flex items-center space-x-1.5 pb-2 border-b border-[#c8c5cb]/40 text-[#5c2434]">
                <Award className="w-4 h-4" />
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider">
                  Missing Production Rigor
                </h3>
              </div>
              <ul className="space-y-2 font-sans text-xs text-[#1c1c18]">
                {(mentor?.missingPractices || [
                  'Automated partition chaos injection in CI',
                  'Distributed OpenTelemetry span propagation headers',
                  'Dynamic connection pooling limits on sockets',
                ]).map((p, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5c2434] shrink-0 mt-1.5"></span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 2. Ascent Roadmap View */}
      {activeSubTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="bg-[#ffffff] rounded-lg bevel-hairline p-5">
            <div className="flex items-center justify-between border-b border-[#c8c5cb]/40 pb-3">
              <div>
                <span className="font-mono text-[10px] text-[#835331] uppercase tracking-wider font-semibold">
                  Personalized Engineering Pathway
                </span>
                <h2 className="font-serif text-2xl font-medium text-[#1c1c18]">
                  The Ascent: Tailored Curriculum for {project.name}
                </h2>
              </div>
              <span className="font-mono text-xs bg-[#f1ede6] px-2.5 py-1 rounded border border-[#c8c5cb] text-[#47464b]">
                {roadmap.length} Stages Synthesized
              </span>
            </div>

            <p className="font-sans text-xs sm:text-sm text-[#47464b] mt-3 leading-relaxed">
              Every milestone in this roadmap traces directly to observed code implementations, detected technologies, or identified security vulnerabilities in this repository.
            </p>
          </div>

          {/* Roadmap Stages */}
          <div className="space-y-5">
            {roadmap.map((stage) => (
              <div key={stage.stageNumber} className="bg-[#ffffff] rounded-lg bevel-hairline p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#c8c5cb]/30 pb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-xs font-bold bg-[#835331] text-[#ffffff] px-2 py-0.5 rounded">
                      Stage {stage.stageNumber}
                    </span>
                    <h3 className="font-serif text-lg font-semibold text-[#1c1c18]">
                      {stage.stageTitle}
                    </h3>
                  </div>
                  <span className="font-mono text-xs text-[#78767b] hidden sm:inline">
                    {stage.focusArea}
                  </span>
                </div>

                <div className="space-y-3">
                  {stage.milestones.map((milestone, idx) => {
                    const mKey = `${stage.stageNumber}-${idx}`;
                    const isDone = !!completedMilestones[mKey];
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border transition-all ${
                          isDone
                            ? 'bg-[#e6f4ed]/40 border-[#95d4b3]'
                            : 'bg-[#f7f3ec] border-[#c8c5cb]/60 hover:border-[#835331]/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => toggleMilestone(mKey)}
                              className={`w-5 h-5 rounded-sm flex items-center justify-center border transition-all mt-0.5 ${
                                isDone
                                  ? 'bg-[#0e5138] border-[#0e5138] text-[#ffffff]'
                                  : 'bg-[#ffffff] border-[#c8c5cb] hover:border-[#835331]'
                              }`}
                            >
                              {isDone && <CheckCircle className="w-3.5 h-3.5" />}
                            </button>

                            <div className="space-y-1">
                              <h4
                                className={`font-sans text-sm font-semibold ${
                                  isDone ? 'line-through text-[#78767b]' : 'text-[#1c1c18]'
                                }`}
                              >
                                {milestone.title}
                              </h4>
                              <p className="font-sans text-xs text-[#47464b] leading-relaxed">
                                {milestone.description}
                              </p>

                              {/* Grounded Rationale */}
                              <div className="bg-[#ffffff] p-2 rounded border border-[#c8c5cb]/40 font-mono text-[11px] text-[#835331] mt-2">
                                <strong>Codebase Evidence:</strong> {milestone.groundedRationale}
                              </div>

                              {/* Skills Pills */}
                              <div className="flex flex-wrap gap-1 mt-2">
                                {milestone.keySkills.map((sk) => (
                                  <span
                                    key={sk}
                                    className="font-mono text-[10px] bg-[#f1ede6] text-[#47464b] px-2 py-0.2 rounded border border-[#c8c5cb]"
                                  >
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                                milestone.impactLevel === 'Mastery'
                                  ? 'bg-[#ffdcc6] text-[#673c1c] border-[#835331]/30'
                                  : 'bg-[#ffffff] text-[#1c1c18] border-[#c8c5cb]'
                              }`}
                            >
                              {milestone.impactLevel}
                            </span>
                            <div className="font-mono text-[11px] text-[#78767b] flex items-center justify-end mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              <span>{milestone.estimatedHours}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
