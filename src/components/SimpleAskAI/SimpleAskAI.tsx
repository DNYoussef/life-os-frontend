import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../Button';
import './SimpleAskAI.scss';

// Interfaces
interface Suggestion {
  category: string;
  questions: string[];
}

interface AskResponse {
  success: boolean;
  response?: string;
  image_url?: string;
  archetype_used?: string;
  method?: string;
  error?: string;
  mcp_instructions?: object;
  note?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  imageUrl?: string;
  timestamp: Date;
}

interface SimpleAskAIProps {
  apiBase?: string;
}

export const SimpleAskAI: React.FC<SimpleAskAIProps> = ({ apiBase }) => {
  const API_BASE = apiBase || import.meta.env.VITE_API_URL || 'https://life-os-dashboard-production.up.railway.app';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<{ status: string; cli_available: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Keyboard shortcut (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsExpanded(true);
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch suggestions and status on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/simple/suggestions/`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
        }
      } catch (err) {
        console.error('Failed to fetch suggestions:', err);
      }
    };

    const fetchStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/simple/status/`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        }
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    };

    fetchSuggestions();
    fetchStatus();
  }, [API_BASE]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/simple/ask/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: input.trim(),
          user_id: 'family'
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: AskResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Request failed');
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: data.response || data.note || 'Processing your request...',
        imageUrl: data.image_url,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    setIsExpanded(true);
    inputRef.current?.focus();
  };

  const getImageAltText = (imageUrl: string, prompt: string): string => {
    const imageType = imageUrl.includes('gemini') ? 'Gemini Imagen' : 'AI';
    return `${imageType} generated image based on prompt: ${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}`;
  };

  return (
    <div className={`simple-ask-ai-container ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="simple-ask-ai-card">
        {/* Header */}
        <header className="ask-header">
          <div className="header-left">
            <div className="sparkle-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="header-title">Life OS Intelligence</span>
          </div>
          <div className="header-right">
            {status && (
              <span
                className={`status-indicator ${status.cli_available ? 'online' : 'offline'}`}
                aria-label={status.cli_available ? 'AI is online' : 'AI is in browser mode'}
              >
                {status.cli_available ? 'Fast Mode' : 'Browser Mode'}
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="expand-btn"
              aria-label={isExpanded ? 'Minimize chat' : 'Expand chat'}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Message Area */}
        {isExpanded && (
          <div
            className="message-area"
            ref={scrollRef}
            role="log"
            aria-label="Conversation history"
            aria-live="polite"
          >
            {messages.length === 0 && !isTyping && (
              <div className="empty-state">
                <p>How can I assist with your objectives today?</p>
                {suggestions.length > 0 && (
                  <div className="suggestion-chips">
                    {suggestions.slice(0, 2).map((category, idx) => (
                      <div key={idx} className="chip-category">
                        <span className="chip-label">{category.category}</span>
                        <div className="chips">
                          {category.questions.slice(0, 2).map((q, qIdx) => (
                            <button
                              key={qIdx}
                              className="suggestion-chip"
                              onClick={() => handleSuggestionClick(q)}
                              aria-label={`Ask: ${q}`}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`message ${msg.role}`}
                aria-label={`${msg.role === 'user' ? 'You' : 'AI'} said`}
              >
                <div className="message-bubble">
                  <p>{msg.content}</p>
                  {msg.imageUrl && (
                    <div className="message-image">
                      <img
                        src={msg.imageUrl}
                        alt={getImageAltText(msg.imageUrl, messages[idx - 1]?.content || msg.content)}
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
                <span className="message-time" aria-hidden="true">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="typing-indicator" aria-label="AI is typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}

            {error && (
              <div className="error-message" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Input Area */}
        <div className="input-area">
          <div className="input-wrapper">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === 'Escape') {
                  setIsExpanded(false);
                }
              }}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ask anything..."
              aria-label="Type your question"
              disabled={isTyping}
            />
            <div className="input-actions">
              {!input && (
                <kbd className="keyboard-hint" aria-hidden="true">
                  <span className="cmd-key">Ctrl</span>
                  <span>K</span>
                </kbd>
              )}
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                aria-label="Send message"
                className="send-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="ask-footer">
          <p>Powered by Life OS Intelligence</p>
          <p className="hint">Tip: Say "generate an image of..." to create pictures</p>
        </footer>
      </div>
    </div>
  );
};

export default SimpleAskAI;
