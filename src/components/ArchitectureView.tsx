import React, { useState } from 'react';
import {
  Network,
  ChevronDown,
  ChevronRight,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  FileCode,
  HardDrive,
  Cpu,
  Radio,
  Server,
} from 'lucide-react';
import type { ArchitectureLayer, Project } from '../types';

interface ArchitectureViewProps {
  project: Project;
  onSelectFile?: (filePath: string, line?: number) => void;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({ project, onSelectFile }) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string>(project.architectureLayers[0]?.id || '');

  const activeLayer = project.architectureLayers.find((l) => l.id === selectedLayerId) || project.architectureLayers[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Title */}
      <div className="border-b border-[#c8c5cb]/50 pb-4">
        <span className="font-mono text-[10px] text-[#835331] uppercase tracking-widest font-semibold">
          System Map &amp; Structural Topology
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[#1c1c18] tracking-tight">
          Physical Architecture Pipeline
        </h1>
        <p className="font-sans text-xs sm:text-sm text-[#47464b] mt-1">
          Evidence-based node pipeline extracted from repository entrypoints, protocols, and directory manifests.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Physical Layer Pipeline */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#78767b] px-1">
            <span>PIPELINE EXECUTION TOPOLOGY</span>
            <span>TOPOLOGY: {project.detectedTopology}</span>
          </div>

          <div className="space-y-2">
            {project.architectureLayers.map((layer, idx) => {
              const isSelected = layer.id === (activeLayer?.id || '');
              return (
                <React.Fragment key={layer.id}>
                  <div
                    onClick={() => setSelectedLayerId(layer.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all border shadow-xs relative ${
                      isSelected
                        ? 'bg-[#ffffff] border-[#835331] ring-1 ring-[#835331]'
                        : 'bg-[#f7f3ec] border-[#c8c5cb]/60 hover:border-[#835331]/40'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <span className="font-mono text-xs font-bold text-[#835331] bg-[#ffdcc6]/40 px-2 py-0.5 rounded border border-[#835331]/20 mt-0.5">
                          {layer.stepNumber}
                        </span>

                        <div className="space-y-0.5">
                          <h3 className="font-sans text-sm sm:text-base font-semibold text-[#1c1c18]">
                            {layer.name}
                          </h3>
                          <p className="font-sans text-xs text-[#47464b] line-clamp-2">
                            {layer.description}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <span className="font-mono text-[10px] bg-[#ece8e1] px-2 py-0.5 rounded border border-[#c8c5cb] text-[#1c1c18] font-medium">
                          {layer.badge}
                        </span>
                        <div className="font-mono text-[10px] text-[#78767b] mt-1">
                          {layer.loc > 0 ? `${layer.loc} LOC` : 'Manifest bound'}
                        </div>
                      </div>
                    </div>

                    {layer.status === 'warning' && (
                      <div className="mt-2.5 pt-2 border-t border-[#c8c5cb]/40 flex items-center text-[11px] font-mono text-[#8a3b00]">
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                        <span>Security / Quality finding flagged in this tier</span>
                      </div>
                    )}
                  </div>

                  {idx < project.architectureLayers.length - 1 && (
                    <div className="flex justify-center my-0.5">
                      <div className="flex flex-col items-center">
                        <div className="w-[1px] h-3 bg-[#c8c5cb]"></div>
                        <ChevronDown className="w-4 h-4 text-[#835331] -my-1" />
                        <div className="w-[1px] h-3 bg-[#c8c5cb]"></div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Right 5 Columns: Active Layer Inspector */}
        <div className="lg:col-span-5">
          {activeLayer ? (
            <div className="bg-[#ffffff] rounded-lg bevel-hairline p-5 space-y-4 sticky top-24">
              <div className="border-b border-[#c8c5cb]/40 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-[#835331]">
                    TIER {activeLayer.stepNumber} INSPECTOR
                  </span>
                  <span className="font-mono text-xs text-[#0e5138] bg-[#e6f4ed] px-2 py-0.2 rounded border border-[#95d4b3]">
                    {activeLayer.protocol}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-medium text-[#1c1c18] mt-1">
                  {activeLayer.name}
                </h3>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-mono text-[11px] text-[#78767b] uppercase tracking-wider font-semibold mb-1">
                    Layer Responsibilities
                  </h4>
                  <p className="font-sans text-xs text-[#1c1c18] leading-relaxed bg-[#f7f3ec] p-2.5 rounded border border-[#c8c5cb]/50">
                    {activeLayer.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-mono text-[11px] text-[#78767b] uppercase tracking-wider font-semibold mb-1.5">
                    Participating Source Files ({activeLayer.files.length})
                  </h4>
                  <div className="space-y-1.5">
                    {activeLayer.files.length > 0 ? (
                      activeLayer.files.map((f) => (
                        <div
                          key={f}
                          onClick={() => onSelectFile && onSelectFile(f)}
                          className="flex items-center justify-between p-2 rounded bg-[#f1ede6] border border-[#c8c5cb]/50 text-xs font-mono cursor-pointer hover:bg-[#ece8e1] hover:border-[#835331] transition-all"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <FileCode className="w-3.5 h-3.5 text-[#835331] shrink-0" />
                            <span className="text-[#1c1c18] truncate">{f}</span>
                          </div>
                          <span className="text-[10px] text-[#835331] hover:underline flex items-center ml-2 shrink-0">
                            Open <ArrowRight className="w-3 h-3 ml-0.5" />
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs font-mono text-[#78767b] p-2 bg-[#f7f3ec] rounded">
                        Generated / runtime interface contract
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#c8c5cb]/40">
                  <div className="flex items-center justify-between text-xs font-mono text-[#47464b]">
                    <span>Contract Schema</span>
                    <span className="text-[#1c1c18] font-semibold">{activeLayer.badge}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-[#47464b] mt-1">
                    <span>Protocol Mode</span>
                    <span className="text-[#1c1c18] font-semibold">{activeLayer.protocol}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
