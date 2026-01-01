import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  tokens?: number;
  executionTime?: number;
  timestamp: Date;
}

interface Provider {
  provider: string;
  available: boolean;
  model: string;
  description: string;
}

interface CLIBridgeProps {
  apiBase: string;
}

export function CLIBridge({ apiBase }: CLIBridgeProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [provider, setProvider] = useState<string>('claude');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available providers on mount
  useEffect(() => {
    fetchProviders();
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${apiBase}/api/v1/cli/providers`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
      }
    } catch (err) {
      console.error('Failed to fetch providers:', err);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/v1/cli/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: input,
          provider: provider,
          conversation_id: conversationId,
          max_tokens: 2048,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to get response');
      }

      const data = await response.json();

      // Update conversation ID if this is first message
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      const assistantMessage: Message = {
        id: data.id,
        role: 'assistant',
        content: data.response,
        provider: data.provider,
        model: data.model,
        tokens: data.tokens_used,
        executionTime: data.execution_time_ms,
        timestamp: new Date(data.created_at)
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const getProviderColor = (p: string) => {
    switch (p) {
      case 'claude': return '#cc785c';
      case 'gemini': return '#4285f4';
      case 'openai': return '#10a37f';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="cli-bridge">
      <div className="cli-header">
        <div className="cli-controls">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="cli-provider-select"
          >
            {providers.length > 0 ? (
              providers.map(p => (
                <option key={p.provider} value={p.provider} disabled={!p.available}>
                  {p.provider.charAt(0).toUpperCase() + p.provider.slice(1)}
                  {!p.available && ' (Not configured)'}
                </option>
              ))
            ) : (
              <>
                <option value="claude">Claude</option>
                <option value="gemini">Gemini</option>
                <option value="openai">OpenAI</option>
              </>
            )}
          </select>
          <button onClick={clearConversation} className="cli-clear-btn">
            Clear
          </button>
        </div>
        {conversationId && (
          <span className="cli-conversation-id">
            Session: {conversationId.slice(0, 8)}...
          </span>
        )}
      </div>

      <div className="cli-messages">
        {messages.length === 0 && (
          <div className="cli-empty">
            <p>Send a message to start a conversation</p>
            <p className="cli-hint">
              Try: "Explain async/await in Python" or "Write a React component for a todo list"
            </p>
          </div>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`cli-message cli-message-${msg.role}`}>
            <div className="cli-message-header">
              <span className="cli-message-role">
                {msg.role === 'user' ? 'You' : (
                  <span style={{ color: getProviderColor(msg.provider || '') }}>
                    {msg.provider?.charAt(0).toUpperCase()}{msg.provider?.slice(1)}
                  </span>
                )}
              </span>
              {msg.role === 'assistant' && msg.model && (
                <span className="cli-message-meta">
                  {msg.model} | {msg.tokens} tokens | {msg.executionTime}ms
                </span>
              )}
            </div>
            <div className="cli-message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="cli-message cli-message-assistant cli-loading">
            <div className="cli-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="error-with-retry">
          <span className="error-message">{error}</span>
          <button className="retry-btn" onClick={() => { setError(null); sendMessage(); }}>
            Retry
          </button>
        </div>
      )}

      <div className="cli-input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
          className="cli-input"
          rows={3}
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          className="cli-send-btn"
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
