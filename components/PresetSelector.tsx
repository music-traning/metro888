
import React from 'react';
import { PRESETS } from '../constants';
import { Preset } from '../types';

interface PresetSelectorProps {
    onSelect: (preset: Preset) => void;
    disabled: boolean;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect, disabled }) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPreset = PRESETS.find(p => p.name === event.target.value);
        if (selectedPreset) {
            onSelect(selectedPreset);
        }
    };

    return (
        <select
            id="presets"
            onChange={handleChange}
            disabled={disabled}
            className="w-full bg-gray-700 text-white border-gray-600 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
        >
            {PRESETS.map(preset => (
                <option key={preset.name} value={preset.name}>
                    {preset.name}
                </option>
            ))}
        </select>
    );
};

export default PresetSelector;
