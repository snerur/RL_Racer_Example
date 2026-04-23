import { useState, useRef, useEffect, useCallback } from 'react';
import type { LLMConfig, LLMProvider, ChatMessage, SimStats, ProcessedTrack, RLParams, RewardWeights } from '../types';
import { ANTHROPIC_MODELS, OPENAI_MODELS } from '../types';
import { sendChatMessage, buildSystemPrompt } from '../services/llmService';

interface Props {
  stats: SimStats;
  processedTrack: ProcessedTrack | null;
  rlParams: RLParams;
  rewardWeights: RewardWeights;
}

function newId() {
  return Math.random().toString(36).slice(2);
}

export function LLMChat({ stats, processedTrack, rlParams, rewardWeights }: Props) {
  const [config, setConfig] = useState<LLMConfig>({
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
    apiKey: '',
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const models = config.provider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS;

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleProviderChange = (p: LLMProvider) => {
    const model = p === 'anthropic' ? ANTHROPIC_MODELS[0] : OPENAI_MODELS[0];
    setConfig((c) => ({ ...c, provider: p, model }));
  };

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = { id: newId(), role: 'user', content: trimmed };
    const assistantId = newId();
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', content: '', isStreaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setIsLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const systemPrompt = buildSystemPrompt(stats, processedTrack, rlParams, rewardWeights);
    // Build history for the API (exclude the in-progress assistant message)
    const historyForAPI: ChatMessage[] = [...messages, userMsg];

    try {
      await sendChatMessage(
        config,
        systemPrompt,
        historyForAPI,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        },
        ctrl.signal
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg !== 'AbortError') {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `Error: ${errMsg}`, isStreaming: false }
              : m
          )
        );
      }
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      );
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [input, isLoading, messages, config, stats, processedTrack, rlParams, rewardWeights]);

  const cancel = () => {
    abortRef.current?.abort();
  };

  const clearChat = () => {
    setMessages([]);
  };

  const STARTER_QUESTIONS = [
    'Why does ε decrease over time?',
    'How does learning rate α affect training?',
    'What does the discount factor γ do?',
    'Why is the car going off-track?',
    'How should I tune parameters for the hard track?',
  ];

  return (
    <div className="panel llm-panel">
      <div className="llm-header">
        <h3 className="panel-title" style={{ margin: 0 }}>Ask the RL Tutor</h3>
        <div className="llm-header-actions">
          <button className="icon-btn" onClick={() => setConfigOpen((o) => !o)} title="Configure LLM">⚙</button>
          <button className="icon-btn" onClick={clearChat} title="Clear chat">🗑</button>
        </div>
      </div>

      {/* Config drawer */}
      {configOpen && (
        <div className="llm-config">
          <div className="config-row">
            <label>Provider</label>
            <div className="mode-toggle">
              <button className={`mode-btn ${config.provider === 'anthropic' ? 'active' : ''}`}
                onClick={() => handleProviderChange('anthropic')}>Anthropic</button>
              <button className={`mode-btn ${config.provider === 'openai' ? 'active' : ''}`}
                onClick={() => handleProviderChange('openai')}>OpenAI</button>
            </div>
          </div>
          <div className="config-row">
            <label>Model</label>
            <select
              value={config.model}
              onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
              className="select"
            >
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="config-row">
            <label>API Key</label>
            <div className="api-key-row">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={`${config.provider === 'anthropic' ? 'sk-ant-...' : 'sk-...'}`}
                value={config.apiKey}
                onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                className="api-key-input"
              />
              <button className="icon-btn" onClick={() => setShowKey((s) => !s)}>
                {showKey ? '🙈' : '👁'}
              </button>
            </div>
          </div>
          <p className="config-note">Keys are stored in memory only — never sent to our servers.</p>
        </div>
      )}

      {/* Message history */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Ask me anything about this RL simulation!</p>
            <div className="starter-questions">
              {STARTER_QUESTIONS.map((q) => (
                <button key={q} className="starter-q" onClick={() => setInput(q)}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-bubble ${msg.role}`}>
            <div className="bubble-role">{msg.role === 'user' ? 'You' : '🤖 Tutor'}</div>
            <div className="bubble-content">
              {msg.content || (msg.isStreaming ? <span className="typing-dots">···</span> : '')}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-row">
        <textarea
          className="chat-input"
          placeholder="Ask about RL concepts, parameter tuning, car behavior…"
          value={input}
          rows={2}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={isLoading}
        />
        {isLoading ? (
          <button className="btn btn-danger send-btn" onClick={cancel}>■ Stop</button>
        ) : (
          <button className="btn btn-primary send-btn" onClick={send} disabled={!input.trim()}>
            ↑ Send
          </button>
        )}
      </div>
    </div>
  );
}
