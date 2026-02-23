import { NextResponse } from 'next/server';
import { decryptData } from '@/lib/encryption';

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
        const results = userAnswers.map((answer, index) => {
            const key = scoringKey[index];
            const isCorrect = answer === key.correctAnswer;
            if (isCorrect) score++;
            return {
                providedAnswer: answer,
                correctAnswer: key.correctAnswer,
                justification: key.justification,
                isCorrect
            };
        });

        return NextResponse.json({
            score,
            total: scoringKey.length,
            results
        });

    } catch (error) {
        console.error("Grading Error:", error);
        return NextResponse.json({ error: "Failed to grade exam" }, { status: 500 });
    }
}
