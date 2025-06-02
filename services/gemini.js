import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generates a summary of the provided text using Google's Gemini API
 * @param {string} text - The text to summarize
 * @returns {Promise<string>} - The generated summary
 */
export async function generateSummary(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
  }
  
  try {
    // Initialize the Generative AI API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the gemini-pro model
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 100,
      },
    });
    
    // Create the prompt
    const prompt = `次の内容を日本語で120字以内で1行要約してください。
--------
${text}
--------`;
    
    // Set timeout for the request (20 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    // Generate the content
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }, { signal: controller.signal });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // Get the response
    const response = result.response;
    const summary = response.text();
    
    if (!summary) {
      throw new Error('Gemini API returned an empty response');
    }
    
    // Clean up the summary (remove any newlines and ensure it's a single line)
    return summary.replace(/\n/g, ' ').trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}
