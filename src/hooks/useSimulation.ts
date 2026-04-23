import { useRef, useState, useCallback, useEffect } from 'react';
import type { RLParams, RewardWeights, SimStats, EpisodeRecord, SimSpeed } from '../types';
import type { ProcessedTrack } from '../types';
import { processTrack } from '../engine/trackGeometry';
import { createCar, stepCar } from '../engine/physics';
import { createQTable, discretize, selectAction, updateQ, decayEpsilon, resetQTable } from '../engine/qlearning';
import { computeReward, defaultRewardWeights } from '../engine/rewardFunction';
import { getTrack } from '../tracks';

export const DEFAULT_RL_PARAMS: RLParams = {
  alpha: 0.3,
  gamma: 0.95,
  epsilon: 1.0,
  epsilonDecay: 0.995,
  epsilonMin: 0.05,
  maxSteps: 2000,
};

function defaultStats(): SimStats {
  return {
    episode: 0,
    episodeStep: 0,
    episodeReward: 0,
    bestReward: -Infinity,
    lapCount: 0,
    epsilon: DEFAULT_RL_PARAMS.epsilon,
    qtableSize: 0,
    isRunning: false,
    isTraining: true,
    history: [],
  };
}

/**
 * Central simulation hook.
 *
 * Returns:
 *  • processedTrack — current track (for rendering + LLM context)
 *  • stats — current training statistics (React state, updated ~4×/sec)
 *  • rlParams / setRLParams — live hyperparameter control
 *  • rewardWeights / setRewardWeights
 *  • controls — start / stop / reset / setTrack / setMode / setSpeed
 *  • carRef — ref to mutable CarState (for the canvas renderer)
 *  • simCoreRef — ref to the inner simulation object (for the render loop)
 */
