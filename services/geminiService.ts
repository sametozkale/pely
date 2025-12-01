import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
// Note: In a real production app, this would be proxied through a backend to protect the key.
// For this PRD demo running in client-side environment, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'mock_key_for_demo' });

interface AIAnalysisResult {
  title: string;
  description: string;
  suggestedTags: string[];
}

export const analyzeUrlWithGemini = async (url: string): Promise<AIAnalysisResult> => {
  // If no key is present or it's the mock string, return mock data to prevent crash in demo
  if (!process.env.API_KEY || process.env.API_KEY === 'mock_key_for_demo') {
    console.warn("Using mock AI response because API_KEY is missing.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          title: "AI Analysis Unavailable (Demo Mode)",
          description: "Please configure a valid API_KEY to use Gemini 2.5 Flash for real-time analysis of: " + url,
          suggestedTags: ["Demo", "NoKey"]
        });
      }, 1000);
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this URL: ${url}. Provide a concise title, a short description (max 20 words), and 3 relevant short tags.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedTags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AIAnalysisResult;
    }
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      title: "",
      description: "",
      suggestedTags: []
    };
  }
};