import type { TrackDefinition } from '../types';
import { ovalTrack } from './oval';
import { chianesTrack } from './chicanes';
import { circuitTrack } from './circuit';

export const TRACKS: TrackDefinition[] = [ovalTrack, chianesTrack, circuitTrack];

export function getTrack(id: string): TrackDefinition {
  return TRACKS.find((t) => t.id === id) ?? ovalTrack;
}
