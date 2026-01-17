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
        const jdFile = formData.get("jd") as File | null;

        if (!jdFile) {
            return NextResponse.json(
                { error: "Job description file is required" },
                { status: 400 }
            );
        }

        // Parse JD
        const jdText = await parseFile(jdFile);

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "OpenAI API key is not configured" },
                { status: 500 }
            );
        }

        // Use OpenAI to extract role information
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert at analyzing job descriptions. Extract key information to create a role summary.

Return a JSON object with the following structure:
{
  "roleName": "A short name combining company and role, e.g., 'Wise - Senior Designer'",
  "companyName": "The company name only",
  "roleTitle": "The exact job title, e.g., 'Senior Product Designer'"
}

Focus on:
- Extracting the exact company name
- Identifying the precise job title
- Creating a concise combined role name

If any field cannot be determined, use an empty string.`,
                },
                {
                    role: "user",
                    content: `Job Description:\n${jdText.substring(0, 15000)}`,
                },
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");

        return NextResponse.json({
            roleName: result.roleName || "",
            companyName: result.companyName || "",
            roleTitle: result.roleTitle || "",
            jdText: jdText,
            jdFileName: jdFile.name,
        });
    } catch (error: any) {
        console.error("Error in /api/parse-jd:", error);
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
