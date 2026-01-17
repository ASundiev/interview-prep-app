import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import mammoth from "mammoth";
const pdf = require("pdf-parse-new");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function parseFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type;
    const name = file.name.toLowerCase();

    try {
        if (type === "application/pdf" || name.endsWith(".pdf")) {
            const data = await pdf(buffer);
            return data.text;
        } else if (type === "text/plain" || name.endsWith(".txt") || name.endsWith(".md")) {
            return buffer.toString("utf-8");
        } else if (
            type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            name.endsWith(".docx")
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } else {
            // Fallback for text files
            return buffer.toString("utf-8");
        }
    } catch (error) {
        console.error(`Error parsing file ${name}:`, error);
        throw new Error(`Failed to parse file ${name}`);
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const cvFile = formData.get("cv") as File | null;

        if (!cvFile) {
            return NextResponse.json(
                { error: "CV file is required" },
                { status: 400 }
            );
        }

        // Parse CV
        const cvText = await parseFile(cvFile);

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key is not configured" },
                { status: 500 }
            );
        }

        // Use OpenAI to extract profile information
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert CV analyzer. Extract key information from the provided CV/Resume to create a candidate profile.

Return a JSON object with the following structure:
{
  "name": "Full name of the candidate",
  "background": "A concise 2-3 sentence professional summary describing their experience, seniority level, and primary domain expertise. Write in third person.",
  "strengths": ["Array of 5-7 key skills, achievements, or areas of expertise extracted from the CV"]
}

Focus on:
- Professional experience and seniority
- Key achievements and impact
- Technical skills and domain expertise
- Leadership and collaboration abilities

Keep the background summary concise but informative. Strengths should be specific and actionable, not generic.`,
                },
                {
                    role: "user",
                    content: `CV Content:\n${cvText.substring(0, 15000)}`,
                },
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        return NextResponse.json({
            name: result.name || "Unknown",
            background: result.background || "",
            strengths: result.strengths || [],
            cvText: cvText,
            cvFileName: cvFile.name,
        });
    } catch (error: any) {
        console.error("Error in /api/parse-cv:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
