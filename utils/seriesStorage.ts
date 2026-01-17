// Storage utilities for Interview Series feature

import {
    SeriesHistory,
    InterviewSession,
    InterviewContext,
    Message,
    AnalysisResult,
    STORAGE_KEYS,
} from "@/types/series";

// Generate a unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Get all series from localStorage
export function getAllSeries(): SeriesHistory[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.SERIES_LIST);
    return stored ? JSON.parse(stored) : [];
}

// Save all series to localStorage
export function saveSeries(series: SeriesHistory[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.SERIES_LIST, JSON.stringify(series));
}

// Get a specific series by ID
export function getSeriesById(seriesId: string): SeriesHistory | null {
    const allSeries = getAllSeries();
    return allSeries.find((s) => s.seriesId === seriesId) || null;
}

// Create a new series
export function createSeries(
    name: string,
    baseContext: InterviewContext
): SeriesHistory {
    const newSeries: SeriesHistory = {
        seriesId: generateId(),
        seriesName: name,
        createdAt: new Date().toISOString(),
        baseContext,
        sessions: [],
    };

    const allSeries = getAllSeries();
    allSeries.unshift(newSeries);
    saveSeries(allSeries);

    return newSeries;
}

// Add a session to a series
export function addSessionToSeries(
    seriesId: string,
    session: InterviewSession
): void {
    const allSeries = getAllSeries();
    const seriesIndex = allSeries.findIndex((s) => s.seriesId === seriesId);

    if (seriesIndex !== -1) {
        allSeries[seriesIndex].sessions.push(session);
        saveSeries(allSeries);
    }
}

// Update the last session in a series (e.g., to add analysis)
export function updateLastSession(
    seriesId: string,
    updates: Partial<InterviewSession>
): void {
    const allSeries = getAllSeries();
    const seriesIndex = allSeries.findIndex((s) => s.seriesId === seriesId);

    if (seriesIndex !== -1 && allSeries[seriesIndex].sessions.length > 0) {
        const lastSessionIndex = allSeries[seriesIndex].sessions.length - 1;
        allSeries[seriesIndex].sessions[lastSessionIndex] = {
            ...allSeries[seriesIndex].sessions[lastSessionIndex],
            ...updates,
        };
        saveSeries(allSeries);
    }
}

// Get active series ID
export function getActiveSeriesId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SERIES_ID);
}

// Set active series ID
export function setActiveSeriesId(seriesId: string | null): void {
    if (typeof window === "undefined") return;
    if (seriesId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SERIES_ID, seriesId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SERIES_ID);
    }
}

// Get active session ID
export function getActiveSessionId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
}

// Set active session ID
export function setActiveSessionId(sessionId: string | null): void {
    if (typeof window === "undefined") return;
    if (sessionId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    }
}

// Get a summary of past feedback for the AI prompt
export function getPastFeedbackSummary(seriesId: string): string | null {
    const series = getSeriesById(seriesId);
    if (!series || series.sessions.length === 0) return null;

    const sessionsWithFeedback = series.sessions.filter((s) => s.analysis);
    if (sessionsWithFeedback.length === 0) return null;

    const feedbackSummary = sessionsWithFeedback
        .map((session, index) => {
            const analysis = session.analysis!;
            return `Session ${index + 1} (${session.interviewType}, Score: ${analysis.overallScore}/100):
- Strengths: ${analysis.strengths.join(", ")}
- Weaknesses: ${analysis.weaknesses.join(", ")}
- Tips: ${analysis.improvementTips.join(", ")}`;
        })
        .join("\n\n");

    return feedbackSummary;
}

// Delete a series
export function deleteSeries(seriesId: string): void {
    const allSeries = getAllSeries();
    const filtered = allSeries.filter((s) => s.seriesId !== seriesId);
    saveSeries(filtered);

    // Clear active IDs if they match
    if (getActiveSeriesId() === seriesId) {
        setActiveSeriesId(null);
        setActiveSessionId(null);
    }
}

// Get the next interview type in the progression
export function getNextInterviewType(
    currentType: "screening" | "hiring-manager" | "cultural-fit"
): "screening" | "hiring-manager" | "cultural-fit" | null {
    const progression: Array<"screening" | "hiring-manager" | "cultural-fit"> = [
        "screening",
        "hiring-manager",
        "cultural-fit",
    ];
    const currentIndex = progression.indexOf(currentType);
    if (currentIndex < progression.length - 1) {
        return progression[currentIndex + 1];
    }
    return null; // Already at the last stage
}
