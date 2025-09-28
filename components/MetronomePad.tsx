
import React from 'react';
import { PadState } from '../types';

interface MetronomePadProps {
    state: PadState;
    isActive: boolean;
    onClick: () => void;
}

const MetronomePad: React.FC<MetronomePadProps> = ({ state, isActive, onClick }) => {
    const baseClasses = "w-full aspect-square rounded-md transition-all duration-150 flex items-center justify-center text-white font-bold cursor-pointer shadow-md";

    const stateClasses = {
        [PadState.Off]: 'bg-gray-700 hover:bg-gray-600',
        [PadState.Normal]: 'bg-teal-500 hover:bg-teal-400 shadow-teal-500/30',
        [PadState.Accent]: 'bg-blue-500 hover:bg-blue-400 shadow-blue-500/30',
    };

    const activeClasses = isActive ? 'ring-4 ring-offset-2 ring-offset-gray-900 ring-yellow-400 scale-110' : '';

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${stateClasses[state]} ${activeClasses}`}
        >
        </button>
    );
};

export default MetronomePad;
