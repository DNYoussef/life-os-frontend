import { useState, useEffect, useRef } from 'react';
import {
  Terminal, Play, Square, Plus, X, RefreshCw,
  Bot, Brain, Zap, Clock, CheckCircle, AlertCircle,
  Maximize2, Minimize2
} from 'lucide-react';

// Types for agent terminals
interface AgentTerminal {
  id: string;
  name: string;
  model: 'claude' | 'gemini' | 'codex';
  status: 'idle' | 'running' | 'completed' | 'error';
  project?: string;
  output: TerminalLine[];
  startedAt?: string;
  completedAt?: string;
  taskDescription?: string;
}

interface TerminalLine {
  timestamp: string;
  type: 'stdout' | 'stderr' | 'system' | 'memory';
  content: string;
}

interface MemoryLogEntry {
  timestamp: string;
  agent: string;
  action: string;
  tier: 'short_term' | 'mid_term' | 'long_term';
  namespace: string;
}

// Model colors and icons
const MODEL_CONFIG = {
  claude: { color: 'from-orange-600 to-orange-800', border: 'border-orange-500', icon: '🧠' },
  gemini: { color: 'from-blue-600 to-blue-800', border: 'border-blue-500', icon: '💎' },
  codex: { color: 'from-green-600 to-green-800', border: 'border-green-500', icon: '🤖' },
};

const STATUS_CONFIG = {
  idle: { color: 'text-gray-400', icon: Clock, label: 'Idle' },
  running: { color: 'text-blue-400 animate-pulse', icon: Zap, label: 'Running' },
  completed: { color: 'text-green-400', icon: CheckCircle, label: 'Completed' },
  error: { color: 'text-red-400', icon: AlertCircle, label: 'Error' },
};

