/**
 * CapabilityMatchStage - Stage 6 of the Project Wizard
 * Match tasks to Context Cascade capabilities (skills, agents, commands)
 * Designed for extensibility - capabilities loaded from registry API
 */

import { useState, useEffect } from 'react';
import {
  Puzzle,
  Loader2,
  AlertTriangle,
  Check,
  X,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Zap,
  Bot,
  Terminal,
  HelpCircle,
  ExternalLink,
  Filter,
  Sparkles,
} from 'lucide-react';
import type { StageOutput, CapabilityMatch, TaskCapabilityMapping } from '../../../types/wizard';
import { getCapabilityMatch, runCapabilityMatch } from '../../../services/wizardApi';

// Capability types from Context Cascade registry
export type CapabilityType = 'skill' | 'agent' | 'command' | 'playbook' | 'workflow';

export interface Capability {
  id: string;
  name: string;
  type: CapabilityType;
  description: string;
  category?: string;
  tags?: string[];
  confidence?: number;
  historicalSuccessRate?: number;
}

export interface TaskMatch {
  taskId: string;
  taskTitle: string;
  taskDescription?: string;
  matches: CapabilityMatch[];
  selectedCapability?: Capability;
  hasGap: boolean;
  manualOverride: boolean;
}

interface CapabilityMatchStageProps {
  projectId: string;
  lastOutput?: StageOutput;
  isProcessing: boolean;
  onSubmit: (data: Record<string, unknown>) => Promise<StageOutput | undefined>;
}

const CAPABILITY_ICONS: Record<CapabilityType, React.ComponentType<{ size?: number; className?: string }>> = {
  skill: Zap,
  agent: Bot,
  command: Terminal,
  playbook: Sparkles,
  workflow: RefreshCw,
};

const CAPABILITY_COLORS: Record<CapabilityType, string> = {
  skill: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  agent: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
  command: 'text-green-400 bg-green-500/20 border-green-500/30',
  playbook: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  workflow: 'text-pink-400 bg-pink-500/20 border-pink-500/30',
};

// Confidence indicator
function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color =
    percentage >= 80
      ? 'text-green-400 bg-green-500/20'
      : percentage >= 60
      ? 'text-yellow-400 bg-yellow-500/20'
      : 'text-red-400 bg-red-500/20';

  return (
    <span className={`text-xs px-2 py-0.5 rounded ${color}`}>
      {percentage}%
    </span>
  );
}

