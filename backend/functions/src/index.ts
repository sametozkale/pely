import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI, Type } from "@google/genai";

if (!admin.apps.length) {
  admin.initializeApp();
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: GEMINI_API_KEY })
  : null;

export const analyzeUrl = functions.https.onCall(
  async (data: { url: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Authentication required."
      );
    }

    const url = data?.url;
    if (!url || typeof url !== "string") {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a URL string."
      );
    }

    if (!ai) {
      console.warn("GEMINI_API_KEY is missing. Returning mock analysis.");
      return {
        title: "AI Analysis Unavailable (Backend Demo Mode)",
        description:
          "Configure GEMINI_API_KEY in your Cloud Functions environment to enable live analysis.",
        suggestedTags: ["Demo", "NoKey"],
      };
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
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      // @ts-expect-error - response.text exists at runtime
      if (response.text) {
        // @ts-expect-error
        return JSON.parse(response.text);
      }
      throw new Error("Empty response from Gemini");
    } catch (err) {
      console.error("Gemini analysis failed:", err);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to analyze URL with Gemini."
      );
    }
  }
);


