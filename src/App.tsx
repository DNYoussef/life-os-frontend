import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import { CLIBridge } from './components/CLIBridge'
import { EvidenceViewer } from './components/EvidenceViewer'
import { ConsensusDisplay } from './components/ConsensusDisplay'
import { TasksPage } from './pages/TasksPage'
import { AgentsPage } from './pages/AgentsPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { WizardPage } from './pages/WizardPage'
import { SimpleAskAI } from './components/SimpleAskAI/SimpleAskAI'
import {
  Home,
  CheckSquare,
  Bot,
  FolderKanban,
  Wand2,
  Activity,
  LayoutGrid,
  GitMerge,
  Terminal,
  FileCheck,
  type LucideIcon,
} from 'lucide-react'

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
    { path: '/', label: 'Home', icon: Home },
    { path: '/tasks', label: 'Tasks', icon: CheckSquare },
    { path: '/agents', label: 'Agents', icon: Bot },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/wizard', label: 'Wizard', icon: Wand2 },
  ];

  return (
    <nav className="nav-container">
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-link ${location.pathname === item.path ? 'nav-link-active' : ''}`}
        >
          <item.icon size={16} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// Feature Card Component
function FeatureCard({ to, icon: Icon, title, description }: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="feature-card clickable">
      <div className="feature-card-icon">
        <Icon size={24} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="api-badge live">Live</span>
    </Link>
  );
}

// Section Header Component
function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <h2><Icon size={20} className="section-icon" />{title}</h2>
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
    </>
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
        <SectionHeader icon={Activity} title="System Status" />
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
        <SectionHeader icon={LayoutGrid} title="Dashboard Pages" subtitle="Manage your Life OS infrastructure" />
        <div className="features-grid">
          <FeatureCard
            to="/tasks"
            icon={CheckSquare}
            title="Task Management"
            description="Create and track scheduled tasks with cron expressions"
          />
          <FeatureCard
            to="/agents"
            icon={Bot}
            title="Agent Registry"
            description="Monitor AI agents, metrics, and activity history"
          />
          <FeatureCard
            to="/projects"
            icon={FolderKanban}
            title="Project Management"
            description="Organize tasks into projects with progress tracking"
          />
          <FeatureCard
            to="/wizard"
            icon={Wand2}
            title="Project Wizard"
            description="7-stage Design OS workflow with Ralph Wiggum quality gates"
          />
        </div>
      </section>

      <section className="consensus-section">
        <SectionHeader icon={GitMerge} title="Multi-Model Consensus" subtitle="Run prompts through Claude, Gemini, and Codex for consensus validation" />
        <ConsensusDisplay apiBase={API_BASE} />
      </section>

      <div className="two-column-section">
        <section className="cli-section">
          <SectionHeader icon={Terminal} title="CLI Bridge" subtitle="Route AI requests to Claude, Gemini, or OpenAI" />
          <CLIBridge apiBase={API_BASE} />
        </section>

        <section className="evidence-section">
          <SectionHeader icon={FileCheck} title="Evidence Trail" subtitle="Visual proof and audit records for observable learning" />
          <EvidenceViewer apiBase={API_BASE} />
        </section>
      </div>
    </main>
  );
}

// App content wrapper to conditionally show/hide elements based on route
function AppContent() {
  const location = useLocation();
  const isWizardPage = location.pathname === '/wizard';

  return (
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
        <Route path="/wizard" element={<WizardPage />} />
      </Routes>
      <footer className="footer">
        <p>Life OS Integration Project</p>
      </footer>

      {/* Floating AI Chat Widget - Hidden on wizard page */}
      {!isWizardPage && <SimpleAskAI apiBase={API_BASE} />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
