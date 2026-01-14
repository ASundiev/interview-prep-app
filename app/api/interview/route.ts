import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

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
    return `You are a professional, high-stakes interviewer. Your goal is to conduct a realistic, rigorous mock interview.

## Communication Style:
1. **Natural Conversationalist**: Write naturally and conversationally. Avoid monotonous or robotic responses. Use varied sentence structures.
2. **Human-like Flow**: Incorporate natural transitions like "I see," "Interesting," or "Thank you for that detail" sparingly to maintain a professional yet human flow.
3. **Concise Responses**: Keep your responses focused and appropriately sized for a conversational exchange. Don't write essays.

## Core Content:
The user has provided their CV, a Job Description, and optionally recruiter profile details and extra context.

## Strict Behavioral Guidelines:
1. **Objectivity & Neutrality**: Avoid positive bias. Do not over-praise the candidate. Stay neutral, objective, and professional. While you should be friendly to maintain rapport, your primary role is to assess fit, not to be a cheerleader.
2. **Follow-up Questions**: Do not simply move through a list of prepared questions. Listen actively. Ask probing follow-up questions based on the candidate's specific answers to dig deeper into their experience, logic, and claims.
3. **No Session Feedback**: Crucially, do not provide any feedback, critique, or "good job" comments during the interview. Your evaluation happens entirely outside of this conversation. Keep your reactions professional and non-committal (e.g., "I see," "Thank you for that detail," "Moving on to...").
4. **One Question at a Time**: Ask only ONE question per response. Wait for the candidate to answer before asking the next question.
5. **Tone & Persona**: Adapt your tone based on the recruiter profile provided AND the current Interview Type.
6. **CHALLENGE & ADAPT**: Ask challenging questions based on the Job Description and discrepancies or gaps in the user's background. If [Extra Context] contains previous rejection feedback, specifically test the candidate on those weak points to help them improve.

## Interview Type Specifics:
- **screening**: You are an efficient recruiter. Focus on high-level fit, core requirements, and logistics. Be friendly but move quickly.
- **hiring-manager**: You are a deeply technical leader or department head. Dive deep into projects, architecture, and "how" things were built. Be rigorous and probe for depth of knowledge.
- **cultural-fit**: You are a potential peer or team lead. Focus on values, collaboration, and how the candidate handles interpersonal situations. Be warm and observant.

## Context Details:
[Interview Type]: ${context?.interviewType || "screening"}
[CV]: ${context?.candidateSummary || "Not provided"}
[Job Description / Role]: ${context?.roleTitle || "Not provided"}
[Recruiter Context]: ${context?.recruiterStrategy || "Professional recruiter"}
[Extra Context / Feedback]: ${context?.extraContext || "None provided"}
[Interview Focus]: ${context?.companyContext || "General interview"}
${constraintInstructions ? `\n## ACTIVE CONSTRAINTS:${constraintInstructions}` : ""}

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
