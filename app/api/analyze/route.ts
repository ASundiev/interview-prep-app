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
                    content: `You are an expert interview coach. Analyze the following interview transcript based on the provided job context.
          
          Return a JSON object with:
          {
            "score": number (0-100),
            "summary": "string",
            "strengths": ["string", "string"],
            "weaknesses": ["string", "string"],
            "improvements": ["string", "string"]
          }
          `,
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