export function useSimulation() {
  // ── State visible to React UI ──────────────────────────────────────────────
  const [trackId, setTrackIdState] = useState<string>('oval');
  const [processedTrack, setProcessedTrack] = useState<ProcessedTrack>(() =>
    processTrack(getTrack('oval'))
  );
  const [stats, setStats] = useState<SimStats>(defaultStats);
  const [rlParams, setRLParams] = useState<RLParams>({ ...DEFAULT_RL_PARAMS });
  const [rewardWeights, setRewardWeights] = useState<RewardWeights>(defaultRewardWeights);
  const [simSpeed, setSimSpeed] = useState<SimSpeed>(5);
  const [mode, setMode] = useState<'training' | 'testing'>('training');

  // ── Mutable simulation core (NOT React state — avoids re-renders) ──────────
  const coreRef = useRef({
    car: createCar(processTrack(getTrack('oval'))),
    track: processTrack(getTrack('oval')),
    qtable: createQTable(),
    rlParams: { ...DEFAULT_RL_PARAMS },
    rewardWeights: defaultRewardWeights(),
    mode: 'training' as 'training' | 'testing',
    speed: 5 as SimSpeed,
    isRunning: false,
    episodeStep: 0,
    episodeReward: 0,
    episode: 0,
    bestReward: -Infinity,
    lapCount: 0,
    history: [] as EpisodeRecord[],
    prevLapCount: 0,
  });

  const animRef = useRef<number | null>(null);

  // ── Keep core in sync with React state ────────────────────────────────────
  useEffect(() => { coreRef.current.rlParams = { ...rlParams }; }, [rlParams]);
  useEffect(() => { coreRef.current.rewardWeights = { ...rewardWeights }; }, [rewardWeights]);
  useEffect(() => { coreRef.current.mode = mode; }, [mode]);
  useEffect(() => { coreRef.current.speed = simSpeed; }, [simSpeed]);

  // ── Stats polling (push to React state 4×/sec) ────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const c = coreRef.current;
      setStats({
        episode: c.episode,
        episodeStep: c.episodeStep,
        episodeReward: c.episodeReward,
        bestReward: c.bestReward === -Infinity ? 0 : c.bestReward,
        lapCount: c.lapCount,
        epsilon: c.rlParams.epsilon,
        qtableSize: c.qtable.size,
        isRunning: c.isRunning,
        isTraining: c.mode === 'training',
        history: [...c.history],
      });
    }, 250);
    return () => clearInterval(id);
  }, []);

  // ── Single simulation step ─────────────────────────────────────────────────
  const doStep = useCallback(() => {
    const c = coreRef.current;
    const { car, track, qtable, rlParams: rp, rewardWeights: rw, mode: m } = c;

    // Discretize current state
    const state = discretize(car, track.definition.trackWidth / 2);

    // Select action
    const eps = m === 'training' ? rp.epsilon : 0;
    const actionIdx = selectAction(qtable, state, eps);

    // Step physics
    const nextCar = stepCar(car, actionIdx, track);

    // Compute reward
    const { reward, done, lapCompleted } = computeReward(nextCar, c.prevLapCount, track, rw);

    // Update Q-table
    if (m === 'training') {
      const nextState = discretize(nextCar, track.definition.trackWidth / 2);
      updateQ(qtable, state, actionIdx, reward, nextState, done, rp);
    }

    c.episodeReward += reward;
    c.episodeStep += 1;
    c.car = nextCar;
    if (lapCompleted) {
      c.lapCount += 1;
      c.prevLapCount = nextCar.lapCount;
    }

    // ── Episode termination ─────────────────────────────────────────────────
    const episodeDone = done || c.episodeStep >= rp.maxSteps;
    if (episodeDone) {
      if (c.episodeReward > c.bestReward) c.bestReward = c.episodeReward;

      const record: EpisodeRecord = {
        episode: c.episode,
        reward: c.episodeReward,
        steps: c.episodeStep,
        laps: c.lapCount,
        epsilon: rp.epsilon,
      };
      c.history = [...c.history.slice(-499), record];

      if (m === 'training') decayEpsilon(rp);

      // Reset episode
      c.episode += 1;
      c.episodeStep = 0;
      c.episodeReward = 0;
      c.lapCount = 0;
      c.prevLapCount = 0;
      c.car = createCar(track);
    }
  }, []);

  // ── Animation loop ─────────────────────────────────────────────────────────
  const startLoop = useCallback(() => {
    const loop = () => {
      if (!coreRef.current.isRunning) return;
      const stepsThisFrame = coreRef.current.speed;
      for (let i = 0; i < stepsThisFrame; i++) {
        doStep();
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  }, [doStep]);

  const stopLoop = useCallback(() => {
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
  }, []);

  // ── Public controls ────────────────────────────────────────────────────────
  const start = useCallback(() => {
    coreRef.current.isRunning = true;
    startLoop();
  }, [startLoop]);

  const stop = useCallback(() => {
    coreRef.current.isRunning = false;
    stopLoop();
  }, [stopLoop]);

  const reset = useCallback(() => {
    stop();
    const c = coreRef.current;
    resetQTable(c.qtable);
    c.episode = 0;
    c.episodeStep = 0;
    c.episodeReward = 0;
    c.bestReward = -Infinity;
    c.lapCount = 0;
    c.prevLapCount = 0;
    c.history = [];
    c.rlParams.epsilon = DEFAULT_RL_PARAMS.epsilon;
    setRLParams((p) => ({ ...p, epsilon: DEFAULT_RL_PARAMS.epsilon }));
    c.car = createCar(c.track);
  }, [stop]);

  const selectTrack = useCallback((id: string) => {
    stop();
    const track = processTrack(getTrack(id));
    coreRef.current.track = track;
    coreRef.current.car = createCar(track);
    coreRef.current.episode = 0;
    coreRef.current.episodeStep = 0;
    coreRef.current.episodeReward = 0;
    coreRef.current.bestReward = -Infinity;
    coreRef.current.lapCount = 0;
    coreRef.current.prevLapCount = 0;
    coreRef.current.history = [];
    resetQTable(coreRef.current.qtable);
    coreRef.current.rlParams.epsilon = DEFAULT_RL_PARAMS.epsilon;
    setRLParams((p) => ({ ...p, epsilon: DEFAULT_RL_PARAMS.epsilon }));
    setTrackIdState(id);
    setProcessedTrack(track);
  }, [stop]);

  return {
    // Data
    processedTrack,
    trackId,
    stats,
    rlParams,
    rewardWeights,
    simSpeed,
    mode,
    // Core ref for canvas renderer
    coreRef,
    // Controls
    start,
    stop,
    reset,
    selectTrack,
    setRLParams,
    setRewardWeights,
    setSimSpeed,
    setMode,
  };
}
