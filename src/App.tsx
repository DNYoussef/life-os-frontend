import { useState, useEffect } from 'react'
import './App.css'

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
        fetch(`${API_BASE}/api/v1/health`),
        fetch(`${API_BASE}/api/v1/liveness`)
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
            <div className="loading">Loading...</div>
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
        <section className="features-section">
          <h2>Coming Soon</h2>
          <div className="features-grid">
            <div className="feature-card"><h3>Task Management</h3><p>Create and track scheduled tasks</p></div>
            <div className="feature-card"><h3>CLI Bridge</h3><p>Route AI requests to Claude, Gemini, or Codex</p></div>
            <div className="feature-card"><h3>MCP Discovery</h3><p>Toggle and manage MCP servers</p></div>
            <div className="feature-card"><h3>Expertise System</h3><p>Accumulate patterns over time</p></div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <p>Life OS Integration Project</p>
      </footer>
    </div>
  )
}

export default App
