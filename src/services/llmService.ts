import type { LLMConfig, ChatMessage, SimStats, ProcessedTrack, RLParams, RewardWeights } from '../types';

// ── System prompt builder ─────────────────────────────────────────────────────

export function buildSystemPrompt(
  stats: SimStats,
  track: ProcessedTrack | null,
  rlParams: RLParams,
  weights: RewardWeights
): string {
  const t = track?.definition;
  return `You are an expert AI tutor for RL Racer, a reinforcement learning simulation.
The simulation uses Q-learning to teach a miniature car to complete a race track.

CURRENT SIMULATION STATE
━━━━━━━━━━━━━━━━━━━━━━━━
Track:          ${t ? `${t.name} (${t.difficulty})` : 'None selected'}
Track width:    ${t ? t.trackWidth + ' px' : '—'}
Obstacles:      ${t ? t.obstacles.length : 0}
Episode:        ${stats.episode}
Episode step:   ${stats.episodeStep}
Episode reward: ${stats.episodeReward.toFixed(2)}
Best reward:    ${stats.bestReward.toFixed(2)}
Laps completed: ${stats.lapCount}
Mode:           ${stats.isTraining ? 'Training (ε-greedy)' : 'Testing (greedy/exploit)'}

RL HYPERPARAMETERS
━━━━━━━━━━━━━━━━━━
Learning rate (α):    ${rlParams.alpha}
Discount factor (γ):  ${rlParams.gamma}
Epsilon (ε):          ${rlParams.epsilon.toFixed(4)}
Epsilon decay:        ${rlParams.epsilonDecay} per episode
Epsilon min:          ${rlParams.epsilonMin}
Max steps/episode:    ${rlParams.maxSteps}

REWARD WEIGHTS
━━━━━━━━━━━━━━
Center-track:     ${weights.centerTrack}
Speed:            ${weights.speed}
Lap bonus:        ${weights.lapBonus}
Off-track:        ${weights.offTrackPenalty}
Obstacle hit:     ${weights.obstaclePenalty}
Step penalty:     ${weights.stepPenalty}

Q-TABLE STATS
━━━━━━━━━━━━━
States explored: ${stats.qtableSize} / 252

HOW THE SIMULATION WORKS
━━━━━━━━━━━━━━━━━━━━━━━━
• The track is represented as a dense centerline of points.
• State = (cross-track error bin [9], heading-error bin [7], speed bin [4]) → 252 states
• Actions: Hard Left, Soft Left, Straight, Soft Right, Hard Right (5 discrete actions)
• The Bellman update: Q(s,a) ← Q(s,a) + α·[r + γ·max_a'Q(s',a') - Q(s,a)]
• Off-track terminates the episode; obstacles incur a penalty but do not end the episode.
• ε-greedy: at each step, explore randomly with probability ε, exploit with (1-ε).

GUIDANCE STYLE
━━━━━━━━━━━━━━
Explain clearly and encourage the user. Relate concepts to what they can see happening.
Use analogies to driving. Keep answers focused and educational.
If asked to suggest parameters, base suggestions on the current training state.`;
}

// ── Anthropic API ─────────────────────────────────────────────────────────────

async function callAnthropic(
  config: LLMConfig,
  systemPrompt: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal: AbortSignal
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          full += parsed.delta.text;
          onChunk(parsed.delta.text);
        }
      } catch {
        // ignore parse errors on non-JSON lines
      }
    }
  }

  return full;
}

// ── OpenAI API ────────────────────────────────────────────────────────────────

async function callOpenAI(
  config: LLMConfig,
  systemPrompt: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal: AbortSignal
): Promise<string> {
  const oaiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 1024,
      stream: true,
      messages: oaiMessages,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let full = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) {
          full += text;
          onChunk(text);
        }
      } catch {
        // ignore
      }
    }
  }

  return full;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Send a chat message to the configured LLM provider with streaming.
 *
 * @param onChunk  called with each streamed text fragment (for live display)
 * @param signal   AbortController signal to cancel mid-stream
 * @returns        the full assistant response
 */
export async function sendChatMessage(
  config: LLMConfig,
  systemPrompt: string,
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  signal: AbortSignal
): Promise<string> {
  if (!config.apiKey.trim()) throw new Error('Please enter your API key in the LLM panel.');

  if (config.provider === 'anthropic') {
    return callAnthropic(config, systemPrompt, messages, onChunk, signal);
  } else {
    return callOpenAI(config, systemPrompt, messages, onChunk, signal);
  }
}
