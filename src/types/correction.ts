/**
 * Correction types for the Fix Button feature
 * Part of Building Block 8: Human Correction Affordance
 */

/**
 * Type of correction being made
 */
export type CorrectionType =
  | 'wrong_answer'
  | 'incomplete'
  | 'formatting'
  | 'hallucination'
  | 'security'
  | 'style'
  | 'other';

/**
 * Correction data submitted via Fix Button
 */
export interface CorrectionData {
  /** Unique identifier for the issue */
  issue_id: string;
  /** Type of issue (e.g., 'qa_failure', 'slop_detected') */
  issue_type: string;
  /** Original AI output */
  original_output: string;
  /** Human-corrected output */
  corrected_output: string;
  /** Category of correction */
  correction_type: CorrectionType;
  /** Human explanation of the correction */
  explanation: string;
  /** Optional context data */
  context?: Record<string, unknown>;
}

/**
 * API response after submitting a correction
 */
export interface CorrectionResponse {
  /** Correction ID in the system */
  correction_id: string;
  /** Whether stored in Memory MCP */
  stored_in_memory: boolean;
  /** Whether Loop 1.5 was triggered */
  loop_triggered: boolean;
  /** Status message */
  message: string;
  /** ISO timestamp */
  timestamp: string;
}

/**
 * Correction record stored in Memory MCP
 */
export interface CorrectionRecord extends CorrectionData {
  /** System-assigned ID */
  correction_id: string;
  /** Who submitted the correction */
  submitted_by: string;
  /** When submitted */
  submitted_at: string;
  /** Status of the correction */
  status: 'pending' | 'applied' | 'rejected';
  /** Optional rejection reason */
  rejection_reason?: string;
}
