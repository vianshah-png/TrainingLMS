import { NextResponse } from 'next/server';
import { groq } from '@/lib/groq';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(req: Request) {
    // 1. Verify admin authorization
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { topicTitle, topicContent, customPrompt } = await req.json();

        if (!topicTitle) {
            return NextResponse.json({ error: 'Missing topic title' }, { status: 400 });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert Clinical Assessment Designer at Balance Nutrition. 
                    Your task is to suggest high-quality Multiple Choice Questions (MCQs) for a module assessment.
                    
                    Follow these strict rules:
                    1. **Generate EXACTLY 3-5 High-Quality MCQs**.
                    2. Tone: Professional, clinical, and protocol-oriented.
                    3. Each question must include 'question', 'options' (array of 4), 'correctAnswer', and 'justification'.
                    4. Format: Return ONLY a valid JSON array. No text before or after.
                    5. Custom Guidance: ${customPrompt || 'None provided'}.
                    
                    BN CORE CONTEXT:
                    - 10 Health Segments: Weight Loss, Weight Gain, PCOS, Thyroid, Diabetes, Children's Health, Post-Pregnancy, Skin & Hair, General Health, Muscle Building.
                    - Cleanse Plans: Gut Reset-Detox, Weight Loss Cleanse, Sugar Detox Cleanse.
                    - KPIs: L:C Benchmark = 70%.`
                },
                {
                    role: "user",
                    content: `Topic Title: ${topicTitle}\nTopic Content: ${topicContent}\n\nSuggest questions that would test a counsellor's understanding of this specific module content.`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });

        const responseContent = chatCompletion.choices[0]?.message?.content || "[]";
        const jsonContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();

        let suggestions: any[];
        try {
            suggestions = JSON.parse(jsonContent);
        } catch (e) {
            console.error("JSON Parse Error in Suggestions:", e);
            suggestions = [];
        }

        return NextResponse.json({ success: true, suggestions });
    } catch (error: any) {
        console.error("Quiz Suggestion Error:", error);
        return NextResponse.json({ error: "Failed to generate AI suggestions: " + error.message }, { status: 500 });
    }
}
