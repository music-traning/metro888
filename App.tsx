import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PadState, Pattern } from './types';
import { PRESETS } from './constants';
import MetronomePad from './components/MetronomePad';
import PresetSelector from './components/PresetSelector';
import RecordControls from './components/RecordControls';
import Countdown from './components/Countdown';

const MAX_MEASURES = 8;

const App: React.FC = () => {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const [bpm, setBpm] = useState<number>(60);
    const [volume, setVolume] = useState<number>(0.75);
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [isRecording, setIsRecording] = useState<boolean>(false);
    
    const [pattern, setPattern] = useState<Pattern>(PRESETS[1].pattern);
    const [numMeasures, setNumMeasures] = useState<number>(PRESETS[1].beatsPerMeasure.length);
    const [beatsPerMeasure, setBeatsPerMeasure] = useState<number[]>(PRESETS[1].beatsPerMeasure);

    const [currentMeasure, setCurrentMeasure] = useState<number>(-1);
    const [currentBeat, setCurrentBeat] = useState<number>(-1);

    const [countdown, setCountdown] = useState<number>(0);
    const [isCountdownEnabled, setIsCountdownEnabled] = useState<boolean>(true);

    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);
    const schedulerTimerRef = useRef<number | null>(null);
    const nextNoteTimeRef = useRef<number>(0);
    const noteProgressRef = useRef({ measure: 0, beat: 0 });
    const isPlayingRef = useRef(false);
    const countdownTimerRef = useRef<number | null>(null);
    const allTimersRef = useRef<number[]>([]);
    
    const lookahead = 25.0; // ms
    const scheduleAheadTime = 0.1; // seconds

    const isDesktop = useMemo(() => isClient && window.innerWidth >= 768, [isClient]);

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    const initAudio = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            gainNodeRef.current = audioContextRef.current.createGain();
            gainNodeRef.current.connect(audioContextRef.current.destination);
            gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        }
    }, [volume]);

    const playSound = useCallback((time: number, state: PadState) => {
        if (!audioContextRef.current || !gainNodeRef.current || state === PadState.Off) return;

        const context = audioContextRef.current;
        const envelope = context.createGain();
        envelope.connect(gainNodeRef.current);

        const osc = context.createOscillator();
        osc.connect(envelope);

        const freq = state === PadState.Accent ? 1000 : 800;
        const decay = 0.08; // Shorter decay for a "tighter", sharper sound

        osc.type = 'triangle'; // Triangle wave has more harmonics for a sharper tone
        osc.frequency.setValueAtTime(freq, time);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, time + decay);

        envelope.gain.setValueAtTime(1, time);
        envelope.gain.exponentialRampToValueAtTime(0.0001, time + decay);

        osc.start(time);
        osc.stop(time + decay);
    }, []);

    const scheduleNotes = useCallback(() => {
        if(!audioContextRef.current) return;

        const subdivisionInterval = 60.0 / (bpm * 4);

        while (nextNoteTimeRef.current < audioContextRef.current.currentTime + scheduleAheadTime) {
            const { measure, beat } = noteProgressRef.current;
            const time = nextNoteTimeRef.current;

            const visualUpdateTimeout = window.setTimeout(() => {
                if (isPlayingRef.current) {
                    setCurrentMeasure(measure);
                    setCurrentBeat(beat);
                }
            }, (time - audioContextRef.current.currentTime) * 1000);
            allTimersRef.current.push(visualUpdateTimeout);

            if (pattern[measure] && pattern[measure][beat] !== undefined) {
                const padState = pattern[measure][beat];
                if (padState !== PadState.Off) {
                    playSound(time, padState);
                }
            }
            
            let nextBeat = beat + 1;
            let nextMeasure = measure;

            if (nextBeat >= beatsPerMeasure[measure]) {
                nextBeat = 0;
                nextMeasure = (measure + 1) % numMeasures;
            }
            
            noteProgressRef.current = { measure: nextMeasure, beat: nextBeat };
            
            nextNoteTimeRef.current += subdivisionInterval;
        }
    }, [bpm, pattern, numMeasures, beatsPerMeasure, playSound]);

    const scheduler = useCallback(() => {
        if (isPlayingRef.current) {
            scheduleNotes();
            schedulerTimerRef.current = window.setTimeout(scheduler, lookahead);
        }
    }, [scheduleNotes]);
    
    const stop = useCallback(() => {
        setIsPlaying(false);
        if (schedulerTimerRef.current) {
            clearTimeout(schedulerTimerRef.current);
            schedulerTimerRef.current = null;
        }
        if (countdownTimerRef.current) {
            clearTimeout(countdownTimerRef.current);
            countdownTimerRef.current = null;
        }
        allTimersRef.current.forEach(clearTimeout);
        allTimersRef.current = [];
        setCountdown(0);
        setCurrentMeasure(-1);
        setCurrentBeat(-1);
    }, []);

    const start = useCallback(() => {
        initAudio();
        const context = audioContextRef.current;
        if (!context) return;
        
        if (context.state === 'suspended') {
            context.resume();
        }

        if (isCountdownEnabled) {
            setCountdown(1); // Set to 1 to show the first beat immediately
            const beatInterval = 60.0 / bpm;
            const startTime = context.currentTime + 0.1;
            
            allTimersRef.current.forEach(clearTimeout);
            allTimersRef.current = [];

            for (let i = 0; i < 4; i++) {
                const time = startTime + i * beatInterval;
                playSound(time, PadState.Accent);
                
                const visualTimeout = window.setTimeout(() => {
                    // We want to display 1, 2, 3, 4
                    setCountdown(i + 1);
                }, (time - context.currentTime) * 1000);
                allTimersRef.current.push(visualTimeout);
            }

            const metronomeStartTime = startTime + 4 * beatInterval;
            nextNoteTimeRef.current = metronomeStartTime;

            if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
            countdownTimerRef.current = window.setTimeout(() => {
                setIsPlaying(true);
                setCountdown(0);
                allTimersRef.current = [];
            }, (metronomeStartTime - context.currentTime) * 1000);
            
        } else {
            nextNoteTimeRef.current = context.currentTime;
            setIsPlaying(true);
        }
    }, [isCountdownEnabled, bpm, playSound, initAudio]);

    useEffect(() => {
        if (isPlaying) {
            if (!audioContextRef.current) return;
            // nextNoteTimeRef is now set precisely by the `start` function
            // before `isPlaying` is set to true.
            noteProgressRef.current = { measure: 0, beat: 0 };
            setCurrentMeasure(0);
            setCurrentBeat(0);
            scheduler();
        } 
    }, [isPlaying, scheduler]);

    const handlePlay = () => {
        if (!isPlaying && countdown === 0) start();
        else stop();
    };

    const handleRecordStart = () => {
        start();
        setIsRecording(true);
    };

    const handleRecordStop = () => {
        stop();
        setIsRecording(false);
    };

    useEffect(() => {
        if (gainNodeRef.current && audioContextRef.current) {
            gainNodeRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        }
    }, [volume]);

    const updatePadState = (measureIndex: number, padIndex: number) => {
        const newPattern = pattern.map(m => [...m]);
        const currentPad = newPattern[measureIndex][padIndex];
        newPattern[measureIndex][padIndex] = (currentPad + 1) % 3 as PadState;
        setPattern(newPattern);
    };

    const handleNumMeasuresChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newNum = parseInt(e.target.value, 10);
        const diff = newNum - numMeasures;
        
        if (diff > 0) {
            const newMeasures = Array(diff).fill(null).map(() => Array(4).fill(PadState.Off));
            const newBeats = Array(diff).fill(4);
            setPattern(p => [...p.slice(0, numMeasures), ...newMeasures]);
            setBeatsPerMeasure(b => [...b.slice(0, numMeasures), ...newBeats]);
        }
        
        setNumMeasures(newNum);
    };

    const handleBeatsPerMeasureChange = (measureIndex: number, newBeats: number) => {
        const newBeatsArray = [...beatsPerMeasure];
        newBeatsArray[measureIndex] = newBeats;
        setBeatsPerMeasure(newBeatsArray);

        const newPattern = pattern.map((m, i) => {
            if (i !== measureIndex) return [...m];

            const currentBeats = m.length;
            if (newBeats > currentBeats) {
                return [...m, ...Array(newBeats - currentBeats).fill(PadState.Off)];
            } else {
                return m.slice(0, newBeats);
            }
        });
        setPattern(newPattern);
    };

    const isBusy = isPlaying || isRecording || countdown > 0;

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col p-4">
            {countdown > 0 && <Countdown count={countdown} bpm={bpm} />}
            <header className="text-center mb-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500">
                    Click Metronome
                </h1>
                <p className="text-gray-400 mt-1">Craft Your Rhythm, Perfect Your Timing.</p>
            </header>

            <main className="flex-grow w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">
                <div className="bg-gray-800 p-4 rounded-xl shadow-lg flex flex-col gap-4 self-start">
                    {/* Controls */}
                    <div className="flex flex-col items-center">
                        <label htmlFor="bpm" className="text-sm font-medium text-gray-400">BPM: <span className="text-teal-400 font-bold text-lg">{bpm}</span></label>
                        <input
                            type="range" id="bpm" min="20" max="300" value={bpm}
                            onChange={(e) => setBpm(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                            disabled={isBusy}
                        />
                    </div>
                    <div className="flex flex-col items-center">
                        <label htmlFor="volume" className="text-sm font-medium text-gray-400">Volume</label>
                        <input
                            type="range" id="volume" min="0" max="1" step="0.01" value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </div>
                    <div className="flex flex-col items-center">
                        <label htmlFor="presets" className="text-sm font-medium text-gray-400">Presets</label>
                        <PresetSelector 
                            onSelect={(preset) => {
                                setPattern(preset.pattern);
                                setBeatsPerMeasure(preset.beatsPerMeasure);
                                setNumMeasures(preset.beatsPerMeasure.length);
                            }}
                            disabled={isBusy}
                        />
                    </div>
                     <div className="flex items-center gap-4">
                         <label htmlFor="numMeasures" className="text-sm font-medium text-gray-400">Measures:</label>
                         <select
                             id="numMeasures" value={numMeasures} onChange={handleNumMeasuresChange} disabled={isBusy}
                             className="w-full bg-gray-700 text-white border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 py-2"
                         >
                             {Array.from({ length: MAX_MEASURES }, (_, i) => i + 1).map(num => (
                                 <option key={num} value={num}>{num}</option>
                             ))}
                         </select>
                     </div>

                    <div className="flex justify-center items-center gap-4 pt-2 border-t border-gray-700">
                        <button
                            onClick={handlePlay}
                            className={`px-8 py-3 rounded-lg font-bold text-lg transition-all duration-200 ${isBusy && !isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-500 hover:bg-teal-600'} text-white shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed`}
                             disabled={isRecording}
                        >
                            {isBusy && !isRecording ? 'Stop' : 'Play'}
                        </button>
                        <div className="flex items-center space-x-2">
                            <input 
                                type="checkbox" id="countdown-toggle" checked={isCountdownEnabled} onChange={(e) => setIsCountdownEnabled(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-teal-600 focus:ring-teal-500"
                            />
                            <label htmlFor="countdown-toggle" className="text-sm text-gray-400">Countdown</label>
                        </div>
                    </div>
                    {isDesktop && (
                        <RecordControls 
                            isRecording={isRecording}
                            isPlaying={isPlaying}
                            onRecordStart={handleRecordStart}
                            onRecordStop={handleRecordStop}
                            isBusy={isBusy}
                        />
                    )}
                </div>
                
                <div className="bg-gray-800/50 p-4 rounded-xl shadow-inner flex-grow">
                    <div className="space-y-3">
                        {pattern.slice(0, numMeasures).map((measurePads, measureIndex) => (
                            <div key={measureIndex} className="flex items-center gap-3 p-2 bg-gray-900/40 rounded-lg">
                                <span className="font-mono text-lg text-gray-400 w-6 text-center">{measureIndex + 1}</span>
                                <div className="flex-grow grid grid-cols-8 gap-1.5">
                                    {measurePads.map((padState, padIndex) => (
                                        <MetronomePad
                                            key={padIndex}
                                            state={padState}
                                            isActive={isPlaying && currentMeasure === measureIndex && currentBeat === padIndex}
                                            onClick={() => updatePadState(measureIndex, padIndex)}
                                        />
                                    ))}
                                </div>
                                <select 
                                    value={beatsPerMeasure[measureIndex]} 
                                    onChange={(e) => handleBeatsPerMeasureChange(measureIndex, parseInt(e.target.value, 10))}
                                    disabled={isBusy}
                                    className="bg-gray-700 text-white border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 text-sm"
                                >
                                    {Array.from({ length: 8 }, (_, i) => i + 1).map(num => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
            
            <footer className="text-center mt-4 text-gray-500 text-sm">
                <p>
                    Special Thanks To <a href="https://toshikinunokawa.com/online-salon/" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">Toshiki Nunokawa Online Salon</a>
                </p>
            </footer>
        </div>
    );
};

export default App;