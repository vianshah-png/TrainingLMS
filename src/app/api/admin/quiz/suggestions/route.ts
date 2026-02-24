import { NextResponse } from 'next/server';
import { groq } from '@/lib/groq';
import { verifyAdmin } from '@/lib/admin-auth';

export async function POST(req: Request) {
    // 1. Verify admin authorization
    const auth = await verifyAdmin(req);
    if (!auth.authorized) return auth.response;

    try {
        const { topicTitle, topicContent, customPrompt, existingQuestions } = await req.json();

        if (!topicTitle) {
            return NextResponse.json({ error: 'Missing topic title' }, { status: 400 });
        }

        // Truncate content to avoid exceeding token limits
        const trimmedContent = (topicContent || '').substring(0, 3000);

        const existingQuestionsContext = existingQuestions && Array.isArray(existingQuestions) && existingQuestions.length > 0
            ? `\nEXISTING QUESTIONS (Build upon, refine or vary these):\n${JSON.stringify(existingQuestions, null, 2)}`
            : "";

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are an expert Clinical Assessment Designer at Balance Nutrition (BN). 
Your task is to generate high-quality Multiple Choice Questions (MCQs) for a counsellor training module quiz.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. No markdown, no code fences, no explanations.
- Each object in the array MUST have exactly these keys: "question" (string), "options" (array of exactly 4 strings), "correctAnswer" (one of the 4 options as a string), "justification" (string explaining why).
- If existing questions are provided, you should aim to improve them, add variations, or complement them with new relevant questions.
- Generate 3 to 5 questions in total unless the user specifies a different count.
- Tone: Professional, clinical, nutrition-protocol-oriented.

BN CONTEXT:
- 10 Health Segments: Weight Loss, Weight Gain, PCOS, Thyroid, Diabetes, Children's Health, Post-Pregnancy, Skin & Hair, General Health, Muscle Building.
- Cleanse Plans: Gut Reset-Detox, Weight Loss Cleanse, Sugar Detox Cleanse.
- KPIs: L:C Benchmark = 70%.
- BN Verticals: BN Shop, Nutriprenuer, BN Franchise, BN Health (BN Diagnostics + Doctors), Corporate Wellness, Fitness, Educational.

EXAMPLE OUTPUT (follow this format exactly):
[{"question":"What is the primary goal of BN counselling?","options":["Sell products","Help clients achieve health goals","Prescribe medication","Diagnose diseases"],"correctAnswer":"Help clients achieve health goals","justification":"BN counsellors focus on nutrition-based health improvement, not prescribing medication or selling products."}]`
                },
                {
                    role: "user",
                    content: `Topic: ${topicTitle}
Content Summary: ${trimmedContent || 'No specific content provided - generate questions based on the topic title.'}${existingQuestionsContext}
${customPrompt ? `Special Instructions: ${customPrompt}` : 'Generate or refine 3-5 relevant quiz questions for this module.'}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.6,
            max_tokens: 4096,
            response_format: { type: "json_object" },
        });

        const responseContent = chatCompletion.choices[0]?.message?.content || "{}";
        console.log("Groq Raw Response:", responseContent.substring(0, 500));

        // Clean up response - remove code fences if present
        let cleanedContent = responseContent
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();

        let suggestions: any[] = [];
        try {
            const parsed = JSON.parse(cleanedContent);
            // Handle both array format and object-with-array format
            if (Array.isArray(parsed)) {
                suggestions = parsed;
            } else if (parsed.questions && Array.isArray(parsed.questions)) {
                suggestions = parsed.questions;
            } else if (parsed.mcqs && Array.isArray(parsed.mcqs)) {
                suggestions = parsed.mcqs;
            } else if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                suggestions = parsed.suggestions;
            } else {
                // Try to find any array in the object
                const firstArrayKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
                if (firstArrayKey) {
                    suggestions = parsed[firstArrayKey];
                }
            }
        } catch (parseError: any) {
            console.error("JSON Parse Error:", parseError.message);
            console.error("Raw content:", cleanedContent.substring(0, 500));

            // Last resort: try to extract JSON array from the string
            const arrayMatch = cleanedContent.match(/\[[\s\S]*\]/);
            if (arrayMatch) {
                try {
                    suggestions = JSON.parse(arrayMatch[0]);
                } catch (e) {
                    console.error("Array extraction also failed");
                }
            }
        }

        // Validate each suggestion has required fields
        suggestions = suggestions.filter(s =>
            s && s.question && Array.isArray(s.options) && s.options.length === 4 && s.correctAnswer
        ).map(s => ({
            question: s.question,
            options: s.options,
            correctAnswer: s.correctAnswer,
            justification: s.justification || ''
        }));

        if (suggestions.length === 0) {
            return NextResponse.json({
                error: 'AI generated an invalid response format. Please try again or adjust your prompt.'
            }, { status: 422 });
        }

        return NextResponse.json({ success: true, suggestions });
    } catch (error: any) {
        console.error("Quiz Suggestion Error:", error);
        return NextResponse.json({
            error: "Failed to generate AI suggestions: " + (error.message || 'Unknown error')
        }, { status: 500 });
    }
}
