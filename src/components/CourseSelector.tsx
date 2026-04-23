import { TRACKS } from '../tracks';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  disabled: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#4caf50',
  medium: '#ff9800',
  hard: '#f44336',
};

export function CourseSelector({ selectedId, onSelect, disabled }: Props) {
  return (
    <div className="panel course-panel">
      <h3 className="panel-title">Select Course</h3>
      <div className="track-list">
        {TRACKS.map((track) => (
          <button
            key={track.id}
            className={`track-card ${selectedId === track.id ? 'active' : ''}`}
            onClick={() => onSelect(track.id)}
            disabled={disabled}
          >
            <div className="track-card-header">
              <span className="track-name">{track.name}</span>
              <span
                className="track-difficulty"
                style={{ color: DIFFICULTY_COLORS[track.difficulty] }}
              >
                {track.difficulty.toUpperCase()}
              </span>
            </div>
            <p className="track-desc">{track.description}</p>
            <div className="track-meta">
              <span>Width: {track.trackWidth}px</span>
              {track.obstacles.length > 0 && (
                <span className="obstacle-badge">
                  ⚠ {track.obstacles.length} obstacle{track.obstacles.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      {disabled && (
        <p className="disabled-hint">Stop training to switch tracks</p>
      )}
    </div>
  );
}
