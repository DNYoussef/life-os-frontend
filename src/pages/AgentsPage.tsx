import { useState, useEffect } from 'react';
import { Bot, Activity, Clock, TrendingUp, Filter, Search, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Agent, AgentStatus, AgentActivity } from '../types';
import { getAgents, getAgentActivity } from '../services/api';

// Agent Status Icon
function AgentStatusIcon({ status }: { status: AgentStatus }) {
  const icons = {
    active: <CheckCircle size={16} className="text-green-400" />,
    inactive: <AlertCircle size={16} className="text-yellow-400" />,
    error: <XCircle size={16} className="text-red-400" />,
  };
  return icons[status];
}

// Agent Card Component
function AgentCard({ agent }: { agent: Agent }) {
  const statusColors: Record<AgentStatus, string> = {
    active: 'border-green-500/30',
    inactive: 'border-yellow-500/30',
    error: 'border-red-500/30',
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
    <div className={`bg-slate-900/50 border ${statusColors[agent.status]} rounded-lg p-4 hover:bg-slate-800/50 transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot size={20} className="text-cyan-500" />
          <h3 className="font-medium text-slate-200">{agent.name}</h3>
        </div>
        <AgentStatusIcon status={agent.status} />
      </div>

      <div className="text-sm text-slate-400 mb-4">
        <span className="px-2 py-0.5 rounded bg-slate-800 text-xs">{agent.type}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-slate-500 block">Total Runs</span>
          <span className="text-slate-200 font-medium">{agent.total_runs.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Success Rate</span>
          <span className={`font-medium ${agent.success_rate >= 90 ? 'text-green-400' : agent.success_rate >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>
            {agent.success_rate}%
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Avg Duration</span>
          <span className="text-slate-200 font-medium">{formatDuration(agent.avg_duration_ms)}</span>
        </div>
        <div>
          <span className="text-slate-500 block">Last Active</span>
          <span className="text-slate-200 font-medium">{formatLastActive(agent.last_active_at)}</span>
        </div>
      </div>
    </div>
  );
}

// Activity Timeline Item
function ActivityItem({ activity }: { activity: AgentActivity }) {
  const isSuccess = activity.status === 'success';

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800 last:border-0">
      <div className={`p-1.5 rounded-full ${isSuccess ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
        {isSuccess ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <span className="font-medium text-slate-200 truncate">{activity.agent_name}</span>
          <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
            {new Date(activity.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-sm text-slate-400">{activity.action}</p>
        <span className="text-xs text-slate-500">{activity.duration_ms}ms</span>
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [agentsRes, activitiesRes] = await Promise.all([
        getAgents(1, 50, typeFilter || undefined, statusFilter || undefined),
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
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agent Registry</h1>
          <p className="text-slate-400 text-sm">Monitor AI agents, metrics, and activity</p>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors"
        >
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Bot size={16} />
            Total Agents
          </div>
          <div className="text-2xl font-bold">{agents.length}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Activity size={16} />
            Active
          </div>
          <div className="text-2xl font-bold text-green-400">{activeCount}</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <TrendingUp size={16} />
            Avg Success Rate
          </div>
          <div className="text-2xl font-bold">{avgSuccessRate}%</div>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Clock size={16} />
            Total Runs
          </div>
          <div className="text-2xl font-bold">{totalRuns.toLocaleString()}</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-8 py-2 text-slate-200 appearance-none focus:outline-none focus:border-cyan-500"
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
          className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-slate-200 appearance-none focus:outline-none focus:border-cyan-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="error">Error</option>
        </select>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
          {error} (showing demo data)
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Agent Grid */}
        <div className="col-span-8">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Agents ({filteredAgents.length})</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin text-slate-500" size={24} />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              No agents found matching your filters.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredAgents.map(agent => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          )}
        </div>

        {/* Activity Timeline */}
        <div className="col-span-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">Recent Activity</h2>
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No recent activity</div>
            ) : (
              activities.map(activity => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
