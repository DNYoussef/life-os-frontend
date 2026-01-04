/**
 * DesignStage - Stage 3 of the Project Wizard
 * Design system and visual identity configuration
 */

import { useState } from 'react';
import {
  Palette,
  Plus,
  X,
  Loader2,
  Type,
  Layout,
  Monitor,
  AlertTriangle,
  Smartphone,
  Tablet,
} from 'lucide-react';
import type { DesignStageInput, StageOutput } from '../../../types/wizard';

interface DesignStageProps {
  projectId: string;
  initialData?: Partial<DesignStageInput>;
  lastOutput?: StageOutput;
  isProcessing: boolean;
  onSubmit: (data: DesignStageInput) => Promise<StageOutput | undefined>;
}

// Shell pattern options
const SHELL_PATTERNS = [
  { value: 'sidebar-content', label: 'Sidebar + Content', description: 'Fixed sidebar with scrollable content area' },
  { value: 'topnav-content', label: 'Top Nav + Content', description: 'Horizontal navigation with full-width content' },
  { value: 'sidebar-topnav', label: 'Sidebar + Top Nav', description: 'Combined sidebar and top navigation' },
  { value: 'dashboard-grid', label: 'Dashboard Grid', description: 'Grid-based layout with widgets' },
  { value: 'wizard-flow', label: 'Wizard Flow', description: 'Step-by-step guided layout' },
  { value: 'minimal', label: 'Minimal', description: 'Clean, content-focused layout' },
];

// Common breakpoint presets
const BREAKPOINT_PRESETS = {
  tailwind: [640, 768, 1024, 1280, 1536],
  bootstrap: [576, 768, 992, 1200, 1400],
  material: [600, 960, 1280, 1920],
};

