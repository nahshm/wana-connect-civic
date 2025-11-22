import { GoogleGenAI, Type } from "@google/genai";
import { Post } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMorePosts = async (currentCount: number): Promise<Post[]> => {
  if (!apiKey) {
    console.warn("No API Key provided for Gemini");
    return [];
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate 3 realistic subreddit posts for r/Kenya. 
      Mix of political discussion, social issues, funny memes (describe image), and questions. 
      Use Kenyan slang where appropriate (Sheng).
      Return JSON format matching the schema.
      For images, use a placeholder URL from 'https://picsum.photos/seed/{random}/600/400' but replace {random} with a keyword.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              subreddit: { type: Type.STRING },
              author: { type: Type.STRING },
              title: { type: Type.STRING },
              content: { type: Type.STRING },
              image: { type: Type.STRING },
              upvotes: { type: Type.INTEGER },
              comments: { type: Type.INTEGER },
              timeAgo: { type: Type.STRING },
              flair: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  color: { type: Type.STRING },
                  textColor: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '[]');
    // Ensure IDs are unique
    return data.map((p: any, idx: number) => ({
      ...p,
      id: `gen-${currentCount}-${idx}-${Date.now()}`,
      subreddit: 'r/Kenya'
    }));

  } catch (error) {
    console.error("Failed to generate posts:", error);
    return [];
  }
};
