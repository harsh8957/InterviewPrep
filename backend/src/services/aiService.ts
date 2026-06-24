import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const aiService = {
  async generateContent(prompt: string): Promise<string> {
    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Returning fallback content.');
      return 'AI features are currently unavailable. Please check the API configuration.';
    }

    try {
      // Using gemini-2.0-flash as recommended by the user config earlier
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI content');
    }
  },

  async generateJSON(prompt: string): Promise<any> {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    try {
      // Request JSON output
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('AI Service JSON Error:', error);
      throw new Error('Failed to generate AI JSON content');
    }
  }
};
