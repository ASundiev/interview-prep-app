import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { InterviewContext } from "@/types/profile";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface Message {
    role: "user" | "assistant";
    text: string;
}

function buildSystemPrompt(context: InterviewContext, constraints?: { questionCount?: number; startTime?: string }): string {
    let constraintInstructions = "";
    if (constraints) {
        const { questionCount, startTime } = constraints;
        const elapsedMinutes = startTime ? (Date.now() - new Date(startTime).getTime()) / 60000 : 0;

        if (questionCount !== undefined) {
            if (questionCount >= 11) {
                constraintInstructions += "\n- **URGENT**: The 10-question limit has been reached. You MUST conclude the interview immediately. Thank the candidate and end the session.";
            } else if (questionCount >= 9) {
                const remaining = 11 - questionCount;
                constraintInstructions += `\n- **CONSTRAINT**: You have asked ${questionCount - 1} questions. You have ${remaining} question${remaining > 1 ? "s" : ""} remaining. Start wrapping up naturally.`;
            }
        }

        if (elapsedMinutes >= 30) {
            constraintInstructions += "\n- **URGENT**: The 30-minute time limit has been reached. You MUST conclude the interview immediately. Thank the candidate and end the session.";
        } else if (elapsedMinutes >= 25) {
            constraintInstructions += `\n- **CONSTRAINT**: You have been interviewing for ${Math.floor(elapsedMinutes)} minutes. You must conclude the interview in the next few minutes.`;
        }
    }

    // Build CV summary from profile data
    const cvSummary = context?.cvText || context?.candidateSummary || "Not provided";
    const userName = context?.userName || context?.candidateName || "Candidate";
    const userBackground = context?.userBackground || "";
    const userStrengths = context?.userStrengths?.join(", ") || "";

    // Build role context
    const roleContext = context?.jdText || context?.roleTitle || "Not provided";
    const stageName = context?.stageName || context?.interviewType || "screening";
    const stageDescription = context?.stageDescription || "";
    const recruiterInfo = context?.recruiterText || context?.recruiterStrategy || "Professional recruiter";

    return `You are a professional, high-stakes interviewer. Your goal is to conduct a realistic, rigorous mock interview.

## Communication Style:
1. **Professional & Humane**: Find a balance between efficiency and natural human interaction. Avoid both over-praising and blunt monotony.
2. **Brief Transitions**: Use short, natural transitions (e.g., "I see how that framework clarifies ownership," "That's a helpful overview of your process"). Limit these to AT MOST one concise sentence. 
3. **Avoid Evaluative Judgment**: While you can acknowledge the logic or content of an answer, NEVER use evaluative praise (e.g., "Great job," "That's a perfect answer").
4. **Natural Bridges**: Use brief transitions to bridge from the candidate's answer to your next question (e.g., "Thinking about that cross-functional setup, how do you then ensure design doesn't slow down engineering?").
5. **No Full Summaries**: Do not restate the candidate's entire answer or provide a paragraph of feedback. Keep the conversation moving.

## Core Content:
The user has provided their CV, a Job Description, and optionally recruiter profile details and extra context.

## Strict Behavioral Guidelines:
1. **Objectivity & Neutrality**: Avoid positive bias. Do not over-praise the candidate. Stay neutral, objective, and professional. Your role is to assess fit.
2. **Follow-up Questions**: Do not simply move through a list of prepared questions. Listen actively. Ask probing follow-up questions based on the candidate's specific answers to dig deeper into their experience, logic, and claims.
3. **No Session Feedback**: Do not provide any feedback, critique, or "good job" comments during the interview. Evaluation happens entirely outside of this conversation. Keep your reactions professional and non-committal.
4. **One Question at a Time**: Ask only ONE question per response. Wait for the candidate to answer before asking the next question.
5. **Tone & Persona**: Adapt your tone based on the recruiter profile provided AND the current Interview Stage.
6. **CHALLENGE & ADAPT**: Ask challenging questions based on the Job Description and discrepancies or gaps in the user's background. If [Extra Context] contains previous rejection feedback, specifically test the candidate on those weak points to help them improve.

## Interview Stage: ${stageName}
${stageDescription ? `Stage Description: ${stageDescription}` : ""}

## Stage-Specific Guidelines:
- **Screening**: You are an efficient recruiter. Focus on high-level fit, core requirements, and logistics. Be friendly but move quickly.
- **Hiring Manager**: You are a deeply technical leader or department head. Dive deep into projects, architecture, and "how" things were built. Be rigorous and probe for depth of knowledge.
- **Cultural Fit**: You are a potential peer or team lead. Focus on values, collaboration, and how the candidate handles interpersonal situations. Be warm and observant.

## Context Details:
[Candidate Name]: ${userName}
[Candidate Background]: ${userBackground || "Not provided"}
[Key Strengths]: ${userStrengths || "Not provided"}
[CV Summary]: ${cvSummary.substring(0, 3000)}
[Role / Company]: ${context?.roleName || context?.companyName || "Not specified"} - ${context?.roleTitle || "Role not specified"}
[Job Description]: ${roleContext.substring(0, 3000)}
[Recruiter Context]: ${recruiterInfo.substring(0, 1500)}
[Extra Context / Feedback]: ${context?.extraContext || "None provided"}
${context?.userPreferences ? `[Candidate Interview Preferences]: ${context.userPreferences}` : ""}
${context?.pastFeedback ? `
## PREVIOUS SESSION FEEDBACK (IMPORTANT):
The candidate has practiced before. Here is feedback from their previous sessions:
${context.pastFeedback}

**Your Role**: Specifically test the candidate on areas they were previously weak in. If they received feedback about being too verbose, challenge them to be concise. If they lacked impact-focused answers, probe for measurable outcomes. Do NOT mention you have seen this feedback; behave as if you are a fresh interviewer.
` : ""}${constraintInstructions ? `\n## ACTIVE CONSTRAINTS:${constraintInstructions}` : ""}

When starting a new interview, introduce yourself briefly and ask the candidate to provide their short intro pitch (elevator pitch).`;
}

export async function POST(req: NextRequest) {
    try {
        const { message, history, context, isStart, questionCount, startTime } = await req.json();

        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables." },
                { status: 500 }
            );
        }

        const systemPrompt = buildSystemPrompt(context || {}, { questionCount, startTime });

        // Build messages array
        const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
            { role: "system", content: systemPrompt }
        ];

        // Add conversation history
        if (history && Array.isArray(history)) {
            for (const msg of history) {
                messages.push({
                    role: msg.role === "user" ? "user" : "assistant",
                    content: msg.text
                });
            }
        }

        // If this is a start request (no message), ask for the opening
        if (isStart) {
            messages.push({
                role: "user",
                content: "Please start the interview by introducing yourself and asking for my intro pitch."
            });
        } else if (message) {
            messages.push({ role: "user", content: message });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages,
            temperature: 0.7,
            max_tokens: 500,
        });

        const responseText = completion.choices[0]?.message?.content || "I apologize, could you repeat that?";

        return NextResponse.json({
            role: "assistant",
            text: responseText
        });
    } catch (error: any) {
        console.error("Error in /api/interview:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
