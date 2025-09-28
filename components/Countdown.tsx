
import React, { useEffect, useState } from 'react';

interface CountdownProps {
    count: number;
    bpm: number;
}

const Countdown: React.FC<CountdownProps> = ({ count, bpm }) => {
    const [displayCount, setDisplayCount] = useState(count);
    const [animationKey, setAnimationKey] = useState(0);
    const animationDuration = 60 / bpm;

    useEffect(() => {
        setDisplayCount(count);
        setAnimationKey(prev => prev + 1);
    }, [count]);

    if (count === 0) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 pointer-events-none">
            <div
                key={animationKey}
                className="text-9xl font-bold text-teal-400 animate-ping-pong"
                style={{ animationDuration: `${animationDuration}s` }}
            >
                {displayCount}
            </div>
            <style>
                {`
                    @keyframes ping-pong {
                        0% {
                            transform: scale(0.5);
                            opacity: 0;
                        }
                        50% {
                            transform: scale(1.2);
                            opacity: 1;
                        }
                        100% {
                            transform: scale(1);
                            opacity: 0;
                        }
                    }
                    .animate-ping-pong {
                        animation-name: ping-pong;
                        animation-timing-function: ease-in-out;
                        animation-fill-mode: forwards;
                    }
                `}
            </style>
        </div>
    );
};

export default Countdown;
