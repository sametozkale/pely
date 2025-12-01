import { httpsCallable } from "firebase/functions";
import { getFirebaseFunctions } from "../firebaseClient";

interface AIAnalysisResult {
  title: string;
  description: string;
  suggestedTags: string[];
}

export const analyzeUrlWithGemini = async (url: string): Promise<AIAnalysisResult> => {
  try {
    const functions = getFirebaseFunctions();
    const analyzeUrl = httpsCallable(functions, "analyzeUrl");
    const res = await analyzeUrl({ url });
    return res.data as AIAnalysisResult;
  } catch (error) {
    console.error("Gemini analysis failed via backend function:", error);
    return {
      title: "",
      description: "",
      suggestedTags: []
    };
  }
};