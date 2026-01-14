"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface SpeechToTextResult {
    isListening: boolean;
    transcript: string;
    audioData: number[];
    error: string | null;
    isProcessing: boolean;
    startListening: () => void;
    stopListening: () => void;
    clearTranscript: () => void;
}

export function useSpeechToText(): SpeechToTextResult {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [audioData, setAudioData] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const isListeningRef = useRef(false);

    // Analyze audio for waveform visualization
    const analyzeAudio = useCallback(() => {
        if (!analyserRef.current) return;

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Downsample to 32 bars for visualization
        const bars = 32;
        const step = Math.floor(dataArray.length / bars);
        const normalized: number[] = [];

        for (let i = 0; i < bars; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += dataArray[i * step + j];
            }
            normalized.push(sum / step / 255);
        }

        setAudioData(normalized);

        if (isListeningRef.current) {
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        }
    }, []);

    const transcribeAudio = useCallback(async (audioBlob: Blob) => {
        setIsProcessing(true);
        setError(null);
        console.log("Starting transcription...");

        try {
            // Create FormData with the audio file
            const formData = new FormData();
            formData.append("audio", audioBlob, "recording.webm");

            const response = await fetch("/api/stt", {
                method: "POST",
                body: formData,
            });

            console.log("Transcription response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Transcription failed" }));
                throw new Error(errorData.error || "Failed to transcribe audio");
            }

            const data = await response.json();
            console.log("Transcription successful, text length:", data.text?.length || 0);
            setTranscript(data.text || "");
        } catch (err: any) {
            console.error("Transcription error:", err);
            setError(err.message || "Failed to transcribe audio");
        } finally {
            setIsProcessing(false);
            console.log("Transcription processing finished");
        }
    }, []);

    const startListening = useCallback(async () => {
        setError(null);
        setTranscript("");
        audioChunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            // Set up audio context for waveform visualization
            audioContextRef.current = new AudioContext();
            const source = audioContextRef.current.createMediaStreamSource(stream);
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            source.connect(analyserRef.current);

            // Set up MediaRecorder for audio capture
            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
            });

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = async () => {
                if (audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                    console.log("Audio blob created, size:", audioBlob.size);
                    await transcribeAudio(audioBlob);
                } else {
                    console.warn("No audio chunks collected");
                    setIsProcessing(false);
                }
            };

            mediaRecorderRef.current.start(100); // Collect data every 100ms
            setIsListening(true);
            isListeningRef.current = true;

            // Start audio visualization
            animationFrameRef.current = requestAnimationFrame(analyzeAudio);
        } catch (err: any) {
            console.error("Error starting recording:", err);
            if (err.name === "NotAllowedError") {
                setError("Microphone permission denied. Please allow microphone access.");
            } else {
                setError("Failed to start recording. Please try again.");
            }
        }
    }, [analyzeAudio, transcribeAudio]);

    const stopListening = useCallback(() => {
        setIsListening(false);
        isListeningRef.current = false;

        // Stop MediaRecorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            setIsProcessing(true);
            mediaRecorderRef.current.stop();
        }

        // Stop animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stop media stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        // Clear audio data
        setAudioData([]);
    }, []);

    const clearTranscript = useCallback(() => {
        setTranscript("");
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
                mediaRecorderRef.current.stop();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return {
        isListening,
        transcript,
        audioData,
        error,
        isProcessing,
        startListening,
        stopListening,
        clearTranscript,
    };
}
