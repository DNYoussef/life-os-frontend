/**
 * CapturePage - Touch-friendly mobile capture interface
 *
 * Supports two modes:
 * - Text mode: Large textarea for quick note capture
 * - Voice mode: Audio recording with visualization and playback
 *
 * Features:
 * - Offline-first with IndexedDB queue
 * - Touch-optimized UI (48px+ tap targets)
 * - Visual recording indicator
 * - Audio level visualization
 * - Playback preview before submit
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  Type,
  Send,
  Play,
  Square,
  Pause,
  Trash2,
  WifiOff,
  CloudOff,
  Check,
  X,
  ChevronLeft,
  RefreshCw,
  Loader2,
  Tag,
  FileText,
  Lightbulb,
  ListTodo,
} from 'lucide-react';
import { useOfflineQueue } from '../hooks/useOfflineQueue';
import type { TextCaptureRequest, VoiceCaptureMetadata } from '../hooks/useOfflineQueue';
import { AppStateBanner } from '../components/ui/AppStateBanner';

// ============ TYPES ============

type CaptureMode = 'text' | 'voice';
type CaptureCategory = 'note' | 'idea' | 'task';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
}

// ============ CONSTANTS ============

const API_BASE = import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

const CATEGORY_CONFIG: Record<CaptureCategory, { icon: typeof FileText; label: string; color: string }> = {
  note: { icon: FileText, label: 'Note', color: 'bg-blue-500' },
  idea: { icon: Lightbulb, label: 'Idea', color: 'bg-amber-500' },
  task: { icon: ListTodo, label: 'Task', color: 'bg-green-500' },
};

// ============ HELPER FUNCTIONS ============

/**
 * Format duration in seconds to mm:ss
 */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ============ AUDIO VISUALIZER COMPONENT ============

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

function AudioVisualizer({ analyser, isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !isActive || !canvasRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;

      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw bars
      const barCount = 32;
      const barWidth = canvas.width / barCount - 2;
      const step = Math.floor(bufferLength / barCount);

      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i * step];
        const barHeight = (value / 255) * canvas.height * 0.8;
        const x = i * (barWidth + 2);
        const y = canvas.height - barHeight;

        // Gradient color based on amplitude
        const hue = 200 + (value / 255) * 60; // Blue to cyan
        ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser, isActive]);

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={80}
      className="w-full h-20 rounded-lg bg-surface-elevated"
    />
  );
}

// ============ RECORDING INDICATOR COMPONENT ============

function RecordingIndicator({ isRecording }: { isRecording: boolean }) {
  if (!isRecording) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </span>
      <span className="text-red-400 font-medium text-sm">Recording</span>
    </div>
  );
}

// ============ OFFLINE BANNER COMPONENT ============

function OfflineBanner({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-warning/90 text-warning-foreground px-4 py-3 flex items-center justify-center gap-3">
      <WifiOff size={20} />
      <span className="font-medium">Offline Mode</span>
      {pendingCount > 0 && (
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
          {pendingCount} pending
        </span>
      )}
    </div>
  );
}

// ============ PENDING QUEUE BADGE ============

function PendingQueueBadge({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-4 z-40 bg-accent-500 text-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2 active:scale-95 transition-transform min-h-[48px]"
    >
      <CloudOff size={18} />
      <span className="font-medium">{count} pending</span>
    </button>
  );
}

// ============ CATEGORY SELECTOR ============

interface CategorySelectorProps {
  selected: CaptureCategory;
  onChange: (category: CaptureCategory) => void;
}

