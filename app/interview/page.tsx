"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Mic, MicOff, PhoneOff, Play, MessageSquare, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";

interface InterviewContext {
    candidateName: string;
    roleTitle: string;
    interviewQuestions: string[];
    companyContext?: string;
    candidateSummary?: string;
    extraContext?: string | null;
    avatar?: string;
    avatarName?: string;
    background?: string | null;
    interviewType?: "screening" | "hiring-manager" | "cultural-fit";
}

export default function InterviewPage() {
    const router = useRouter();
    const [context, setContext] = useState<InterviewContext | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const { connect, disconnect, status, isSpeaking, items, error: realtimeError } = useRealtime();

    const handleStart = useCallback((ctx: InterviewContext) => {
        connect(ctx);
    }, [connect]);

    useEffect(() => {
        const stored = localStorage.getItem("interviewContext");
        if (stored) {
            const parsedContext = JSON.parse(stored);
            setContext(parsedContext);
            // Start interview immediately when context is available
            handleStart(parsedContext);
        } else {
            router.push("/");
        }
    }, [router, handleStart]);

    const handleEndInterview = () => {
        disconnect();
        localStorage.setItem("interviewTranscript", JSON.stringify(items));
        router.push("/feedback");
    };

    if (!context) return null;

    return (
        <main className="min-h-screen bg-dark-950 text-white flex flex-col p-4 md:p-6 font-sans overflow-hidden">
            {/* Header */}
            <header className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center border border-white/5">
                        <span className="font-bold text-primary">AI</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-white leading-tight">Mock Interview</h1>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{context.roleTitle}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    {status === "connected" && (
                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs text-red-400 font-bold uppercase tracking-wide">Live Session</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">

                {/* Left Column: Avatar & Video (8 cols) */}
                <div className="lg:col-span-8 flex flex-col space-y-6">
                    {/* Main Avatar Area */}
                    <div className="flex-1 bg-dark-800 rounded-3xl overflow-hidden relative border border-white/5 shadow-2xl flex items-center justify-center group">
                        {/* Background Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-b from-dark-800 to-dark-900"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50"></div>

                        {/* Avatar Area */}
                        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                            <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden mb-6 transition-all duration-300 ${isSpeaking ? 'scale-105 shadow-glow ring-4 ring-primary/50' : 'ring-1 ring-white/10'}`}>
                                <img
                                    src="/avatar.png"
                                    alt="AI Interviewer"
                                    className="w-full h-full object-cover"
                                />
                                {/* Speaking Overlay Animation */}
                                {isSpeaking && (
                                    <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                                )}
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-semibold text-white">
                                    AI Interviewer
                                </h3>
                                <p className={`text-sm font-medium transition-colors duration-300 ${isSpeaking ? 'text-primary' : 'text-gray-500'}`}>
                                    {status === "connected" ? (isSpeaking ? "Speaking..." : "Listening...") : (
                                        status === "connecting" ? "Connecting..." : "Disconnected"
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Error Overlay */}
                        {status === "error" && realtimeError && (
                            <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-sm flex items-center justify-center z-20">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 max-w-md text-center">
                                    <p className="text-sm text-red-400 font-medium mb-2">Connection Failed</p>
                                    <p className="text-xs text-gray-400">{realtimeError}</p>
                                    {realtimeError.includes("Microphone permission") && (
                                        <div className="mt-3 text-xs text-gray-500">
                                            <p>To fix this:</p>
                                            <ol className="list-decimal list-inside mt-1 space-y-1">
                                                <li>Click the lock icon in your browser's address bar</li>
                                                <li>Allow microphone access</li>
                                                <li>Refresh the page and try again</li>
                                            </ol>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Controls Bar */}
                    <div className="h-24 bg-dark-800 rounded-3xl border border-white/5 flex items-center justify-center px-8 shadow-lg">
                        <div className="flex items-center space-x-6">
                            <button
                                onClick={() => setIsMicOn(!isMicOn)}
                                className={`p-4 rounded-2xl transition-all duration-200 ${isMicOn ? 'bg-dark-700 text-white hover:bg-dark-600' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                            >
                                {isMicOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                            </button>
                            <div className="w-px h-10 bg-white/10 mx-2"></div>
                            <button
                                onClick={handleEndInterview}
                                className="p-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg hover:shadow-red-500/30"
                            >
                                <PhoneOff className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Transcript */}
                <div className="lg:col-span-4 flex flex-col space-y-6">
                    {/* Transcript */}
                    <div className="flex-1 bg-dark-800 rounded-3xl border border-white/5 shadow-lg flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-dark-800/50 backdrop-blur-sm flex items-center space-x-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-gray-300">Live Transcript</span>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-dark-700 scrollbar-track-transparent">
                            {items.length === 0 && (
                                <div className="h-full flex items-center justify-center text-center p-4">
                                    <p className="text-sm text-gray-600">Conversation will appear here...</p>
                                </div>
                            )}
                            {items.map((item, i) => (
                                <div key={i} className={`flex flex-col ${item.role === 'assistant' ? 'items-start' : 'items-end'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${item.role === 'assistant'
                                        ? 'bg-dark-700 text-gray-200 rounded-tl-none'
                                        : 'bg-primary/20 text-primary-100 rounded-tr-none border border-primary/10'
                                        }`}>
                                        {item.text}
                                    </div>
                                    <span className="text-[10px] text-gray-600 mt-1 px-1">
                                        {item.role === 'assistant' ? 'AI Interviewer' : 'You'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
