import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Wrench } from 'lucide-react';
import { Button } from '../Button';
import { Badge } from '../ui/Badge';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '../ui/Dialog';

/**
 * Correction type for AI output fixes
 */
export type CorrectionType =
  | 'wrong_answer'
  | 'incomplete'
  | 'formatting'
  | 'hallucination'
  | 'security'
  | 'style'
  | 'other';

interface CorrectionData {
  issue_id: string;
  issue_type: string;
  original_output: string;
  corrected_output: string;
  correction_type: CorrectionType;
  explanation: string;
  context?: Record<string, unknown>;
}

interface FixButtonProps {
  /** Issue ID to fix */
  issueId: string;
  /** Type of issue (e.g., 'qa_failure', 'slop_detected') */
  issueType: string;
  /** Original AI output that needs correction */
  originalOutput?: string;
  /** Optional context data */
  context?: Record<string, unknown>;
  /** Callback after successful fix */
  onFixed?: (data: CorrectionData) => void;
  /** Button size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom button text */
  buttonText?: string;
  /** Disabled state */
  disabled?: boolean;
}

const correctionTypes: { value: CorrectionType; label: string; description: string }[] = [
  { value: 'wrong_answer', label: 'Wrong Answer', description: 'The answer is factually incorrect' },
  { value: 'incomplete', label: 'Incomplete', description: 'Missing important information' },
  { value: 'formatting', label: 'Formatting', description: 'Output format is wrong' },
  { value: 'hallucination', label: 'Hallucination', description: 'Contains made-up information' },
  { value: 'security', label: 'Security Issue', description: 'Contains security vulnerabilities' },
  { value: 'style', label: 'Style/Tone', description: 'Wrong tone or writing style' },
  { value: 'other', label: 'Other', description: 'Other type of issue' },
];

/**
 * FixButton - Human correction affordance for AI outputs
 *
 * Enables users to correct AI mistakes and feed them back to the
 * self-improvement loop (Loop 1.5) for pattern learning.
 *
 * @example
 * ```tsx
 * <FixButton
 *   issueId="qa-123"
 *   issueType="slop_detected"
 *   originalOutput="The AI's response here..."
 *   onFixed={(data) => console.log('Fixed:', data)}
 * />
 * ```
 */
export function FixButton({
  issueId,
  issueType,
  originalOutput = '',
  context,
  onFixed,
  size = 'sm',
  buttonText = 'Fix',
  disabled = false,
}: FixButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [correctionType, setCorrectionType] = useState<CorrectionType>('wrong_answer');
  const [correctedOutput, setCorrectedOutput] = useState('');
  const [explanation, setExplanation] = useState('');

  const resetForm = () => {
    setCorrectionType('wrong_answer');
    setCorrectedOutput('');
    setExplanation('');
    setSubmitStatus('idle');
    setErrorMessage('');
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!correctedOutput.trim() || !explanation.trim()) {
      setErrorMessage('Please provide both the corrected output and an explanation.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const correctionData: CorrectionData = {
      issue_id: issueId,
      issue_type: issueType,
      original_output: originalOutput,
      corrected_output: correctedOutput.trim(),
      correction_type: correctionType,
      explanation: explanation.trim(),
      context,
    };

    try {
      const response = await fetch('/api/v1/corrections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(correctionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit correction: ${response.statusText}`);
      }

      setSubmitStatus('success');
      onFixed?.(correctionData);

      // Close dialog after brief success display
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit correction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant="secondary"
        size={size}
        onClick={handleOpen}
        disabled={disabled}
        className="inline-flex items-center gap-1.5"
      >
        <Wrench className="w-3.5 h-3.5" />
        {buttonText}
      </Button>

      <Dialog open={isOpen} onClose={handleClose} size="lg">
        <DialogHeader onClose={handleClose}>
          <DialogTitle>Fix AI Output</DialogTitle>
          <DialogDescription>
            Submit a correction to improve future responses. Your feedback helps train the system.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {submitStatus === 'success' ? (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-success mb-4" />
              <h3 className="text-lg font-medium text-text-primary mb-2">Correction Submitted</h3>
              <p className="text-sm text-text-secondary">
                Thank you! This will be used to improve the system via Loop 1.5 learning.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Issue Info */}
              <div className="flex items-center gap-2 p-3 bg-surface-elevated rounded-lg">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-sm text-text-secondary">Issue ID: {issueId}</span>
                <Badge variant="warning" size="sm">{issueType}</Badge>
              </div>

              {/* Original Output */}
              {originalOutput && (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Original Output
                  </label>
                  <div className="p-3 bg-surface-secondary border border-border-subtle rounded-lg text-sm text-text-secondary max-h-32 overflow-y-auto">
                    {originalOutput}
                  </div>
                </div>
              )}

              {/* Correction Type */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Correction Type
                </label>
                <select
                  value={correctionType}
                  onChange={(e) => setCorrectionType(e.target.value as CorrectionType)}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border-default rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  {correctionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Corrected Output */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Corrected Output <span className="text-error">*</span>
                </label>
                <textarea
                  value={correctedOutput}
                  onChange={(e) => setCorrectedOutput(e.target.value)}
                  placeholder="Enter the correct output that should have been generated..."
                  rows={4}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Explanation <span className="text-error">*</span>
                </label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the original was wrong and how this correction is better..."
                  rows={3}
                  className="w-full px-3 py-2 bg-surface-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
                  <p className="text-sm text-error">{errorMessage}</p>
                </div>
              )}
            </div>
          )}
        </DialogBody>

        {submitStatus !== 'success' && (
          <DialogFooter>
            <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !correctedOutput.trim() || !explanation.trim()}
              className="inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Correction
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </Dialog>
    </>
  );
}

/**
 * FixButtonInline - Compact inline version for use in lists
 */
export function FixButtonInline({
  issueId,
  issueType,
  originalOutput,
  context,
  onFixed,
}: Omit<FixButtonProps, 'size' | 'buttonText'>) {
  return (
    <FixButton
      issueId={issueId}
      issueType={issueType}
      originalOutput={originalOutput}
      context={context}
      onFixed={onFixed}
      size="sm"
      buttonText="Fix"
    />
  );
}
