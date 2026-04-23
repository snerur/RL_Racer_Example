import { useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { SimulationCanvas } from './components/SimulationCanvas';
import { ParameterPanel } from './components/ParameterPanel';
import { CourseSelector } from './components/CourseSelector';
import { StatsPanel } from './components/StatsPanel';
import { RewardChart } from './components/RewardChart';
import { LLMChat } from './components/LLMChat';
import { AboutModal } from './components/AboutModal';

export default function App() {
  const {
    processedTrack,
    trackId,
    stats,
    rlParams,
    rewardWeights,
    simSpeed,
    mode,
    coreRef,
    start,
    stop,
    reset,
    selectTrack,
    setRLParams,
    setRewardWeights,
    setSimSpeed,
    setMode,
  } = useSimulation();

  const [showDebug, setShowDebug] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div className="app">
      {/* ── About modal ───────────────────────────────────────────────── */}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="app-header">
        <div className="header-left">
          <span className="header-logo">🏎</span>
          <div>
            <h1 className="header-title">Deep Racer RL</h1>
            <p className="header-subtitle">Q-Learning Reinforcement Learning Simulation</p>
          </div>
        </div>
        <div className="header-center">
          <span className="badge badge-states">252 States</span>
          <span className="badge badge-actions">5 Actions</span>
          <span className="badge badge-algo">Q-Learning</span>
        </div>
        <div className="header-right">
          <button className="btn-about" onClick={() => setShowAbout(true)}>
            ℹ About the Game
          </button>
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <main className="app-main">
        {/* Left sidebar */}
        <aside className="left-panel">
          <CourseSelector
            selectedId={trackId}
            onSelect={selectTrack}
            disabled={stats.isRunning}
          />
          <ParameterPanel
            rlParams={rlParams}
            rewardWeights={rewardWeights}
            simSpeed={simSpeed}
            onRLParams={(p) => setRLParams((prev) => ({ ...prev, ...p }))}
            onRewardWeights={(w) => setRewardWeights((prev) => ({ ...prev, ...w }))}
            onSpeed={setSimSpeed}
          />
        </aside>

        {/* Center — canvas + stats */}
        <section className="center-panel">
          <StatsPanel
            stats={stats}
            mode={mode}
            onModeChange={setMode}
            onStart={start}
            onStop={stop}
            onReset={reset}
            onDebugToggle={() => setShowDebug((d) => !d)}
            showDebug={showDebug}
          />
          <SimulationCanvas
            processedTrack={processedTrack}
            coreRef={coreRef as React.MutableRefObject<{
              car: import('./types').CarState;
              track: import('./types').ProcessedTrack;
              episode: number;
              episodeStep: number;
              episodeReward: number;
              rlParams: import('./types').RLParams;
              mode: 'training' | 'testing';
              isRunning: boolean;
            }>}
            showDebug={showDebug}
          />
        </section>

        {/* Right sidebar */}
        <aside className="right-panel">
          <RewardChart history={stats.history} />
          <LLMChat
            stats={stats}
            processedTrack={processedTrack}
            rlParams={rlParams}
            rewardWeights={rewardWeights}
          />
        </aside>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="app-footer">
        <span>Bellman: Q(s,a) ← Q(s,a) + α · [r + γ · max<sub>a'</sub>Q(s',a') − Q(s,a)]</span>
        <span className="footer-credit">
          Inspired by{' '}
          <a
            href="https://docs.aws.amazon.com/solutions/deepracer-on-aws/"
            className="footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            DeepRacer on AWS
          </a>
          {' '}· Built by{' '}
          <a href="mailto:sridhar.nerur@gmail.com" className="footer-link">
            Sridhar Nerur
          </a>{' '}
          using Claude · Educational purposes only
        </span>
      </footer>
    </div>
  );
}
