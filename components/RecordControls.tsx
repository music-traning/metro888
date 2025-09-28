
import React, { useState, useRef, useCallback } from 'react';

interface RecordControlsProps {
    isRecording: boolean;
    isPlaying: boolean;
    onRecordStart: () => void;
    onRecordStop: () => void;
    isBusy: boolean;
}

const SUPPORTED_MIME_TYPES = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
];

const getSupportedMimeType = () => {
    for (const type of SUPPORTED_MIME_TYPES) {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return null;
}


const RecordControls: React.FC<RecordControlsProps> = ({ isRecording, isPlaying, onRecordStart, onRecordStop, isBusy }) => {
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        const mimeType = getSupportedMimeType();
        if (!mimeType) {
            setError("Your browser does not support audio recording.");
            return;
        }

        try {
            setError(null);
            setAudioURL(null);
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                }
            });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                if(event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };
            
            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                audioChunksRef.current = [];
                stream.getTracks().forEach(track => track.stop());
            };
            
            mediaRecorderRef.current.start();
            onRecordStart();
        } catch (err) {
            console.error("Error accessing microphone:", err);
            setError("Could not access microphone. Please check permissions.");
        }
    }, [onRecordStart]);
    
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }
        onRecordStop();
    }, [onRecordStop]);

    const handleButtonClick = () => {
        if (isRecording) {
            stopRecording();
        } else {
            startRecording();
        }
    };

    return (
        <div className="mt-2 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-center mb-2 text-gray-300">Recording Studio</h3>
            <div className="flex flex-col items-center justify-center gap-4">
                <button
                    onClick={handleButtonClick}
                    disabled={isBusy && !isRecording}
                    className={`w-full px-6 py-3 rounded-lg font-bold text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
                        isRecording 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed`}
                >
                     <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-white animate-pulse' : 'bg-red-400'}`}></div>
                    {isRecording ? 'Stop Recording' : 'Record'}
                </button>
                {audioURL && (
                    <div className="w-full">
                        <audio controls src={audioURL} className="w-full"></audio>
                    </div>
                )}
            </div>
            {error && <p className="text-red-500 text-center mt-2 text-sm">{error}</p>}
        </div>
    );
};

export default RecordControls;
