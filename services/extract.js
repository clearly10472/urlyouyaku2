import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

/**
 * Fetches and extracts the main content from a URL
 * @param {string} url - The URL to fetch and extract content from
 * @returns {Promise<string>} - The extracted text content
 */
export async function extractContent(url) {
  try {
    // Set timeout for fetch request (20 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    // Fetch the HTML content
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    // Get the HTML text
    const html = await response.text();
    
    // Parse the HTML using jsdom
    const dom = new JSDOM(html, { url });
    
    // Use Readability to extract the main content
    const reader = new Readability(dom.window.document);
    const article = reader.parse();
    
    if (!article || !article.textContent) {
      throw new Error('Could not extract content from the provided URL');
    }
    
    return article.textContent.trim();
  } catch (error) {
    console.error('Error extracting content:', error);
    throw error;
  }
}
