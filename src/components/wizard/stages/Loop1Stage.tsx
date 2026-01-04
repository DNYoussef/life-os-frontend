/**
 * Loop1Stage - Stage 5 of the Project Wizard
 * Risk analysis and feasibility check
 */

import { useState } from 'react';
import {
  RefreshCw,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  Shield,
  GitBranch,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Circle,
} from 'lucide-react';
import type { Loop1StageInput, StageOutput } from '../../../types/wizard';

interface Risk {
  id: string;
  name: string;
  description: string;
  category: 'technical' | 'business' | 'resource' | 'timeline' | 'external';
  severity: 'low' | 'medium' | 'high' | 'critical';
  likelihood: 'unlikely' | 'possible' | 'likely' | 'certain';
  mitigation: string;
  status: 'identified' | 'mitigating' | 'mitigated' | 'accepted';
}

interface DependencyNode {
  id: string;
  name: string;
  type: 'section' | 'entity' | 'external';
  dependsOn: string[];
}

interface Loop1StageProps {
  projectId: string;
  initialData?: Partial<Loop1StageInput>;
  lastOutput?: StageOutput;
  isProcessing: boolean;
  onSubmit: (data: Loop1StageInput) => Promise<StageOutput | undefined>;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const RISK_CATEGORIES = [
  { value: 'technical', label: 'Technical', color: 'text-blue-400' },
  { value: 'business', label: 'Business', color: 'text-green-400' },
  { value: 'resource', label: 'Resource', color: 'text-yellow-400' },
  { value: 'timeline', label: 'Timeline', color: 'text-orange-400' },
  { value: 'external', label: 'External', color: 'text-purple-400' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  { value: 'high', label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  { value: 'critical', label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
];

const LIKELIHOOD_LEVELS = [
  { value: 'unlikely', label: 'Unlikely', percent: '< 25%' },
  { value: 'possible', label: 'Possible', percent: '25-50%' },
  { value: 'likely', label: 'Likely', percent: '50-75%' },
  { value: 'certain', label: 'Certain', percent: '> 75%' },
];

// Risk Editor Component
function RiskEditor({
  risk,
  onChange,
  onRemove,
  disabled,
}: {
  risk: Risk;
  onChange: (risk: Risk) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const severityInfo = SEVERITY_LEVELS.find((s) => s.value === risk.severity);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/80"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <Shield className="text-red-400" size={18} />
          <span className="font-medium text-slate-200">
            {risk.name || 'Unnamed Risk'}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded border ${severityInfo?.color}`}
          >
            {severityInfo?.label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-400"
            >
              <X size={16} />
            </button>
          )}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-700">
          {/* Name & Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Risk Name
              </label>
              <input
                type="text"
                value={risk.name}
                onChange={(e) => onChange({ ...risk, name: e.target.value })}
                placeholder="e.g., API Rate Limiting"
                disabled={disabled}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Category
              </label>
              <select
                value={risk.category}
                onChange={(e) =>
                  onChange({ ...risk, category: e.target.value as Risk['category'] })
                }
                disabled={disabled}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              >
                {RISK_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Description
            </label>
            <textarea
              value={risk.description}
              onChange={(e) => onChange({ ...risk, description: e.target.value })}
              placeholder="Describe the risk and its potential impact..."
              disabled={disabled}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* Severity & Likelihood */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">
                Severity
              </label>
              <div className="flex gap-1">
                {SEVERITY_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      onChange({ ...risk, severity: level.value as Risk['severity'] })
                    }
                    disabled={disabled}
                    className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                      risk.severity === level.value
                        ? level.color
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    } disabled:opacity-50`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-2">
                Likelihood
              </label>
              <div className="flex gap-1">
                {LIKELIHOOD_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() =>
                      onChange({ ...risk, likelihood: level.value as Risk['likelihood'] })
                    }
                    disabled={disabled}
                    className={`flex-1 py-1.5 text-xs rounded border transition-colors ${
                      risk.likelihood === level.value
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                    } disabled:opacity-50`}
                    title={level.percent}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mitigation */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Mitigation Strategy
            </label>
            <textarea
              value={risk.mitigation}
              onChange={(e) => onChange({ ...risk, mitigation: e.target.value })}
              placeholder="How will this risk be mitigated or managed?"
              disabled={disabled}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {['identified', 'mitigating', 'mitigated', 'accepted'].map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onChange({ ...risk, status: status as Risk['status'] })}
                  disabled={disabled}
                  className={`px-3 py-1.5 text-xs rounded border capitalize transition-colors ${
                    risk.status === status
                      ? 'bg-slate-700 border-slate-600 text-slate-200'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  } disabled:opacity-50`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Dependency Graph Editor
function DependencyGraphEditor({
  nodes,
  onChange,
  disabled,
}: {
  nodes: DependencyNode[];
  onChange: (nodes: DependencyNode[]) => void;
  disabled?: boolean;
}) {
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState<DependencyNode['type']>('section');

  const addNode = () => {
    if (newNodeName.trim()) {
      onChange([
        ...nodes,
        {
          id: generateId(),
          name: newNodeName.trim(),
          type: newNodeType,
          dependsOn: [],
        },
      ]);
      setNewNodeName('');
    }
  };

  const removeNode = (nodeId: string) => {
    onChange(
      nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => ({
          ...n,
          dependsOn: n.dependsOn.filter((d) => d !== nodeId),
        }))
    );
  };

  const toggleDependency = (nodeId: string, dependsOnId: string) => {
    onChange(
      nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const deps = n.dependsOn.includes(dependsOnId)
          ? n.dependsOn.filter((d) => d !== dependsOnId)
          : [...n.dependsOn, dependsOnId];
        return { ...n, dependsOn: deps };
      })
    );
  };

  const getNodeColor = (type: DependencyNode['type']) => {
    switch (type) {
      case 'section':
        return 'text-cyan-400';
      case 'entity':
        return 'text-purple-400';
      case 'external':
        return 'text-orange-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <GitBranch size={16} className="text-emerald-400" />
          Dependency Graph
        </label>
      </div>

      {/* Visual Graph */}
      {nodes.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <div className="space-y-3">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-start gap-3">
                <div className="flex items-center gap-2 min-w-40">
                  <Circle size={10} className={getNodeColor(node.type)} fill="currentColor" />
                  <span className="text-sm text-slate-200">{node.name}</span>
                  <span className="text-xs text-slate-500">({node.type})</span>
                </div>
                {node.dependsOn.length > 0 && (
                  <>
                    <ArrowRight size={14} className="text-slate-600 mt-1" />
                    <div className="flex flex-wrap gap-1">
                      {node.dependsOn.map((depId) => {
                        const dep = nodes.find((n) => n.id === depId);
                        return dep ? (
                          <span
                            key={depId}
                            className={`text-xs px-2 py-0.5 rounded ${getNodeColor(dep.type)} bg-slate-800`}
                          >
                            {dep.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeNode(node.id)}
                    className="ml-auto p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Node */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newNodeName}
            onChange={(e) => setNewNodeName(e.target.value)}
            placeholder="Component name"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNode())}
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <select
            value={newNodeType}
            onChange={(e) => setNewNodeType(e.target.value as DependencyNode['type'])}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="section">Section</option>
            <option value="entity">Entity</option>
            <option value="external">External</option>
          </select>
          <button
            type="button"
            onClick={addNode}
            disabled={!newNodeName.trim()}
            className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Dependency Matrix */}
      {nodes.length > 1 && !disabled && (
        <div>
          <p className="text-xs text-slate-500 mb-2">
            Click cells to toggle dependencies (row depends on column):
          </p>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-slate-500">Depends on</th>
                  {nodes.map((n) => (
                    <th key={n.id} className="p-2 text-center text-slate-400">
                      {n.name.slice(0, 8)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {nodes.map((row) => (
                  <tr key={row.id}>
                    <td className="p-2 text-slate-400">{row.name}</td>
                    {nodes.map((col) => (
                      <td key={col.id} className="p-2 text-center">
                        {row.id === col.id ? (
                          <span className="text-slate-700">-</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleDependency(row.id, col.id)}
                            className={`w-6 h-6 rounded ${
                              row.dependsOn.includes(col.id)
                                ? 'bg-emerald-500/30 text-emerald-400'
                                : 'bg-slate-800 text-slate-600 hover:bg-slate-700'
                            }`}
                          >
                            {row.dependsOn.includes(col.id) ? '+' : ''}
                          </button>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Risk Score Calculator
function RiskScoreDisplay({ risks }: { risks: Risk[] }) {
  if (risks.length === 0) return null;

  const severityScore = { low: 1, medium: 2, high: 3, critical: 4 };
  const likelihoodScore = { unlikely: 1, possible: 2, likely: 3, certain: 4 };

  const totalScore = risks.reduce((acc, risk) => {
    return acc + severityScore[risk.severity] * likelihoodScore[risk.likelihood];
  }, 0);

  const maxScore = risks.length * 16; // 4 * 4 max per risk
  const percentage = Math.round((totalScore / maxScore) * 100);

  const getRiskLevel = (pct: number) => {
    if (pct < 25) return { label: 'Low', color: 'text-green-400 bg-green-500/20' };
    if (pct < 50) return { label: 'Moderate', color: 'text-yellow-400 bg-yellow-500/20' };
    if (pct < 75) return { label: 'High', color: 'text-orange-400 bg-orange-500/20' };
    return { label: 'Critical', color: 'text-red-400 bg-red-500/20' };
  };

  const level = getRiskLevel(percentage);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">Overall Risk Score</span>
        <span className={`text-sm px-2 py-0.5 rounded ${level.color}`}>
          {level.label}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              percentage < 25
                ? 'bg-green-500'
                : percentage < 50
                ? 'bg-yellow-500'
                : percentage < 75
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-mono text-slate-400">{percentage}%</span>
      </div>
      <p className="text-xs text-slate-500 mt-2">
        {risks.length} risk(s) identified |{' '}
        {risks.filter((r) => r.status === 'mitigated').length} mitigated
      </p>
    </div>
  );
}

export function Loop1Stage({
  initialData,
  lastOutput,
  isProcessing,
  onSubmit,
}: Loop1StageProps) {
  const [risks, setRisks] = useState<Risk[]>(
    (initialData?.risk_assessment as { risks?: Risk[] })?.risks || []
  );
  const [dependencyNodes, setDependencyNodes] = useState<DependencyNode[]>(
    (initialData?.dependency_graph as { nodes?: DependencyNode[] })?.nodes || []
  );
  const [feasibilityNotes, setFeasibilityNotes] = useState<string>(
    initialData?.feasibility_notes || ''
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addRisk = () => {
    setRisks([
      ...risks,
      {
        id: generateId(),
        name: '',
        description: '',
        category: 'technical',
        severity: 'medium',
        likelihood: 'possible',
        mitigation: '',
        status: 'identified',
      },
    ]);
  };

  const updateRisk = (index: number, risk: Risk) => {
    setRisks(risks.map((r, i) => (i === index ? risk : r)));
    setValidationErrors([]);
  };

  const removeRisk = (index: number) => {
    setRisks(risks.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errors: string[] = [];

    if (risks.length === 0) {
      errors.push('Identify at least one risk (even if low severity)');
    }
    risks.forEach((risk, i) => {
      if (!risk.name.trim()) {
        errors.push(`Risk ${i + 1} needs a name`);
      }
      if (!risk.mitigation.trim()) {
        errors.push(`Risk "${risk.name || i + 1}" needs a mitigation strategy`);
      }
    });
    if (!feasibilityNotes.trim()) {
      errors.push('Add feasibility notes summarizing the analysis');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: Loop1StageInput = {
      risk_assessment: { risks },
      dependency_graph: { nodes: dependencyNodes },
      feasibility_notes: feasibilityNotes,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stage Description */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <RefreshCw className="text-amber-400" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-slate-200 mb-1">
              Risk Analysis & Feasibility
            </h3>
            <p className="text-sm text-slate-400">
              Identify potential risks, map dependencies between components, and
              assess overall project feasibility. This is your first feedback loop
              to catch issues early.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-red-400 font-medium text-sm mb-1">
                Please fix the following:
              </p>
              <ul className="list-disc list-inside text-sm text-red-400/80 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Risk Score */}
      <RiskScoreDisplay risks={risks} />

      {/* Risks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Shield size={16} className="text-red-400" />
            Risk Assessment
          </h4>
          <button
            type="button"
            onClick={addRisk}
            disabled={isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={14} />
            Add Risk
          </button>
        </div>
        <div className="space-y-3">
          {risks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
              No risks identified. Click "Add Risk" to start risk assessment.
            </div>
          ) : (
            risks.map((risk, index) => (
              <RiskEditor
                key={risk.id}
                risk={risk}
                onChange={(r) => updateRisk(index, r)}
                onRemove={() => removeRisk(index)}
                disabled={isProcessing}
              />
            ))
          )}
        </div>
      </div>

      {/* Dependency Graph */}
      <DependencyGraphEditor
        nodes={dependencyNodes}
        onChange={setDependencyNodes}
        disabled={isProcessing}
      />

      {/* Feasibility Notes */}
      <div>
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2 mb-2">
          <FileText size={16} className="text-slate-400" />
          Feasibility Notes
        </label>
        <textarea
          value={feasibilityNotes}
          onChange={(e) => {
            setFeasibilityNotes(e.target.value);
            setValidationErrors([]);
          }}
          placeholder="Summarize the overall feasibility assessment. Consider: technical complexity, resource availability, timeline constraints, and any blockers or concerns..."
          disabled={isProcessing}
          rows={5}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-none disabled:opacity-50"
        />
      </div>

      {/* Previous Output Feedback */}
      {lastOutput && !lastOutput.passed && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <h4 className="text-yellow-400 font-medium text-sm mb-2">
            Feedback from Iteration {lastOutput.iteration}
          </h4>
          <p className="text-slate-400 text-sm">{lastOutput.feedback}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw size={18} />
              {lastOutput ? 'Refine Analysis' : 'Submit Analysis'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default Loop1Stage;
