import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import { CLIBridge } from './components/CLIBridge'
import { EvidenceViewer } from './components/EvidenceViewer'
import { ConsensusDisplay } from './components/ConsensusDisplay'
import { TasksPage } from './pages/TasksPage'
import { AgentsPage } from './pages/AgentsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { SimpleAskAI } from './components/SimpleAskAI/SimpleAskAI'

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

// Navigation Component
function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/tasks', label: 'Tasks' },
    { path: '/agents', label: 'Agents' },
    { path: '/projects', label: 'Projects' },
  ];

  return (
    <nav className="nav-container">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// Home Page Component
function HomePage() {
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

      <section className="features-section">
        <h2>Dashboard Pages</h2>
        <p className="section-subtitle">Manage your Life OS infrastructure</p>
        <div className="features-grid">
          <Link to="/tasks" className="feature-card clickable">
            <h3>Task Management</h3>
            <p>Create and track scheduled tasks with cron expressions</p>
            <span className="api-badge live">Live</span>
          </Link>
          <Link to="/agents" className="feature-card clickable">
            <h3>Agent Registry</h3>
            <p>Monitor AI agents, metrics, and activity history</p>
            <span className="api-badge live">Live</span>
          </Link>
          <Link to="/projects" className="feature-card clickable">
            <h3>Project Management</h3>
            <p>Organize tasks into projects with progress tracking</p>
            <span className="api-badge live">Live</span>
          </Link>
        </div>
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
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header className="header">
          <h1>Life OS Dashboard</h1>
          <p className="subtitle">Integration Hub for Context Cascade + Memory MCP</p>
          <Navigation />
        </header>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
        </Routes>
        <footer className="footer">
          <p>Life OS Integration Project</p>
        </footer>

        {/* Floating AI Chat Widget - Available on all pages */}
        <SimpleAskAI apiBase={API_BASE} />
      </div>
    </BrowserRouter>
  )
}

export default App
