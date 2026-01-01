import { useState, useEffect } from 'react';

interface ModelResult {
  success: boolean;
  response_preview: string | null;
  confidence: number | null;
  execution_ms: number | null;
  error: string | null;
}

interface ConsensusResult {
  consensus_id: string;
  run_id: string;
  prompt_preview: string;
  consensus_reached: string;
  consensus_confidence: number;
  models_agree: number;
  total_models: number;
  execution_time_ms: number;
  results: Record<string, ModelResult>;
}

interface ModelStatus {
  name: string;
  available: boolean;
  model_id: string;
}

interface ConsensusDisplayProps {
  apiBase: string;
}

export function ConsensusDisplay({ apiBase }: ConsensusDisplayProps) {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConsensusResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taskType, setTaskType] = useState('general');

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(`${apiBase}/api/v1/consensus/models`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      setModels(data.models || []);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };

  const runConsensus = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${apiBase}/api/v1/consensus/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          task_type: taskType
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Consensus failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getConsensusColor = (status: string) => {
    switch (status) {
      case 'unanimous': return '#22c55e';
      case 'majority': return '#84cc16';
      case 'weak_majority': return '#eab308';
      case 'none': return '#ef4444';
      case 'insufficient': return '#94a3b8';
      default: return '#94a3b8';
    }
  };

  const getModelStatusColor = (available: boolean) => {
    return available ? '#22c55e' : '#ef4444';
  };

  return (
    <div className="consensus-display">
      <div className="consensus-header">
        <h3>Multi-Model Consensus</h3>
        <div className="model-status-row">
          {models.map((m) => (
            <span
              key={m.name}
              className="model-status-badge"
              style={{ borderColor: getModelStatusColor(m.available) }}
            >
              <span
                className="model-status-dot"
                style={{ backgroundColor: getModelStatusColor(m.available) }}
              />
              {m.name}
            </span>
          ))}
        </div>
      </div>

      <div className="consensus-input">
        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value)}
          className="consensus-type-select"
        >
          <option value="general">General</option>
          <option value="validation">Validation</option>
          <option value="code_review">Code Review</option>
          <option value="security_audit">Security Audit</option>
        </select>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter prompt for multi-model consensus..."
          className="consensus-textarea"
          rows={3}
        />
        <button
          onClick={runConsensus}
          disabled={loading || !prompt.trim()}
          className="consensus-run-btn"
        >
          {loading ? 'Running...' : 'Run Consensus'}
        </button>
      </div>

      {error && (
        <div className="consensus-error">{error}</div>
      )}

      {result && (
        <div className="consensus-result">
          <div className="consensus-summary">
            <div
              className="consensus-status"
              style={{ backgroundColor: getConsensusColor(result.consensus_reached) }}
            >
              {result.consensus_reached.replace('_', ' ').toUpperCase()}
            </div>
            <div className="consensus-stats">
              <span className="consensus-stat">
                <strong>{Math.round(result.consensus_confidence * 100)}%</strong> confidence
              </span>
              <span className="consensus-stat">
                <strong>{result.models_agree}/{result.total_models}</strong> models agree
              </span>
              <span className="consensus-stat">
                <strong>{result.execution_time_ms}ms</strong> total
              </span>
            </div>
          </div>

          <div className="model-responses">
            {Object.entries(result.results).map(([name, res]) => (
              <div key={name} className={`model-response ${res.success ? 'success' : 'failed'}`}>
                <div className="model-response-header">
                  <span className="model-name">{name}</span>
                  {res.success ? (
                    <>
                      <span className="model-confidence">
                        {res.confidence ? `${Math.round(res.confidence * 100)}%` : 'N/A'}
                      </span>
                      <span className="model-time">
                        {res.execution_ms}ms
                      </span>
                    </>
                  ) : (
                    <span className="model-error">Error</span>
                  )}
                </div>
                <div className="model-response-body">
                  {res.success && res.response_preview ? (
                    <pre>{res.response_preview}</pre>
                  ) : res.error ? (
                    <span className="error-text">{res.error}</span>
                  ) : (
                    <span className="no-response">Not available</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
