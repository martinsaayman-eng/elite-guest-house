// services/geminiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

// Get the API key from environment variables
const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;

// Check if the API key exists
if (!apiKey) {
  throw new Error("Missing VITE_GOOGLE_AI_API_KEY environment variable. Please add it to your .env file.");
}

// Initialize the Google AI client with the API key
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiService = {
  async generateContent(prompt: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  },
};