function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  const categories: CaptureCategory[] = ['note', 'idea', 'task'];

  return (
    <div className="flex gap-2">
      {categories.map((category) => {
        const config = CATEGORY_CONFIG[category];
        const Icon = config.icon;
        const isSelected = selected === category;

        return (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all min-h-[48px] ${
              isSelected
                ? `${config.color} text-white shadow-lg`
                : 'bg-surface-elevated text-text-secondary hover:bg-surface-primary'
            }`}
          >
            <Icon size={18} />
            <span>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============ MODE TOGGLE ============

interface ModeToggleProps {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
}

function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="flex bg-surface-elevated rounded-xl p-1">
      <button
        onClick={() => onChange('text')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all min-h-[48px] ${
          mode === 'text'
            ? 'bg-accent-500 text-white shadow-md'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        <Type size={20} />
        <span>Text</span>
      </button>
      <button
        onClick={() => onChange('voice')}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all min-h-[48px] ${
          mode === 'voice'
            ? 'bg-accent-500 text-white shadow-md'
            : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        <Mic size={20} />
        <span>Voice</span>
      </button>
    </div>
  );
}

// ============ TEXT CAPTURE FORM ============

interface TextCaptureFormProps {
  onSubmit: (data: TextCaptureRequest) => Promise<void>;
  isSubmitting: boolean;
  category: CaptureCategory;
}

function TextCaptureForm({ onSubmit, isSubmitting, category }: TextCaptureFormProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(150, textareaRef.current.scrollHeight)}px`;
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t);

    await onSubmit({
      content: content.trim(),
      title: title.trim() || undefined,
      tags: tagList.length > 0 ? tagList : undefined,
      category,
    });

    // Reset form on success
    setContent('');
    setTitle('');
    setTags('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1">
      {/* Main content textarea */}
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Capture your ${category}...`}
          disabled={isSubmitting}
          className="w-full bg-surface-elevated border border-border-default rounded-xl px-4 py-4 text-text-primary text-lg focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 resize-none min-h-[150px] placeholder:text-text-muted disabled:opacity-50 transition-all"
          style={{ fontSize: '18px', lineHeight: '1.6' }}
        />
      </div>

      {/* Advanced options toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-text-secondary text-sm py-2"
      >
        <Tag size={16} />
        <span>{showAdvanced ? 'Hide options' : 'Add title & tags'}</span>
        <ChevronLeft
          size={16}
          className={`transition-transform ${showAdvanced ? '-rotate-90' : ''}`}
        />
      </button>

      {/* Advanced options */}
      {showAdvanced && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            disabled={isSubmitting}
            className="w-full bg-surface-elevated border border-border-default rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50 min-h-[48px]"
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            disabled={isSubmitting}
            className="w-full bg-surface-elevated border border-border-default rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-accent-500 disabled:opacity-50 min-h-[48px]"
          />
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!content.trim() || isSubmitting}
        className="w-full bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px] text-lg shadow-lg active:scale-[0.98]"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={24} className="animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <Send size={24} />
            <span>Capture</span>
          </>
        )}
      </button>
    </form>
  );
}

// ============ VOICE CAPTURE FORM ============

interface VoiceCaptureFormProps {
  onSubmit: (data: VoiceCaptureMetadata, audioBlob: Blob) => Promise<void>;
  isSubmitting: boolean;
}

function VoiceCaptureForm({ onSubmit, isSubmitting }: VoiceCaptureFormProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
    audioUrl: null,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
      if (recordingState.audioUrl) {
        URL.revokeObjectURL(recordingState.audioUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context and analyser for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Set up MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setRecordingState((prev) => ({
          ...prev,
          isRecording: false,
          isPaused: false,
          audioBlob: blob,
          audioUrl: url,
        }));
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms

      // Start duration timer
      timerRef.current = setInterval(() => {
        setRecordingState((prev) => ({
          ...prev,
          duration: prev.duration + 1,
        }));
      }, 1000);

      setRecordingState((prev) => ({
        ...prev,
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioBlob: null,
        audioUrl: null,
      }));
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Microphone access denied. Please allow microphone access to record.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
  };

  const discardRecording = () => {
    if (recordingState.audioUrl) {
      URL.revokeObjectURL(recordingState.audioUrl);
    }
    setRecordingState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
      audioUrl: null,
    });
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const togglePlayback = () => {
    if (!audioRef.current || !recordingState.audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setPlaybackProgress(progress);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  const handleSubmit = async () => {
    if (!recordingState.audioBlob) return;

    const metadata: VoiceCaptureMetadata = {
      filename: `voice-capture-${Date.now()}.webm`,
      mimeType: recordingState.audioBlob.type,
      duration: recordingState.duration,
    };

    await onSubmit(metadata, recordingState.audioBlob);

    // Reset state on success
    discardRecording();
  };

  return (
    <div className="flex flex-col gap-6 flex-1">
      {/* Error message */}
      {error && (
        <AppStateBanner
          variant="error"
          title="Recording Error"
          message={error}
        />
      )}

      {/* Audio visualizer */}
      <div className="flex-1 flex items-center justify-center">
        {recordingState.isRecording ? (
          <div className="w-full space-y-4">
            <AudioVisualizer
              analyser={analyserRef.current}
              isActive={recordingState.isRecording}
            />
            <div className="flex items-center justify-center gap-4">
              <RecordingIndicator isRecording={recordingState.isRecording} />
              <span className="text-2xl font-mono text-text-primary">
                {formatDuration(recordingState.duration)}
              </span>
            </div>
          </div>
        ) : recordingState.audioUrl ? (
          <div className="w-full space-y-4">
            {/* Audio element for playback */}
            <audio
              ref={audioRef}
              src={recordingState.audioUrl}
              onTimeUpdate={handleAudioTimeUpdate}
              onEnded={handleAudioEnded}
            />

            {/* Playback progress bar */}
            <div className="w-full bg-surface-elevated rounded-full h-3">
              <div
                className="bg-accent-500 h-3 rounded-full transition-all duration-100"
                style={{ width: `${playbackProgress}%` }}
              />
            </div>

            {/* Duration display */}
            <div className="text-center">
              <span className="text-2xl font-mono text-text-primary">
                {formatDuration(recordingState.duration)}
              </span>
            </div>

            {/* Playback controls */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={togglePlayback}
                className="w-16 h-16 rounded-full bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              <button
                onClick={discardRecording}
                className="w-16 h-16 rounded-full bg-surface-elevated hover:bg-surface-primary text-error flex items-center justify-center active:scale-95 transition-all"
              >
                <Trash2 size={28} />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-32 h-32 rounded-full bg-surface-elevated flex items-center justify-center mx-auto">
              <Mic size={48} className="text-text-muted" />
            </div>
            <p className="text-text-secondary">Tap the microphone to start recording</p>
          </div>
        )}
      </div>

      {/* Recording controls */}
      <div className="space-y-4">
        {!recordingState.audioUrl && (
          <button
            onClick={recordingState.isRecording ? stopRecording : startRecording}
            disabled={isSubmitting}
            className={`w-full py-6 px-6 rounded-xl flex items-center justify-center gap-3 font-semibold text-lg shadow-lg active:scale-[0.98] transition-all min-h-[72px] ${
              recordingState.isRecording
                ? 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white'
                : 'bg-accent-500 hover:bg-accent-600 active:bg-accent-700 text-white'
            }`}
          >
            {recordingState.isRecording ? (
              <>
                <Square size={28} />
                <span>Stop Recording</span>
              </>
            ) : (
              <>
                <Mic size={28} />
                <span>Start Recording</span>
              </>
            )}
          </button>
        )}

        {recordingState.audioUrl && (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-semibold py-6 px-6 rounded-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[72px] text-lg shadow-lg active:scale-[0.98]"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={28} className="animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Check size={28} />
                <span>Save Recording</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ============ SUCCESS TOAST ============

interface SuccessToastProps {
  message: string;
  onDismiss: () => void;
}

function SuccessToast({ message, onDismiss }: SuccessToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom duration-300">
      <div className="bg-green-500 text-white rounded-xl p-4 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Check size={24} />
          <span className="font-medium">{message}</span>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-white/20 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}

// ============ MAIN CAPTURE PAGE ============

export function CapturePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isOnline, pendingCount, addToQueue, syncQueue } = useOfflineQueue();

  // Get mode from URL param (default to text)
  const mode = (searchParams.get('mode') as CaptureMode) || 'text';
  const [category, setCategory] = useState<CaptureCategory>('note');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPendingList, setShowPendingList] = useState(false);

  // Update mode in URL
  const handleModeChange = useCallback(
    (newMode: CaptureMode) => {
      setSearchParams({ mode: newMode });
    },
    [setSearchParams]
  );

  // Submit text capture
  const handleTextSubmit = async (data: TextCaptureRequest) => {
    setIsSubmitting(true);
    try {
      if (isOnline) {
        // Try direct API call first
        const endpoint =
          data.category === 'idea'
            ? '/api/v1/ideas'
            : data.category === 'task'
              ? '/api/v1/tasks'
              : '/api/v1/notes';

        const response = await fetch(`${API_BASE}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: data.title || 'Quick Capture',
            content: data.content,
            tags: data.tags || [],
          }),
        });

        if (response.ok) {
          setSuccessMessage(`${CATEGORY_CONFIG[data.category || 'note'].label} saved!`);
          return;
        }
        // If API fails, fall through to offline queue
      }

      // Add to offline queue
      await addToQueue({
        type: 'text',
        data,
      });
      setSuccessMessage(
        isOnline
          ? `${CATEGORY_CONFIG[data.category || 'note'].label} saved!`
          : `${CATEGORY_CONFIG[data.category || 'note'].label} queued for sync`
      );
    } catch (error) {
      console.error('Submit error:', error);
      // Add to queue as fallback
      await addToQueue({
        type: 'text',
        data,
      });
      setSuccessMessage(`${CATEGORY_CONFIG[data.category || 'note'].label} queued for sync`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit voice capture
  const handleVoiceSubmit = async (metadata: VoiceCaptureMetadata, audioBlob: Blob) => {
    setIsSubmitting(true);
    try {
      if (isOnline) {
        // Try direct API upload first
        const formData = new FormData();
        formData.append('audio', audioBlob, metadata.filename);
        if (metadata.duration) {
          formData.append('duration', String(metadata.duration));
        }

        const response = await fetch(`${API_BASE}/api/v1/captures/voice`, {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          setSuccessMessage('Voice note saved!');
          return;
        }
        // If API fails, fall through to offline queue
      }

      // Convert audio to base64 for offline storage
      const audioData = await blobToBase64(audioBlob);

      await addToQueue({
        type: 'voice',
        data: metadata,
        audioData,
      });
      setSuccessMessage(isOnline ? 'Voice note saved!' : 'Voice note queued for sync');
    } catch (error) {
      console.error('Submit error:', error);
      // Try adding to queue as fallback
      try {
        const audioData = await blobToBase64(audioBlob);
        await addToQueue({
          type: 'voice',
          data: metadata,
          audioData,
        });
        setSuccessMessage('Voice note queued for sync');
      } catch {
        setSuccessMessage('Failed to save voice note');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manual sync trigger
  const handleManualSync = async () => {
    if (!isOnline) return;
    setIsSubmitting(true);
    try {
      const result = await syncQueue();
      if (result.synced > 0) {
        setSuccessMessage(`Synced ${result.synced} item${result.synced > 1 ? 's' : ''}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-base text-text-primary flex flex-col">
      {/* Offline banner */}
      {!isOnline && <OfflineBanner pendingCount={pendingCount} />}

      {/* Header */}
      <header
        className={`sticky top-0 z-40 bg-surface-base/95 backdrop-blur-sm border-b border-border-default px-4 py-3 ${
          !isOnline ? 'mt-12' : ''
        }`}
      >
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-surface-elevated active:bg-surface-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-semibold">Quick Capture</h1>
          <button
            onClick={handleManualSync}
            disabled={!isOnline || pendingCount === 0 || isSubmitting}
            className="p-2 -mr-2 rounded-lg hover:bg-surface-elevated active:bg-surface-primary transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <RefreshCw size={22} className={isSubmitting ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col p-4 max-w-2xl mx-auto w-full">
        {/* Mode toggle */}
        <div className="mb-4">
          <ModeToggle mode={mode} onChange={handleModeChange} />
        </div>

        {/* Category selector (only for text mode) */}
        {mode === 'text' && (
          <div className="mb-4">
            <CategorySelector selected={category} onChange={setCategory} />
          </div>
        )}

        {/* Capture form */}
        <div className="flex-1 flex flex-col">
          {mode === 'text' ? (
            <TextCaptureForm
              onSubmit={handleTextSubmit}
              isSubmitting={isSubmitting}
              category={category}
            />
          ) : (
            <VoiceCaptureForm onSubmit={handleVoiceSubmit} isSubmitting={isSubmitting} />
          )}
        </div>
      </main>

      {/* Pending queue badge */}
      <PendingQueueBadge count={pendingCount} onClick={() => setShowPendingList(true)} />

      {/* Success toast */}
      {successMessage && (
        <SuccessToast message={successMessage} onDismiss={() => setSuccessMessage(null)} />
      )}

      {/* Pending list modal placeholder - can be expanded */}
      {showPendingList && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-surface-primary rounded-t-2xl w-full max-w-lg p-6 max-h-[70vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Pending Captures</h2>
              <button
                onClick={() => setShowPendingList(false)}
                className="p-2 rounded-lg hover:bg-surface-elevated min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>
            {pendingCount === 0 ? (
              <p className="text-text-secondary text-center py-8">No pending captures</p>
            ) : (
              <div className="space-y-3">
                <p className="text-text-secondary">
                  {pendingCount} capture{pendingCount > 1 ? 's' : ''} waiting to sync
                </p>
                <button
                  onClick={async () => {
                    await handleManualSync();
                    setShowPendingList(false);
                  }}
                  disabled={!isOnline || isSubmitting}
                  className="w-full bg-accent-500 hover:bg-accent-600 text-white font-medium py-3 px-4 rounded-xl disabled:opacity-50 min-h-[48px]"
                >
                  {isOnline ? 'Sync Now' : 'Waiting for connection...'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CapturePage;
