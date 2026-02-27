import { NextResponse } from 'next/server';
import { decryptData } from '@/lib/encryption';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
    try {
        const { answerToken, userAnswers } = await req.json();

        if (!answerToken || !userAnswers || !Array.isArray(userAnswers)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const scoringKey = decryptData(answerToken);

        if (!scoringKey || !Array.isArray(scoringKey)) {
            return NextResponse.json({ error: "Invalid or expired session" }, { status: 400 });
        }

        let score = 0;
        const results = await Promise.all(userAnswers.slice(0, scoringKey.length).map(async (answer, index) => {
            const key = scoringKey[index];
            const type = key?.type || 'mcq';
            let isCorrect = false;
            let aiFeedback = null;

            if (!key) return null;

            if (type === 'text') {
                const trimmedAnswer = answer?.trim();

                // If answer is empty, do NOT audit with AI, just mark wrong.
                if (!trimmedAnswer) {
                    isCorrect = false;
                } else {
                    try {
                        const aiResponse = await groq.chat.completions.create({
                            messages: [
                                {
                                    role: "system",
                                    content: "You are a quiz evaluator for health counselors. Compare the user's response to the reference answer. Focus on general understanding and core concepts rather than verbatim matching. For a match, respond ONLY in JSON format: { \"isCorrect\": boolean, \"explanation\": \"short feedback\" }."
                                },
                                {
                                    role: "user",
                                    content: `Reference Answer: "${key.correctAnswer}"\nUser Answer: "${trimmedAnswer}"\n\nDoes this user answer demonstrate a correct general understanding of the reference answer?`
                                }
                            ],
                            model: "llama-3.3-70b-versatile",
                            response_format: { type: "json_object" }
                        });

                        const evaluation = JSON.parse(aiResponse.choices[0].message.content || "{}");
                        isCorrect = !!evaluation.isCorrect;
                        aiFeedback = evaluation.explanation;
                    } catch (err) {
                        console.error("AI Grading Error:", err);
                        // Fallback to basic match if AI fails
                        isCorrect = trimmedAnswer.toLowerCase() === key.correctAnswer.toLowerCase();
                    }
                }
            } else {
                isCorrect = answer === key.correctAnswer;
            }

            if (isCorrect) score++;
            return {
                question: key.question,
                providedAnswer: answer,
                correctAnswer: key.correctAnswer,
                isCorrect,
                aiFeedback,
                type
            };
        }));

        return NextResponse.json({
            score,
            total: scoringKey.length,
            results: results.filter(Boolean)
        });

    } catch (error) {
        console.error("Grading Error:", error);
        return NextResponse.json({ error: "Failed to grade exam" }, { status: 500 });
    }
}