// Color Palette Editor
function ColorPaletteEditor({
  colors,
  onChange,
  disabled,
}: {
  colors: Record<string, string>;
  onChange: (colors: Record<string, string>) => void;
  disabled?: boolean;
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('#3b82f6');

  const updateColor = (key: string, value: string) => {
    onChange({ ...colors, [key]: value });
  };

  const removeColor = (key: string) => {
    const { [key]: _, ...rest } = colors;
    onChange(rest);
  };

  const addColor = () => {
    if (newKey.trim() && !colors[newKey.trim()]) {
      onChange({ ...colors, [newKey.trim()]: newValue });
      setNewKey('');
      setNewValue('#3b82f6');
    }
  };

  const addDefaultColors = () => {
    const defaults: Record<string, string> = {
      primary: '#3b82f6',
      secondary: '#6366f1',
      accent: '#06b6d4',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      'text-muted': '#94a3b8',
      border: '#334155',
      error: '#ef4444',
      success: '#22c55e',
      warning: '#f59e0b',
    };
    onChange({ ...defaults, ...colors });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Palette size={16} className="text-pink-400" />
          Color Palette
        </label>
        {Object.keys(colors).length === 0 && !disabled && (
          <button
            type="button"
            onClick={addDefaultColors}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          >
            Load Defaults
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {Object.entries(colors).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2"
          >
            <input
              type="color"
              value={value}
              onChange={(e) => updateColor(key, e.target.value)}
              disabled={disabled}
              className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-400 truncate">{key}</p>
              <p className="text-xs text-slate-500 font-mono">{value}</p>
            </div>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeColor(key)}
                className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Color name (e.g., info)"
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="color"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-10 h-8 rounded cursor-pointer border border-slate-700 bg-slate-900"
          />
          <button
            type="button"
            onClick={addColor}
            disabled={!newKey.trim()}
            className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// Typography Editor
function TypographyEditor({
  typography,
  onChange,
  disabled,
}: {
  typography: Record<string, string>;
  onChange: (typography: Record<string, string>) => void;
  disabled?: boolean;
}) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const updateValue = (key: string, value: string) => {
    onChange({ ...typography, [key]: value });
  };

  const removeValue = (key: string) => {
    const { [key]: _, ...rest } = typography;
    onChange(rest);
  };

  const addValue = () => {
    if (newKey.trim() && !typography[newKey.trim()]) {
      onChange({ ...typography, [newKey.trim()]: newValue });
      setNewKey('');
      setNewValue('');
    }
  };

  const addDefaults = () => {
    const defaults: Record<string, string> = {
      'font-family': 'Inter, system-ui, sans-serif',
      'font-family-mono': 'JetBrains Mono, monospace',
      'font-size-base': '16px',
      'font-size-sm': '14px',
      'font-size-lg': '18px',
      'font-size-xl': '24px',
      'font-size-2xl': '32px',
      'line-height': '1.5',
      'font-weight-normal': '400',
      'font-weight-medium': '500',
      'font-weight-bold': '700',
    };
    onChange({ ...defaults, ...typography });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Type size={16} className="text-orange-400" />
          Typography
        </label>
        {Object.keys(typography).length === 0 && !disabled && (
          <button
            type="button"
            onClick={addDefaults}
            className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          >
            Load Defaults
          </button>
        )}
      </div>

      <div className="space-y-2">
        {Object.entries(typography).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center gap-2 bg-slate-800/50 rounded-lg p-2"
          >
            <span className="text-xs text-slate-400 w-32 truncate">{key}</span>
            <input
              type="text"
              value={value}
              onChange={(e) => updateValue(key, e.target.value)}
              disabled={disabled}
              className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => removeValue(key)}
                className="p-1 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Property name"
            className="w-32 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={addValue}
            disabled={!newKey.trim()}
            className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

// Breakpoint Editor
function BreakpointEditor({
  breakpoints,
  onChange,
  disabled,
}: {
  breakpoints: number[];
  onChange: (breakpoints: number[]) => void;
  disabled?: boolean;
}) {
  const [newValue, setNewValue] = useState('');

  const addBreakpoint = () => {
    const num = parseInt(newValue, 10);
    if (!isNaN(num) && num > 0 && !breakpoints.includes(num)) {
      onChange([...breakpoints, num].sort((a, b) => a - b));
      setNewValue('');
    }
  };

  const removeBreakpoint = (bp: number) => {
    onChange(breakpoints.filter((b) => b !== bp));
  };

  const applyPreset = (preset: keyof typeof BREAKPOINT_PRESETS) => {
    onChange(BREAKPOINT_PRESETS[preset]);
  };

  const getDeviceIcon = (bp: number) => {
    if (bp < 768) return Smartphone;
    if (bp < 1024) return Tablet;
    return Monitor;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Monitor size={16} className="text-green-400" />
          Responsive Breakpoints
        </label>
        {!disabled && (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => applyPreset('tailwind')}
              className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
            >
              Tailwind
            </button>
            <button
              type="button"
              onClick={() => applyPreset('bootstrap')}
              className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
            >
              Bootstrap
            </button>
            <button
              type="button"
              onClick={() => applyPreset('material')}
              className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
            >
              Material
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {breakpoints.map((bp) => {
          const Icon = getDeviceIcon(bp);
          return (
            <div
              key={bp}
              className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2"
            >
              <Icon size={14} className="text-slate-400" />
              <span className="text-sm text-slate-200 font-mono">{bp}px</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeBreakpoint(bp)}
                  className="p-0.5 hover:bg-red-500/20 rounded text-slate-500 hover:text-red-400"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {!disabled && (
        <div className="flex gap-2">
          <input
            type="number"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Width in pixels"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addBreakpoint())}
            className="w-40 bg-slate-900 border border-slate-700 rounded px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={addBreakpoint}
            disabled={!newValue}
            className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-50"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

export function DesignStage({
  initialData,
  lastOutput,
  isProcessing,
  onSubmit,
}: DesignStageProps) {
  const [colorPalette, setColorPalette] = useState<Record<string, string>>(
    initialData?.color_palette || {}
  );
  const [typography, setTypography] = useState<Record<string, string>>(
    initialData?.typography || {}
  );
  const [shellPattern, setShellPattern] = useState<string>(
    initialData?.shell_pattern || ''
  );
  const [breakpoints, setBreakpoints] = useState<number[]>(
    initialData?.responsive_breakpoints || []
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validate = (): boolean => {
    const errors: string[] = [];

    if (Object.keys(colorPalette).length === 0) {
      errors.push('Define at least one color in the palette');
    }
    if (Object.keys(typography).length === 0) {
      errors.push('Define at least one typography setting');
    }
    if (!shellPattern) {
      errors.push('Select a shell pattern');
    }
    if (breakpoints.length === 0) {
      errors.push('Add at least one responsive breakpoint');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: DesignStageInput = {
      color_palette: colorPalette,
      typography: typography,
      shell_pattern: shellPattern,
      responsive_breakpoints: breakpoints,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stage Description */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Palette className="text-pink-400" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-slate-200 mb-1">
              Define Your Design System
            </h3>
            <p className="text-sm text-slate-400">
              Create a consistent visual identity with colors, typography,
              layout patterns, and responsive breakpoints. Use presets to get
              started quickly.
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

      {/* Color Palette */}
      <ColorPaletteEditor
        colors={colorPalette}
        onChange={setColorPalette}
        disabled={isProcessing}
      />

      {/* Typography */}
      <TypographyEditor
        typography={typography}
        onChange={setTypography}
        disabled={isProcessing}
      />

      {/* Shell Pattern */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Layout size={16} className="text-cyan-400" />
          Shell Pattern
        </label>
        <div className="grid grid-cols-2 gap-3">
          {SHELL_PATTERNS.map((pattern) => (
            <button
              key={pattern.value}
              type="button"
              onClick={() => {
                setShellPattern(pattern.value);
                setValidationErrors([]);
              }}
              disabled={isProcessing}
              className={`text-left p-3 rounded-lg border transition-colors ${
                shellPattern === pattern.value
                  ? 'bg-cyan-500/20 border-cyan-500/50'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
              } disabled:opacity-50`}
            >
              <p className={`text-sm font-medium ${
                shellPattern === pattern.value ? 'text-cyan-400' : 'text-slate-200'
              }`}>
                {pattern.label}
              </p>
              <p className="text-xs text-slate-500 mt-1">{pattern.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Breakpoints */}
      <BreakpointEditor
        breakpoints={breakpoints}
        onChange={(bps) => {
          setBreakpoints(bps);
          setValidationErrors([]);
        }}
        disabled={isProcessing}
      />

      {/* Preview Card */}
      {(Object.keys(colorPalette).length > 0 || shellPattern) && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Preview</h4>
          <div
            className="rounded-lg p-4 border"
            style={{
              backgroundColor: colorPalette.background || '#0f172a',
              borderColor: colorPalette.border || '#334155',
            }}
          >
            <div
              className="text-lg font-bold mb-2"
              style={{ color: colorPalette.primary || '#3b82f6' }}
            >
              {shellPattern ? SHELL_PATTERNS.find(p => p.value === shellPattern)?.label : 'Your App'}
            </div>
            <p style={{ color: colorPalette.text || '#f1f5f9' }}>
              Primary text content
            </p>
            <p style={{ color: colorPalette['text-muted'] || '#94a3b8' }}>
              Secondary muted text
            </p>
            <div className="flex gap-2 mt-3">
              <span
                className="px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: colorPalette.primary || '#3b82f6',
                  color: colorPalette.background || '#0f172a',
                }}
              >
                Primary
              </span>
              <span
                className="px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: colorPalette.secondary || '#6366f1',
                  color: colorPalette.background || '#0f172a',
                }}
              >
                Secondary
              </span>
              <span
                className="px-3 py-1 rounded text-sm"
                style={{
                  backgroundColor: colorPalette.accent || '#06b6d4',
                  color: colorPalette.background || '#0f172a',
                }}
              >
                Accent
              </span>
            </div>
          </div>
        </div>
      )}

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
              <Palette size={18} />
              {lastOutput ? 'Refine Design' : 'Submit Design'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default DesignStage;
