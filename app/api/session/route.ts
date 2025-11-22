import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-realtime-preview-2024-10-01",
                voice: "alloy",
                instructions: `You are Anna, a professional AI interviewer from Synthesia. 
                You are conducting a video interview with a candidate. 
                You have a visual appearance (a professional woman in business attire) and you are visible to the candidate.
                NEVER say you are a "voice-only AI" or that you "don't have a body". 
                Always behave as if you are a real person conducting a video call.
                Keep your responses concise and professional, suitable for an interview context.`,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json({ error }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching session:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
