import { useState, useEffect } from 'react';

interface Evidence {
  id: string;
  evidence_type: string;
  category: string;
  run_id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  confidence: number;
  confidence_level: string;
  source_url: string | null;
  captured_at: string;
}

interface RunSummary {
  run_id: string;
  evidence_count: number;
  consensus_count: number;
  overall_confidence: number;
  evidence_by_type: Record<string, number>;
  evidence_by_category: Record<string, number>;
  confidence_distribution: Record<string, number>;
  has_visual_proof: boolean;
  has_consensus: boolean;
}

interface EvidenceViewerProps {
  apiBase: string;
}

export function EvidenceViewer({ apiBase }: EvidenceViewerProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [filter, setFilter] = useState({
    category: '',
    confidence_level: ''
  });

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      if (filter.confidence_level) params.append('confidence_level', filter.confidence_level);

      const response = await fetch(`${apiBase}/api/v1/evidence?${params}`);
      if (!response.ok) throw new Error('Failed to fetch evidence');

      const data = await response.json();
      setEvidence(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRunSummary = async (runId: string) => {
    try {
      const response = await fetch(`${apiBase}/api/v1/evidence/run/${runId}/summary`);
      if (!response.ok) throw new Error('Failed to fetch run summary');

      const data = await response.json();
      setRunSummary(data);
    } catch (err) {
      console.error('Error fetching run summary:', err);
    }
  };

  useEffect(() => {
    fetchEvidence();
  }, [filter]);

  useEffect(() => {
    if (selectedRunId) {
      fetchRunSummary(selectedRunId);
    }
  }, [selectedRunId]);

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high': return '#22c55e';
      case 'medium': return '#eab308';
      case 'low': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'screenshot': return '[IMG]';
      case 'gif': return '[GIF]';
      case 'console_log': return '[LOG]';
      case 'network_request': return '[NET]';
      case 'consensus_result': return '[CON]';
      case 'audit_result': return '[AUD]';
      default: return '[DOC]';
    }
  };

  return (
    <div className="evidence-viewer">
      <div className="evidence-header">
        <h3>Evidence Trail</h3>
        <div className="evidence-filters">
          <select
            value={filter.category}
            onChange={(e) => setFilter(f => ({ ...f, category: e.target.value }))}
            className="evidence-filter-select"
          >
            <option value="">All Categories</option>
            <option value="deployment_verification">Deployment</option>
            <option value="functionality_test">Functionality</option>
            <option value="multi_model_consensus">Consensus</option>
            <option value="error_debug">Debug</option>
          </select>
          <select
            value={filter.confidence_level}
            onChange={(e) => setFilter(f => ({ ...f, confidence_level: e.target.value }))}
            className="evidence-filter-select"
          >
            <option value="">All Confidence</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <button onClick={fetchEvidence} className="evidence-refresh-btn">Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="evidence-list">
          <div className="evidence-item skeleton"><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>
          <div className="evidence-item skeleton"><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>
          <div className="evidence-item skeleton"><div className="skeleton-line"></div><div className="skeleton-line short"></div></div>
        </div>
      ) : error ? (
        <div className="error-with-retry">
          <span className="error-message">{error}</span>
          <button className="retry-btn" onClick={() => { setError(null); fetchEvidence(); }}>
            Retry
          </button>
        </div>
      ) : evidence.length === 0 ? (
        <div className="evidence-empty">No evidence collected yet</div>
      ) : (
        <div className="evidence-list">
          {evidence.map((e) => (
            <div
              key={e.id}
              className={`evidence-item ${selectedRunId === e.run_id ? 'selected' : ''}`}
              onClick={() => setSelectedRunId(e.run_id)}
            >
              <div className="evidence-item-header">
                <span className="evidence-type">{getTypeIcon(e.evidence_type)}</span>
                <span className="evidence-title">{e.title}</span>
                <span
                  className="evidence-confidence"
                  style={{ backgroundColor: getConfidenceColor(e.confidence_level) }}
                >
                  {Math.round(e.confidence * 100)}%
                </span>
              </div>
              <div className="evidence-item-meta">
                <span className="evidence-category">{e.category.replace(/_/g, ' ')}</span>
                <span className="evidence-run-id">{e.run_id}</span>
                <span className="evidence-time">
                  {new Date(e.captured_at).toLocaleString()}
                </span>
              </div>
              {e.description && (
                <div className="evidence-description">{e.description}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {runSummary && (
        <div className="run-summary">
          <h4>Run Summary: {runSummary.run_id}</h4>
          <div className="run-summary-grid">
            <div className="run-summary-stat">
              <span className="stat-value">{runSummary.evidence_count}</span>
              <span className="stat-label">Evidence</span>
            </div>
            <div className="run-summary-stat">
              <span className="stat-value">{runSummary.consensus_count}</span>
              <span className="stat-label">Consensus</span>
            </div>
            <div className="run-summary-stat">
              <span className="stat-value">{Math.round(runSummary.overall_confidence * 100)}%</span>
              <span className="stat-label">Confidence</span>
            </div>
            <div className="run-summary-stat">
              <span className="stat-value">{runSummary.has_visual_proof ? 'Yes' : 'No'}</span>
              <span className="stat-label">Visual Proof</span>
            </div>
          </div>
          <div className="confidence-dist">
            <span className="dist-high">High: {runSummary.confidence_distribution.high || 0}</span>
            <span className="dist-medium">Medium: {runSummary.confidence_distribution.medium || 0}</span>
            <span className="dist-low">Low: {runSummary.confidence_distribution.low || 0}</span>
          </div>
        </div>
      )}
    </div>
  );
}