// Single capability card
function CapabilityCard({
  capability,
  isSelected,
  onSelect,
  disabled,
}: {
  capability: Capability;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}) {
  const Icon = CAPABILITY_ICONS[capability.type] || HelpCircle;
  const colorClass = CAPABILITY_COLORS[capability.type] || 'text-slate-400 bg-slate-500/20 border-slate-500/30';

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full text-left p-3 rounded-lg border transition-all ${
        isSelected
          ? 'bg-cyan-500/20 border-cyan-500/50 ring-1 ring-cyan-500/30'
          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg border ${colorClass}`}>
          <Icon size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200 truncate">
              {capability.name}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${colorClass}`}>
              {capability.type}
            </span>
            {capability.confidence !== undefined && (
              <ConfidenceBadge score={capability.confidence} />
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
            {capability.description}
          </p>
          {capability.tags && capability.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {capability.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        {isSelected && (
          <Check size={18} className="text-cyan-400 flex-shrink-0" />
        )}
      </div>
    </button>
  );
}

// Task matching card with capability selection
function TaskMatchCard({
  taskMatch,
  allCapabilities,
  onSelectCapability,
  onClearSelection,
  disabled,
}: {
  taskMatch: TaskMatch;
  allCapabilities: Capability[];
  onSelectCapability: (capability: Capability) => void;
  onClearSelection: () => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(!taskMatch.selectedCapability);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<CapabilityType | 'all'>('all');

  // Combine API matches with search results
  const getFilteredCapabilities = () => {
    let caps = taskMatch.matches.length > 0
      ? taskMatch.matches.map((m) => ({
          id: m.capability_name,
          name: m.capability_name,
          type: m.capability_type as CapabilityType,
          description: m.description || '',
          confidence: m.confidence,
          historicalSuccessRate: m.historical_success_rate,
        }))
      : allCapabilities;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      caps = caps.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      caps = caps.filter((c) => c.type === filterType);
    }

    return caps;
  };

  const filteredCapabilities = getFilteredCapabilities();
  const bestMatch = taskMatch.matches[0];

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/80"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {taskMatch.hasGap ? (
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
              <AlertTriangle size={18} />
            </div>
          ) : taskMatch.selectedCapability ? (
            <div className="p-2 rounded-lg bg-green-500/20 text-green-400">
              <Check size={18} />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400">
              <Puzzle size={18} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-200 truncate">
              {taskMatch.taskTitle}
            </h4>
            {taskMatch.taskDescription && (
              <p className="text-xs text-slate-500 truncate">
                {taskMatch.taskDescription}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {taskMatch.selectedCapability && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-cyan-400">
                {taskMatch.selectedCapability.name}
              </span>
              {taskMatch.manualOverride && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                  Manual
                </span>
              )}
            </div>
          )}
          {taskMatch.hasGap && !taskMatch.selectedCapability && (
            <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400">
              Gap - No Match
            </span>
          )}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="p-4 pt-0 space-y-4 border-t border-slate-700">
          {/* Best Match Suggestion */}
          {bestMatch && !taskMatch.selectedCapability && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-cyan-400" />
                  <span className="text-sm text-cyan-400">Recommended Match</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onSelectCapability({
                      id: bestMatch.capability_name,
                      name: bestMatch.capability_name,
                      type: bestMatch.capability_type as CapabilityType,
                      description: bestMatch.description || '',
                      confidence: bestMatch.confidence,
                    })
                  }
                  disabled={disabled}
                  className="text-xs px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
                >
                  Accept
                </button>
              </div>
              <p className="text-sm text-slate-300 mt-1">
                {bestMatch.capability_name}{' '}
                <span className="text-slate-500">({bestMatch.capability_type})</span>
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>Confidence: {Math.round(bestMatch.confidence * 100)}%</span>
                {bestMatch.historical_success_rate && (
                  <span>
                    Historical: {Math.round(bestMatch.historical_success_rate * 100)}%
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Search and Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search capabilities..."
                disabled={disabled}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as CapabilityType | 'all')}
              disabled={disabled}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            >
              <option value="all">All Types</option>
              <option value="skill">Skills</option>
              <option value="agent">Agents</option>
              <option value="command">Commands</option>
              <option value="playbook">Playbooks</option>
              <option value="workflow">Workflows</option>
            </select>
          </div>

          {/* Capability List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredCapabilities.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-sm">
                No matching capabilities found.
                {taskMatch.hasGap && (
                  <p className="mt-1 text-xs">
                    This may require a new capability to be developed.
                  </p>
                )}
              </div>
            ) : (
              filteredCapabilities.map((cap) => (
                <CapabilityCard
                  key={cap.id}
                  capability={cap}
                  isSelected={taskMatch.selectedCapability?.id === cap.id}
                  onSelect={() => onSelectCapability(cap)}
                  disabled={disabled}
                />
              ))
            )}
          </div>

          {/* Clear Selection */}
          {taskMatch.selectedCapability && !disabled && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Summary stats
function MatchingSummary({ taskMatches }: { taskMatches: TaskMatch[] }) {
  const total = taskMatches.length;
  const matched = taskMatches.filter((t) => t.selectedCapability).length;
  const gaps = taskMatches.filter((t) => t.hasGap && !t.selectedCapability).length;
  const pending = total - matched - gaps;

  return (
    <div className="grid grid-cols-4 gap-3">
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-slate-200">{total}</p>
        <p className="text-xs text-slate-500">Total Tasks</p>
      </div>
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-green-400">{matched}</p>
        <p className="text-xs text-green-400/70">Matched</p>
      </div>
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-yellow-400">{pending}</p>
        <p className="text-xs text-yellow-400/70">Pending</p>
      </div>
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
        <p className="text-2xl font-bold text-red-400">{gaps}</p>
        <p className="text-xs text-red-400/70">Gaps</p>
      </div>
    </div>
  );
}

export function CapabilityMatchStage({
  projectId,
  lastOutput,
  isProcessing,
  onSubmit,
}: CapabilityMatchStageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskMatches, setTaskMatches] = useState<TaskMatch[]>([]);
  const [allCapabilities, setAllCapabilities] = useState<Capability[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load capability matching data
  const loadMatchingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await getCapabilityMatch(projectId);

      // Transform API response to TaskMatch format
      const matches: TaskMatch[] = response.mappings.map((mapping: TaskCapabilityMapping) => ({
        taskId: mapping.task_title.toLowerCase().replace(/\s+/g, '-'),
        taskTitle: mapping.task_title,
        taskDescription: mapping.task_description,
        matches: mapping.matches,
        selectedCapability: mapping.best_match
          ? {
              id: mapping.best_match.capability_name,
              name: mapping.best_match.capability_name,
              type: mapping.best_match.capability_type as CapabilityType,
              description: mapping.best_match.description || '',
              confidence: mapping.best_match.confidence,
            }
          : undefined,
        hasGap: mapping.has_gap,
        manualOverride: false,
      }));

      setTaskMatches(matches);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matching data');
      // Demo data for fallback
      setTaskMatches([
        {
          taskId: 'implement-auth',
          taskTitle: 'Implement user authentication',
          taskDescription: 'Build login, registration, and session management',
          matches: [
            {
              capability_type: 'agent',
              capability_name: 'auth-specialist',
              confidence: 0.92,
              description: 'Handles authentication implementations',
            },
            {
              capability_type: 'skill',
              capability_name: 'security-review',
              confidence: 0.78,
              description: 'Security analysis and review',
            },
          ],
          hasGap: false,
          manualOverride: false,
        },
        {
          taskId: 'build-dashboard',
          taskTitle: 'Build main dashboard',
          taskDescription: 'Create dashboard with widgets and charts',
          matches: [
            {
              capability_type: 'skill',
              capability_name: 'delivery-sparc-frontend-specialist',
              confidence: 0.88,
              description: 'Frontend development specialist',
            },
          ],
          hasGap: false,
          manualOverride: false,
        },
        {
          taskId: 'custom-integration',
          taskTitle: 'Custom third-party integration',
          taskDescription: 'Integrate with proprietary vendor API',
          matches: [],
          hasGap: true,
          manualOverride: false,
        },
      ]);

      // Demo capabilities
      setAllCapabilities([
        { id: 'code', name: 'code', type: 'skill', description: 'General code implementation' },
        { id: 'debug', name: 'debug', type: 'skill', description: 'Debugging and troubleshooting' },
        { id: 'e2e-test', name: 'e2e-test', type: 'skill', description: 'End-to-end testing' },
        { id: 'coder', name: 'coder', type: 'agent', description: 'Code writing agent' },
        { id: 'tester', name: 'tester', type: 'agent', description: 'Testing agent' },
        { id: 'deployer', name: 'deployer', type: 'agent', description: 'Deployment agent' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Run auto-matching
  const runAutoMatch = async () => {
    try {
      setLoading(true);
      await runCapabilityMatch(projectId);
      await loadMatchingData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Auto-matching failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatchingData();
  }, [projectId]);

  const selectCapability = (taskId: string, capability: Capability) => {
    setTaskMatches(
      taskMatches.map((t) =>
        t.taskId === taskId
          ? { ...t, selectedCapability: capability, manualOverride: true }
          : t
      )
    );
    setValidationErrors([]);
  };

  const clearSelection = (taskId: string) => {
    setTaskMatches(
      taskMatches.map((t) =>
        t.taskId === taskId
          ? { ...t, selectedCapability: undefined, manualOverride: false }
          : t
      )
    );
  };

  const validate = (): boolean => {
    const errors: string[] = [];

    const unmatched = taskMatches.filter((t) => !t.selectedCapability);
    if (unmatched.length > 0) {
      errors.push(
        `${unmatched.length} task(s) still need capability assignments`
      );
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const mappings = taskMatches.reduce((acc, task) => {
      if (task.selectedCapability) {
        acc[task.taskId] = {
          capability_type: task.selectedCapability.type,
          capability_name: task.selectedCapability.name,
          confidence: task.selectedCapability.confidence || 1.0,
          manual_override: task.manualOverride,
        };
      }
      return acc;
    }, {} as Record<string, unknown>);

    await onSubmit({
      task_capability_mappings: mappings,
      gaps_identified: taskMatches
        .filter((t) => t.hasGap && !t.selectedCapability)
        .map((t) => t.taskTitle),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-cyan-500" size={32} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stage Description */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <Puzzle className="text-purple-400" size={20} />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-slate-200 mb-1">
              Match Tasks to Capabilities
            </h3>
            <p className="text-sm text-slate-400">
              Map each project task to the best matching capability from the
              Context Cascade registry. Skills, agents, commands, and playbooks
              are automatically suggested based on task requirements.
            </p>
          </div>
          <button
            type="button"
            onClick={runAutoMatch}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Re-run Matching
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="text-yellow-500 flex-shrink-0" size={18} />
          <span className="text-yellow-400 text-sm">{error} (showing demo data)</span>
        </div>
      )}

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

      {/* Summary */}
      <MatchingSummary taskMatches={taskMatches} />

      {/* Task Matches */}
      <div className="space-y-3">
        {taskMatches.map((taskMatch) => (
          <TaskMatchCard
            key={taskMatch.taskId}
            taskMatch={taskMatch}
            allCapabilities={allCapabilities}
            onSelectCapability={(cap) => selectCapability(taskMatch.taskId, cap)}
            onClearSelection={() => clearSelection(taskMatch.taskId)}
            disabled={isProcessing}
          />
        ))}
      </div>

      {/* Registry Link */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Bot size={16} />
            <span>
              Capabilities loaded from Context Cascade Registry
            </span>
          </div>
          <a
            href="/agents"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300"
          >
            View Registry
            <ExternalLink size={12} />
          </a>
        </div>
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
              <Puzzle size={18} />
              Confirm Mappings
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default CapabilityMatchStage;
