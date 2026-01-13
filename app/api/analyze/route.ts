import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { transcript, context } = await req.json();

        if (!transcript || !Array.isArray(transcript)) {
            return new Response(JSON.stringify({ error: "Invalid transcript" }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert interview coach. Analyze the provided transcript of a mock interview.
Provide a detailed, honest, and critical evaluation of the candidate's performance. 

Be specific about where they excelled and where they were vague or missed opportunities to showcase their value relative to the Job Description.
If the candidate provided "Extra Context" (like previous rejection feedback), evaluate if they have successfully improved in those specific areas.

Format your response as a JSON object:
{
  "overallScore": number (1-100),
  "strengths": string[],
  "weaknesses": string[],
  "improvementTips": string[],
  "feedbackSummary": string
}`,
                },
                {
                    role: "user",
                    content: `
          Context: ${JSON.stringify(context)}
          
          Transcript:
          ${transcript.map((t: { role: string; text: string }) => `${t.role}: ${t.text}`).join("\n")}
          `,
                },
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");
        return NextResponse.json(result);
    } catch (error) {
        console.error("Error analyzing interview:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
