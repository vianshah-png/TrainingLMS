import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const { summary, topicTitle, topicContent } = await req.json();

        const systemPrompt = `You are a Senior Academy Auditor at Balance Nutrition. 
        Your task is to review a counsellor's summary of the topic: "${topicTitle}".
        
        Syllabus Reference Content:
        ${topicContent}
        
        Evaluation Guidelines:
        1. Check if they mentioned key USPs, protocol details, or business protocols from the reference.
        2. Identify gaps: What important information did they miss?
        3. Rate their understanding on a scale of 1-10.
        
        Return ONLY a JSON object: { feedback: string, score: number }.
        Feedback should be concise, professional, and identify at least one thing they did well and one gap.`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Counsellor's Summary: ${summary}` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });

        const response = chatCompletion.choices[0]?.message?.content || '{"feedback": "Unable to analyze", "score": 0}';
        const result = JSON.parse(response);
        return NextResponse.json(result);
    } catch (error) {
        console.error("Grader API Error:", error);
        return NextResponse.json({ error: "Failed to grade summary" }, { status: 500 });
    }
}