// Terminal Panel Component
function TerminalPanel({
  terminal,
  onClose,
  onStop,
  onRestart,
  isExpanded,
  onToggleExpand,
}: {
  terminal: AgentTerminal;
  onClose: () => void;
  onStop: () => void;
  onRestart: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const outputRef = useRef<HTMLDivElement>(null);
  const config = MODEL_CONFIG[terminal.model];
  const statusConfig = STATUS_CONFIG[terminal.status];
  const StatusIcon = statusConfig.icon;

  // Auto-scroll to bottom when new output arrives
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [terminal.output]);

  return (
    <div className={`flex flex-col bg-surface-primary border ${config.border} rounded-lg overflow-hidden ${isExpanded ? 'col-span-2 row-span-2' : ''}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 bg-gradient-to-r ${config.color}`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{config.icon}</span>
          <div>
            <h3 className="text-sm font-semibold text-white">{terminal.name}</h3>
            <p className="text-xs text-white/70">{terminal.project || 'No project'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`flex items-center gap-1 text-xs ${statusConfig.color}`}>
            <StatusIcon size={12} />
            {statusConfig.label}
          </span>
          <button onClick={onToggleExpand} className="p-1 hover:bg-white/20 rounded">
            {isExpanded ? <Minimize2 size={14} className="text-white" /> : <Maximize2 size={14} className="text-white" />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded">
            <X size={14} className="text-white" />
          </button>
        </div>
      </div>

      {/* Task Description */}
      {terminal.taskDescription && (
        <div className="px-3 py-1.5 bg-surface-elevated border-b border-border-subtle">
          <p className="text-xs text-text-secondary truncate">{terminal.taskDescription}</p>
        </div>
      )}

      {/* Terminal Output */}
      <div
        ref={outputRef}
        className="flex-1 p-2 font-mono text-xs overflow-y-auto bg-black/50 min-h-[200px] max-h-[400px]"
      >
        {terminal.output.length === 0 ? (
          <p className="text-gray-500 italic">Waiting for output...</p>
        ) : (
          terminal.output.map((line, i) => (
            <div key={i} className={`flex gap-2 ${
              line.type === 'stderr' ? 'text-red-400' :
              line.type === 'system' ? 'text-yellow-400' :
              line.type === 'memory' ? 'text-purple-400' :
              'text-green-400'
            }`}>
              <span className="text-gray-600 select-none">{line.timestamp}</span>
              {line.type === 'memory' && <Brain size={12} className="text-purple-400 mt-0.5" />}
              <span className="whitespace-pre-wrap break-all">{line.content}</span>
            </div>
          ))
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-elevated border-t border-border-subtle">
        <div className="text-xs text-text-muted">
          {terminal.startedAt && (
            <span>Started: {new Date(terminal.startedAt).toLocaleTimeString()}</span>
          )}
        </div>
        <div className="flex gap-2">
          {terminal.status === 'running' ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 hover:bg-red-500 text-white rounded"
            >
              <Square size={12} /> Stop
            </button>
          ) : (
            <button
              onClick={onRestart}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-accent-600 hover:bg-accent-500 text-white rounded"
            >
              <RefreshCw size={12} /> Restart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Memory Log Panel
function MemoryLogPanel({ logs }: { logs: MemoryLogEntry[] }) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const tierColors = {
    short_term: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    mid_term: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    long_term: 'bg-green-500/20 text-green-400 border-green-500/50',
  };

  return (
    <div className="bg-surface-primary border border-purple-500 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-800">
        <Brain size={16} className="text-white" />
        <h3 className="text-sm font-semibold text-white">Memory MCP Activity</h3>
        <span className="ml-auto text-xs text-white/70">{logs.length} entries</span>
      </div>
      <div ref={logRef} className="p-2 font-mono text-xs overflow-y-auto max-h-[200px] bg-black/30">
        {logs.length === 0 ? (
          <p className="text-gray-500 italic">No memory activity yet...</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex items-center gap-2 py-1 border-b border-border-subtle/30">
              <span className="text-gray-600">{log.timestamp}</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded border ${tierColors[log.tier]}`}>
                {log.tier.replace('_', ' ')}
              </span>
              <span className="text-purple-400">[{log.agent}]</span>
              <span className="text-text-secondary">{log.action}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Add Agent Modal
function AddAgentModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (agent: Partial<AgentTerminal>) => void;
}) {
  const [name, setName] = useState('');
  const [model, setModel] = useState<'claude' | 'gemini' | 'codex'>('claude');
  const [project, setProject] = useState('');
  const [task, setTask] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name: name || `${model}-agent-${Date.now()}`,
      model,
      project,
      taskDescription: task,
    });
    setName('');
    setProject('');
    setTask('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-text-primary mb-4 flex items-center gap-2">
          <Bot size={20} />
          Spawn New Agent
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., research-agent"
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Model</label>
            <div className="flex gap-2">
              {(['claude', 'gemini', 'codex'] as const).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`flex-1 py-2 rounded-lg border ${model === m ? MODEL_CONFIG[m].border + ' bg-surface-elevated' : 'border-border-default'}`}
                >
                  <span className="text-lg">{MODEL_CONFIG[m].icon}</span>
                  <span className="ml-1 text-sm capitalize">{m}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="e.g., trader-ai"
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Task Description</label>
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What should this agent do?"
              rows={3}
              className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium">
              <Play size={16} className="inline mr-1" /> Spawn Agent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Main Manager Page
export function ManagerPage() {
  const [terminals, setTerminals] = useState<AgentTerminal[]>([]);
  const [memoryLogs, setMemoryLogs] = useState<MemoryLogEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedTerminal, setExpandedTerminal] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize with demo agents
  useEffect(() => {
    const demoAgents: AgentTerminal[] = [
      {
        id: 'claude-1',
        name: 'oracle-planner',
        model: 'claude',
        status: 'running',
        project: 'life-os-dashboard',
        taskDescription: 'Planning Sisyphus orchestrator architecture',
        output: [
          { timestamp: '10:27:32', type: 'system', content: 'Agent spawned with Claude Opus 4.5' },
          { timestamp: '10:27:33', type: 'stdout', content: 'Analyzing codebase structure...' },
          { timestamp: '10:27:35', type: 'stdout', content: 'Found 12 backend routers, 15 frontend pages' },
          { timestamp: '10:27:38', type: 'memory', content: '[STORE] Architecture analysis -> short_term/session' },
          { timestamp: '10:27:40', type: 'stdout', content: 'Generating implementation plan...' },
        ],
        startedAt: new Date().toISOString(),
      },
      {
        id: 'gemini-1',
        name: 'librarian-research',
        model: 'gemini',
        status: 'running',
        project: 'trader-ai',
        taskDescription: 'Research dual momentum strategies',
        output: [
          { timestamp: '10:25:01', type: 'system', content: 'Agent spawned with Gemini 2.5 Pro' },
          { timestamp: '10:25:03', type: 'stdout', content: 'Searching academic papers...' },
          { timestamp: '10:25:10', type: 'stdout', content: 'Found 47 relevant papers on momentum trading' },
          { timestamp: '10:25:15', type: 'memory', content: '[STORE] Research findings -> mid_term/expertise' },
        ],
        startedAt: new Date(Date.now() - 150000).toISOString(),
      },
      {
        id: 'codex-1',
        name: 'test-fixer',
        model: 'codex',
        status: 'completed',
        project: 'connascence',
        taskDescription: 'Fix failing unit tests in detector module',
        output: [
          { timestamp: '10:20:00', type: 'system', content: 'Agent spawned with Codex (full-auto mode)' },
          { timestamp: '10:20:05', type: 'stdout', content: 'Running pytest...' },
          { timestamp: '10:20:15', type: 'stderr', content: '3 tests failed in test_detector.py' },
          { timestamp: '10:21:30', type: 'stdout', content: 'Applying fix to line 142...' },
          { timestamp: '10:22:00', type: 'stdout', content: 'All tests passing!' },
          { timestamp: '10:22:02', type: 'memory', content: '[STORE] Bug fix pattern -> long_term/expertise' },
          { timestamp: '10:22:05', type: 'system', content: 'Task completed successfully' },
        ],
        startedAt: new Date(Date.now() - 420000).toISOString(),
        completedAt: new Date(Date.now() - 300000).toISOString(),
      },
    ];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTerminals(demoAgents);

    // Demo memory logs
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMemoryLogs([
      { timestamp: '10:22:05', agent: 'test-fixer', action: 'Stored bug fix pattern for CoE detection', tier: 'long_term', namespace: 'expertise' },
      { timestamp: '10:25:15', agent: 'librarian-research', action: 'Stored momentum research findings', tier: 'mid_term', namespace: 'expertise' },
      { timestamp: '10:27:38', agent: 'oracle-planner', action: 'Stored architecture analysis', tier: 'short_term', namespace: 'session' },
    ]);
  }, []);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8001';
      const ws = new WebSocket(`${wsUrl}/ws/manager`);

      ws.onopen = () => {
        console.log('Manager WebSocket connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'terminal_output') {
          setTerminals(prev => prev.map(t =>
            t.id === data.terminalId
              ? { ...t, output: [...t.output, data.line] }
              : t
          ));
        } else if (data.type === 'memory_log') {
          setMemoryLogs(prev => [...prev, data.log]);
        }
      };

      ws.onerror = () => {
        console.log('WebSocket error - running in demo mode');
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const handleAddAgent = (agent: Partial<AgentTerminal>) => {
    const newAgent: AgentTerminal = {
      id: `${agent.model}-${Date.now()}`,
      name: agent.name || 'new-agent',
      model: agent.model || 'claude',
      status: 'idle',
      project: agent.project,
      taskDescription: agent.taskDescription,
      output: [
        { timestamp: new Date().toLocaleTimeString(), type: 'system', content: `Agent ${agent.name} initialized` }
      ],
    };
    setTerminals(prev => [...prev, newAgent]);
  };

  const handleCloseTerminal = (id: string) => {
    setTerminals(prev => prev.filter(t => t.id !== id));
  };

  const handleStopAgent = (id: string) => {
    setTerminals(prev => prev.map(t =>
      t.id === id
        ? { ...t, status: 'idle', output: [...t.output, { timestamp: new Date().toLocaleTimeString(), type: 'system', content: 'Agent stopped by user' }] }
        : t
    ));
  };

  const handleRestartAgent = (id: string) => {
    setTerminals(prev => prev.map(t =>
      t.id === id
        ? { ...t, status: 'running', startedAt: new Date().toISOString(), output: [...t.output, { timestamp: new Date().toLocaleTimeString(), type: 'system', content: 'Agent restarted' }] }
        : t
    ));
  };

  // Stats
  const runningCount = terminals.filter(t => t.status === 'running').length;
  const completedCount = terminals.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Terminal size={24} className="text-accent-400" />
            Agent Manager
          </h1>
          <p className="text-text-secondary text-sm">Sisyphus-style multi-agent orchestration</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1 text-blue-400">
              <Zap size={14} /> {runningCount} Running
            </span>
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle size={14} /> {completedCount} Completed
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <Brain size={14} /> {memoryLogs.length} Memory Ops
            </span>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium"
          >
            <Plus size={18} />
            Spawn Agent
          </button>
        </div>
      </div>

      {/* Memory Log Panel */}
      <div className="mb-6">
        <MemoryLogPanel logs={memoryLogs} />
      </div>

      {/* Terminal Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {terminals.map(terminal => (
          <TerminalPanel
            key={terminal.id}
            terminal={terminal}
            onClose={() => handleCloseTerminal(terminal.id)}
            onStop={() => handleStopAgent(terminal.id)}
            onRestart={() => handleRestartAgent(terminal.id)}
            isExpanded={expandedTerminal === terminal.id}
            onToggleExpand={() => setExpandedTerminal(expandedTerminal === terminal.id ? null : terminal.id)}
          />
        ))}

        {/* Add Agent Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-border-default rounded-lg hover:border-accent-500 hover:bg-surface-elevated/50 transition-colors"
        >
          <Plus size={32} className="text-text-muted mb-2" />
          <span className="text-text-muted">Spawn New Agent</span>
        </button>
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAgent}
      />
    </div>
  );
}
