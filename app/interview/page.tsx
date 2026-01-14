"use client";

import { useEffect, useState, useRef } from "react";
import { Mic, MicOff, Send, X, Loader2, Volume2, VolumeX, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useChatInterview } from "@/hooks/useChatInterview";
import { useSpeechToText } from "@/hooks/useSpeechToText";

interface InterviewContext {
    candidateName: string;
    roleTitle: string;
    interviewQuestions: string[];
    companyContext?: string;
    candidateSummary?: string;
    extraContext?: string | null;
    interviewType?: "screening" | "hiring-manager" | "cultural-fit";
}

type InputState = "ready" | "recording" | "editing";

export default function InterviewPage() {
    const router = useRouter();
    const [context, setContext] = useState<InterviewContext | null>(null);
    const [inputState, setInputState] = useState<InputState>("ready");
    const [editableText, setEditableText] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const {
        messages,
        isLoading,
        error: chatError,
        isSpeaking,
        sendMessage,
        startInterview,
        stopSpeaking,
    } = useChatInterview();

    const {
        isListening,
        transcript,
        audioData,
        error: sttError,
        isProcessing,
        startListening,
        stopListening,
        clearTranscript,
    } = useSpeechToText();

    // Initialize interview on mount
    useEffect(() => {
        const stored = localStorage.getItem("interviewContext");
        if (stored) {
            const parsedContext = JSON.parse(stored);
            setContext(parsedContext);
            startInterview(parsedContext);
        } else {
            router.push("/");
        }
    }, [router, startInterview]);

    // Auto-scroll to latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle recording state changes
    useEffect(() => {
        if (isListening) {
            setInputState("recording");
        }
    }, [isListening]);

    // When recording stops, transition based on whether we have a transcript
    useEffect(() => {
        if (!isListening && inputState === "recording") {
            if (transcript && transcript.trim()) {
                // Has transcript - go to editing mode
                setEditableText(transcript);
                setInputState("editing");
                clearTranscript();
                // Focus textarea
                setTimeout(() => textareaRef.current?.focus(), 100);
            } else {
                // No transcript - go back to ready
                setInputState("ready");
                clearTranscript();
            }
        }
    }, [isListening, inputState, transcript, clearTranscript]);

    const handleMicClick = () => {
        if (inputState === "recording") {
            stopListening();
        } else {
            setEditableText("");
            clearTranscript();
            startListening();
        }
    };

    const handleSend = async () => {
        if (!editableText.trim() || isLoading) return;

        const text = editableText.trim();
        setEditableText("");
        setInputState("ready");
        await sendMessage(text);
    };

    const handleDiscard = () => {
        setEditableText("");
        setInputState("ready");
        clearTranscript();
    };

    const handleEndInterview = () => {
        stopSpeaking();
        localStorage.setItem("interviewTranscript", JSON.stringify(messages));
        router.push("/feedback");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!context) return null;

    const error = chatError || sttError;

    return (
        <main className="min-h-screen bg-dark-950 text-white flex flex-col font-sans">
            {/* Header */}
            <header className="flex-shrink-0 flex justify-between items-center px-4 md:px-8 py-4 border-b border-white/5 bg-dark-900/50 backdrop-blur-sm">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center border border-white/5">
                        <MessageSquare className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">Mock Interview</h1>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{context.roleTitle}</p>
                    </div>
                </div>
                <button
                    onClick={handleEndInterview}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                    End Interview
                </button>
            </header>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {messages.map((message, i) => (
                        <div
                            key={i}
                            className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                        >
                            <div
                                className={`max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed ${message.role === "assistant"
                                    ? "bg-dark-800 text-gray-200 rounded-tl-sm"
                                    : "bg-primary/20 text-white rounded-tr-sm border border-primary/20"
                                    }`}
                            >
                                {message.text}
                            </div>
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-dark-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                                <div className="flex space-x-1.5">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Speaking Indicator */}
                    {isSpeaking && !isLoading && (
                        <div className="flex justify-start items-center space-x-2 text-xs text-gray-500">
                            <Volume2 className="w-4 h-4 animate-pulse text-primary" />
                            <span>AI is speaking...</span>
                            <button
                                onClick={stopSpeaking}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <VolumeX className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">
                            {error}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-white/5 bg-dark-900/80 backdrop-blur-sm px-4 md:px-8 py-4">
                <div className="max-w-3xl mx-auto">
                    {/* Ready State - Large Mic Button */}
                    {inputState === "ready" && (
                        <div className="flex flex-col items-center space-y-3">
                            <button
                                onClick={handleMicClick}
                                disabled={isLoading || isProcessing}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-glow"
                            >
                                <Mic className="w-7 h-7 md:w-8 md:h-8 text-white" />
                            </button>
                            <span className="text-xs text-gray-500">Press to speak</span>
                        </div>
                    )}

                    {/* Recording State - Waveform */}
                    {inputState === "recording" && (
                        <div className="flex flex-col items-center space-y-4">
                            <button
                                onClick={handleMicClick}
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all animate-pulse shadow-lg shadow-red-500/30"
                            >
                                <MicOff className="w-7 h-7 md:w-8 md:h-8 text-white" />
                            </button>

                            {/* Real-time Waveform */}
                            <div className="flex items-center justify-center space-x-1 h-12 w-full max-w-xs">
                                {audioData.length > 0 ? (
                                    audioData.map((value, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-primary rounded-full transition-all duration-75"
                                            style={{
                                                height: `${Math.max(4, value * 48)}px`,
                                            }}
                                        />
                                    ))
                                ) : (
                                    // Placeholder animation when no audio data
                                    Array.from({ length: 32 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-primary/50 rounded-full animate-pulse"
                                            style={{
                                                height: `${4 + Math.sin(i * 0.5) * 8}px`,
                                                animationDelay: `${i * 30}ms`,
                                            }}
                                        />
                                    ))
                                )}
                            </div>

                            <span className="text-xs text-red-400">Recording... Press again to stop</span>
                        </div>
                    )}

                    {/* Processing State - Whisper Transcription */}
                    {isProcessing && inputState === "ready" && (
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-dark-800 border border-primary/50 flex items-center justify-center">
                                <Loader2 className="w-7 h-7 md:w-8 md:h-8 text-primary animate-spin" />
                            </div>
                            <span className="text-xs text-primary">Transcribing...</span>
                        </div>
                    )}

                    {/* Editing State - Textarea + Send */}
                    {inputState === "editing" && (
                        <div className="space-y-3">
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    value={editableText}
                                    onChange={(e) => setEditableText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Edit your response if needed..."
                                    className="w-full bg-dark-800 border border-white/10 rounded-xl px-4 py-3 pr-24 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all"
                                    rows={3}
                                />
                                <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                                    <button
                                        onClick={handleDiscard}
                                        className="p-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        disabled={!editableText.trim() || isLoading}
                                        className="p-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors"
                                    >
                                        {isLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 text-center">
                                Press Enter to send, Shift+Enter for new line
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
