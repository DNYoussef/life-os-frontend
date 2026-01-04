/**
 * SectionsStage - Stage 4 of the Project Wizard
 * Define user flows and UI requirements for each section
 */

import { useState } from 'react';
import {
  Layout,
  Plus,
  X,
  Loader2,
  GitBranch,
  ListChecks,
  Database,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import type { SectionStageInput, StageOutput } from '../../../types/wizard';

interface UserFlowStep {
  id: string;
  action: string;
  description: string;
  next?: string;
}

interface UserFlow {
  id: string;
  name: string;
  description: string;
  steps: UserFlowStep[];
}

interface SectionsStageProps {
  projectId: string;
  initialData?: Partial<SectionStageInput>;
  lastOutput?: StageOutput;
  isProcessing: boolean;
  availableSections?: Array<{ name: string; description: string }>;
  onSubmit: (data: SectionStageInput) => Promise<StageOutput | undefined>;
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// User Flow Editor
function UserFlowEditor({
  flow,
  onChange,
  onRemove,
  disabled,
}: {
  flow: UserFlow;
  onChange: (flow: UserFlow) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [newStepAction, setNewStepAction] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');

  const addStep = () => {
    if (newStepAction.trim()) {
      const newStep: UserFlowStep = {
        id: generateId(),
        action: newStepAction.trim(),
        description: newStepDesc.trim(),
      };
      onChange({
        ...flow,
        steps: [...flow.steps, newStep],
      });
      setNewStepAction('');
      setNewStepDesc('');
    }
  };

  const updateStep = (stepId: string, updates: Partial<UserFlowStep>) => {
    onChange({
      ...flow,
      steps: flow.steps.map((s) =>
        s.id === stepId ? { ...s, ...updates } : s
      ),
    });
  };

  const removeStep = (stepId: string) => {
    onChange({
      ...flow,
      steps: flow.steps.filter((s) => s.id !== stepId),
    });
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-800/80"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <GitBranch className="text-emerald-400" size={18} />
          <span className="font-medium text-slate-200">
            {flow.name || 'Unnamed Flow'}
          </span>
          <span className="text-xs text-slate-500">
            ({flow.steps.length} steps)
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
          {/* Flow Name & Description */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Flow Name
              </label>
              <input
                type="text"
                value={flow.name}
                onChange={(e) => onChange({ ...flow, name: e.target.value })}
                placeholder="e.g., User Registration"
                disabled={disabled}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Description
              </label>
              <input
                type="text"
                value={flow.description}
                onChange={(e) =>
                  onChange({ ...flow, description: e.target.value })
                }
                placeholder="What this flow accomplishes"
                disabled={disabled}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Steps */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2">
              Flow Steps
            </label>
            {flow.steps.length > 0 && (
              <div className="space-y-2 mb-3">
                {flow.steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-start gap-2 bg-slate-900 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2 text-slate-500">
                      <GripVertical size={14} className="cursor-grab" />
                      <span className="text-xs font-mono w-5">{index + 1}</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={step.action}
                        onChange={(e) =>
                          updateStep(step.id, { action: e.target.value })
                        }
                        placeholder="Action (e.g., Click 'Sign Up')"
                        disabled={disabled}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                      />
                      <input
                        type="text"
                        value={step.description}
                        onChange={(e) =>
                          updateStep(step.id, { description: e.target.value })
                        }
                        placeholder="Expected result or note"
                        disabled={disabled}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-400 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                      />
                    </div>
                    {index < flow.steps.length - 1 && (
                      <ArrowRight
                        size={14}
                        className="text-slate-600 mt-2 flex-shrink-0"
                      />
                    )}
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => removeStep(step.id)}
                        className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!disabled && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStepAction}
                  onChange={(e) => setNewStepAction(e.target.value)}
                  placeholder="Step action"
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addStep())
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={newStepDesc}
                  onChange={(e) => setNewStepDesc(e.target.value)}
                  placeholder="Description (optional)"
                  onKeyDown={(e) =>
                    e.key === 'Enter' && (e.preventDefault(), addStep())
                  }
                  className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={addStep}
                  disabled={!newStepAction.trim()}
                  className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
                >
                  <Plus size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// UI Requirements Editor
function UIRequirementsEditor({
  requirements,
  onChange,
  disabled,
}: {
  requirements: string[];
  onChange: (requirements: string[]) => void;
  disabled?: boolean;
}) {
  const [newReq, setNewReq] = useState('');

  const addRequirement = () => {
    if (newReq.trim() && !requirements.includes(newReq.trim())) {
      onChange([...requirements, newReq.trim()]);
      setNewReq('');
    }
  };

  const removeRequirement = (index: number) => {
    onChange(requirements.filter((_, i) => i !== index));
  };

  const suggestedRequirements = [
    'Responsive design (mobile-first)',
    'Keyboard navigation support',
    'Loading states for async operations',
    'Error message display',
    'Form validation feedback',
    'Empty state handling',
    'Pagination or infinite scroll',
    'Search/filter functionality',
    'Breadcrumb navigation',
    'Toast notifications',
  ];

  const availableSuggestions = suggestedRequirements.filter(
    (s) => !requirements.includes(s)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <ListChecks size={16} className="text-amber-400" />
          UI Requirements
        </label>
      </div>

      {requirements.length > 0 && (
        <div className="space-y-2">
          {requirements.map((req, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2"
            >
              <span className="flex-1 text-sm text-slate-200">{req}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeRequirement(index)}
                  className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!disabled && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              placeholder="Add a UI requirement..."
              onKeyDown={(e) =>
                e.key === 'Enter' && (e.preventDefault(), addRequirement())
              }
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={addRequirement}
              disabled={!newReq.trim()}
              className="px-3 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
            >
              <Plus size={16} />
            </button>
          </div>

          {availableSuggestions.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Quick add:</p>
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.slice(0, 5).map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => onChange([...requirements, suggestion])}
                    className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Sample Data Editor
function SampleDataEditor({
  data,
  onChange,
  disabled,
}: {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState(JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const addField = () => {
    if (newKey.trim()) {
      // Try to parse value as JSON, otherwise use as string
      let parsedValue: unknown = newValue;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }
      onChange({ ...data, [newKey.trim()]: parsedValue });
      setNewKey('');
      setNewValue('');
    }
  };

  const removeField = (key: string) => {
    const { [key]: _, ...rest } = data;
    onChange(rest);
  };

  const applyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      onChange(parsed);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  };

  const formatValue = (value: unknown): string => {
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Database size={16} className="text-violet-400" />
          Sample Data
        </label>
        {!disabled && (
          <button
            type="button"
            onClick={() => {
              setJsonMode(!jsonMode);
              if (!jsonMode) {
                setJsonText(JSON.stringify(data, null, 2));
              }
            }}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          >
            {jsonMode ? 'Key-Value Mode' : 'JSON Mode'}
          </button>
        )}
      </div>

      {jsonMode ? (
        <div className="space-y-2">
          <textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            disabled={disabled}
            rows={8}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          />
          {jsonError && (
            <p className="text-xs text-red-400">{jsonError}</p>
          )}
          {!disabled && (
            <button
              type="button"
              onClick={applyJson}
              className="text-xs px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              Apply JSON
            </button>
          )}
        </div>
      ) : (
        <>
          {Object.keys(data).length > 0 && (
            <div className="space-y-2">
              {Object.entries(data).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2"
                >
                  <span className="text-sm text-slate-400 font-mono">{key}:</span>
                  <span className="flex-1 text-sm text-slate-200 font-mono truncate">
                    {formatValue(value)}
                  </span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeField(key)}
                      className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {!disabled && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="Key"
                className="w-32 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Value (string or JSON)"
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addField())
                }
                className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={addField}
                disabled={!newKey.trim()}
                className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function SectionsStage({
  initialData,
  lastOutput,
  isProcessing,
  availableSections = [],
  onSubmit,
}: SectionsStageProps) {
  const [sectionId, setSectionId] = useState<string>(
    initialData?.section_id || ''
  );
  const [userFlows, setUserFlows] = useState<UserFlow[]>(
    (initialData?.user_flows as UserFlow[]) || []
  );
  const [uiRequirements, setUiRequirements] = useState<string[]>(
    initialData?.ui_requirements || []
  );
  const [sampleData, setSampleData] = useState<Record<string, unknown>>(
    initialData?.sample_data || {}
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const addUserFlow = () => {
    setUserFlows([
      ...userFlows,
      {
        id: generateId(),
        name: '',
        description: '',
        steps: [],
      },
    ]);
  };

  const updateUserFlow = (index: number, flow: UserFlow) => {
    setUserFlows(userFlows.map((f, i) => (i === index ? flow : f)));
    setValidationErrors([]);
  };

  const removeUserFlow = (index: number) => {
    setUserFlows(userFlows.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!sectionId) {
      errors.push('Select a section to define');
    }
    if (userFlows.length === 0) {
      errors.push('Add at least one user flow');
    }
    userFlows.forEach((flow, i) => {
      if (!flow.name.trim()) {
        errors.push(`User flow ${i + 1} needs a name`);
      }
      if (flow.steps.length === 0) {
        errors.push(`User flow "${flow.name || i + 1}" needs at least one step`);
      }
    });
    if (uiRequirements.length === 0) {
      errors.push('Add at least one UI requirement');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: SectionStageInput = {
      section_id: sectionId,
      user_flows: userFlows.map((flow) => ({
        id: flow.id,
        name: flow.name,
        description: flow.description,
        steps: flow.steps,
      })),
      ui_requirements: uiRequirements,
      sample_data: sampleData,
    };

    await onSubmit(data);
  };

  // Demo sections if none provided
  const sections =
    availableSections.length > 0
      ? availableSections
      : [
          { name: 'authentication', description: 'User login and registration' },
          { name: 'dashboard', description: 'Main dashboard view' },
          { name: 'settings', description: 'User settings and preferences' },
          { name: 'profile', description: 'User profile management' },
        ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stage Description */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
            <Layout className="text-indigo-400" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-slate-200 mb-1">
              Define Section Details
            </h3>
            <p className="text-sm text-slate-400">
              For each section in your roadmap, define the user flows (step-by-step
              interactions), UI requirements, and sample data to test with.
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

      {/* Section Selector */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Section to Define
        </label>
        <div className="grid grid-cols-2 gap-2">
          {sections.map((section) => (
            <button
              key={section.name}
              type="button"
              onClick={() => {
                setSectionId(section.name);
                setValidationErrors([]);
              }}
              disabled={isProcessing}
              className={`text-left p-3 rounded-lg border transition-colors ${
                sectionId === section.name
                  ? 'bg-indigo-500/20 border-indigo-500/50'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              } disabled:opacity-50`}
            >
              <p
                className={`text-sm font-medium ${
                  sectionId === section.name ? 'text-indigo-400' : 'text-slate-200'
                }`}
              >
                {section.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* User Flows */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <GitBranch size={16} className="text-emerald-400" />
            User Flows
          </h4>
          <button
            type="button"
            onClick={addUserFlow}
            disabled={isProcessing}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={14} />
            Add Flow
          </button>
        </div>
        <div className="space-y-3">
          {userFlows.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
              No user flows yet. Add flows to describe how users interact with this
              section.
            </div>
          ) : (
            userFlows.map((flow, index) => (
              <UserFlowEditor
                key={flow.id}
                flow={flow}
                onChange={(f) => updateUserFlow(index, f)}
                onRemove={() => removeUserFlow(index)}
                disabled={isProcessing}
              />
            ))
          )}
        </div>
      </div>

      {/* UI Requirements */}
      <UIRequirementsEditor
        requirements={uiRequirements}
        onChange={(reqs) => {
          setUiRequirements(reqs);
          setValidationErrors([]);
        }}
        disabled={isProcessing}
      />

      {/* Sample Data */}
      <SampleDataEditor
        data={sampleData}
        onChange={setSampleData}
        disabled={isProcessing}
      />

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
              <Layout size={18} />
              {lastOutput ? 'Refine Section' : 'Submit Section'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default SectionsStage;
