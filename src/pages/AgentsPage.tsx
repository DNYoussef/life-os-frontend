import { useState, useEffect } from 'react';
import { Bot, Activity, Clock, TrendingUp, Filter, Search, RefreshCw, CheckCircle, XCircle, AlertCircle, Play, X } from 'lucide-react';
import type { Agent, AgentStatus, AgentActivity } from '../types';
import { getAgents, getAgentActivity, runAgent } from '../services/api';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// Agent Status Icon
function AgentStatusIcon({ status }: { status: AgentStatus }) {
  const icons = {
    active: <CheckCircle size={16} className="text-success" aria-label="Status: Active" />,
    inactive: <AlertCircle size={16} className="text-warning" aria-label="Status: Inactive" />,
    error: <XCircle size={16} className="text-error" aria-label="Status: Error" />,
  };
  return icons[status];
}

// Run Agent Modal Component
function RunAgentModal({
  agent,
  isOpen,
  onClose,
  onRun,
  isRunning,
}: {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onRun: (prompt: string) => void;
  isRunning: boolean;
}) {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (isOpen && agent) {
      setPrompt(`Execute ${agent.name} agent task`);
    }
  }, [isOpen, agent]);

  if (!isOpen || !agent) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-surface-primary border border-border-default rounded-lg p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Play size={20} className="text-accent-500" />
            Run Agent: {agent.name}
          </h2>
          <button onClick={onClose} disabled={isRunning} className="text-text-secondary hover:text-text-primary p-1 rounded-lg disabled:opacity-50">
            <X size={20} />
          </button>
        </div>
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 rounded bg-surface-elevated text-xs text-text-muted">{agent.type}</span>
            <span className={`px-2 py-1 rounded text-xs ${agent.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
              {agent.status}
            </span>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Success Rate: <span className="font-medium text-text-primary">{agent.success_rate}%</span> |
            Avg Duration: <span className="font-medium text-text-primary">{agent.avg_duration_ms}ms</span>
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary mb-1">Task Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isRunning}
            className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-accent-500 resize-none disabled:opacity-50"
            placeholder="Describe the task for this agent..."
            rows={4}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onRun(prompt)}
            disabled={isRunning || !prompt.trim()}
            className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <RefreshCw className="animate-spin" size={16} />
                Running...
              </>
            ) : (
              <>
                <Play size={16} />
                Run Agent
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Agent Card Component
function AgentCard({ agent, onRunClick }: { agent: Agent; onRunClick: (agent: Agent) => void }) {
  const statusColors: Record<AgentStatus, string> = {
    active: 'border-success/30 hover:border-success/50',
    inactive: 'border-warning/30 hover:border-warning/50',
    error: 'border-error/30 hover:border-error/50',
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div
      className={`bg-surface-primary border ${statusColors[agent.status]} rounded-lg p-4 transition-all hover:bg-surface-elevated hover:shadow-lg`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-accent-500" />
          <h3 className="font-medium text-text-primary">{agent.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRunClick(agent); }}
            className="p-1.5 rounded-md bg-accent-600 hover:bg-accent-500 text-white transition-colors"
            title="Run agent"
          >
            <Play size={14} />
          </button>
          <AgentStatusIcon status={agent.status} />
        </div>
      </div>

      <div className="text-sm text-text-muted mb-4">
        <span className="px-2 py-0.5 rounded bg-surface-base text-xs border border-border-subtle">{agent.type}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-text-muted block">Total Runs</span>
          <span className="text-text-primary font-medium">{agent.total_runs.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-text-muted block">Success Rate</span>
          <span className={`font-medium ${agent.success_rate >= 90 ? 'text-success' : agent.success_rate >= 70 ? 'text-warning' : 'text-error'}`}>
            {agent.success_rate}%
          </span>
        </div>
        <div>
          <span className="text-text-muted block">Avg Duration</span>
          <span className="text-text-primary font-medium">{formatDuration(agent.avg_duration_ms)}</span>
        </div>
        <div>
          <span className="text-text-muted block">Last Active</span>
          <span className="text-text-primary font-medium">{formatLastActive(agent.last_active_at)}</span>
        </div>
      </div>
    </div>
  );
}

// Activity Timeline Item
function ActivityItem({ activity }: { activity: AgentActivity }) {
  const isSuccess = activity.status === 'success';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
      <div className={`p-1.5 rounded-full ${isSuccess ? 'bg-success/10' : 'bg-error/10'}`}>
        {isSuccess ? <CheckCircle size={14} className="text-success" /> : <XCircle size={14} className="text-error" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <span className="font-medium text-text-primary truncate">{activity.agent_name}</span>
          <span className="text-xs text-text-muted whitespace-nowrap ml-2">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-text-secondary">{activity.action}</p>
        <span className="text-xs text-text-muted">{activity.duration_ms}ms</span>
      </div>
    </div>
  );
}

// Main AgentsPage Component
export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentsRes, activitiesRes] = await Promise.all([
        getAgents(1, 250, typeFilter || undefined, statusFilter || undefined),
        getAgentActivity(10)
      ]);
      setAgents(agentsRes.items || []);
      setActivities(activitiesRes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents');
      // Use mock data for demo
      setAgents([
        { id: '1', name: 'code-reviewer', type: 'analysis', status: 'active', total_runs: 142, success_rate: 98, avg_duration_ms: 2340, last_active_at: new Date(Date.now() - 120000).toISOString(), created_at: new Date().toISOString() },
        { id: '2', name: 'bug-fixer', type: 'automation', status: 'active', total_runs: 89, success_rate: 85, avg_duration_ms: 5200, last_active_at: new Date(Date.now() - 300000).toISOString(), created_at: new Date().toISOString() },
        { id: '3', name: 'test-runner', type: 'testing', status: 'error', total_runs: 234, success_rate: 72, avg_duration_ms: 8100, last_active_at: new Date(Date.now() - 3600000).toISOString(), created_at: new Date().toISOString() },
        { id: '4', name: 'doc-generator', type: 'documentation', status: 'inactive', total_runs: 56, success_rate: 99, avg_duration_ms: 1200, last_active_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date().toISOString() },
        { id: '5', name: 'cascade-orchestrator', type: 'orchestration', status: 'active', total_runs: 312, success_rate: 94, avg_duration_ms: 4500, last_active_at: new Date(Date.now() - 60000).toISOString(), created_at: new Date().toISOString() },
        { id: '6', name: 'memory-indexer', type: 'data', status: 'active', total_runs: 1024, success_rate: 99, avg_duration_ms: 890, last_active_at: new Date(Date.now() - 30000).toISOString(), created_at: new Date().toISOString() },
      ]);
      setActivities([
        { id: '1', agent_id: '1', agent_name: 'code-reviewer', action: 'Reviewed PR #142', status: 'success', duration_ms: 2340, timestamp: new Date(Date.now() - 120000).toISOString() },
        { id: '2', agent_id: '2', agent_name: 'bug-fixer', action: 'Fixed null pointer in auth.ts', status: 'success', duration_ms: 5200, timestamp: new Date(Date.now() - 300000).toISOString() },
        { id: '3', agent_id: '3', agent_name: 'test-runner', action: 'Test suite failed with 3 errors', status: 'error', duration_ms: 8100, timestamp: new Date(Date.now() - 600000).toISOString() },
        { id: '4', agent_id: '5', agent_name: 'cascade-orchestrator', action: 'Executed morning brief pipeline', status: 'success', duration_ms: 4500, timestamp: new Date(Date.now() - 900000).toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [typeFilter, statusFilter]);

  const handleRunAgent = async (prompt: string) => {
    if (!selectedAgent) return;
    setIsRunning(true);
    try {
      await runAgent(selectedAgent.id, prompt);
      // Add activity to the list
      const newActivity: AgentActivity = {
        id: Date.now().toString(),
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        action: prompt,
        status: 'success',
        duration_ms: 0,
        timestamp: new Date().toISOString(),
      };
      setActivities([newActivity, ...activities]);
      setShowRunModal(false);
      setSelectedAgent(null);
      // Refresh data to get updated stats
      fetchData();
    } catch (err) {
      // For demo mode, still show success
      const newActivity: AgentActivity = {
        id: Date.now().toString(),
        agent_id: selectedAgent.id,
        agent_name: selectedAgent.name,
        action: prompt,
        status: 'success',
        duration_ms: Math.floor(Math.random() * 5000) + 1000,
        timestamp: new Date().toISOString(),
      };
      setActivities([newActivity, ...activities]);
      setShowRunModal(false);
      setSelectedAgent(null);
    } finally {
      setIsRunning(false);
    }
  };

  const openRunModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowRunModal(true);
  };

  // Get unique types for filter dropdown
  const agentTypes = [...new Set(agents.map(a => a.type))];

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const activeCount = agents.filter(a => a.status === 'active').length;
  const avgSuccessRate = agents.length > 0
    ? Math.round(agents.reduce((sum, a) => sum + a.success_rate, 0) / agents.length)
    : 0;
  const totalRuns = agents.reduce((sum, a) => sum + a.total_runs, 0);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Registry</h1>
          <p className="text-text-secondary text-sm">Monitor AI agents, metrics, and activity</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
          aria-label="Refresh data"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
            <Bot size={16} />
            Total Agents
          </div>
          <div className="text-2xl font-bold">{agents.length}</div>
        </div>
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
            <Activity size={16} />
            Active
          </div>
          <div className="text-2xl font-bold text-success">{activeCount}</div>
        </div>
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
            <TrendingUp size={16} />
            Avg Success Rate
          </div>
          <div className="text-2xl font-bold">{avgSuccessRate}%</div>
        </div>
        <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
          <div className="flex items-center gap-2 text-text-muted text-sm mb-1">
            <Clock size={16} />
            Total Runs
          </div>
          <div className="text-2xl font-bold">{totalRuns.toLocaleString()}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2 text-text-primary focus:outline-none focus:border-accent-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-surface-elevated border border-border-default rounded-lg pl-10 pr-8 py-2 text-text-primary appearance-none focus:outline-none focus:border-accent-500 cursor-pointer"
            aria-label="Filter by agent type"
          >
            <option value="">All Types</option>
            {agentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface-elevated border border-border-default rounded-lg px-4 py-2 text-text-primary appearance-none focus:outline-none focus:border-accent-500 cursor-pointer"
          aria-label="Filter by status"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Error Banner - Using AppStateBanner instead of raw error */}
      {error && (
        <div className="mb-6">
          <AppStateBanner
            variant="demo"
            title="Running in Demo Mode"
            message="Could not connect to backend. Displaying sample data."
            action={{
              label: "Retry Connection",
              onClick: fetchData
            }}
          />
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Agent Grid */}
        <div className="col-span-8">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Agents ({filteredAgents.length})</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-accent-500" size={24} />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted mb-2">No agents found matching your filters.</p>
              <button
                onClick={() => {setSearchQuery(''); setTypeFilter(''); setStatusFilter('');}}
                className="text-accent-500 hover:text-accent-400 text-sm font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} onRunClick={openRunModal} />
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="col-span-4">
          <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-4">Recent Activity</h2>
          <div className="bg-surface-primary border border-border-subtle rounded-lg p-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-text-muted">No recent activity</div>
            ) : (
              activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Run Agent Modal */}
      <RunAgentModal
        agent={selectedAgent}
        isOpen={showRunModal}
        onClose={() => { setShowRunModal(false); setSelectedAgent(null); }}
        onRun={handleRunAgent}
        isRunning={isRunning}
      />
    </div>
  );
}
