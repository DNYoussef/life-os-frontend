import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
  type Connection,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot, Brain, Cpu, Clock, GitBranch, Play, Save, Trash2, Workflow, Zap,
  Database, MessageSquare, Download, FileText, Users, Sparkles,
  PenTool, Search, Image, GitCommit, Rocket, Globe, Shield, Link, Webhook,
  RefreshCw, CheckCircle, AlertTriangle, Layers, BookOpen, Mic, ImagePlus,
  AudioLines, Server, Palette, Headphones, Volume2, Calendar, X
} from 'lucide-react';

// ============ NODE COMPONENTS ============

function TriggerNode({ data }: { data: { label: string; schedule?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-orange-900 to-orange-800 border-2 border-orange-500 min-w-[180px]">
      <div className="flex items-center gap-2"><Zap className="text-orange-300" size={18} /><span className="text-sm font-medium text-orange-100">Trigger</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.schedule && <div className="mt-1 text-xs text-orange-300">{data.schedule}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-orange-400" />
    </div>
  );
}

function AgentNode({ data }: { data: { label: string; agentType?: string; model?: string; role?: string } }) {
  const modelColors: Record<string, string> = {
    claude: 'bg-orange-500/80 text-orange-100',
    gemini: 'bg-blue-500/80 text-blue-100',
    codex: 'bg-green-500/80 text-green-100',
  };
  const modelColor = modelColors[data.model || 'claude'] || modelColors.claude;

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-purple-900 to-purple-800 border-2 border-purple-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="!bg-purple-400" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="text-purple-300" size={18} />
          <span className="text-sm font-medium text-purple-100">Agent</span>
        </div>
        {data.model && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${modelColor}`}>
            {data.model}
          </span>
        )}
      </div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.role && <div className="mt-1 text-xs text-purple-300">{data.role}</div>}
      {data.agentType && !data.role && <div className="mt-1 text-xs text-purple-300">{data.agentType}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-purple-400" />
    </div>
  );
}

function AIModelNode({ data }: { data: { label: string; model?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 border-2 border-blue-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-blue-400" />
      <div className="flex items-center gap-2"><Cpu className="text-blue-300" size={18} /><span className="text-sm font-medium text-blue-100">AI Model</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.model && <div className="mt-1 text-xs text-blue-300">{data.model}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400" />
    </div>
  );
}

function MemoryNode({ data }: { data: { label: string; tier?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-green-400" />
      <div className="flex items-center gap-2"><Brain className="text-green-300" size={18} /><span className="text-sm font-medium text-green-100">Memory MCP</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.tier && <div className="mt-1 text-xs text-green-300">{data.tier}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-green-400" />
    </div>
  );
}

function LogicNode({ data }: { data: { label: string; condition?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-yellow-900 to-yellow-800 border-2 border-yellow-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-yellow-400" />
      <div className="flex items-center gap-2"><GitBranch className="text-yellow-300" size={18} /><span className="text-sm font-medium text-yellow-100">Logic</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.condition && <div className="mt-1 text-xs text-yellow-300">{data.condition}</div>}
      <Handle type="source" position={Position.Bottom} id="yes" className="!bg-green-400" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="no" className="!bg-red-400" style={{ left: '75%' }} />
    </div>
  );
}

function QualityNode({ data }: { data: { label: string; threshold?: string; analyzer?: string } }) {
  // Analyzer-specific badges and descriptions
  const analyzerInfo: Record<string, { badge: string; color: string; description: string }> = {
    connascence: { badge: '9 Types', color: 'bg-orange-500/80', description: 'Coupling analysis' },
    nasa: { badge: 'P10', color: 'bg-blue-500/80', description: 'Power of 10 rules' },
    mece: { badge: 'DUP', color: 'bg-purple-500/80', description: 'Duplication detection' },
    clarity: { badge: 'COG', color: 'bg-cyan-500/80', description: 'Cognitive load' },
    sixsigma: { badge: '6σ', color: 'bg-yellow-500/80', description: 'DPMO metrics' },
    theater: { badge: 'FAKE', color: 'bg-pink-500/80', description: 'Fake quality detect' },
    safety: { badge: 'GOD', color: 'bg-emerald-500/80', description: 'God object scan' },
    premerge: { badge: '7-GATE', color: 'bg-indigo-500/80', description: 'All analyzers' },
    full: { badge: 'AUDIT', color: 'bg-rose-500/80', description: 'Full compliance' },
    slop: { badge: 'SLOP', color: 'bg-amber-500/80', description: 'AI pattern detect' },
    review: { badge: 'LGTM', color: 'bg-green-500/80', description: 'Human review' },
  };

  const info = analyzerInfo[data.analyzer || ''] || null;

  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-500 min-w-[200px]">
      <Handle type="target" position={Position.Top} className="!bg-red-400" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="text-red-300" size={18} />
          <span className="text-sm font-medium text-red-100">Quality Gate</span>
        </div>
        {info && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${info.color}`}>
            {info.badge}
          </span>
        )}
      </div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {info && <div className="mt-0.5 text-[10px] text-red-400">{info.description}</div>}
      {data.threshold && <div className="mt-1 text-xs text-red-300 font-mono">{data.threshold}</div>}
      <div className="mt-2 flex justify-between text-[9px] text-red-400">
        <span>PASS</span>
        <span>FAIL</span>
      </div>
      <Handle type="source" position={Position.Bottom} id="pass" className="!bg-green-400" style={{ left: '25%' }} />
      <Handle type="source" position={Position.Bottom} id="fail" className="!bg-red-400" style={{ left: '75%' }} />
    </div>
  );
}

