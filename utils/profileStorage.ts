// Storage utilities for User Profile and Role management

import {
    UserProfile,
    Role,
    InterviewSession,
    InterviewStage,
    DEFAULT_INTERVIEW_STAGES,
    STORAGE_KEYS,
    AnalysisResult,
} from "@/types/profile";

// ============== Utility Functions ==============

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ============== User Profile ==============

export function getUserProfile(): UserProfile | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return stored ? JSON.parse(stored) : null;
}

export function saveUserProfile(profile: UserProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
}

export function createUserProfile(
    name: string,
    background: string,
    strengths: string[],
    cvText: string | null,
    cvFileName: string | null
): UserProfile {
    const profile: UserProfile = {
        name,
        background,
        strengths,
        preferences: "",
        defaultCvText: cvText,
        defaultCvFileName: cvFileName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    saveUserProfile(profile);
    return profile;
}

export function updateUserProfile(updates: Partial<UserProfile>): UserProfile | null {
    const profile = getUserProfile();
    if (!profile) return null;

    const updated = {
        ...profile,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    saveUserProfile(updated);
    return updated;
}

// ============== Roles ==============

export function getAllRoles(): Role[] {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.ROLES_LIST);
    return stored ? JSON.parse(stored) : [];
}

export function saveRoles(roles: Role[]): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEYS.ROLES_LIST, JSON.stringify(roles));
}

export function getRoleById(roleId: string): Role | null {
    const roles = getAllRoles();
    return roles.find((r) => r.roleId === roleId) || null;
}

export function createRole(
    roleName: string,
    companyName: string,
    roleTitle: string,
    jdText: string | null = null,
    jdFileName: string | null = null,
    recruiterText: string | null = null,
    recruiterFileName: string | null = null,
    extraContext: string | null = null,
    customStages?: InterviewStage[]
): Role {
    const newRole: Role = {
        roleId: generateId(),
        roleName,
        companyName,
        roleTitle,
        jdText,
        jdFileName,
        recruiterText,
        recruiterFileName,
        extraContext,
        customCvText: null,
        customCvFileName: null,
        stages: customStages || [...DEFAULT_INTERVIEW_STAGES],
        createdAt: new Date().toISOString(),
        sessions: [],
    };

    const roles = getAllRoles();
    roles.unshift(newRole);
    saveRoles(roles);

    return newRole;
}

export function updateRole(roleId: string, updates: Partial<Role>): Role | null {
    const roles = getAllRoles();
    const index = roles.findIndex((r) => r.roleId === roleId);

    if (index === -1) return null;

    roles[index] = { ...roles[index], ...updates };
    saveRoles(roles);
    return roles[index];
}

export function deleteRole(roleId: string): void {
    const roles = getAllRoles();
    const filtered = roles.filter((r) => r.roleId !== roleId);
    saveRoles(filtered);

    // Clear active IDs if they match
    if (getActiveRoleId() === roleId) {
        setActiveRoleId(null);
        setActiveSessionId(null);
        setActiveStageId(null);
    }
}

// ============== Sessions ==============

export function addSessionToRole(roleId: string, session: InterviewSession): void {
    const roles = getAllRoles();
    const index = roles.findIndex((r) => r.roleId === roleId);

    if (index !== -1) {
        roles[index].sessions.push(session);
        saveRoles(roles);
    }
}

export function updateLastSession(roleId: string, updates: Partial<InterviewSession>): void {
    const roles = getAllRoles();
    const index = roles.findIndex((r) => r.roleId === roleId);

    if (index !== -1 && roles[index].sessions.length > 0) {
        const lastSessionIndex = roles[index].sessions.length - 1;
        roles[index].sessions[lastSessionIndex] = {
            ...roles[index].sessions[lastSessionIndex],
            ...updates,
        };
        saveRoles(roles);
    }
}

// ============== Active State ==============

export function getActiveRoleId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE_ID);
}

export function setActiveRoleId(roleId: string | null): void {
    if (typeof window === "undefined") return;
    if (roleId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE_ID, roleId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE_ID);
    }
}

export function getActiveSessionId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
}

export function setActiveSessionId(sessionId: string | null): void {
    if (typeof window === "undefined") return;
    if (sessionId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION_ID, sessionId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION_ID);
    }
}

export function getActiveStageId(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_STAGE_ID);
}

export function setActiveStageId(stageId: string | null): void {
    if (typeof window === "undefined") return;
    if (stageId) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_STAGE_ID, stageId);
    } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_STAGE_ID);
    }
}

// ============== Past Feedback ==============

export function getPastFeedbackSummary(roleId: string): string | null {
    const role = getRoleById(roleId);
    if (!role || role.sessions.length === 0) return null;

    const sessionsWithFeedback = role.sessions.filter((s) => s.analysis);
    if (sessionsWithFeedback.length === 0) return null;

    const feedbackSummary = sessionsWithFeedback
        .map((session, index) => {
            const analysis = session.analysis!;
            return `Session ${index + 1} (${session.stageName}, Score: ${analysis.overallScore}/100):
- Strengths: ${analysis.strengths.join(", ")}
- Weaknesses: ${analysis.weaknesses.join(", ")}
- Tips: ${analysis.improvementTips.join(", ")}`;
        })
        .join("\n\n");

    return feedbackSummary;
}

// ============== Stage Helpers ==============

export function getNextStage(role: Role, currentStageId: string): InterviewStage | null {
    const currentIndex = role.stages.findIndex((s) => s.id === currentStageId);
    if (currentIndex < role.stages.length - 1) {
        return role.stages[currentIndex + 1];
    }
    return null;
}

// ============== Migration from old Series format ==============

export function migrateFromSeries(): void {
    if (typeof window === "undefined") return;

    const oldSeries = localStorage.getItem(STORAGE_KEYS.SERIES_LIST);
    if (!oldSeries) return;

    // Check if already migrated
    const existingRoles = getAllRoles();
    if (existingRoles.length > 0) return;

    try {
        const seriesList = JSON.parse(oldSeries);
        const roles: Role[] = seriesList.map((series: any) => ({
            roleId: series.seriesId,
            roleName: series.seriesName,
            companyName: "",
            roleTitle: series.baseContext?.roleTitle || "",
            jdText: null,
            jdFileName: null,
            recruiterText: series.baseContext?.recruiterStrategy || null,
            recruiterFileName: null,
            extraContext: series.baseContext?.extraContext || null,
            customCvText: null,
            customCvFileName: null,
            stages: [...DEFAULT_INTERVIEW_STAGES],
            createdAt: series.createdAt,
            sessions: series.sessions.map((s: any) => ({
                id: s.id,
                stageId: s.interviewType || "screening",
                stageName: s.interviewType === "hiring-manager" ? "Hiring Manager" :
                    s.interviewType === "cultural-fit" ? "Cultural Fit" : "Screening",
                startedAt: s.startedAt,
                endedAt: s.endedAt,
                transcript: s.transcript,
                analysis: s.analysis,
            })),
        }));

        saveRoles(roles);
        console.log("Migrated", roles.length, "series to roles");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}
