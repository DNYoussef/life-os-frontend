/**
 * VisionStage - Stage 1 of the Project Wizard
 * Define product vision and value proposition
 */

import { useState } from 'react';
import {
  Lightbulb,
  Plus,
  X,
  Loader2,
  Target,
  Users,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import type { VisionStageInput, StageOutput } from '../../../types/wizard';

interface VisionStageProps {
  projectId: string;
  initialData?: Partial<VisionStageInput>;
  lastOutput?: StageOutput;
  isProcessing: boolean;
  onSubmit: (data: VisionStageInput) => Promise<StageOutput | undefined>;
}

// Reusable array input component
function ArrayInput({
  label,
  placeholder,
  values,
  onChange,
  icon: Icon,
  disabled,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Icon
            className="absolute left-3 top-1/2 -tranmuted-y-1/2 text-muted-foreground"
            size={16}
          />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-ring disabled:opacity-50"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          className="px-3 py-2 rounded-lg bg-muted hover:bg-muted-foreground text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={18} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {values.map((value, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
            >
              {value}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="hover:text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function VisionStage({
  initialData,
  lastOutput,
  isProcessing,
  onSubmit,
}: VisionStageProps) {
  const [formData, setFormData] = useState<VisionStageInput>({
    product_name: initialData?.product_name || '',
    problems_solved: initialData?.problems_solved || [],
    key_features: initialData?.key_features || [],
    target_users: initialData?.target_users || '',
    unique_value_proposition: initialData?.unique_value_proposition || '',
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validate = (): boolean => {
    const errors: string[] = [];

    if (!formData.product_name.trim()) {
      errors.push('Product name is required');
    }
    if (formData.problems_solved.length === 0) {
      errors.push('Add at least one problem your product solves');
    }
    if (formData.key_features.length === 0) {
      errors.push('Add at least one key feature');
    }
    if (!formData.target_users.trim()) {
      errors.push('Target users description is required');
    }
    if (!formData.unique_value_proposition.trim()) {
      errors.push('Unique value proposition is required');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData);
  };

  const updateField = <K extends keyof VisionStageInput>(
    field: K,
    value: VisionStageInput[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setValidationErrors([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stage Description */}
      <div className="bg-card/50 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="text-warning" size={20} />
          </div>
          <div>
            <h3 className="font-medium text-foreground mb-1">
              Define Your Product Vision
            </h3>
            <p className="text-sm text-muted-foreground">
              Clearly articulate what your product does, who it's for, and why
              it matters. This forms the foundation for all subsequent stages.
            </p>
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-destructive font-medium text-sm mb-1">
                Please fix the following:
              </p>
              <ul className="list-disc list-inside text-sm text-destructive/80 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Product Name */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Product Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={formData.product_name}
          onChange={(e) => updateField('product_name', e.target.value)}
          placeholder="e.g., TaskFlow Pro"
          disabled={isProcessing}
          className="w-full bg-muted border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:border-ring disabled:opacity-50"
        />
      </div>

      {/* Problems Solved */}
      <ArrayInput
        label="Problems Solved *"
        placeholder="e.g., Teams waste time in unproductive meetings"
        values={formData.problems_solved}
        onChange={(values) => updateField('problems_solved', values)}
        icon={Target}
        disabled={isProcessing}
      />

      {/* Key Features */}
      <ArrayInput
        label="Key Features *"
        placeholder="e.g., AI-powered meeting summaries"
        values={formData.key_features}
        onChange={(values) => updateField('key_features', values)}
        icon={Sparkles}
        disabled={isProcessing}
      />

      {/* Target Users */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Target Users <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Users
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <textarea
            value={formData.target_users}
            onChange={(e) => updateField('target_users', e.target.value)}
            placeholder="Describe your ideal users (e.g., Remote teams of 5-50 people in tech startups who struggle with async communication)"
            disabled={isProcessing}
            rows={3}
            className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-ring resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Unique Value Proposition */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          Unique Value Proposition <span className="text-destructive">*</span>
        </label>
        <div className="relative">
          <Lightbulb
            className="absolute left-3 top-3 text-muted-foreground"
            size={16}
          />
          <textarea
            value={formData.unique_value_proposition}
            onChange={(e) =>
              updateField('unique_value_proposition', e.target.value)
            }
            placeholder="What makes your product unique? (e.g., The only task manager that learns from your work patterns and automatically prioritizes based on impact)"
            disabled={isProcessing}
            rows={4}
            className="w-full bg-muted border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-ring resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Previous Output Feedback */}
      {lastOutput && !lastOutput.passed && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
          <h4 className="text-warning font-medium text-sm mb-2">
            Feedback from Iteration {lastOutput.iteration}
          </h4>
          <p className="text-muted-foreground text-sm">{typeof lastOutput.feedback === "string" ? lastOutput.feedback : ""}</p>
          {lastOutput.criteria_results && (
            <div className="mt-3 space-y-1">
              {Object.entries(lastOutput.criteria_results).map(([key, passed]) => (
                <div
                  key={key}
                  className={`text-xs flex items-center gap-2 ${
                    passed ? 'text-success' : 'text-destructive'
                  }`}
                >
                  <span>{passed ? 'Pass' : 'Fail'}</span>
                  <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          type="submit"
          disabled={isProcessing}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary hover:bg-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Processing...
            </>
          ) : (
            <>
              <Lightbulb size={18} />
              {lastOutput ? 'Refine Vision' : 'Submit Vision'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default VisionStage;