function ContentNode({ data }: { data: { label: string; phase?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-cyan-900 to-cyan-800 border-2 border-cyan-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-cyan-400" />
      <div className="flex items-center gap-2"><FileText className="text-cyan-300" size={18} /><span className="text-sm font-medium text-cyan-100">Content</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.phase && <div className="mt-1 text-xs text-cyan-300">{data.phase}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-cyan-400" />
    </div>
  );
}

function IntegrationNode({ data }: { data: { label: string; service?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-pink-900 to-pink-800 border-2 border-pink-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-pink-400" />
      <div className="flex items-center gap-2"><Link className="text-pink-300" size={18} /><span className="text-sm font-medium text-pink-100">Integration</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.service && <div className="mt-1 text-xs text-pink-300">{data.service}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-pink-400" />
    </div>
  );
}

function CouncilNode({ data }: { data: { label: string; models?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-indigo-900 to-indigo-800 border-2 border-indigo-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-indigo-400" />
      <div className="flex items-center gap-2"><Users className="text-indigo-300" size={18} /><span className="text-sm font-medium text-indigo-100">LLM Council</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.models && <div className="mt-1 text-xs text-indigo-300">{data.models}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-indigo-400" />
    </div>
  );
}

function RalphLoopNode({ data }: { data: { label: string; maxIterations?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-amber-900 to-amber-800 border-2 border-amber-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-amber-400" />
      <div className="flex items-center gap-2"><RefreshCw className="text-amber-300" size={18} /><span className="text-sm font-medium text-amber-100">Ralph Loop</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.maxIterations && <div className="mt-1 text-xs text-amber-300">max: {data.maxIterations}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400" />
    </div>
  );
}

function LocalImageNode({ data }: { data: { label: string; model?: string; endpoint?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-fuchsia-900 to-fuchsia-800 border-2 border-fuchsia-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-fuchsia-400" />
      <div className="flex items-center gap-2"><ImagePlus className="text-fuchsia-300" size={18} /><span className="text-sm font-medium text-fuchsia-100">Local Image</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.model && <div className="mt-1 text-xs text-fuchsia-300">{data.model}</div>}
      {data.endpoint && <div className="mt-1 text-xs text-fuchsia-400 font-mono">{data.endpoint}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-fuchsia-400" />
    </div>
  );
}

function LocalAudioNode({ data }: { data: { label: string; model?: string; endpoint?: string } }) {
  return (
    <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-teal-900 to-teal-800 border-2 border-teal-500 min-w-[180px]">
      <Handle type="target" position={Position.Top} className="!bg-teal-400" />
      <div className="flex items-center gap-2"><AudioLines className="text-teal-300" size={18} /><span className="text-sm font-medium text-teal-100">Local Audio</span></div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.model && <div className="mt-1 text-xs text-teal-300">{data.model}</div>}
      {data.endpoint && <div className="mt-1 text-xs text-teal-400 font-mono">{data.endpoint}</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-teal-400" />
    </div>
  );
}

function MCPNode({ data }: { data: { label: string; category?: string; tokens?: number } }) {
  const categoryColors: Record<string, string> = {
    core: 'from-lime-900 to-lime-800 border-lime-500',
    google: 'from-sky-900 to-sky-800 border-sky-500',
    browser: 'from-emerald-900 to-emerald-800 border-emerald-500',
    swarm: 'from-violet-900 to-violet-800 border-violet-500',
    ml: 'from-rose-900 to-rose-800 border-rose-500',
    quality: 'from-orange-900 to-orange-800 border-orange-500',
    scientific: 'from-cyan-900 to-cyan-800 border-cyan-500',
  };
  const colors = categoryColors[data.category || 'core'] || categoryColors.core;
  const textColors: Record<string, string> = {
    core: 'text-lime-300',
    google: 'text-sky-300',
    browser: 'text-emerald-300',
    swarm: 'text-violet-300',
    ml: 'text-rose-300',
    quality: 'text-orange-300',
    scientific: 'text-cyan-300',
  };
  const textColor = textColors[data.category || 'core'] || textColors.core;

  return (
    <div className={'px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br border-2 min-w-[180px] ' + colors}>
      <Handle type="target" position={Position.Top} className="!bg-lime-400" />
      <div className="flex items-center gap-2">
        <Server className={textColor} size={18} />
        <span className={'text-sm font-medium ' + textColor}>MCP Server</span>
      </div>
      <div className="mt-2 text-white font-semibold">{data.label}</div>
      {data.category && <div className={'mt-1 text-xs ' + textColor}>{data.category}</div>}
      {data.tokens && <div className="mt-1 text-xs text-gray-400">{data.tokens} tokens</div>}
      <Handle type="source" position={Position.Bottom} className="!bg-lime-400" />
    </div>
  );
}

// ============ NODE TYPES REGISTRY ============

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  aiModel: AIModelNode,
  memory: MemoryNode,
  logic: LogicNode,
  quality: QualityNode,
  content: ContentNode,
  integration: IntegrationNode,
  council: CouncilNode,
  ralphLoop: RalphLoopNode,
  localImage: LocalImageNode,
  localAudio: LocalAudioNode,
  mcp: MCPNode,
};

// ============ NODE TEMPLATES ============

interface NodeTemplate {
  type: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  extra?: Record<string, string>;
}

const nodeTemplates: NodeTemplate[] = [
  // Triggers
  { type: 'trigger', label: 'Schedule (Cron)', icon: Clock, color: 'orange', extra: { schedule: '0 9 * * *' } },
  { type: 'trigger', label: 'Manual Run', icon: Play, color: 'orange' },
  { type: 'trigger', label: 'Webhook', icon: Webhook, color: 'orange' },
  { type: 'trigger', label: 'YouTube Upload', icon: Globe, color: 'orange', extra: { schedule: 'on new video' } },

  // Content Pipeline
  { type: 'content', label: 'yt-dlp Download', icon: Download, color: 'cyan', extra: { phase: 'Phase 1' } },
  { type: 'content', label: 'Whisper Transcribe', icon: Mic, color: 'cyan', extra: { phase: 'Phase 2' } },
  { type: 'content', label: 'Blog Draft', icon: PenTool, color: 'cyan', extra: { phase: 'Phase 6' } },
  { type: 'content', label: 'Style Rewrite', icon: Sparkles, color: 'cyan', extra: { phase: 'Phase 7' } },
  { type: 'content', label: 'Image Generation', icon: Image, color: 'cyan', extra: { phase: 'Phase 9' } },

  // AI Models
  { type: 'aiModel', label: 'Claude Opus', icon: MessageSquare, color: 'blue', extra: { model: 'claude-opus-4' } },
  { type: 'aiModel', label: 'Gemini Pro', icon: Sparkles, color: 'blue', extra: { model: 'gemini-2.0-pro' } },
  { type: 'aiModel', label: 'Codex CLI', icon: Cpu, color: 'blue', extra: { model: 'codex-cli' } },

  // LLM Council
  { type: 'council', label: 'Byzantine Consensus', icon: Users, color: 'indigo', extra: { models: 'Claude + Gemini + Codex' } },
  { type: 'council', label: 'Parallel Analysis', icon: Layers, color: 'indigo', extra: { models: '3 models parallel' } },
  { type: 'council', label: 'Zeitgeist Synthesis', icon: BookOpen, color: 'indigo', extra: { models: 'holistic merge' } },

  // Quality Gates - Connascence 7-Analyzer Suite
  { type: 'quality', label: 'Slop Detector', icon: Search, color: 'red', extra: { threshold: '< 5%', analyzer: 'slop' } },
  { type: 'quality', label: 'Code Review', icon: CheckCircle, color: 'red', extra: { threshold: 'LGTM required', analyzer: 'review' } },

  // Connascence Analyzer (9 coupling types: CoN, CoT, CoM, CoP, CoA, CoE, CoT2, CoV, CoI)
  { type: 'quality', label: 'Connascence Scan', icon: AlertTriangle, color: 'red', extra: { threshold: '0 critical', analyzer: 'connascence' } },

  // NASA Safety Analyzer (Power of 10 rules)
  { type: 'quality', label: 'NASA Compliance', icon: Shield, color: 'red', extra: { threshold: '>= 95%', analyzer: 'nasa' } },

  // MECE Analyzer (duplication detection)
  { type: 'quality', label: 'MECE Check', icon: Layers, color: 'red', extra: { threshold: '>= 80%', analyzer: 'mece' } },

  // Clarity Linter (cognitive load)
  { type: 'quality', label: 'Clarity Lint', icon: BookOpen, color: 'red', extra: { threshold: '>= 80%', analyzer: 'clarity' } },

  // Six Sigma Quality (DPMO, sigma levels)
  { type: 'quality', label: 'Six Sigma', icon: Zap, color: 'red', extra: { threshold: '>= 4.0σ', analyzer: 'sixsigma' } },

  // Theater Detection (fake quality prevention)
  { type: 'quality', label: 'Theater Detect', icon: AlertTriangle, color: 'red', extra: { threshold: '< 20%', analyzer: 'theater' } },

  // Safety Violation Detector (god objects, parameter bombs)
  { type: 'quality', label: 'Safety Scan', icon: Shield, color: 'red', extra: { threshold: '0 god objects', analyzer: 'safety' } },

  // Composite Quality Gates
  { type: 'quality', label: 'Pre-Merge Gate', icon: CheckCircle, color: 'red', extra: { threshold: 'All 7 pass', analyzer: 'premerge' } },
  { type: 'quality', label: 'Full Quality Audit', icon: Shield, color: 'red', extra: { threshold: 'Strict mode', analyzer: 'full' } },

  // Ralph Loops
  { type: 'ralphLoop', label: 'Style Loop', icon: RefreshCw, color: 'amber', extra: { maxIterations: '50' } },
  { type: 'ralphLoop', label: 'Slop Loop', icon: RefreshCw, color: 'amber', extra: { maxIterations: '50' } },
  { type: 'ralphLoop', label: 'Image Loop', icon: RefreshCw, color: 'amber', extra: { maxIterations: '50' } },

  // Memory MCP
  { type: 'memory', label: 'Read Short-Term', icon: Brain, color: 'green', extra: { tier: '24h' } },
  { type: 'memory', label: 'Read Mid-Term', icon: Brain, color: 'green', extra: { tier: '7d' } },
  { type: 'memory', label: 'Read Long-Term', icon: Brain, color: 'green', extra: { tier: '30d+' } },
  { type: 'memory', label: 'Write Memory', icon: Database, color: 'green', extra: { tier: 'auto-tier' } },
  { type: 'memory', label: 'Semantic Search', icon: Search, color: 'green', extra: { tier: 'vector RAG' } },

  // Agents
  { type: 'agent', label: 'Code Reviewer', icon: Bot, color: 'purple', extra: { agentType: 'quality' } },
  { type: 'agent', label: 'Bug Fixer', icon: Bot, color: 'purple', extra: { agentType: 'delivery' } },
  { type: 'agent', label: 'Test Runner', icon: Bot, color: 'purple', extra: { agentType: 'quality' } },
  { type: 'agent', label: 'Documentation', icon: Bot, color: 'purple', extra: { agentType: 'docs' } },
  { type: 'agent', label: 'Security Auditor', icon: Bot, color: 'purple', extra: { agentType: 'security' } },

  // Integrations
  { type: 'integration', label: 'Git Commit', icon: GitCommit, color: 'pink', extra: { service: 'GitHub' } },
  { type: 'integration', label: 'Git Push', icon: Rocket, color: 'pink', extra: { service: 'GitHub' } },
  { type: 'integration', label: 'Railway Deploy', icon: Rocket, color: 'pink', extra: { service: 'Railway' } },
  { type: 'integration', label: 'API Call', icon: Globe, color: 'pink', extra: { service: 'REST' } },

  // Logic
  { type: 'logic', label: 'IF Condition', icon: GitBranch, color: 'yellow' },
  { type: 'logic', label: 'Switch', icon: GitBranch, color: 'yellow' },

  // Local Image Models
  { type: 'localImage', label: 'Stable Diffusion', icon: ImagePlus, color: 'fuchsia', extra: { model: 'SD 1.5/2.1', endpoint: 'localhost:7860' } },
  { type: 'localImage', label: 'SDXL', icon: ImagePlus, color: 'fuchsia', extra: { model: 'SDXL 1.0', endpoint: 'localhost:7860' } },
  { type: 'localImage', label: 'Flux', icon: ImagePlus, color: 'fuchsia', extra: { model: 'Flux.1', endpoint: 'localhost:7860' } },
  { type: 'localImage', label: 'ComfyUI', icon: Palette, color: 'fuchsia', extra: { model: 'workflow', endpoint: 'localhost:8188' } },
  { type: 'localImage', label: 'Dall-E 3', icon: ImagePlus, color: 'fuchsia', extra: { model: 'dall-e-3', endpoint: 'api.openai.com' } },

  // Local Audio Models
  { type: 'localAudio', label: 'Whisper Local', icon: AudioLines, color: 'teal', extra: { model: 'whisper-large-v3', endpoint: 'localhost:9000' } },
  { type: 'localAudio', label: 'Faster-Whisper', icon: Headphones, color: 'teal', extra: { model: 'large-v3-turbo', endpoint: 'localhost:9000' } },
  { type: 'localAudio', label: 'WhisperX', icon: AudioLines, color: 'teal', extra: { model: 'whisperx', endpoint: 'localhost:9000' } },
  { type: 'localAudio', label: 'PodBrain', icon: Volume2, color: 'teal', extra: { model: 'podbrain', endpoint: 'api.podbrain.ai' } },
  { type: 'localAudio', label: 'Deepgram', icon: AudioLines, color: 'teal', extra: { model: 'nova-2', endpoint: 'api.deepgram.com' } },

  // MCP Servers - Core (Always Active)
  { type: 'mcp', label: 'Memory MCP', icon: Server, color: 'green', extra: { category: 'core', tokens: '1200', purpose: 'Cross-session persistence, semantic vector search' } },
  { type: 'mcp', label: 'Sequential Thinking', icon: Server, color: 'green', extra: { category: 'core', tokens: '1500', purpose: 'Complex reasoning chains, meta-cognition' } },

  // MCP Servers - Google Workspace
  { type: 'mcp', label: 'Google Calendar', icon: Server, color: 'blue', extra: { category: 'google', tokens: '~1000', purpose: 'Event management, scheduling' } },
  { type: 'mcp', label: 'Gmail', icon: Server, color: 'blue', extra: { category: 'google', tokens: '~1000', purpose: 'Email operations, auto-auth' } },
  { type: 'mcp', label: 'Google Drive', icon: Server, color: 'blue', extra: { category: 'google', tokens: '~1000', purpose: 'File operations, storage' } },

  // MCP Servers - Browser Automation
  { type: 'mcp', label: 'Playwright', icon: Server, color: 'purple', extra: { category: 'browser', tokens: '14500', purpose: 'E2E testing, browser automation, visual regression' } },

  // MCP Servers - Swarm/Multi-Agent
  { type: 'mcp', label: 'RUV Swarm', icon: Server, color: 'red', extra: { category: 'swarm', tokens: '15500', purpose: 'Multi-agent swarm orchestration, DAA' } },

  // MCP Servers - ML/Neural
  { type: 'mcp', label: 'Flow Nexus', icon: Server, color: 'amber', extra: { category: 'ml', tokens: '58000', purpose: 'Neural training, distributed ML, cloud sandboxes' } },
  { type: 'mcp', label: 'Flow Nexus Swarm', icon: Server, color: 'amber', extra: { category: 'ml', tokens: '7000', purpose: 'Swarm init, agent spawn, task orchestrate' } },
  { type: 'mcp', label: 'Flow Nexus Neural', icon: Server, color: 'amber', extra: { category: 'ml', tokens: '12000', purpose: 'Neural train, predict, cluster' } },

  // MCP Servers - Code Quality
  { type: 'mcp', label: 'Focused Changes', icon: Server, color: 'lime', extra: { category: 'quality', tokens: '1800', purpose: 'Change tracking, root cause analysis' } },
  { type: 'mcp', label: 'TOC Generator', icon: Server, color: 'lime', extra: { category: 'quality', tokens: '613', purpose: 'Table of contents generation' } },

  // MCP Servers - Scientific
  { type: 'mcp', label: 'Wolfram Alpha', icon: Server, color: 'sky', extra: { category: 'scientific', tokens: '800', purpose: 'Math, physics, unit conversions' } },
];

// ============ CONTENT PIPELINE (11 Phases) ============

const contentPipelineNodes: Node[] = [
  // Phase 1: Trigger
  { id: '1', type: 'trigger', position: { x: 400, y: 0 }, data: { label: 'Weekly Content', schedule: '0 6 * * MON' } },

  // Phase 1: Download
  { id: '2', type: 'content', position: { x: 400, y: 100 }, data: { label: 'yt-dlp Download', phase: 'Phase 1: Audio' } },

  // Phase 2: Transcribe
  { id: '3', type: 'content', position: { x: 400, y: 200 }, data: { label: 'Whisper Transcribe', phase: 'Phase 2: Transcript' } },

  // Phase 3: Parallel Analysis (3 models)
  { id: '4a', type: 'aiModel', position: { x: 150, y: 320 }, data: { label: 'Claude Analysis', model: 'opus-4' } },
  { id: '4b', type: 'aiModel', position: { x: 400, y: 320 }, data: { label: 'Gemini Analysis', model: 'pro-2.0' } },
  { id: '4c', type: 'aiModel', position: { x: 650, y: 320 }, data: { label: 'Codex Analysis', model: 'cli' } },

  // Phase 4: Holistic Zeitgeist
  { id: '5', type: 'council', position: { x: 400, y: 440 }, data: { label: 'Zeitgeist Synthesis', models: 'Phase 4: Per-model synthesis' } },

  // Phase 5: Byzantine Consensus
  { id: '6', type: 'council', position: { x: 400, y: 540 }, data: { label: 'Byzantine Consensus', models: 'Phase 5: LLM Council' } },

  // Phase 6: Blog Draft
  { id: '7', type: 'content', position: { x: 400, y: 640 }, data: { label: 'Blog Draft Gen', phase: 'Phase 6: Draft' } },

  // Phase 7: Ralph Loop - Style
  { id: '8', type: 'ralphLoop', position: { x: 400, y: 740 }, data: { label: 'Style Rewrite', maxIterations: '50' } },

  // Phase 8: Slop Detection Quality Gate
  { id: '9', type: 'quality', position: { x: 400, y: 840 }, data: { label: 'Slop Detector', threshold: '< 5%' } },

  // Phase 9: Image Generation
  { id: '10', type: 'ralphLoop', position: { x: 200, y: 960 }, data: { label: 'Image Generation', maxIterations: '50' } },

  // Re-run style if slop detected
  { id: '9b', type: 'ralphLoop', position: { x: 600, y: 960 }, data: { label: 'Re-Style Loop', maxIterations: '25' } },

  // Phase 10: Git Operations
  { id: '11', type: 'integration', position: { x: 200, y: 1080 }, data: { label: 'Git Commit', service: 'dnyoussef-portfolio' } },
  { id: '12', type: 'integration', position: { x: 200, y: 1180 }, data: { label: 'Git Push', service: 'GitHub' } },

  // Phase 11: Deploy
  { id: '13', type: 'integration', position: { x: 200, y: 1280 }, data: { label: 'Railway Deploy', service: 'Auto-deploy' } },

  // Store in Memory
  { id: '14', type: 'memory', position: { x: 200, y: 1380 }, data: { label: 'Store Success', tier: 'long-term' } },
];

const contentPipelineEdges = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3', animated: true },

  // Fan out to 3 parallel models
  { id: 'e3-4a', source: '3', target: '4a', animated: true },
  { id: 'e3-4b', source: '3', target: '4b', animated: true },
  { id: 'e3-4c', source: '3', target: '4c', animated: true },

  // Merge into Zeitgeist
  { id: 'e4a-5', source: '4a', target: '5', animated: true },
  { id: 'e4b-5', source: '4b', target: '5', animated: true },
  { id: 'e4c-5', source: '4c', target: '5', animated: true },

  { id: 'e5-6', source: '5', target: '6', animated: true },
  { id: 'e6-7', source: '6', target: '7', animated: true },
  { id: 'e7-8', source: '7', target: '8', animated: true },
  { id: 'e8-9', source: '8', target: '9', animated: true },

  // Slop gate branches
  { id: 'e9-10', source: '9', sourceHandle: 'pass', target: '10', animated: true, style: { stroke: '#22c55e' } },
  { id: 'e9-9b', source: '9', sourceHandle: 'fail', target: '9b', animated: true, style: { stroke: '#ef4444' } },

  // Re-style loops back to slop check
  { id: 'e9b-8', source: '9b', target: '8', animated: true, style: { stroke: '#f59e0b' } },

  // Continue to deploy
  { id: 'e10-11', source: '10', target: '11', animated: true },
  { id: 'e11-12', source: '11', target: '12', animated: true },
  { id: 'e12-13', source: '12', target: '13', animated: true },
  { id: 'e13-14', source: '13', target: '14', animated: true },
];

// ============ COLOR CLASSES ============

const colorClasses: Record<string, string> = {
  orange: 'bg-orange-900/30 border-orange-700/50 text-orange-200 hover:bg-orange-900/50',
  purple: 'bg-purple-900/30 border-purple-700/50 text-purple-200 hover:bg-purple-900/50',
  blue: 'bg-blue-900/30 border-blue-700/50 text-blue-200 hover:bg-blue-900/50',
  green: 'bg-green-900/30 border-green-700/50 text-green-200 hover:bg-green-900/50',
  yellow: 'bg-yellow-900/30 border-yellow-700/50 text-yellow-200 hover:bg-yellow-900/50',
  red: 'bg-red-900/30 border-red-700/50 text-red-200 hover:bg-red-900/50',
  cyan: 'bg-cyan-900/30 border-cyan-700/50 text-cyan-200 hover:bg-cyan-900/50',
  pink: 'bg-pink-900/30 border-pink-700/50 text-pink-200 hover:bg-pink-900/50',
  indigo: 'bg-indigo-900/30 border-indigo-700/50 text-indigo-200 hover:bg-indigo-900/50',
  amber: 'bg-amber-900/30 border-amber-700/50 text-amber-200 hover:bg-amber-900/50',
  fuchsia: 'bg-fuchsia-900/30 border-fuchsia-700/50 text-fuchsia-200 hover:bg-fuchsia-900/50',
  teal: 'bg-teal-900/30 border-teal-700/50 text-teal-200 hover:bg-teal-900/50',
  lime: 'bg-lime-900/30 border-lime-700/50 text-lime-200 hover:bg-lime-900/50',
  sky: 'bg-sky-900/30 border-sky-700/50 text-sky-200 hover:bg-sky-900/50',
  emerald: 'bg-emerald-900/30 border-emerald-700/50 text-emerald-200 hover:bg-emerald-900/50',
  violet: 'bg-violet-900/30 border-violet-700/50 text-violet-200 hover:bg-violet-900/50',
  rose: 'bg-rose-900/30 border-rose-700/50 text-rose-200 hover:bg-rose-900/50',
};

const iconColorClasses: Record<string, string> = {
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  blue: 'text-blue-400',
  green: 'text-green-400',
  yellow: 'text-yellow-400',
  red: 'text-red-400',
  cyan: 'text-cyan-400',
  pink: 'text-pink-400',
  indigo: 'text-indigo-400',
  amber: 'text-amber-400',
  fuchsia: 'text-fuchsia-400',
  teal: 'text-teal-400',
};

// ============ CATEGORY CONFIG ============

const categories = [
  { key: 'trigger', label: 'Triggers' },
  { key: 'content', label: 'Content Pipeline' },
  { key: 'aiModel', label: 'AI Models (Cloud)' },
  { key: 'localImage', label: 'Local Image Models' },
  { key: 'localAudio', label: 'Local Audio Models' },
  { key: 'council', label: 'LLM Council' },
  { key: 'quality', label: 'Quality Gates' },
  { key: 'ralphLoop', label: 'Ralph Loops' },
  { key: 'memory', label: 'Memory MCP' },
  { key: 'mcp', label: 'MCP Servers' },
  { key: 'agent', label: 'Agents' },
  { key: 'integration', label: 'Integrations' },
  { key: 'logic', label: 'Logic' },
];

// ============ MAIN COMPONENT ============

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

interface BackendAgent {
  agent_id: string;
  name: string;
  role: string;
  metadata: { category: string };
}

// CLI Status Response
interface CLIStatusResponse {
  available_models: string[];
  yolo_mode: boolean;
  status: string;
}

// CLI Invoke Response
interface CLIInvokeResponse {
  success: boolean;
  output: string;
  error: string | null;
  model: string;
  exit_code: number;
}

// MCP Server from backend
interface MCPServer {
  id: string;
  name: string;
  category: string;
  tokens: number;
  description: string;
  can_toggle: boolean;
  status: string;
}

export function PipelineDesignerPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(contentPipelineNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(contentPipelineEdges);
  const [pipelineName, setPipelineName] = useState('Content Pipeline (YouTube to Blog)');
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Agent state
  const [agents, setAgents] = useState<BackendAgent[]>([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gemini' | 'codex'>('claude');
  const [loadingAgents, setLoadingAgents] = useState(true);

  // CLI execution state
  const [cliStatus, setCliStatus] = useState<CLIStatusResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [showExecutionLog, setShowExecutionLog] = useState(false);

  // MCP management state
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [showMcpPanel, setShowMcpPanel] = useState(false);
  const [togglingMcp, setTogglingMcp] = useState<string | null>(null);

  // Pipeline scheduling state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [cronExpression, setCronExpression] = useState('0 9 * * *');
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [schedulePreset, setSchedulePreset] = useState('daily-9am');

  // Cron presets
  const cronPresets = [
    { id: 'daily-9am', label: 'Daily at 9:00 AM', cron: '0 9 * * *' },
    { id: 'daily-6am', label: 'Daily at 6:00 AM', cron: '0 6 * * *' },
    { id: 'weekly-mon', label: 'Weekly on Monday 9 AM', cron: '0 9 * * MON' },
    { id: 'weekly-fri', label: 'Weekly on Friday 9 AM', cron: '0 9 * * FRI' },
    { id: 'hourly', label: 'Every Hour', cron: '0 * * * *' },
    { id: 'every-6h', label: 'Every 6 Hours', cron: '0 */6 * * *' },
    { id: 'custom', label: 'Custom', cron: '' },
  ];

  // Handle preset change
  const handlePresetChange = (presetId: string) => {
    setSchedulePreset(presetId);
    const preset = cronPresets.find(p => p.id === presetId);
    if (preset && preset.cron) {
      setCronExpression(preset.cron);
    }
  };

  // Save pipeline schedule
  const savePipelineSchedule = async () => {
    setScheduleSaving(true);
    try {
      const pipelineId = 'pipeline-' + Date.now();
      const response = await fetch(`${API_BASE}/api/v1/orchestrator/pipelines/${pipelineId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pipeline_id: pipelineId,
          pipeline_name: pipelineName,
          cron_expression: cronExpression,
          enabled: scheduleEnabled,
        }),
      });

      if (response.ok) {
        await response.json();
        setShowScheduleModal(false);
        alert(`Pipeline scheduled successfully!\n\nCron: ${cronExpression}\nNext run will appear in Calendar.`);
      } else {
        alert('Failed to schedule pipeline. Check backend logs.');
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule: ' + String(error));
    } finally {
      setScheduleSaving(false);
    }
  };

  // Fetch MCP servers
  useEffect(() => {
    async function fetchMCPs() {
      try {
        const response = await fetch(`${API_BASE}/api/v1/mcp/servers`);
        if (response.ok) {
          const data = await response.json();
          setMcpServers(data.servers || []);
        }
      } catch (error) {
        console.error('Failed to fetch MCP servers:', error);
      }
    }
    fetchMCPs();
  }, []);

  // Toggle MCP server
  const toggleMCP = async (mcpId: string, currentStatus: string) => {
    setTogglingMcp(mcpId);
    const action = currentStatus === 'active' ? 'disable' : 'enable';
    try {
      const response = await fetch(`${API_BASE}/api/v1/mcp/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcp_id: mcpId, action }),
      });
      const result = await response.json();
      if (result.success) {
        setMcpServers(prev => prev.map(mcp =>
          mcp.id === mcpId ? { ...mcp, status: action === 'enable' ? 'active' : 'idle' } : mcp
        ));
      }
    } catch (error) {
      console.error('Failed to toggle MCP:', error);
    } finally {
      setTogglingMcp(null);
    }
  };

  // Group MCPs by category
  const mcpByCategory = mcpServers.reduce((acc, mcp) => {
    if (!acc[mcp.category]) acc[mcp.category] = [];
    acc[mcp.category].push(mcp);
    return acc;
  }, {} as Record<string, MCPServer[]>);

  const categoryLabels: Record<string, string> = {
    core: 'Core (Always Active)',
    google: 'Google Workspace',
    browser: 'Browser Automation',
    swarm: 'Swarm/Multi-Agent',
    ml: 'ML/Neural',
    quality: 'Code Quality',
    scientific: 'Scientific',
  };

  const categoryColors: Record<string, string> = {
    core: 'border-emerald-500/50 bg-emerald-900/20',
    google: 'border-blue-500/50 bg-blue-900/20',
    browser: 'border-violet-500/50 bg-violet-900/20',
    swarm: 'border-rose-500/50 bg-rose-900/20',
    ml: 'border-amber-500/50 bg-amber-900/20',
    quality: 'border-lime-500/50 bg-lime-900/20',
    scientific: 'border-sky-500/50 bg-sky-900/20',
  };

  // Check CLI availability on mount
  useEffect(() => {
    async function checkCLI() {
      try {
        const response = await fetch(API_BASE + '/api/v1/cli/status');
        if (response.ok) {
          const data = await response.json();
          setCliStatus(data);
        }
      } catch (error) {
        console.error('Failed to check CLI status:', error);
      }
    }
    checkCLI();
  }, []);

  // Invoke CLI for a specific node
  const invokeCLI = async (prompt: string, model: 'claude' | 'gemini' | 'codex'): Promise<CLIInvokeResponse> => {
    const response = await fetch(API_BASE + '/api/v1/cli/invoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, timeout: 300 }),
    });
    return response.json();
  };

  // Run pipeline - execute agent nodes sequentially
  const runPipeline = async () => {
    setIsRunning(true);
    setShowExecutionLog(true);
    setExecutionLog(['[Pipeline Execution Started]', 'Model: ' + selectedModel, '---']);

    const agentNodes = nodes.filter(n => n.type === 'agent');

    for (const node of agentNodes) {
      const nodeData = node.data as { label: string; model?: string; role?: string };
      const model = (nodeData.model || 'claude') as 'claude' | 'gemini' | 'codex';
      const prompt = 'Execute agent task: ' + nodeData.label + (nodeData.role ? ' - Role: ' + nodeData.role : '');

      setExecutionLog(prev => [...prev, '[Invoking] ' + nodeData.label + ' via ' + model + '...']);

      try {
        const result = await invokeCLI(prompt, model);
        if (result.success) {
          setExecutionLog(prev => [...prev, '[Success] ' + nodeData.label + ': ' + (result.output || '').slice(0, 200)]);
        } else {
          setExecutionLog(prev => [...prev, '[Error] ' + nodeData.label + ': ' + (result.error || 'Unknown error')]);
        }
      } catch (error) {
        setExecutionLog(prev => [...prev, '[Error] ' + nodeData.label + ': ' + String(error)]);
      }
    }

    setExecutionLog(prev => [...prev, '---', '[Pipeline Complete]']);
    setIsRunning(false);
  };

  // Fetch agents from API
  useEffect(() => {
    async function fetchAgents() {
      try {
        const response = await fetch(`${API_BASE}/api/v1/agents/?limit=300`);
        if (response.ok) {
          const data = await response.json();
          setAgents(data);
        }
      } catch (error) {
        console.error('Failed to fetch agents:', error);
      } finally {
        setLoadingAgents(false);
      }
    }
    fetchAgents();
  }, []);

  // Filter agents by search
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
    agent.role.toLowerCase().includes(agentSearch.toLowerCase()) ||
    agent.metadata.category.toLowerCase().includes(agentSearch.toLowerCase())
  );

  // Group agents by category
  const agentsByCategory = filteredAgents.reduce((acc, agent) => {
    const cat = agent.metadata.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(agent);
    return acc;
  }, {} as Record<string, BackendAgent[]>);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const label = event.dataTransfer.getData('application/reactflow/label');
      const extra = event.dataTransfer.getData('application/reactflow/extra');
      if (!type) return;
      const position = { x: event.clientX - 300, y: event.clientY - 50 };
      const newNode: Node = {
        id: String(Date.now()),
        type,
        position,
        data: { label, ...JSON.parse(extra || '{}') },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow/type', template.type);
    event.dataTransfer.setData('application/reactflow/label', template.label);
    event.dataTransfer.setData('application/reactflow/extra', JSON.stringify(template.extra || {}));
    event.dataTransfer.effectAllowed = 'move';
  };

  const loadContentPipeline = () => {
    setNodes(contentPipelineNodes);
    setEdges(contentPipelineEdges);
    setPipelineName('Content Pipeline (YouTube to Blog)');
  };

  // Drag handler for dynamic agents
  const onAgentDragStart = (event: React.DragEvent, agent: BackendAgent) => {
    event.dataTransfer.setData('application/reactflow/type', 'agent');
    event.dataTransfer.setData('application/reactflow/label', agent.name);
    event.dataTransfer.setData('application/reactflow/extra', JSON.stringify({
      agentId: agent.agent_id,
      role: agent.role,
      agentType: agent.metadata.category,
      model: selectedModel,
    }));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-screen bg-surface-base flex">
      {/* Sidebar */}
      <div className="w-72 bg-surface-primary border-r border-border-default p-4 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Workflow size={20} className="text-accent-500" />
            Pipeline Designer
          </h2>
          <p className="text-sm text-text-muted mt-1">Drag nodes to canvas</p>
        </div>

        {/* Pipeline Name */}
        <div className="mb-4">
          <label className="block text-xs text-text-muted mb-1">Pipeline Name</label>
          <input
            type="text"
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
            className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-sm text-text-primary"
          />
        </div>

        {/* Quick Load */}
        <div className="mb-4">
          <button
            onClick={loadContentPipeline}
            className="w-full px-3 py-2 bg-cyan-900/30 border border-cyan-700/50 text-cyan-200 rounded text-sm hover:bg-cyan-900/50 transition-colors flex items-center gap-2 justify-center"
          >
            <FileText size={14} />
            Load Content Pipeline
          </button>
        </div>

        {/* Node Categories (excluding agents) */}
        <div className="space-y-4">
          {categories.filter(c => c.key !== 'agent').map(({ key, label }) => (
            <div key={key}>
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {label}
              </h3>
              <div className="space-y-1.5">
                {nodeTemplates.filter((n) => n.type === key).map((template, i) => (
                  <div
                    key={i}
                    draggable
                    onDragStart={(e) => onDragStart(e, template)}
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded cursor-grab transition-colors text-xs ${colorClasses[template.color]}`}
                  >
                    <template.icon size={14} className={iconColorClasses[template.color]} />
                    <span>{template.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Dynamic Agents Section */}
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Agents ({agents.length})</span>
              {loadingAgents && <RefreshCw size={12} className="animate-spin text-purple-400" />}
            </h3>

            {/* Model Selector */}
            <div className="mb-2 flex gap-1">
              {(['claude', 'gemini', 'codex'] as const).map((model) => (
                <button
                  key={model}
                  onClick={() => setSelectedModel(model)}
                  className={`flex-1 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${
                    selectedModel === model
                      ? model === 'claude' ? 'bg-orange-500 text-white'
                        : model === 'gemini' ? 'bg-blue-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'bg-surface-elevated text-text-muted hover:bg-surface-base'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>

            {/* Agent Search */}
            <div className="relative mb-2">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search agents..."
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                className="w-full bg-surface-elevated border border-border-default rounded pl-7 pr-2 py-1.5 text-xs text-text-primary"
              />
            </div>

            {/* Agent List by Category */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {Object.entries(agentsByCategory).map(([category, categoryAgents]) => (
                <div key={category}>
                  <div className="text-[10px] text-purple-400 uppercase font-semibold mb-1">
                    {category} ({categoryAgents.length})
                  </div>
                  <div className="space-y-1">
                    {categoryAgents.slice(0, 10).map((agent) => (
                      <div
                        key={agent.agent_id}
                        draggable
                        onDragStart={(e) => onAgentDragStart(e, agent)}
                        className="flex items-center gap-2 px-2 py-1 border rounded cursor-grab transition-colors text-xs bg-purple-900/30 border-purple-700/50 text-purple-200 hover:bg-purple-900/50"
                      >
                        <Bot size={12} className="text-purple-400 flex-shrink-0" />
                        <span className="truncate flex-1">{agent.name}</span>
                        <span className={`px-1 rounded text-[8px] font-bold ${
                          selectedModel === 'claude' ? 'bg-orange-500/50 text-orange-200'
                            : selectedModel === 'gemini' ? 'bg-blue-500/50 text-blue-200'
                            : 'bg-green-500/50 text-green-200'
                        }`}>
                          {selectedModel.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ))}
                    {categoryAgents.length > 10 && (
                      <div className="text-[10px] text-text-muted text-center">
                        +{categoryAgents.length - 10} more
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredAgents.length === 0 && !loadingAgents && (
                <div className="text-xs text-text-muted text-center py-2">
                  No agents found
                </div>
              )}
            </div>
          </div>

          {/* MCP Management Section */}
          <div className="mt-4 pt-4 border-t border-border-default">
            <button
              onClick={() => setShowMcpPanel(!showMcpPanel)}
              className="w-full flex items-center justify-between mb-2"
            >
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                <Server size={12} className="text-emerald-400" />
                MCP Servers ({mcpServers.filter(m => m.status === 'active').length}/{mcpServers.length})
              </h3>
              <span className="text-text-muted text-xs">{showMcpPanel ? '-' : '+'}</span>
            </button>

            {showMcpPanel && (
              <div className="space-y-3">
                {Object.entries(mcpByCategory).map(([category, mcps]) => (
                  <div key={category} className={`rounded-lg border p-2 ${categoryColors[category] || 'border-gray-500/50 bg-gray-900/20'}`}>
                    <h4 className="text-[10px] font-semibold text-text-muted uppercase mb-1.5">
                      {categoryLabels[category] || category}
                    </h4>
                    <div className="space-y-1">
                      {mcps.map(mcp => (
                        <div
                          key={mcp.id}
                          className="flex items-center justify-between text-xs bg-surface-base/50 rounded px-2 py-1"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${mcp.status === 'active' ? 'bg-green-400' : 'bg-gray-500'}`} />
                            <span className="text-text-primary truncate" title={mcp.description}>{mcp.name}</span>
                            <span className="text-text-muted text-[10px]">{mcp.tokens}t</span>
                          </div>
                          {mcp.can_toggle && (
                            <button
                              onClick={() => toggleMCP(mcp.id, mcp.status)}
                              disabled={togglingMcp === mcp.id}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                mcp.status === 'active'
                                  ? 'bg-green-900/50 text-green-300 hover:bg-red-900/50 hover:text-red-300'
                                  : 'bg-gray-700/50 text-gray-400 hover:bg-green-900/50 hover:text-green-300'
                              }`}
                            >
                              {togglingMcp === mcp.id ? '...' : mcp.status === 'active' ? 'ON' : 'OFF'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Total Token Count */}
                <div className="text-center text-xs text-text-muted pt-2 border-t border-border-default">
                  Total: {mcpServers.filter(m => m.status === 'active').reduce((sum, m) => sum + m.tokens, 0).toLocaleString()} tokens active
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="bg-surface-base"
        >
          <Background color="#374151" gap={20} />
          <Controls className="!bg-surface-primary !border-border-default [&>button]:!bg-surface-elevated [&>button]:!border-border-default [&>button]:!text-text-primary" />
          <MiniMap
            className="!bg-surface-primary !border-border-default"
            nodeColor={(node) => {
              const colors: Record<string, string> = {
                trigger: '#f97316',
                agent: '#a855f7',
                aiModel: '#3b82f6',
                memory: '#22c55e',
                logic: '#eab308',
                quality: '#ef4444',
                content: '#06b6d4',
                integration: '#ec4899',
                council: '#6366f1',
                ralphLoop: '#f59e0b',
                localImage: '#d946ef',
                localAudio: '#14b8a6',
              };
              return colors[node.type || ''] || '#6b7280';
            }}
          />
          <Panel position="top-right" className="flex gap-2">
            <button
              onClick={runPipeline}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} />
              {isRunning ? 'Running...' : 'Run'}
            </button>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
            >
              <Calendar size={16} />
              Schedule
            </button>
            <button
              onClick={() => alert('Save functionality coming soon!')}
              className="flex items-center gap-2 px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg hover:bg-surface-primary transition-colors"
            >
              <Save size={16} />
              Save
            </button>
            <button
              onClick={() => { setNodes([]); setEdges([]); setPipelineName('New Pipeline'); }}
              className="flex items-center gap-2 px-4 py-2 bg-red-900/50 border border-red-700/50 text-red-200 rounded-lg hover:bg-red-900/70 transition-colors"
            >
              <Trash2 size={16} />
              Clear
            </button>
          </Panel>

          {/* Execution Log Panel */}
          {showExecutionLog && (
            <Panel position="bottom-right" className="bg-surface-primary/95 border border-border-default rounded-lg p-3 max-w-md max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Layers size={14} className="text-accent-500" />
                  Execution Log
                </h4>
                <button onClick={() => setShowExecutionLog(false)} className="text-text-muted hover:text-text-primary">x</button>
              </div>
              <div className="text-xs font-mono space-y-1">
                {executionLog.map((log, i) => (
                  <div key={i} className={`${log.startsWith('[OK]') ? 'text-green-400' : log.startsWith('[ERROR]') || log.startsWith('[FAILED]') ? 'text-red-400' : 'text-text-muted'}`}>
                    {log}
                  </div>
                ))}
              </div>
            </Panel>
          )}

          {/* CLI Status Indicator */}
          <Panel position="bottom-left" className="bg-surface-primary/90 border border-border-default rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${cliStatus?.status === 'ready' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-text-muted">
                CLI: {cliStatus?.available_models?.join(', ') || 'checking...'}
              </span>
              {cliStatus?.yolo_mode && <span className="text-amber-400">(YOLO)</span>}
            </div>
          </Panel>

          {/* Pipeline Info Panel */}
          <Panel position="top-left" className="bg-surface-primary/90 border border-border-default rounded-lg p-3 max-w-xs">
            <h3 className="text-sm font-semibold text-text-primary mb-1">{pipelineName}</h3>
            <p className="text-xs text-text-muted">
              {nodes.length} nodes | {edges.length} connections
            </p>
            <div className="mt-2 text-xs text-text-muted">
              <span className="text-cyan-400">11-Phase</span> YouTube to Blog automation with{' '}
              <span className="text-indigo-400">LLM Council</span>,{' '}
              <span className="text-red-400">Slop Detection</span>, and{' '}
              <span className="text-amber-400">Ralph Loops</span>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Schedule Pipeline Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-primary border border-border-default rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Calendar className="text-cyan-400" size={20} />
                Schedule Pipeline
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Pipeline Name */}
              <div>
                <label className="block text-sm text-text-muted mb-1">Pipeline</label>
                <div className="bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary">
                  {pipelineName}
                </div>
              </div>

              {/* Schedule Preset */}
              <div>
                <label className="block text-sm text-text-muted mb-1">Schedule Preset</label>
                <select
                  value={schedulePreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary"
                >
                  {cronPresets.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.label}</option>
                  ))}
                </select>
              </div>

              {/* Cron Expression */}
              <div>
                <label className="block text-sm text-text-muted mb-1">Cron Expression</label>
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => {
                    setCronExpression(e.target.value);
                    setSchedulePreset('custom');
                  }}
                  placeholder="0 9 * * *"
                  className="w-full bg-surface-elevated border border-border-default rounded px-3 py-2 text-text-primary font-mono"
                />
                <p className="text-xs text-text-muted mt-1">
                  Format: minute hour day month weekday
                </p>
              </div>

              {/* Enable Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-text-primary">Enable Schedule</label>
                <button
                  onClick={() => setScheduleEnabled(!scheduleEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    scheduleEnabled ? 'bg-cyan-500' : 'bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    scheduleEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Calendar Integration Notice */}
              <div className="bg-cyan-900/20 border border-cyan-700/50 rounded-lg p-3">
                <p className="text-xs text-cyan-300">
                  <Calendar size={12} className="inline mr-1" />
                  This schedule will be visible in your Calendar view. Pipeline executions will be logged to Memory MCP.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-2 bg-surface-elevated border border-border-default text-text-primary rounded-lg hover:bg-surface-base transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePipelineSchedule}
                  disabled={scheduleSaving || !cronExpression}
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {scheduleSaving ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Calendar size={16} />
                  )}
                  {scheduleSaving ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
