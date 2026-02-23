import Groq from "groq-sdk";

// Uses GROQ_API_KEY instead of NEXT_PUBLIC_GROQ_API_KEY so it stays server-side only
const groqApiKey = process.env.GROQ_API_KEY;

export const groq = new Groq({ apiKey: groqApiKey });
