"use client";

import { useState, useCallback, useRef } from "react";
import { useTextToSpeech } from "./useTextToSpeech";

interface Message {
    role: "user" | "assistant";
    text: string;
}

interface InterviewContext {
    candidateName?: string;
    roleTitle?: string;
    interviewQuestions?: string[];
    companyContext?: string;
    candidateSummary?: string;
    extraContext?: string | null;
    interviewType?: "screening" | "hiring-manager" | "cultural-fit";
    recruiterStrategy?: string;
}

interface ChatInterviewResult {
    messages: Message[];
    isLoading: boolean;
    error: string | null;
    isSpeaking: boolean;
    sendMessage: (text: string) => Promise<void>;
    startInterview: (context: InterviewContext) => Promise<void>;
    stopSpeaking: () => void;
}

export function useChatInterview(): ChatInterviewResult {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const contextRef = useRef<InterviewContext | null>(null);
    const { speak, stop: stopSpeaking, isPlaying: isSpeaking, isLoading: isTTSLoading } = useTextToSpeech();

    const sendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;

        setError(null);
        setIsLoading(true);

        // Add user message immediately
        const userMessage: Message = { role: "user", text: text.trim() };
        setMessages((prev) => [...prev, userMessage]);

        try {
            const response = await fetch("/api/interview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: text.trim(),
                    history: [...messages, userMessage],
                    context: contextRef.current,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to get response" }));
                throw new Error(errorData.error || "Failed to get interview response");
            }

            const data = await response.json();
            const assistantMessage: Message = { role: "assistant", text: data.text };

            // Play TTS for assistant response
            // Show message only when audio is ready to play (synced with voice)
            speak(data.text, () => {
                setMessages((prev) => [...prev, assistantMessage]);
            });
        } catch (err: any) {
            console.error("Chat error:", err);
            setError(err.message || "Failed to send message");
        } finally {
            setIsLoading(false);
        }
    }, [messages, speak]);

    const startInterview = useCallback(async (context: InterviewContext) => {
        contextRef.current = context;
        setMessages([]);
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch("/api/interview", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isStart: true,
                    history: [],
                    context,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Failed to start interview" }));
                throw new Error(errorData.error || "Failed to start interview");
            }

            const data = await response.json();
            const assistantMessage: Message = { role: "assistant", text: data.text };

            // Play TTS for opening greeting
            // Show message only when audio is ready to play (synced with voice)
            speak(data.text, () => {
                setMessages([assistantMessage]);
            });
        } catch (err: any) {
            console.error("Start interview error:", err);
            setError(err.message || "Failed to start interview");
        } finally {
            setIsLoading(false);
        }
    }, [speak]);

    return {
        messages,
        isLoading: isLoading || isTTSLoading,
        error,
        isSpeaking,
        sendMessage,
        startInterview,
        stopSpeaking,
    };
}
