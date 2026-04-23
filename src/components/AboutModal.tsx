interface Props {
  onClose: () => void;
}

export function AboutModal({ onClose }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-logo">🏎</span>
            <h2 className="modal-title">About RL Racer</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">

          {/* Purpose */}
          <section className="about-section">
            <h3>What Is This?</h3>
            <p>
              RL Racer is an interactive browser simulation that teaches the core principles of
              <strong> Reinforcement Learning (RL)</strong> through a miniature racing car.
              The car learns entirely on its own — you set the parameters and watch it discover
              how to complete the track without any hand-coded rules.
            </p>
          </section>

          {/* How it works */}
          <section className="about-section">
            <h3>How the Car Learns — Q-Learning</h3>
            <p>
              The car uses <strong>Q-Learning</strong>, one of the foundational RL algorithms.
              At each moment, the car observes its <em>state</em> and chooses an <em>action</em>.
              Based on how well it does, it receives a <em>reward</em> (positive) or a <em>penalty</em>
              (negative). Over thousands of attempts, it builds a table of learned knowledge —
              the <strong>Q-table</strong> — mapping states to actions.
            </p>
            <div className="formula-box">
              <code>Q(s,a) ← Q(s,a) + α · [r + γ · max<sub>a'</sub>Q(s',a') − Q(s,a)]</code>
            </div>
            <p>
              This is the <strong>Bellman equation</strong>: it updates the value of taking action
              <em> a</em> in state <em>s</em> based on the reward received and the best future value
              the car expects from the next state <em>s'</em>.
            </p>
          </section>

          {/* State & actions */}
          <section className="about-section">
            <h3>State, Actions &amp; Rewards</h3>
            <div className="info-grid">
              <div className="info-card">
                <h4>🧭 State (252 total)</h4>
                <ul>
                  <li><strong>Cross-Track Error (CTE):</strong> How far left or right of center is the car? (9 bins)</li>
                  <li><strong>Heading Error:</strong> Is the car pointing toward or away from the track direction? (7 bins)</li>
                  <li><strong>Speed:</strong> How fast is the car moving? (4 bins)</li>
                </ul>
              </div>
              <div className="info-card">
                <h4>🎮 Actions (5 choices)</h4>
                <ul>
                  <li>Hard Left / Soft Left</li>
                  <li>Straight</li>
                  <li>Soft Right / Hard Right</li>
                </ul>
                <p className="info-note">Harder turns slow the car; straight maximises speed.</p>
              </div>
              <div className="info-card">
                <h4>🏆 Rewards &amp; Penalties</h4>
                <ul>
                  <li><strong>+</strong> Near track center (Gaussian bonus)</li>
                  <li><strong>+</strong> High forward speed</li>
                  <li><strong>+</strong> Completing a lap</li>
                  <li><strong>−</strong> Veering off the track (episode ends)</li>
                  <li><strong>−</strong> Hitting an obstacle</li>
                  <li><strong>−</strong> Small per-step penalty (encourages efficiency)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Parameters */}
          <section className="about-section">
            <h3>Tuning the Hyperparameters</h3>
            <div className="param-table">
              <div className="param-row-about">
                <span className="param-sym">α</span>
                <span className="param-name">Learning Rate</span>
                <span className="param-desc">How much each new experience overwrites old knowledge. Too high = unstable; too low = learns slowly.</span>
              </div>
              <div className="param-row-about">
                <span className="param-sym">γ</span>
                <span className="param-name">Discount Factor</span>
                <span className="param-desc">How much future rewards matter vs. immediate ones. Close to 1 = car plans far ahead.</span>
              </div>
              <div className="param-row-about">
                <span className="param-sym">ε</span>
                <span className="param-name">Exploration Rate</span>
                <span className="param-desc">Chance the car tries a random action instead of its best-known one. Decays over time so it exploits more as it learns.</span>
              </div>
              <div className="param-row-about">
                <span className="param-sym">↓ε</span>
                <span className="param-name">Epsilon Decay</span>
                <span className="param-desc">How quickly exploration reduces each episode. Faster decay = earlier commitment to learned policy.</span>
              </div>
            </div>
          </section>

          {/* Getting started */}
          <section className="about-section">
            <h3>Getting Started</h3>
            <ol className="steps">
              <li><strong>Select a track</strong> — start with <em>Oval Circuit</em> (easy) to see the car learn quickly.</li>
              <li><strong>Click ▶ Run</strong> — the car begins training with ε = 1.0 (fully random).</li>
              <li><strong>Watch ε decay</strong> — as episodes progress, random exploration gives way to learned behaviour.</li>
              <li><strong>Speed up training</strong> — use the 20× or 50× speed button to skip ahead.</li>
              <li><strong>Switch to Test mode</strong> — freeze the Q-table and watch the car exploit what it has learned (ε = 0).</li>
              <li><strong>Try harder tracks</strong> — once the oval is mastered, move to <em>Chicane Challenge</em> then <em>Grand Circuit</em>.</li>
              <li><strong>Enable Debug overlay 🔍</strong> — see the cross-track error line and heading error arc in real time.</li>
              <li><strong>Ask the Tutor</strong> — enter your Anthropic or OpenAI API key in the chat panel and ask anything about the simulation.</li>
            </ol>
          </section>

          {/* Tips */}
          <section className="about-section">
            <h3>Tips for Faster Learning</h3>
            <ul className="tips">
              <li>Increase <strong>α</strong> (e.g. 0.4–0.6) on easy tracks for faster Q-table updates.</li>
              <li>Keep <strong>γ</strong> high (0.95+) so the car values lap completion.</li>
              <li>Raise the <strong>Lap Bonus</strong> if the car rarely completes a lap — it motivates persistence.</li>
              <li>Increase the <strong>Off-Track Penalty</strong> on narrow tracks to discourage edge-grazing.</li>
              <li>Reset and retrain after changing reward weights — the Q-table may have learned the old objective.</li>
            </ul>
          </section>

          {/* Credit */}
          <section className="about-section about-credit">
            <p>
              Inspired by{' '}
              <a
                href="https://docs.aws.amazon.com/solutions/deepracer-on-aws/"
                className="credit-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                DeepRacer on AWS
              </a>
              .
            </p>
            <p style={{ marginTop: '8px' }}>
              Built by <a href="mailto:sridhar.nerur@gmail.com" className="credit-link">Sridhar Nerur</a> using <strong>Claude</strong> (Anthropic).
              To be used for <strong>educational purposes only</strong>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
