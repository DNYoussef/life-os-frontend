import { useState, useEffect } from 'react';
import { Brain, Search, Database, Clock, Calendar, Archive, RefreshCw, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { AppStateBanner } from '../components/ui/AppStateBanner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Types
interface MemoryStatus {
  available: boolean;
  base_url: string;
  namespaces: string[];
  tiers: string[];
}

interface SearchEntry {
  id: string;
  text: string;
  namespace: string;
  tier: string;
  score: number | null;
}

interface SearchResponse {
  entries: SearchEntry[];
  query: string;
  mode: string;
  count: number;
  execution_time_ms: number;
}

// Tier configuration
const TIER_CONFIG = {
  short_term: { label: '24 Hours', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  mid_term: { label: '7 Days', icon: Calendar, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  long_term: { label: '30+ Days', icon: Archive, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
};

const NAMESPACE_COLORS: Record<string, string> = {
  session: 'bg-green-500/20 text-green-400',
  archetype: 'bg-blue-500/20 text-blue-400',
  expertise: 'bg-purple-500/20 text-purple-400',
  cross: 'bg-orange-500/20 text-orange-400',
};

// Memory Tier Card
function TierCard({ tier, count, isActive }: { tier: string; count: number; isActive: boolean }) {
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.short_term;
  const Icon = config.icon;

  return (
    <div className={`bg-surface-primary border ${isActive ? config.border : 'border-border-default'} rounded-lg p-4 transition-all ${isActive ? 'ring-2 ring-accent-500/30' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2 rounded-lg ${config.bg}`}>
          <Icon size={20} className={config.color} />
        </div>
        <div>
          <h3 className="font-medium text-text-primary">{config.label}</h3>
          <p className="text-xs text-text-muted">{tier.replace('_', '-')}</p>
        </div>
      </div>
      <div className="text-2xl font-bold text-text-primary">{count}</div>
      <p className="text-xs text-text-muted">memories</p>
    </div>
  );
}

// Search Result Card
function SearchResultCard({ entry }: { entry: SearchEntry }) {
  const tierConfig = TIER_CONFIG[entry.tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.short_term;
  const TierIcon = tierConfig.icon;

  return (
    <div className="bg-surface-primary border border-border-default rounded-lg p-4 hover:border-accent-500 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs ${NAMESPACE_COLORS[entry.namespace] || 'bg-gray-500/20 text-gray-400'}`}>
            {entry.namespace}
          </span>
          <span className={`px-2 py-0.5 rounded text-xs ${tierConfig.bg} ${tierConfig.color}`}>
            <TierIcon size={10} className="inline mr-1" />
            {tierConfig.label}
          </span>
        </div>
        {entry.score !== null && (
          <span className="text-xs text-text-muted">
            Score: {(entry.score * 100).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-text-primary line-clamp-3">{entry.text}</p>
      <p className="text-xs text-text-muted mt-2 font-mono">{entry.id.slice(0, 16)}...</p>
    </div>
  );
}

// Main MemoryPage Component
export function MemoryPage() {
  const [status, setStatus] = useState<MemoryStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedNamespace, setSelectedNamespace] = useState<string | null>(null);

  // Demo data for when backend is unavailable
  const demoStatus: MemoryStatus = {
    available: false,
    base_url: 'http://localhost:3100',
    namespaces: ['session', 'archetype', 'expertise', 'cross'],
    tiers: ['short_term', 'mid_term', 'long_term'],
  };

  const demoSearchResults: SearchResponse = {
    entries: [
      { id: 'demo-1-abc123def456', text: 'User prefers TypeScript for frontend development. Has strong experience with React 19 and Vite.', namespace: 'expertise', tier: 'long_term', score: 0.95 },
      { id: 'demo-2-xyz789ghi012', text: 'Last session focused on Life OS Dashboard integration. Key files: main.py, AgentsPage.tsx', namespace: 'session', tier: 'short_term', score: 0.88 },
      { id: 'demo-3-jkl345mno678', text: 'Cascade orchestrator successfully executed 5-phase workflow with 98% success rate.', namespace: 'archetype', tier: 'mid_term', score: 0.82 },
      { id: 'demo-4-pqr901stu234', text: 'Memory MCP triple-layer system configured with 24h/7d/30d retention policies.', namespace: 'cross', tier: 'long_term', score: 0.79 },
    ],
    query: 'demo search',
    mode: 'execution',
    count: 4,
    execution_time_ms: 45,
  };

  const fetchStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/api/v1/memory/status`);
      if (!response.ok) throw new Error('Memory MCP unavailable');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to Memory MCP');
      setStatus(demoStatus);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ query: searchQuery, limit: '20' });
      if (selectedTier) params.append('tier', selectedTier);
      if (selectedNamespace) params.append('namespace', selectedNamespace);

      const response = await fetch(`${API_BASE}/api/v1/memory/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          limit: 20,
          tier: selectedTier || undefined,
          namespace: selectedNamespace || undefined,
        }),
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setSearchResults(data);
    } catch {
      // Use demo results
      setSearchResults({
        ...demoSearchResults,
        query: searchQuery,
        entries: demoSearchResults.entries.filter(e =>
          e.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (!selectedTier || e.tier === selectedTier) &&
          (!selectedNamespace || e.namespace === selectedNamespace)
        ),
      });
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  // Calculate tier counts from search results (for visualization)
  const tierCounts = searchResults?.entries.reduce((acc, entry) => {
    acc[entry.tier] = (acc[entry.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || { short_term: 0, mid_term: 0, long_term: 0 };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="text-accent-500" />
            Memory MCP
          </h1>
          <p className="text-text-secondary text-sm">Triple-layer memory system with semantic search</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${status?.available ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
            {status?.available ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
            {status?.available ? 'Connected' : 'Demo Mode'}
          </div>
          <button
            onClick={fetchStatus}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <AppStateBanner
            variant="demo"
            title="Demo Mode"
            message="Memory MCP not available. Displaying sample data."
            action={{ label: "Retry Connection", onClick: fetchStatus }}
          />
        </div>
      )}

      {/* Memory Tiers Overview */}
      <div className="mb-6">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">Memory Layers</h2>
        <div className="grid grid-cols-3 gap-4">
          {['short_term', 'mid_term', 'long_term'].map(tier => (
            <button
              key={tier}
              onClick={() => setSelectedTier(selectedTier === tier ? null : tier)}
              className="text-left"
            >
              <TierCard
                tier={tier}
                count={tierCounts[tier] || 0}
                isActive={selectedTier === tier}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-surface-primary border border-border-default rounded-lg p-4 mb-6">
        <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider mb-3">Semantic Search</h2>
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search memories... (e.g., 'TypeScript patterns', 'recent sessions')"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full bg-surface-elevated border border-border-default rounded-lg pl-10 pr-4 py-2.5 text-text-primary focus:outline-none focus:border-accent-500"
            />
          </div>
          <select
            value={selectedNamespace || ''}
            onChange={(e) => setSelectedNamespace(e.target.value || null)}
            className="bg-surface-elevated border border-border-default rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-500"
          >
            <option value="">All Namespaces</option>
            {(status?.namespaces || demoStatus.namespaces).map(ns => (
              <option key={ns} value={ns}>{ns}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-6 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {searching ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
            Search
          </button>
        </div>

        {/* Filter Pills */}
        {(selectedTier || selectedNamespace) && (
          <div className="flex gap-2 mt-3">
            {selectedTier && (
              <span className="px-2 py-1 rounded-full bg-accent-500/20 text-accent-400 text-xs flex items-center gap-1">
                Tier: {selectedTier}
                <button onClick={() => setSelectedTier(null)} className="hover:text-white">x</button>
              </span>
            )}
            {selectedNamespace && (
              <span className="px-2 py-1 rounded-full bg-accent-500/20 text-accent-400 text-xs flex items-center gap-1">
                Namespace: {selectedNamespace}
                <button onClick={() => setSelectedNamespace(null)} className="hover:text-white">x</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-medium text-text-muted uppercase tracking-wider">
              Search Results ({searchResults.count})
            </h2>
            <span className="text-xs text-text-muted">
              Mode: {searchResults.mode} | {searchResults.execution_time_ms}ms
            </span>
          </div>
          {searchResults.entries.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <Database size={48} className="mx-auto mb-4 opacity-50" />
              <p>No memories found matching your query</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.entries.map(entry => (
                <SearchResultCard key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!searchResults && !loading && (
        <div className="text-center py-12 text-text-muted">
          <Brain size={64} className="mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium text-text-primary mb-2">Search Your Memory</h3>
          <p className="mb-4">Query the triple-layer memory system using natural language</p>
          <div className="flex flex-wrap justify-center gap-2">
            {['Recent sessions', 'TypeScript patterns', 'Agent configurations', 'Project decisions'].map(suggestion => (
              <button
                key={suggestion}
                onClick={() => { setSearchQuery(suggestion); }}
                className="px-3 py-1.5 rounded-full bg-surface-elevated border border-border-default text-sm hover:border-accent-500 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
