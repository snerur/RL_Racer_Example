import type { RLParams, RewardWeights, SimSpeed } from '../types';

interface Props {
  rlParams: RLParams;
  rewardWeights: RewardWeights;
  simSpeed: SimSpeed;
  onRLParams: (p: Partial<RLParams>) => void;
  onRewardWeights: (w: Partial<RewardWeights>) => void;
  onSpeed: (s: SimSpeed) => void;
}

function Slider({
  label, value, min, max, step, onChange, format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  return (
    <div className="param-row">
      <div className="param-label">
        <span>{label}</span>
        <span className="param-value">{format ? format(value) : value.toFixed(3)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider"
      />
    </div>
  );
}

const SPEEDS: SimSpeed[] = [1, 5, 20, 50];

export function ParameterPanel({ rlParams, rewardWeights, simSpeed, onRLParams, onRewardWeights, onSpeed }: Props) {
  return (
    <div className="panel param-panel">
      <h3 className="panel-title">RL Hyperparameters</h3>

      <Slider label="Learning Rate (α)" value={rlParams.alpha} min={0.01} max={0.9} step={0.01}
        onChange={(v) => onRLParams({ alpha: v })} />
      <Slider label="Discount Factor (γ)" value={rlParams.gamma} min={0.5} max={0.999} step={0.001}
        onChange={(v) => onRLParams({ gamma: v })} />
      <Slider label="ε Decay (per episode)" value={rlParams.epsilonDecay} min={0.98} max={0.9999} step={0.0001}
        onChange={(v) => onRLParams({ epsilonDecay: v })} />
      <Slider label="ε Minimum" value={rlParams.epsilonMin} min={0.01} max={0.3} step={0.01}
        onChange={(v) => onRLParams({ epsilonMin: v })} />
      <Slider label="Max Steps / Episode" value={rlParams.maxSteps} min={200} max={5000} step={100}
        format={(v) => v.toString()}
        onChange={(v) => onRLParams({ maxSteps: v })} />

      <div className="section-divider" />
      <h3 className="panel-title">Reward Weights</h3>

      <Slider label="Center-Track Reward" value={rewardWeights.centerTrack} min={0} max={3} step={0.1}
        format={(v) => v.toFixed(1)}
        onChange={(v) => onRewardWeights({ centerTrack: v })} />
      <Slider label="Speed Reward" value={rewardWeights.speed} min={0} max={2} step={0.05}
        format={(v) => v.toFixed(2)}
        onChange={(v) => onRewardWeights({ speed: v })} />
      <Slider label="Lap Bonus" value={rewardWeights.lapBonus} min={10} max={500} step={10}
        format={(v) => v.toFixed(0)}
        onChange={(v) => onRewardWeights({ lapBonus: v })} />
      <Slider label="Off-Track Penalty" value={-rewardWeights.offTrackPenalty} min={10} max={200} step={5}
        format={(v) => `-${v.toFixed(0)}`}
        onChange={(v) => onRewardWeights({ offTrackPenalty: -v })} />
      <Slider label="Obstacle Penalty" value={-rewardWeights.obstaclePenalty} min={5} max={100} step={5}
        format={(v) => `-${v.toFixed(0)}`}
        onChange={(v) => onRewardWeights({ obstaclePenalty: -v })} />

      <div className="section-divider" />
      <h3 className="panel-title">Training Speed</h3>
      <div className="speed-buttons">
        {SPEEDS.map((s) => (
          <button
            key={s}
            className={`speed-btn ${simSpeed === s ? 'active' : ''}`}
            onClick={() => onSpeed(s)}
          >
            {s}×
          </button>
        ))}
      </div>
      <p className="speed-hint">{simSpeed} simulation step{simSpeed > 1 ? 's' : ''} per render frame</p>
    </div>
  );
}
