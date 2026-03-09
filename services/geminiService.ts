
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a response from the management assistant using Gemini 3 Flash.
 * @param prompt Internal staff query.
 * @param context Management context including unit prices and name.
 * @returns AI generated assistance text.
 */
export const getGeminiResponse = async (prompt: string, context?: any) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Context: ${JSON.stringify(context || {})}
      
      Staff Query: ${prompt}`,
    config: {
      systemInstruction: `You are the Guest House Management Assistant for ${context?.guestHouseName || 'our Guesthouse'}. 
      You help administrative staff with logistics, booking summaries, unit details, and operational efficiency.`,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    }
  });

  return response.text;
};

/**
 * Analyzes the sentiment of a guest review for management review.
 * @param text The review string.
 * @returns One of POSITIVE, NEUTRAL, or NEGATIVE.
 */
export const analyzeSentiment = async (text: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the sentiment of this guest review: "${text}". Return only one word: POSITIVE, NEUTRAL, or NEGATIVE.`,
    config: {
      responseMimeType: "text/plain",
    }
  });
  
  return response.text?.trim() || 'NEUTRAL';
};
