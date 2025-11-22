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
    avatar?: string;
    avatarName?: string;
    background?: string | null;
    interviewType?: "screening" | "hiring-manager" | "cultural-fit";
}

export default function InterviewPage() {
    const router = useRouter();
    const [context, setContext] = useState<InterviewContext | null>(null);
    const [isMicOn, setIsMicOn] = useState(true);
    const { connect, disconnect, status, isSpeaking, items } = useRealtime();
    
    // Briefing State
    const [briefingStatus, setBriefingStatus] = useState<'idle' | 'generating' | 'ready' | 'playing' | 'completed' | 'failed'>('idle');
    const [generationProgress, setGenerationProgress] = useState(0);
    const [briefingVideoUrl, setBriefingVideoUrl] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [autoplayError, setAutoplayError] = useState<string | null>(null);
    const [briefingError, setBriefingError] = useState<string | null>(null);
    const hasQueuedBriefing = useRef(false);

    useEffect(() => {
        const stored = localStorage.getItem("interviewContext");
        if (stored) {
            const parsedContext = JSON.parse(stored);
            setContext(parsedContext);
            // Start generating briefing immediately if valid context (only once)
            if (parsedContext && !hasQueuedBriefing.current) {
                hasQueuedBriefing.current = true;
                generateBriefing(parsedContext);
            }
        } else {
            router.push("/");
        }
    }, [router]);

    const generateBriefing = async (ctx: InterviewContext) => {
        setBriefingStatus('generating');
        setBriefingError(null);
        setGenerationProgress(5);
        
        try {
            const defaultAvatarId =
                process.env.NEXT_PUBLIC_PREFERRED_AVATAR_ID || "anna_costume1_cameraA";
            const avatarId = ctx.avatar || defaultAvatarId;
            const avatarName =
                ctx.avatarName || process.env.NEXT_PUBLIC_PREFERRED_AVATAR_NAME || "AI Interviewer";
            const type = ctx.interviewType || "screening";
            const typeScriptSnippets: Record<string, string> = {
                "screening": "I’ll focus on your overall fit, communication style, and motivation for this role.",
                "hiring-manager": "I’ll dive deeper into your impact, leadership decisions, and collaboration style.",
                "cultural-fit": "I’ll explore how your values, teamwork habits, and communication style align with our culture.",
            };
            const typeLabelMap: Record<string, string> = {
                "screening": "screening conversation",
                "hiring-manager": "hiring manager discussion",
                "cultural-fit": "culture fit conversation",
            };
            const typeSnippet = typeScriptSnippets[type] || typeScriptSnippets["screening"];
            const typeLabel = typeLabelMap[type] || typeLabelMap["screening"];
            const script = `Hello ${ctx.candidateName}. Welcome to your interview for the ${ctx.roleTitle} position. I've reviewed your background in ${ctx.candidateSummary ? ctx.candidateSummary.slice(0, 50) + "..." : "your resume"}, and I'm excited to discuss how you can contribute. We'll go through a few technical and behavioral questions. Please answer clearly and concisely. Good luck!`;
            const scriptWithType = `${script}\n\nThis session is framed as a ${typeLabel}, so ${typeSnippet}`;
            
            // 1. Create Video Request
            const response = await fetch("/api/synthesia/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: `Briefing: ${ctx.candidateName}`,
                    script: scriptWithType,
                    description: `Interview briefing for ${ctx.roleTitle}`,
                    avatar: avatarId,
                    background: ctx.background ?? undefined
                })
            });
            
            const payload = await response.json().catch(() => null);
            if (!response.ok) {
                const detail = payload?.details || payload?.error || "Failed to create video";
                throw new Error(detail);
            }

            const data = payload;
            const videoId = data.id;
            console.log("Video created, ID:", videoId);
            
            setGenerationProgress(10); // Request sent
            
            // 2. Polling Logic
            let attempts = 0;
            const maxAttempts = 60; // 5 minutes (60 * 5s)
            
            const pollInterval = setInterval(async () => {
                attempts++;
                if (attempts > maxAttempts) {
                    clearInterval(pollInterval);
                    setBriefingStatus('idle'); // Timeout fallback
                    return;
                }

                try {
                    const statusRes = await fetch(`/api/synthesia/status?id=${videoId}`);
                    if (!statusRes.ok) return;
                    
                    const statusData = await statusRes.json();
                    console.log("Video Status:", statusData.status);

                    if (statusData.status === "complete") {
                        clearInterval(pollInterval);
                        setBriefingVideoUrl(statusData.download);
                        setBriefingStatus('ready');
                        setGenerationProgress(100);
                    } else {
                        // Realistic fake progress: 10% -> 90% over ~2 minutes
                        setGenerationProgress(prev => {
                           if (prev >= 90) return 90;
                           return prev + 2; // Increment slightly
                        });
                    }
                } catch (e) {
                    console.error("Polling error", e);
                }
            }, 5000); // Poll every 5 seconds

        } catch (error) {
            console.error("Briefing generation failed:", error);
            setBriefingStatus('failed'); // Fallback to skip briefing
            setBriefingError(error instanceof Error ? error.message : "Failed to create video");
        }
    };

    const handlePlayBriefing = useCallback(() => {
        if (!briefingVideoUrl) return;
        setBriefingStatus('playing');
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            const playPromise = videoRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    setAutoplayError("Tap to play briefing");
                    setBriefingStatus('ready');
                });
            }
        }
    }, [briefingVideoUrl]);

    useEffect(() => {
        if (briefingStatus === 'ready' && briefingVideoUrl) {
            setAutoplayError(null);
            handlePlayBriefing();
        }
    }, [briefingStatus, briefingVideoUrl, handlePlayBriefing]);

    const handleBriefingEnded = () => {
        setBriefingStatus('completed');
    };

    const handleStart = () => {
        connect();
    };

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

                        {/* Avatar Placeholder / Briefing Video */}
                        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                            {briefingStatus === 'playing' && briefingVideoUrl ? (
                                <video 
                                    ref={videoRef}
                                    src={briefingVideoUrl} 
                                    className="w-full h-full object-cover rounded-3xl"
                                    onEnded={handleBriefingEnded}
                                    controls={false}
                                    autoPlay
                                    playsInline
                                />
                            ) : (
                                <div className={`relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden mb-6 transition-all duration-300 ${isSpeaking ? 'scale-105 shadow-glow ring-4 ring-primary/50' : 'ring-1 ring-white/10'}`}>
                                    <img
                                        src="/avatar.png"
                                        alt={context.avatarName || process.env.NEXT_PUBLIC_PREFERRED_AVATAR_NAME || "AI Interviewer"}
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Speaking Overlay Animation */}
                                    {isSpeaking && (
                                        <div className="absolute inset-0 bg-primary/10 animate-pulse"></div>
                                    )}
                                </div>
                            )}
                            
                            {briefingStatus !== 'playing' && (
                                <div className="text-center space-y-2">
                                    <h3 className="text-xl font-semibold text-white">
                                        {context.avatarName || process.env.NEXT_PUBLIC_PREFERRED_AVATAR_NAME || "AI Interviewer"}
                                    </h3>
                                    <p className={`text-sm font-medium transition-colors duration-300 ${isSpeaking ? 'text-primary' : 'text-gray-500'}`}>
                                        {status === "connected" ? (isSpeaking ? "Speaking..." : "Listening...") : (
                                            briefingStatus === 'generating' ? "Preparing your briefing..." :
                                            briefingStatus === 'ready' ? "Briefing Ready" : "Ready to start"
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Overlay Actions */}
                        {status !== "connected" && briefingStatus !== 'playing' && (
                            <div className="absolute inset-0 bg-dark-950/60 backdrop-blur-sm flex items-center justify-center z-20">
                                {briefingStatus === 'generating' ? (
                                    <div className="flex flex-col items-center space-y-4 w-full max-w-xs">
                                        <Loader2 className="w-10 h-10 animate-spin text-primary" />
                                        <div className="space-y-1 text-center w-full">
                                            <p className="text-sm font-medium text-gray-300">Generating personalized briefing...</p>
                                            <div className="w-full bg-dark-700 rounded-full h-1.5">
                                                <div 
                                                    className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out" 
                                                    style={{ width: `${generationProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-500">Synthesia AI is rendering your video ({generationProgress}%)</p>
                                        </div>
                                    </div>
                                ) : briefingStatus === 'ready' ? (
                                    <div className="flex flex-col items-center space-y-3">
                                        {autoplayError && <p className="text-xs text-red-400">{autoplayError}</p>}
                                    <button
                                        onClick={handlePlayBriefing}
                                        className="btn-primary py-4 px-10 text-lg flex items-center space-x-3 shadow-2xl hover:shadow-primary/50"
                                    >
                                        <Play className="w-6 h-6 fill-current" />
                                        <span>Watch Briefing</span>
                                    </button>
                                    </div>
                                ) : briefingStatus === 'failed' ? (
                                    <div className="flex flex-col items-center space-y-4 text-center max-w-sm">
                                        <p className="text-sm text-red-400 font-medium">Could not generate briefing video.</p>
                                        {briefingError && (
                                            <p className="text-xs text-gray-400 whitespace-pre-wrap">{briefingError}</p>
                                        )}
                                        <button
                                            onClick={() => context && generateBriefing(context)}
                                            className="btn-primary py-3 px-8 text-sm shadow-lg hover:shadow-primary/40"
                                        >
                                            Retry Briefing
                                        </button>
                                        <button
                                            onClick={handleStart}
                                            className="text-xs text-gray-500 underline decoration-dotted hover:text-gray-300"
                                        >
                                            Skip briefing and start interview
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleStart}
                                        disabled={status === "connecting"}
                                        className="btn-primary py-4 px-10 text-lg flex items-center space-x-3 shadow-2xl hover:shadow-primary/50"
                                    >
                                        {status === "connecting" ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Connecting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-6 h-6" />
                                                <span>Start Interview</span>
                                            </>
                                        )}
                                    </button>
                                )}
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
