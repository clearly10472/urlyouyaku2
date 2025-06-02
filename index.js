import express from 'express';
import dotenv from 'dotenv';
import { extractContent } from './services/extract.js';
import { generateSummary } from './services/gemini.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Main endpoint for summarization
app.get('/summary', async (req, res) => {
  const { url } = req.query;
  
  // Validate URL parameter
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    // Validate URL format
    new URL(url); // Will throw if invalid
    
    // Extract content from the URL
    const extractedText = await extractContent(url);
    
    if (!extractedText) {
      return res.status(400).json({ error: 'Could not extract content from the provided URL' });
    }
    
    // Generate summary using Gemini API
    const summary = await generateSummary(extractedText);
    
    // Return the summary
    return res.json({ summary });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Handle URL validation errors
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Handle Gemini API errors
    if (error.message.includes('Gemini API')) {
      return res.status(502).json({ error: error.message });
    }
    
    // Handle other errors
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
