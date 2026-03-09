// src/utils/openai.ts
// Safe OpenAI wrapper that works even if no API key exists

import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (client) return client;

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey || apiKey.length < 10) {
    console.warn("AI disabled: No API key found.");
    return null;
  }

  try {
    client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    return client;
  } catch (err) {
    console.warn("AI disabled:", err);
    return null;
  }
}

export async function generateAIResponse(prompt: string): Promise<string> {
  const openai = getClient();

  if (!openai) {
    return "AI feature currently disabled.";
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    return response.choices[0]?.message?.content || "No response.";
  } catch (error) {
    console.error("AI request failed:", error);
    return "AI request failed.";
  }
}