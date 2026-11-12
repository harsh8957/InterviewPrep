import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EVALUATOR_SERVICE_URL = process.env.EVALUATOR_SERVICE_URL || 'http://localhost:8001';
const INTERNAL_SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export const aiService = {
  /**
   * Generates free-form text through the centralized AI evaluator microservice.
   * Falls back to direct SDK if evaluator is unreachable.
   */
  async generateContent(prompt: string): Promise<string> {
    // 1. Try centralized FastAPI Evaluator Service
    try {
      const response = await axios.post(
        `${EVALUATOR_SERVICE_URL}/generate-text`,
        { prompt },
        {
          headers: {
            'x-internal-service-key': INTERNAL_SERVICE_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      if (response.data && response.data.text) {
        return response.data.text;
      }
    } catch (evaluatorErr: any) {
      console.warn(
        `[aiService] Centralized evaluator unavailable (${evaluatorErr.message}). Attempting local fallback.`
      );
    }

    // 2. Direct SDK Fallback
    if (!genAI || !GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY is not set. Returning unavailable notice.');
      return 'AI features are currently unavailable. Please check the API configuration.';
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('AI Service Error:', error);
      throw new Error('Failed to generate AI content');
    }
  },

  /**
   * Generates structured JSON through the centralized AI evaluator microservice.
   * Falls back to direct SDK if evaluator is unreachable.
   */
  async generateJSON(prompt: string): Promise<any> {
    // 1. Try centralized FastAPI Evaluator Service
    try {
      const response = await axios.post(
        `${EVALUATOR_SERVICE_URL}/generate-json`,
        { prompt },
        {
          headers: {
            'x-internal-service-key': INTERNAL_SERVICE_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );
      if (response.data) {
        return response.data;
      }
    } catch (evaluatorErr: any) {
      console.warn(
        `[aiService] Centralized evaluator unavailable (${evaluatorErr.message}). Attempting local fallback.`
      );
    }

    // 2. Direct SDK Fallback
    if (!genAI || !GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.5-flash',
        generationConfig: { responseMimeType: 'application/json' }
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
