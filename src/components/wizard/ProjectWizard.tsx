/**
 * ProjectWizard - Main wizard shell component
 * 7-stage stepper with navigation and stage content rendering
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Lightbulb,
  Map,
  Palette,
  Layout,
  RefreshCw,
  Puzzle,
  Play,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  X,
  Users,
  Server,
  ChevronDown,
  ChevronUp,
  Brain,
  Database,
  Shield,
  Cpu,
  Search,
  FileCode,
  Settings,
  Wrench,
  Zap,
  Circle,
} from 'lucide-react';
import type { WizardProject, WizardStage, StageOutput, VisionStageInput, RoadmapStageInput, DesignStageInput, SectionStageInput, Loop1StageInput } from '../../types/wizard';
import { WIZARD_STAGES } from '../../types/wizard';
import { VisionStage } from './stages/VisionStage';
import { RoadmapStage } from './stages/RoadmapStage';
import { DesignStage } from './stages/DesignStage';
import { SectionsStage } from './stages/SectionsStage';
import { Loop1Stage } from './stages/Loop1Stage';
import { CapabilityMatchStage } from './stages/CapabilityMatchStage';
import { ExecuteStage } from './stages/ExecuteStage';
import {
  getWizardProject,
  processStage,
  canAccessStage,
  getNextStage,
  getPreviousStage,
  getStageIndex,
} from '../../services/wizardApi';

// Icon mapping
const STAGE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Lightbulb,
  Map,
  Palette,
  Layout,
  RefreshCw,
  Puzzle,
  Play,
};

// Agent categories from Context Cascade registry
const AGENT_CATEGORIES = [
  { id: 'delivery', name: 'Delivery', count: 18, icon: Zap, description: 'Feature and product implementation' },
  { id: 'foundry', name: 'Foundry', count: 19, icon: Wrench, description: 'Agent creation and templates' },
  { id: 'operations', name: 'Operations', count: 28, icon: Settings, description: 'DevOps and infrastructure' },
  { id: 'orchestration', name: 'Orchestration', count: 21, icon: Cpu, description: 'Multi-agent workflows' },
  { id: 'platforms', name: 'Platforms', count: 44, icon: Database, description: 'Data, ML, neural services' },
  { id: 'quality', name: 'Quality', count: 18, icon: Shield, description: 'Analysis and testing' },
  { id: 'research', name: 'Research', count: 11, icon: Search, description: 'Research and discovery' },
  { id: 'security', name: 'Security', count: 5, icon: Shield, description: 'Security specialists' },
  { id: 'specialists', name: 'Specialists', count: 18, icon: Brain, description: 'Domain experts' },
  { id: 'tooling', name: 'Tooling', count: 24, icon: FileCode, description: 'Documentation and GitHub' },
];

// MCP Servers from Context Cascade ecosystem
const MCP_SERVERS = [
  // Universal MCPs (Always Active)
  { id: 'memory-mcp', name: 'Memory MCP', status: 'active', description: 'Triple-layer persistent memory' },
  { id: 'sequential-thinking', name: 'Seq. Thinking', status: 'active', description: 'Complex reasoning chains' },
  // Google Workspace MCPs
  { id: 'google-calendar', name: 'Google Calendar', status: 'active', description: 'Event management' },
  { id: 'gmail', name: 'Gmail', status: 'active', description: 'Email operations' },
  { id: 'google-drive', name: 'Google Drive', status: 'idle', description: 'File operations' },
  // Code Quality MCPs
  { id: 'connascence-analyzer', name: 'Connascence', status: 'active', description: 'Code coupling analysis' },
  { id: 'focused-changes', name: 'Focused Changes', status: 'idle', description: 'Change tracking' },
  { id: 'toc', name: 'ToC Generator', status: 'idle', description: 'Table of contents' },
  // Browser & Automation
  { id: 'playwright', name: 'Playwright', status: 'idle', description: 'E2E & visual testing' },
  { id: 'claude-in-chrome', name: 'Claude in Chrome', status: 'active', description: 'Browser automation' },
  // Swarm & ML
  { id: 'ruv-swarm', name: 'RUV Swarm', status: 'idle', description: 'Multi-agent DAA' },
  { id: 'flow-nexus', name: 'Flow Nexus', status: 'idle', description: 'Neural network pipelines' },
  // Scientific
  { id: 'wolfram-alpha', name: 'Wolfram Alpha', status: 'idle', description: 'Math & physics' },
];

interface ProjectWizardProps {
  projectId: string;
  onClose?: () => void;
  onComplete?: (project: WizardProject) => void;
}

interface StageState {
  isProcessing: boolean;
  lastOutput?: StageOutput;
  error?: string;
}

export function ProjectWizard({ projectId, onClose, onComplete }: ProjectWizardProps) {
  const [project, setProject] = useState<WizardProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStage, setActiveStage] = useState<WizardStage>('vision');
  const [showAgents, setShowAgents] = useState(false);
  const [showMcp, setShowMcp] = useState(false);
  const [stageStates, setStageStates] = useState<Record<WizardStage, StageState>>({
    vision: { isProcessing: false },
    roadmap: { isProcessing: false },
    design: { isProcessing: false },
    sections: { isProcessing: false },
    loop1: { isProcessing: false },
    match: { isProcessing: false },
    execute: { isProcessing: false },
  });

  // Load project data
  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWizardProject(projectId);
      setProject(data);
      setActiveStage(data.current_stage);
    } catch (err) {
      // Demo data fallback for development/testing
      const demoProject: WizardProject = {
        id: projectId,
        name: 'Demo SaaS Project',
        description: 'A demonstration project showing the wizard workflow',
        current_stage: 'vision',
        stage_outputs: {},
        capability_mapping: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProject(demoProject);
      setActiveStage('vision');
      // Don't set error - show demo data instead
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Process stage with Ralph Wiggum gate
  const handleProcessStage = async (stage: WizardStage, content: Record<string, unknown>) => {
    if (!project) return;

    setStageStates(prev => ({
      ...prev,
      [stage]: { ...prev[stage], isProcessing: true, error: undefined },
    }));

    try {
      const iteration = stageStates[stage].lastOutput?.iteration || 1;
      const output = await processStage(projectId, stage, {
        content,
        iteration: iteration + 1,
      });

      setStageStates(prev => ({
        ...prev,
        [stage]: { isProcessing: false, lastOutput: output },
      }));

      // If passed, move to next stage
      if (output.passed) {
        const nextStage = getNextStage(stage);
        if (nextStage) {
          setActiveStage(nextStage);
          // Reload project to get updated state
          await loadProject();
        } else if (stage === 'execute') {
          // Wizard complete
          onComplete?.(project);
        }
      }

      return output;
    } catch (err) {
      setStageStates(prev => ({
        ...prev,
        [stage]: {
          ...prev[stage],
          isProcessing: false,
          error: err instanceof Error ? err.message : 'Processing failed',
        },
      }));
    }
  };

  // Navigation handlers
  const handleNext = () => {
    const nextStage = getNextStage(activeStage);
    if (nextStage && project && canAccessStage(project.current_stage, nextStage)) {
      setActiveStage(nextStage);
    }
  };

  const handleBack = () => {
    const prevStage = getPreviousStage(activeStage);
    if (prevStage) {
      setActiveStage(prevStage);
    }
  };

  const handleStageClick = (stage: WizardStage) => {
    if (project && canAccessStage(project.current_stage, stage)) {
      setActiveStage(stage);
    }
  };

  // Get stage status for stepper
  const getStageStatus = (stage: WizardStage): 'completed' | 'current' | 'upcoming' | 'error' => {
    if (!project) return 'upcoming';

    if (stageStates[stage].error) return 'error';

    const currentIndex = getStageIndex(project.current_stage);
    const stageIndex = getStageIndex(stage);

    if (stageIndex < currentIndex) return 'completed';
    if (stageIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-cyan-500" size={48} />
      </div>
    );
  }

  // Render error state
  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-red-400">{error || 'Project not found'}</p>
        <button
          onClick={loadProject}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentStageInfo = WIZARD_STAGES.find(s => s.id === activeStage);
  const currentStageState = stageStates[activeStage];
  const canGoNext = getNextStage(activeStage) && canAccessStage(project.current_stage, getNextStage(activeStage)!);
  const canGoBack = getPreviousStage(activeStage) !== null;

  // Calculate progress percentage
  const completedStages = WIZARD_STAGES.filter(s => getStageStatus(s.id) === 'completed').length;
  const progressPercent = Math.round((completedStages / WIZARD_STAGES.length) * 100);

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950 overflow-hidden">
      {/* LEFT SIDEBAR - Vertical Stepper */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800 flex flex-col bg-slate-900 h-full overflow-hidden">
        {/* Project Info - Fixed at top */}
        <div className="p-5 border-b border-slate-800 flex-shrink-0">
          <h1 className="text-lg font-bold text-slate-200 truncate">{project.name}</h1>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description || 'Project Wizard'}</p>
        </div>

        {/* Scrollable Section - Nav + Agents + MCP */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* Vertical Stepper */}
          <nav className="p-4">
            <div className="space-y-1">
            {WIZARD_STAGES.map((stage, index) => {
              const status = getStageStatus(stage.id);
              const Icon = STAGE_ICONS[stage.icon];
              const isActive = stage.id === activeStage;
              const isClickable = canAccessStage(project.current_stage, stage.id);

              return (
                <div key={stage.id} className="relative">
                  {/* Connector Line (vertical) */}
                  {index < WIZARD_STAGES.length - 1 && (
                    <div
                      className={`
                        absolute left-5 top-12 w-0.5 h-6
                        ${status === 'completed' ? 'bg-green-500/50' : 'bg-slate-700'}
                      `}
                    />
                  )}

                  {/* Stage Button */}
                  <button
                    onClick={() => handleStageClick(stage.id)}
                    disabled={!isClickable}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left
                      ${isActive ? 'bg-cyan-500/20 ring-1 ring-cyan-500/50' : ''}
                      ${isClickable && !isActive ? 'hover:bg-slate-800/50' : ''}
                      ${!isClickable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    {/* Status Icon */}
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors
                        ${status === 'completed' ? 'bg-green-500/20 text-green-400' : ''}
                        ${status === 'current' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                        ${status === 'upcoming' ? 'bg-slate-800 text-slate-500' : ''}
                        ${status === 'error' ? 'bg-red-500/20 text-red-400' : ''}
                      `}
                    >
                      {status === 'completed' ? (
                        <Check size={18} />
                      ) : status === 'error' ? (
                        <AlertCircle size={18} />
                      ) : (
                        <Icon size={18} />
                      )}
                    </div>

                    {/* Stage Info */}
                    <div className="min-w-0 flex-1 flex flex-col">
                      <span
                        className={`
                          text-sm font-medium truncate leading-tight
                          ${isActive ? 'text-cyan-400' : status === 'completed' ? 'text-green-400' : 'text-slate-300'}
                        `}
                      >
                        {stage.name}
                      </span>
                      <span className="text-xs text-slate-500 truncate leading-tight mt-0.5">
                        {status === 'completed' ? 'Completed' : status === 'current' ? 'In Progress' : `Step ${index + 1}`}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
          </nav>

          {/* Agents Section */}
          <div className="border-t border-slate-800">
            <button
              onClick={() => setShowAgents(!showAgents)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Users size={16} className="text-cyan-400" />
                <span className="text-sm font-medium text-slate-300">Agents</span>
                <span className="text-xs bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded">217</span>
              </div>
              {showAgents ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>
            {showAgents && (
              <div className="px-2 pb-3">
                {AGENT_CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/50 cursor-pointer group"
                      title={cat.description}
                    >
                      <Icon size={14} className="text-slate-500 group-hover:text-cyan-400" />
                      <span className="text-xs text-slate-400 group-hover:text-slate-300 flex-1 truncate">{cat.name}</span>
                      <span className="text-xs text-slate-600">{cat.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* MCP Dashboard Section */}
          <div className="border-t border-slate-800">
            <button
              onClick={() => setShowMcp(!showMcp)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Server size={16} className="text-green-400" />
                <span className="text-sm font-medium text-slate-300">MCP Servers</span>
                <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">{MCP_SERVERS.length}</span>
              </div>
              {showMcp ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>
            {showMcp && (
              <div className="px-2 pb-3">
                {MCP_SERVERS.map((mcp) => (
                  <div
                    key={mcp.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-800/50 cursor-pointer group"
                    title={mcp.description}
                  >
                    <Circle
                      size={8}
                      className={mcp.status === 'active' ? 'text-green-400 fill-green-400' : 'text-slate-600 fill-slate-600'}
                    />
                    <span className="text-xs text-slate-400 group-hover:text-slate-300 flex-1 truncate">{mcp.name}</span>
                    <span className={`text-xs ${mcp.status === 'active' ? 'text-green-500' : 'text-slate-600'}`}>
                      {mcp.status}
                    </span>
                  </div>
                ))}
                <a
                  href="http://localhost:8765"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1.5 mt-1 rounded bg-slate-800/50 hover:bg-slate-700/50 text-xs text-cyan-400 hover:text-cyan-300"
                >
                  <Settings size={12} />
                  Open MCP Dashboard
                </a>
              </div>
            )}
          </div>
        </div>
        {/* End Scrollable Section */}

        {/* Progress Footer - Fixed at bottom */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex-shrink-0">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-400">Progress</span>
            <span className="text-cyan-400 font-medium">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(progressPercent, 2)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            {completedStages} of {WIZARD_STAGES.length} stages completed
          </p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/30">
          <div>
            <h2 className="text-xl font-bold text-slate-200">
              {currentStageInfo?.name}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">{currentStageInfo?.description}</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Close wizard"
            >
              <X size={20} />
            </button>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            {/* Ralph Gate Notice */}
            {currentStageInfo?.hasRalphGate && (
              <div className="mb-4 flex items-center gap-2 text-sm text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-4 py-2">
                <RefreshCw size={14} />
                <span>Ralph Wiggum Gate: Minimum 4 iterations, 0.85 quality threshold</span>
              </div>
            )}

            {/* Stage State */}
            {currentStageState.isProcessing && (
              <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg mb-4">
                <Loader2 className="animate-spin text-cyan-500" size={20} />
                <span className="text-cyan-400">Processing stage...</span>
              </div>
            )}

            {currentStageState.error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <AlertCircle className="text-red-500" size={20} />
                <span className="text-red-400">{currentStageState.error}</span>
              </div>
            )}

            {currentStageState.lastOutput && (
              <div
                className={`
                  p-4 rounded-lg mb-4 border
                  ${currentStageState.lastOutput.passed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-yellow-500/10 border-yellow-500/30'}
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  {currentStageState.lastOutput.passed ? (
                    <Check className="text-green-500" size={20} />
                  ) : (
                    <RefreshCw className="text-yellow-500" size={20} />
                  )}
                  <span
                    className={
                      currentStageState.lastOutput.passed ? 'text-green-400' : 'text-yellow-400'
                    }
                  >
                    Iteration {currentStageState.lastOutput.iteration} -{' '}
                    {currentStageState.lastOutput.passed ? 'Passed' : 'Continue refining'}
                  </span>
                  <span className="text-slate-400 text-sm">
                    Score: {(currentStageState.lastOutput.quality_score * 100).toFixed(1)}%
                  </span>
                </div>
                {currentStageState.lastOutput.feedback && (
                  <p className="text-sm text-slate-400 mt-2">
                    {currentStageState.lastOutput.feedback}
                  </p>
                )}
              </div>
            )}

            {/* Stage Content */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
              {activeStage === 'vision' && (
                <VisionStage
                projectId={projectId}
                initialData={project.stage_outputs?.vision as Partial<VisionStageInput> | undefined}
                lastOutput={currentStageState.lastOutput}
                isProcessing={currentStageState.isProcessing}
                onSubmit={async (data) => {
                  return handleProcessStage('vision', data as unknown as Record<string, unknown>);
                }}
              />
            )}
            {activeStage === 'roadmap' && (
              <RoadmapStage
                projectId={projectId}
                initialData={project.stage_outputs?.roadmap as Partial<RoadmapStageInput> | undefined}
                lastOutput={currentStageState.lastOutput}
                isProcessing={currentStageState.isProcessing}
                onSubmit={async (data) => {
                  return handleProcessStage('roadmap', data as unknown as Record<string, unknown>);
                }}
              />
            )}
            {activeStage === 'design' && (
              <DesignStage
                projectId={projectId}
                initialData={project.stage_outputs?.design as Partial<DesignStageInput> | undefined}
                lastOutput={currentStageState.lastOutput}
                isProcessing={currentStageState.isProcessing}
                onSubmit={async (data) => {
                  return handleProcessStage('design', data as unknown as Record<string, unknown>);
                }}
              />
            )}
            {activeStage === 'sections' && (
              <SectionsStage
                projectId={projectId}
                initialData={project.stage_outputs?.sections as Partial<SectionStageInput> | undefined}
                lastOutput={currentStageState.lastOutput}
                isProcessing={currentStageState.isProcessing}
                availableSections={
                  (project.stage_outputs?.roadmap as { sections?: Array<{ name: string; description: string }> })?.sections
                }
                onSubmit={async (data) => {
                  return handleProcessStage('sections', data as unknown as Record<string, unknown>);
                }}
              />
            )}
            {activeStage === 'loop1' && (
              <Loop1Stage
                projectId={projectId}
                initialData={project.stage_outputs?.loop1 as Partial<Loop1StageInput> | undefined}
                lastOutput={currentStageState.lastOutput}
                isProcessing={currentStageState.isProcessing}
                onSubmit={async (data) => {
                  return handleProcessStage('loop1', data as unknown as Record<string, unknown>);
                }}
              />
            )}
            {activeStage === 'match' && (
              <CapabilityMatchStage
                projectId={projectId}
                lastOutput={currentStageState.lastOutput}
                isProcessing={currentStageState.isProcessing}
                onSubmit={async (data) => {
                  return handleProcessStage('match', data);
                }}
              />
            )}
            {activeStage === 'execute' && (
              <ExecuteStage
                projectId={projectId}
                lastOutput={currentStageState.lastOutput}
                isProcessing={currentStageState.isProcessing}
                onSubmit={async (data) => {
                  return handleProcessStage('execute', data);
                }}
                onComplete={() => onComplete?.(project)}
              />
            )}
            </div>
          </div>
        </div>

        {/* Footer Navigation */}
        <footer className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/30">
          <button
            onClick={handleBack}
            disabled={!canGoBack}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${canGoBack
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-slate-900 text-slate-600 cursor-not-allowed'}
            `}
          >
            <ChevronLeft size={18} />
            Back
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            Step {getStageIndex(activeStage) + 1} of {WIZARD_STAGES.length}
          </div>

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg transition-colors
              ${canGoNext
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white font-medium'
                : 'bg-slate-900 text-slate-600 cursor-not-allowed'}
            `}
          >
            {activeStage === 'execute' ? 'Complete' : 'Next'}
            <ChevronRight size={18} />
          </button>
        </footer>
      </main>
    </div>
  );
}

export default ProjectWizard;
