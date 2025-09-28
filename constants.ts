
import { PadState, Preset } from './types';

const { Off, Normal, Accent } = PadState;

const emptyPattern = (measures: number, beats: number): Preset => {
  return {
    name: 'Empty',
    pattern: Array(measures).fill(Array(beats).fill(Off)),
    beatsPerMeasure: Array(measures).fill(beats),
  };
};

const fullPattern = (measures: number, beats: number): Preset => {
  return {
    name: 'Full',
    pattern: Array(measures).fill(Array(beats).fill(Normal)),
    beatsPerMeasure: Array(measures).fill(beats),
  };
};

export const PRESETS: Preset[] = [
  {
    name: '--- Select a Preset ---',
    ...emptyPattern(4, 4),
  },
  {
    ...emptyPattern(4, 4),
    name: 'Empty (4/4)',
  },
  {
    ...fullPattern(4, 4),
    name: 'Full (4/4)',
  },
  {
    name: 'Jazz Swing (4/4)',
    beatsPerMeasure: [4, 4, 4, 4],
    pattern: [
      [Off, Accent, Off, Accent],
      [Off, Accent, Off, Accent],
      [Off, Accent, Off, Accent],
      [Off, Accent, Off, Accent],
    ],
  },
  {
    name: 'Basic Rock (4/4)',
    beatsPerMeasure: [4, 4, 4, 4],
    pattern: [
      [Accent, Normal, Accent, Normal],
      [Accent, Normal, Accent, Normal],
      [Accent, Normal, Accent, Normal],
      [Accent, Normal, Accent, Normal],
    ],
  },
  {
    name: 'Son Clave (4/4)',
    beatsPerMeasure: [4, 4, 4, 4],
    pattern: [
      [Accent, Off, Normal, Off],
      [Accent, Off, Off, Normal],
      [Off, Accent, Off, Off],
      [Off, Off, Off, Off],
    ],
  },
  {
      name: 'Bossa Nova (4/4)',
      beatsPerMeasure: [4, 4, 4, 4],
      pattern: [
        [Accent, Off, Normal, Off],
        [Accent, Normal, Off, Normal],
        [Accent, Off, Normal, Off],
        [Accent, Normal, Off, Normal],
      ],
  },
  {
      name: 'Reggae One Drop (4/4)',
      beatsPerMeasure: [4, 4, 4, 4],
      pattern: [
        [Off, Normal, Accent, Normal],
        [Off, Normal, Accent, Normal],
        [Off, Normal, Accent, Normal],
        [Off, Normal, Accent, Normal],
      ]
  },
  {
      name: 'Funk Groove 1 (4/4)',
      beatsPerMeasure: [4, 4, 4, 4],
      pattern: [
        [Accent, Normal, Normal, Accent],
        [Normal, Accent, Normal, Normal],
        [Accent, Normal, Normal, Accent],
        [Normal, Accent, Normal, Accent],
      ]
  },
  {
      name: 'Take Five (5/4)',
      beatsPerMeasure: [5, 5, 5, 5],
      pattern: [
        [Accent, Normal, Normal, Accent, Normal],
        [Accent, Normal, Normal, Accent, Normal],
        [Accent, Normal, Normal, Accent, Normal],
        [Accent, Normal, Normal, Accent, Normal],
      ]
  },
  {
      name: 'Waltz (3/4)',
      beatsPerMeasure: [3, 3, 3, 3],
      pattern: [
        [Accent, Normal, Normal],
        [Accent, Normal, Normal],
        [Accent, Normal, Normal],
        [Accent, Normal, Normal],
      ]
  }
];
