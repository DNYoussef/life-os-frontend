import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Play, FolderOpen, AlertTriangle, CheckCircle2, Settings } from 'lucide-react';
import type {
  QAStatusResponse,
  QAHistoryResponse,
  QARunRequest,
  RecoveryStatusResponse,
  ComplexityAnalysis,
  ValidationResponse,
  SpecListResponse,
  SpecListItem,
} from '../types/qa';
import {
  getQAStatus,
  getQAHistory,
  runQAPipeline,
  getRecoveryStatus,
  triggerRollback,
  clearStuckSubtasks,
  resetRecovery,
  analyzeComplexity,
  validateSpec,
  listSpecs,
} from '../services/qaApi';
import {
  QAStatusCard,
  QAMetricsSummary,
  QAIssueList,
  QAIterationList,
  MostCommonIssues,
  RecoveryStatusCard,
  StuckSubtaskList,
  SpecComplexityCard,
  SpecValidationCard,
  SpecListCard,
} from '../components/qa';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AppStateBanner } from '../components/ui/AppStateBanner';

type TabType = 'status' | 'history' | 'recovery' | 'spec';

/**
 * QAPipelinePage - Main QA pipeline management interface
 */
export function QAPipelinePage() {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const [projectDir, setProjectDir] = useState('');
  const [specDir, setSpecDir] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [qaStatus, setQAStatus] = useState<QAStatusResponse | null>(null);
  const [qaHistory, setQAHistory] = useState<QAHistoryResponse | null>(null);
  const [recoveryStatus, setRecoveryStatus] = useState<RecoveryStatusResponse | null>(null);
  const [complexity, setComplexity] = useState<ComplexityAnalysis | null>(null);
  const [validation, setValidation] = useState<ValidationResponse | null>(null);
  const [specList, setSpecList] = useState<SpecListResponse | null>(null);

  // Config modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [qaConfig, setQAConfig] = useState({
    model: 'sonnet',
    maxIterations: 50,
    verbose: false,
    background: true,
  });

  // Fetch functions
  const fetchQAStatus = useCallback(async () => {
    if (!specDir) return;
    setIsLoading(true);
    setError(null);
    try {
      const status = await getQAStatus(specDir, projectDir || undefined);
      setQAStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch QA status');
      // Mock data for demo
      setQAStatus({
        spec_id: specDir,
        current_status: 'not_started',
        iteration_count: 0,
        max_iterations: 50,
        total_issues: 0,
        unique_issues: 0,
        fix_success_rate: 0,
        has_fix_request: false,
        has_qa_report: false,
        has_escalation: false,
        build_complete: false,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [specDir, projectDir]);

  const fetchQAHistory = useCallback(async () => {
    if (!specDir) return;
    setIsLoading(true);
    try {
      const history = await getQAHistory(specDir, projectDir || undefined);
      setQAHistory(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch QA history');
    } finally {
      setIsLoading(false);
    }
  }, [specDir, projectDir]);

  const fetchRecoveryStatus = useCallback(async () => {
    if (!specDir) return;
    setIsLoading(true);
    try {
      const status = await getRecoveryStatus(specDir, projectDir || undefined);
      setRecoveryStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recovery status');
      // Mock data for demo
      setRecoveryStatus({
        spec_dir: specDir,
        stuck_subtasks: [],
        stuck_count: 0,
        last_good_commit: null,
        can_rollback: false,
        total_attempts: 0,
        failed_attempts: 0,
        success_rate: 0,
        needs_human_intervention: false,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [specDir, projectDir]);

  const fetchSpecInfo = useCallback(async () => {
    if (!specDir) return;
    setIsLoading(true);
    try {
      const [complexityData, validationData] = await Promise.all([
        analyzeComplexity(specDir, projectDir || undefined),
        validateSpec(specDir, projectDir || undefined),
      ]);
      setComplexity(complexityData);
      setValidation(validationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spec info');
    } finally {
      setIsLoading(false);
    }
  }, [specDir, projectDir]);

  const fetchSpecList = useCallback(async () => {
    if (!projectDir) return;
    setIsLoading(true);
    try {
      const list = await listSpecs(projectDir);
      setSpecList(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch spec list');
    } finally {
      setIsLoading(false);
    }
  }, [projectDir]);

  // Action handlers
  const handleRunQA = async () => {
    if (!specDir || !projectDir) {
      setError('Please specify both project and spec directories');
      return;
    }
    setIsLoading(true);
    try {
      const request: QARunRequest = {
        project_dir: projectDir,
        spec_dir: specDir,
        model: qaConfig.model,
        max_iterations: qaConfig.maxIterations,
        verbose: qaConfig.verbose,
        background: qaConfig.background,
      };
      await runQAPipeline(request);
      // Refresh status after starting
      await fetchQAStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start QA pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async () => {
    if (!specDir) return;
    if (!confirm('Are you sure you want to rollback to the last known good state?')) return;
    setIsLoading(true);
    try {
      await triggerRollback(specDir, projectDir || undefined);
      await fetchRecoveryStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearStuck = async () => {
    if (!specDir) return;
    setIsLoading(true);
    try {
      await clearStuckSubtasks(specDir, projectDir || undefined);
      await fetchRecoveryStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear stuck subtasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!specDir) return;
    if (!confirm('Are you sure you want to reset all recovery state? This cannot be undone.')) return;
    setIsLoading(true);
    try {
      await resetRecovery(specDir, projectDir || undefined);
      await Promise.all([fetchQAStatus(), fetchRecoveryStatus()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSpec = (spec: SpecListItem) => {
    setSpecDir(spec.path);
  };

  // Effect to fetch data when spec changes
  useEffect(() => {
    if (specDir) {
      if (activeTab === 'status') fetchQAStatus();
      else if (activeTab === 'history') fetchQAHistory();
      else if (activeTab === 'recovery') fetchRecoveryStatus();
      else if (activeTab === 'spec') fetchSpecInfo();
    }
  }, [specDir, activeTab, fetchQAStatus, fetchQAHistory, fetchRecoveryStatus, fetchSpecInfo]);

  // Effect to fetch spec list when project changes
  useEffect(() => {
    if (projectDir) {
      fetchSpecList();
    }
  }, [projectDir, fetchSpecList]);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'status', label: 'QA Status' },
    { id: 'history', label: 'History' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'spec', label: 'Spec Analysis' },
  ];

  return (
    <div className="min-h-screen bg-surface-base text-text-primary p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">QA Pipeline</h1>
          <p className="text-text-secondary text-sm">Automated code quality validation and recovery</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="p-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => {
              if (activeTab === 'status') fetchQAStatus();
              else if (activeTab === 'history') fetchQAHistory();
              else if (activeTab === 'recovery') fetchRecoveryStatus();
              else if (activeTab === 'spec') fetchSpecInfo();
            }}
            disabled={isLoading || !specDir}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6">
          <AppStateBanner
            variant="demo"
            title="API Error"
            message={error}
            action={{
              label: "Dismiss",
              onClick: () => setError(null)
            }}
          />
        </div>
      )}

      {/* Directory Inputs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Project Directory</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={projectDir}
              onChange={(e) => setProjectDir(e.target.value)}
              placeholder="D:\Projects\my-project"
              className="flex-1 bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent-500 transition-colors"
            />
            <button
              className="px-3 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors"
              title="Browse"
            >
              <FolderOpen size={18} />
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Spec Directory</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={specDir}
              onChange={(e) => setSpecDir(e.target.value)}
              placeholder="D:\Projects\my-project\specs\feature-x"
              className="flex-1 bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary font-mono text-sm focus:outline-none focus:border-accent-500 transition-colors"
            />
            <button
              className="px-3 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated transition-colors"
              title="Browse"
            >
              <FolderOpen size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border-subtle">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'text-accent-400 border-accent-400'
                : 'text-text-secondary border-transparent hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* No Spec Selected Message */}
      {!specDir && (
        <Card variant="outlined" className="text-center py-12">
          <AlertTriangle className="mx-auto mb-4 text-warning" size={48} />
          <h3 className="text-lg font-semibold text-text-primary mb-2">No Spec Selected</h3>
          <p className="text-text-secondary mb-4">
            Enter a project directory to see available specs, or enter a spec directory directly.
          </p>
        </Card>
      )}

      {/* Tab Content */}
      {specDir && (
        <div className="grid grid-cols-3 gap-6">
          {/* Main Content - 2 columns */}
          <div className="col-span-2 space-y-6">
            {activeTab === 'status' && qaStatus && (
              <>
                <QAStatusCard
                  status={qaStatus}
                  onRunQA={handleRunQA}
                  onViewHistory={() => setActiveTab('history')}
                  isLoading={isLoading}
                />
                {qaStatus.current_status !== 'not_started' && (
                  <QAMetricsSummary
                    totalIssues={qaStatus.total_issues}
                    uniqueIssues={qaStatus.unique_issues}
                    fixSuccessRate={qaStatus.fix_success_rate}
                    iterationCount={qaStatus.iteration_count}
                  />
                )}
              </>
            )}

            {activeTab === 'history' && qaHistory && (
              <>
                <Card>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">QA History Summary</h3>
                  <QAMetricsSummary
                    totalIssues={qaHistory.summary.total_issues}
                    uniqueIssues={qaHistory.summary.unique_issues}
                    fixSuccessRate={qaHistory.summary.fix_success_rate}
                    iterationCount={qaHistory.iterations.length}
                  />
                </Card>
                <QAIterationList iterations={qaHistory.iterations} />
                {qaHistory.summary.most_common && qaHistory.summary.most_common.length > 0 && (
                  <MostCommonIssues issues={qaHistory.summary.most_common} />
                )}
              </>
            )}

            {activeTab === 'recovery' && recoveryStatus && (
              <>
                <RecoveryStatusCard
                  status={recoveryStatus}
                  onRollback={handleRollback}
                  onClearStuck={handleClearStuck}
                  onReset={handleReset}
                  isLoading={isLoading}
                />
                {recoveryStatus.stuck_subtasks.length > 0 && (
                  <StuckSubtaskList subtasks={recoveryStatus.stuck_subtasks} />
                )}
              </>
            )}

            {activeTab === 'spec' && (
              <>
                {complexity && (
                  <SpecComplexityCard
                    analysis={complexity}
                    onReanalyze={fetchSpecInfo}
                    isLoading={isLoading}
                  />
                )}
                {validation && (
                  <SpecValidationCard
                    validation={validation}
                    onValidate={fetchSpecInfo}
                    isLoading={isLoading}
                  />
                )}
              </>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <h4 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={handleRunQA}
                  disabled={isLoading || !specDir || !projectDir}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-accent-500 hover:bg-accent-600 disabled:bg-surface-elevated disabled:text-text-muted text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Play size={16} />
                  Run QA Pipeline
                </button>
                <button
                  onClick={() => setActiveTab('recovery')}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-surface-elevated hover:bg-surface-secondary text-text-secondary rounded-lg text-sm font-medium transition-colors"
                >
                  <AlertTriangle size={16} />
                  View Recovery
                </button>
              </div>
            </Card>

            {/* Status Summary */}
            {qaStatus && (
              <Card>
                <h4 className="text-sm font-semibold text-text-primary mb-3">Status Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">QA Status</span>
                    <Badge
                      variant={
                        qaStatus.current_status === 'approved' ? 'success' :
                        qaStatus.current_status === 'running' ? 'info' :
                        qaStatus.current_status === 'error' || qaStatus.current_status === 'rejected' ? 'error' :
                        'default'
                      }
                      size="sm"
                    >
                      {qaStatus.current_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Iterations</span>
                    <span className="text-text-primary">{qaStatus.iteration_count}/{qaStatus.max_iterations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Fix Rate</span>
                    <span className="text-text-primary">{Math.round(qaStatus.fix_success_rate * 100)}%</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Spec List */}
            {specList && specList.specs.length > 0 && (
              <SpecListCard
                specs={specList}
                onSelectSpec={handleSelectSpec}
                selectedSpec={specDir}
                maxHeight="300px"
              />
            )}
          </div>
        </div>
      )}

      {/* Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-text-primary">QA Configuration</h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                &times;
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Model</label>
                <select
                  value={qaConfig.model}
                  onChange={(e) => setQAConfig({ ...qaConfig, model: e.target.value })}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary"
                >
                  <option value="haiku">Haiku (Fast)</option>
                  <option value="sonnet">Sonnet (Balanced)</option>
                  <option value="opus">Opus (Powerful)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Max Iterations</label>
                <input
                  type="number"
                  value={qaConfig.maxIterations}
                  onChange={(e) => setQAConfig({ ...qaConfig, maxIterations: parseInt(e.target.value) || 50 })}
                  min={1}
                  max={100}
                  className="w-full bg-surface-elevated border border-border-default rounded-lg px-3 py-2 text-text-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verbose"
                  checked={qaConfig.verbose}
                  onChange={(e) => setQAConfig({ ...qaConfig, verbose: e.target.checked })}
                  className="rounded border-border-default"
                />
                <label htmlFor="verbose" className="text-sm text-text-secondary">Verbose Output</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="background"
                  checked={qaConfig.background}
                  onChange={(e) => setQAConfig({ ...qaConfig, background: e.target.checked })}
                  className="rounded border-border-default"
                />
                <label htmlFor="background" className="text-sm text-text-secondary">Run in Background</label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-lg border border-border-default text-text-secondary hover:bg-surface-elevated"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 rounded-lg bg-accent-600 hover:bg-accent-500 text-white font-medium"
                >
                  Save
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
