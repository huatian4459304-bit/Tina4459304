import { GoogleGenAI, Type } from "@google/genai";
import { ContentRecommendation, MediaType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function getRecommendations(interests: string[], level: string): Promise<ContentRecommendation[]> {
  const prompt = `Act as an English learning coach. Suggest 6 pieces of content (articles, podcasts, videos) for a student who is at an ${level} level. 
  Their interests are: ${interests.join(', ')}.
  Provide exactly 2 suggestions for each category: Reading, Listening, and Watching.
  Return the results in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["read", "listen", "watch"] },
              description: { type: Type.STRING },
              url: { type: Type.STRING },
              reason: { type: Type.STRING, description: "Why this is good for their level and interests" }
            },
            required: ["title", "type", "description", "reason"]
          }
        }
      }
    });

    if (!response.text) return [];
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Discovery Error:", error);
    return [];
  }
}

export async function defineWord(word: string, context?: string): Promise<{ definition: string; example: string }> {
  const prompt = `Define the English word/phrase "${word}" ${context ? `in the context of: "${context}"` : ''}. 
  Provide a simple clear definition and one example sentence. 
  Return as JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            definition: { type: Type.STRING },
            example: { type: Type.STRING }
          },
          required: ["definition", "example"]
        }
      }
    });
    
    if (!response.text) throw new Error("No response from AI");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Definiton Error:", error);
    return { definition: "Could not find definition.", example: "" };
  }
}
