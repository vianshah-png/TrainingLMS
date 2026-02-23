import { NextResponse } from 'next/server';
import { groq } from '@/lib/groq';
import { encryptData } from '@/lib/encryption';

export async function POST(req: Request) {

    try {
        const { topicTitle, topicContent, topicLinks } = await req.json();

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert Clinical Counsellor at Balance Nutrition. 
                    Your goal is to generate a high-stakes clinical assessment based on the provided material.
                    
                    Follow these strict rules:
                    1. **Generate EXACTLY 5 Multiple Choice Questions (MCQs)**.
                    2. Apply Bloom's Taxonomy: 
                       - Q1-Q2: Recall (Facts/Dates/Features)
                       - Q3-Q4: Application (Specific client scenario based on the content)
                       - Q5: Analysis (Comparison or complex problem solving)
                    3. Use 'Distractor Logic': Incorrect options should be clinically plausible but technically wrong for our specific BN protocol.
                    4. Tone: Professional, clinical, and rigorous.
                    5. Format: Return ONLY a valid JSON array of objects: [{ question: string, options: string[], correctAnswer: string, justification: string }]. No preamble, explanation, or markdown.
                    6. The generated questions must explicitly test the knowledge in the provided topicContent and the provided topicLinks. Do not invent questions outside of this scope.
                    7. Justification: Provide a concise clinical rationale (1-2 sentences) for EACH question explaining the protocol logic.
                    
                    BN CORE KNOWLEDGE BASE (Use for framing factual/recall questions):
                    - 10 Health Segments: Weight Loss, Weight Gain, PCOS/PCOD, Thyroid, Diabetes, Children's Health, Post-Pregnancy, Skin & Hair, General Health, Muscle Building.
                    - Sessions: 10 days each. Maintenance: 1 month. Trial: 7 days.
                    - Cleanse Plans: Gut Reset-Detox, Weight Loss Cleanse, Sugar Detox Cleanse.
                    - KPIs: L:C (Lead to Consultation) Benchmark = 70%. Lead Funnel = Leads -> Consultations -> Sales.
                    - Sales: Stage III lead = 7-15 KGs overweight. Min 3 follow-ups required.
                    - Tools: 8 guides total (5 in Ekit). Razorpay is the gateway. 24 paid leaves/year.`
                },
                {
                    role: "user",
                    content: `Topic Title: ${topicTitle}\nTopic Knowledge Base: ${topicContent}\nRelated Links to test on: ${topicLinks || 'None provided'}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
        });

        const responseContent = chatCompletion.choices[0]?.message?.content || "[]";
        // Clean up markdown if present (e.g. ```json ... ```)
        const jsonContent = responseContent.replace(/```json/g, '').replace(/```/g, '').trim();

        let testData: any[];
        try {
            testData = JSON.parse(jsonContent);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            testData = [];
        }

        // Secure correct answers AND justifications before sending to client
        const scoringKey = testData.map(q => ({
            correctAnswer: q.correctAnswer,
            justification: q.justification
        }));
        const answerToken = encryptData(scoringKey);

        const clientQuestions = testData.map(q => ({
            question: q.question,
            options: q.options
        }));

        return NextResponse.json({ questions: clientQuestions, answerToken });
    } catch (error) {
        console.error("Groq API Error:", error);
        return NextResponse.json({ error: "Failed to generate test" }, { status: 500 });
    }
}
