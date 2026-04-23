import type { SimStats } from '../types';

interface Props {
  stats: SimStats;
  mode: 'training' | 'testing';
  onModeChange: (m: 'training' | 'testing') => void;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onDebugToggle: () => void;
  showDebug: boolean;
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${accent ? 'accent' : ''}`}>{value}</span>
    </div>
  );
}

export function StatsPanel({
  stats,
  mode,
  onModeChange,
  onStart,
  onStop,
  onReset,
  onDebugToggle,
  showDebug,
}: Props) {
  return (
    <div className="panel stats-panel">
      {/* Controls */}
      <div className="control-row">
        <button
          className={`btn btn-primary ${stats.isRunning ? 'hidden' : ''}`}
          onClick={onStart}
          disabled={stats.isRunning}
        >
          ▶ Run
        </button>
        <button
          className={`btn btn-warning ${!stats.isRunning ? 'hidden' : ''}`}
          onClick={onStop}
          disabled={!stats.isRunning}
        >
          ⏸ Pause
        </button>
        <button className="btn btn-danger" onClick={onReset}>
          ↺ Reset
        </button>
        <div className="mode-toggle">
          <button
            className={`mode-btn ${mode === 'training' ? 'active' : ''}`}
            onClick={() => onModeChange('training')}
          >
            Train
          </button>
          <button
            className={`mode-btn ${mode === 'testing' ? 'active' : ''}`}
            onClick={() => onModeChange('testing')}
          >
            Test
          </button>
        </div>
        <button
          className={`btn btn-ghost ${showDebug ? 'active' : ''}`}
          onClick={onDebugToggle}
          title="Toggle debug overlay (CTE line + heading error arc)"
        >
          🔍
        </button>
      </div>

      {/* Live stats */}
      <div className="stats-grid">
        <Stat label="Episode" value={stats.episode} accent />
        <Stat label="Step" value={stats.episodeStep} />
        <Stat label="Ep Reward" value={stats.episodeReward.toFixed(1)} accent />
        <Stat label="Best Reward" value={stats.bestReward <= 0 && stats.bestReward !== 0
          ? stats.bestReward.toFixed(1) : (stats.bestReward > 0 ? stats.bestReward.toFixed(1) : '—')} />
        <Stat label="Laps" value={stats.lapCount} />
        <Stat label="ε (epsilon)" value={stats.epsilon.toFixed(4)} />
        <Stat label="Q-states" value={`${stats.qtableSize} / 252`} />
        <Stat label="Status" value={stats.isRunning ? (mode === 'training' ? 'Training' : 'Testing') : 'Paused'} accent />
      </div>

      {/* Epsilon progress bar */}
      <div className="epsilon-bar-container">
        <span className="epsilon-bar-label">Exploration (ε)</span>
        <div className="epsilon-bar">
          <div
            className="epsilon-fill"
            style={{ width: `${Math.round(stats.epsilon * 100)}%` }}
          />
        </div>
        <span className="epsilon-pct">{Math.round(stats.epsilon * 100)}%</span>
      </div>
    </div>
  );
}
