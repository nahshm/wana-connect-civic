import { GoogleGenAI } from "@google/genai";

// Ensure API key is present; in a real app, handle missing key gracefully in UI
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateCivicResponse = async (
  prompt: string, 
  context?: string
): Promise<string> => {
  if (!apiKey) {
    return "Error: API Key is missing. Please configure the environment.";
  }

  try {
    const systemInstruction = `You are WanaIQ's AI Civic Assistant, an expert on Kenyan governance, law, and civic processes. 
    Your goal is to educate citizens, explain complex policies in simple terms (English or Swahili), and encourage peaceful, constructive engagement.
    If asked about specific politicians, remain neutral and focus on policy/track records.
    Use formatting like bullet points for clarity.
    
    Context: ${context || 'General civic inquiry'}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for faster simple responses
      }
    });

    return response.text || "I couldn't generate a response at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Sorry, I'm having trouble connecting to the civic database right now.";
  }
};

export const summarizeDocument = async (text: string): Promise<string> => {
    if (!apiKey) return "API Key missing";
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize this civic document or policy into 3 key bullet points for a general citizen audience: ${text}`,
        });
        return response.text || "Could not summarize.";
    } catch (e) {
        console.error(e);
        return "Error summarizing document.";
    }
}
