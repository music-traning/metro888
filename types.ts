
export enum PadState {
  Off = 0,
  Normal = 1,
  Accent = 2,
}

export type MeasurePads = PadState[];
export type Pattern = MeasurePads[];

export interface Preset {
  name: string;
  pattern: Pattern;
  beatsPerMeasure: number[];
}
