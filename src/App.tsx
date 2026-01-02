import { useState, useEffect } from 'react'
import './App.css'
import { CLIBridge } from './components/CLIBridge'
import { EvidenceViewer } from './components/EvidenceViewer'
import { ConsensusDisplay } from './components/ConsensusDisplay'
// SimpleAskAI removed - Phase 0: Kill floating widget

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
  memory_mcp: string;
  version: string;
}

interface LivenessResponse {
  alive: boolean;
  timestamp: string;
}

function StatusCard({ title, status, subtitle }: { title: string; status: string; subtitle?: string }) {
  const getStatusColor = (s: string) => {
    if (s === 'connected' || s === 'ok' || s === 'healthy' || s === 'true') return 'status-good';
    if (s === 'degraded' || s === 'disabled') return 'status-warning';
    return 'status-error';
  };

  return (
    <div className={`status-card ${getStatusColor(status)}`}>
      <h3>{title}</h3>
      <p className="status-value">{status}</p>
      {subtitle && <p className="status-subtitle">{subtitle}</p>}
    </div>
  );
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [liveness, setLiveness] = useState<LivenessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = async () => {
    try {
      setError(null);
      const [healthRes, livenessRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/health/`),
        fetch(`${API_BASE}/api/v1/liveness/`)
      ]);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
      if (livenessRes.ok) {
        const livenessData = await livenessRes.json();
        setLiveness(livenessData);
      }
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Life OS Dashboard</h1>
        <p className="subtitle">Integration Hub for Context Cascade + Memory MCP</p>
      </header>
      <main className="main">
        {error && (
          <div className="error-banner">
            <span>Connection Error: {error}</span>
            <button onClick={fetchStatus}>Retry</button>
          </div>
        )}
        <section className="status-section">
          <h2>System Status</h2>
          {loading ? (
            <div className="status-grid">
              <div className="status-card skeleton"><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>
              <div className="status-card skeleton"><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>
              <div className="status-card skeleton"><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>
              <div className="status-card skeleton"><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>
            </div>
          ) : (
            <div className="status-grid">
              <StatusCard title="Backend API" status={liveness?.alive ? 'connected' : 'disconnected'} subtitle={`v${health?.version || '?'}`} />
              <StatusCard title="Database" status={health?.database || 'unknown'} subtitle="PostgreSQL" />
              <StatusCard title="Memory MCP" status={health?.memory_mcp || 'unknown'} subtitle="Triple-layer memory" />
              <StatusCard title="Overall Health" status={health?.status || 'unknown'} />
            </div>
          )}
          {lastUpdated && <p className="last-updated">Last updated: {lastUpdated.toLocaleTimeString()}</p>}
        </section>
        <section className="consensus-section">
          <h2>Multi-Model Consensus</h2>
          <p className="section-subtitle">Run prompts through Claude, Gemini, and Codex for consensus validation</p>
          <ConsensusDisplay apiBase={API_BASE} />
        </section>

        <section className="cli-section">
          <h2>CLI Bridge</h2>
          <p className="section-subtitle">Route AI requests to Claude, Gemini, or OpenAI</p>
          <CLIBridge apiBase={API_BASE} />
        </section>
        <section className="evidence-section">
          <h2>Evidence Trail</h2>
          <p className="section-subtitle">Visual proof and audit records for observable learning</p>
          <EvidenceViewer apiBase={API_BASE} />
        </section>

        <section className="features-section">
          <h2>Available APIs</h2>
          <p className="section-subtitle">Backend endpoints ready for integration</p>
          <div className="features-grid">
            <a href={`${API_BASE}/api/docs#/tasks`} target="_blank" rel="noopener noreferrer" className="feature-card clickable">
              <h3>Task Management</h3>
              <p>Create and track scheduled tasks</p>
              <span className="api-badge">API Ready</span>
            </a>
            <a href={`${API_BASE}/api/docs#/agents`} target="_blank" rel="noopener noreferrer" className="feature-card clickable">
              <h3>Agent Registry</h3>
              <p>Track agent activity and metrics</p>
              <span className="api-badge">API Ready</span>
            </a>
            <a href={`${API_BASE}/api/docs#/projects`} target="_blank" rel="noopener noreferrer" className="feature-card clickable">
              <h3>Project Management</h3>
              <p>Organize tasks into projects</p>
              <span className="api-badge">API Ready</span>
            </a>
          </div>
        </section>
      </main>
      <footer className="footer">
        <p>Life OS Integration Project</p>
      </footer>

      {/* Floating widget removed - Phase 0: Reduce cognitive load */}
    </div>
  )
}

export default App
