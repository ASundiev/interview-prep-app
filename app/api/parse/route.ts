import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import mammoth from "mammoth";
const pdf = require("pdf-parse-new");

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper to parse file content
async function parseFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const type = file.type;
    const name = file.name.toLowerCase();

    try {
        if (type === "application/pdf" || name.endsWith(".pdf")) {
            const data = await pdf(buffer);
            return data.text;
        } else if (type === "text/plain" || name.endsWith(".txt")) {
            return buffer.toString("utf-8");
        } else if (
            type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            name.endsWith(".docx")
        ) {
            const result = await mammoth.extractRawText({ buffer });
            return result.value;
        } else {
            // Fallback for text files or others
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
        const jdFile = formData.get("jd") as File | null;
        const recruiterFile = formData.get("recruiter") as File | null;
        const extraContextFile = formData.get("extraContext") as File | null;
        const interviewType = (formData.get("interviewType") as string | null) || "screening";
        if (!cvFile || !jdFile) {
            return NextResponse.json({ error: "Both CV and JD files are required" }, { status: 400 });
        }

        // Parse CV
        const cvText = await parseFile(cvFile);

        // Parse JD
        const jdText = await parseFile(jdFile);

        // Parse Recruiter Profile if available
        let recruiterText = "N/A";
        if (recruiterFile) {
            recruiterText = await parseFile(recruiterFile);
        }

        // Parse Extra Context if available
        let extraContextText = "N/A";
        if (extraContextFile) {
            extraContextText = await parseFile(extraContextFile);
        }

        // Use OpenAI to structure the data
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are an expert recruiter and interview coach. 
          Analyze the provided Candidate CV, Job Description, and optionally a Recruiter's LinkedIn Profile (PDF text) and Extra Context documents.
          
          If a Recruiter Profile is provided, analyze their background (technical vs HR), tone, and recent activity to tailor the interview strategy.

          If Extra Context is provided (e.g., previous rejection feedback, company context, desired strategy), incorporate it into the interview questions and strategy.
          
          Extract key information to prepare for a mock interview.
          
          Return a JSON object with the following structure:
          {
            "candidateName": "string",
            "candidateSummary": "string (brief overview of experience)",
            "roleTitle": "string",
            "roleRequirements": ["string", "string"],
            "interviewQuestions": ["string", "string", "string"] (5 potential questions),
            "recruiterStrategy": "string (advice on how to talk to this specific recruiter based on their profile)",
            "companyContext": "string (any notable insights about the company if you can infer them)"
          }
          `,
                },
                {
                    role: "user",
                    content: `
          CV Content:
          ${cvText.substring(0, 10000)}
          
          Job Description:
          ${jdText.substring(0, 10000)}
          
          Recruiter Profile Content:
          ${recruiterText.substring(0, 10000)}
          
          Extra Context Content:
          ${extraContextText.substring(0, 10000)}
          
          Interview Type: ${interviewType}
          `,
                },
            ],
            response_format: { type: "json_object" },
        });

        const result = JSON.parse(completion.choices[0].message.content || "{}");
        result.interviewType = interviewType;
        result.extraContext = extraContextText !== "N/A" ? extraContextText : null;

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in /api/parse:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
