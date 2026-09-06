export interface User {
  id: string;
  email: string;
  name: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LanguageStat {
  name: string;
  percentage: number;
  loc: number;
  color: string;
  role: string;
  manifestProof: string;
}

export interface ManifestStat {
  name: string;
  path: string;
  packageCount: number;
  samplePackages: string[];
}

export interface QualityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: 'complexity' | 'modularity' | 'error-handling' | 'maintainability' | 'documentation';
  title: string;
  description: string;
  file: string;
  line: number;
  codeSnippet: string;
  recommendation: string;
}

export interface SecurityFinding {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file: string;
  line: number;
  codeSnippet: string;
  recommendation: string;
  cweOrPattern: string;
}

export interface ArchitectureLayer {
  id: string;
  stepNumber: string;
  name: string;
  badge: string;
  protocol: string;
  description: string;
  files: string[];
  loc: number;
  status: 'nominal' | 'warning' | 'alert';
}

export interface MentorSynthesis {
  theMirrorQuote: string;
  anomalyFile: string;
  anomalyLine?: number;
  recommendation: string;
  codeFixDiff?: string;
  strengths: string[];
  weaknesses: string[];
  missingPractices: string[];
  reviewedAt: string;
}

export interface RoadmapMilestone {
  title: string;
  description: string;
  groundedRationale: string;
  impactLevel: 'Foundational' | 'High' | 'Architectural' | 'Mastery';
  estimatedHours: string;
  keySkills: string[];
  completed?: boolean;
}

export interface RoadmapStage {
  stageNumber: number;
  stageTitle: string;
  focusArea: string;
  milestones: RoadmapMilestone[];
}

export interface FileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  lines?: number;
  language?: string;
  children?: FileNode[];
}

export interface CodeChunk {
  id: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  language: string;
}

export interface Citation {
  file: string;
  startLine?: number;
  endLine?: number;
  snippet?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  thinking?: string;
}

export interface Project {
  id: string;
  ownerId?: string;
  name: string;
  description: string;
  branch: string;
  sha: string;
  version: string;
  sourceType: 'zip' | 'github' | 'sample';
  sourceUrl?: string;
  createdAt: string;
  analyzedAt: string;
  status: 'idle' | 'scanning' | 'indexing' | 'analyzing' | 'completed' | 'failed';
  systemIntegrity: number;
  integrityClass: string;
  detectedTopology: string;
  topologySubtitle: string;
  totalFiles: number;
  totalLines: number;
  weightedLoc: number;
  evidenceSource: string;
  languages: LanguageStat[];
  manifests: ManifestStat[];
  frameworks: string[];
  libraries: string[];
  packageManagers: string[];
  databases: string[];
  qualityFindings: QualityFinding[];
  securityFindings: SecurityFinding[];
  architectureLayers: ArchitectureLayer[];
  mentorSynthesis?: MentorSynthesis;
  roadmap?: RoadmapStage[];
  rawFiles?: Record<string, string>; // path -> content for explorer & search
}
