"use client";

import { useState, useRef, useCallback } from "react";

interface TextToSpeechResult {
    isPlaying: boolean;
    isLoading: boolean;
    error: string | null;
    speak: (text: string, onReady?: () => void) => Promise<void>;
    stop: () => void;
}

export function useTextToSpeech(): TextToSpeechResult {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const speak = useCallback(async (text: string, onReady?: () => void, voice?: string) => {
        setError(null);
        setIsLoading(true);

        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ text, voice }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "TTS failed" }));
                throw new Error(errorData.error || "Failed to generate speech");
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            audioRef.current = new Audio(audioUrl);

            audioRef.current.onended = () => {
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            audioRef.current.onerror = () => {
                setError("Failed to play audio");
                setIsPlaying(false);
                URL.revokeObjectURL(audioUrl);
            };

            setIsLoading(false);
            setIsPlaying(true);

            // Call onReady callback right when audio starts playing
            // This allows callers to sync text display with audio
            if (onReady) {
                onReady();
            }

            await audioRef.current.play();
        } catch (err: any) {
            if (err.name === "AbortError") {
                // Request was cancelled, ignore
                return;
            }
            console.error("TTS error:", err);
            setError(err.message || "Failed to generate speech");
            setIsLoading(false);
            setIsPlaying(false);
        }
    }, []);

    const stop = useCallback(() => {
        // Cancel pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        // Stop audio playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setIsPlaying(false);
        setIsLoading(false);
    }, []);

    return {
        isPlaying,
        isLoading,
        error,
        speak,
        stop,
    };
}
