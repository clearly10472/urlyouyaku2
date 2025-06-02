const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 記事内容を抽出する関数
async function extractContent(url) {
  try {
    // タイムアウト設定（20秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    // HTMLを取得
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // タイムアウトをクリア
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    // HTMLテキストを取得
    const html = await response.text();
    
    // jsdomでHTMLをパース
    const dom = new JSDOM(html, { url });
    
    // Readabilityで主要コンテンツを抽出
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

// 要約を生成する関数
async function generateSummary(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }
  
  try {
    // Generative AI APIを初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // gemini-proモデルを取得
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 100,
      },
    });
    
    // プロンプトを作成
    const prompt = `次の内容を日本語で120字以内で1行要約してください。
--------
${text}
--------`;
    
    // リクエストのタイムアウト設定（20秒）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    // コンテンツを生成
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    }, { signal: controller.signal });
    
    // タイムアウトをクリア
    clearTimeout(timeoutId);
    
    // レスポンスを取得
    const response = result.response;
    const summary = response.text();
    
    if (!summary) {
      throw new Error('Gemini API returned an empty response');
    }
    
    // 要約をクリーンアップ（改行を削除し、1行にする）
    return summary.replace(/\n/g, ' ').trim();
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}

// Netlify Functions ハンドラー
exports.handler = async function(event, context) {
  // CORSヘッダーを設定
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
  
  // OPTIONSリクエスト（プリフライト）の処理
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  // GETリクエスト以外は拒否
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }
  
  // URLパラメータを取得
  const params = new URLSearchParams(event.queryStringParameters);
  const url = params.get('url');
  
  // URLパラメータのバリデーション
  if (!url) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'URL parameter is required' })
    };
  }
  
  try {
    // URLの形式を検証
    new URL(url); // 無効な場合は例外をスロー
    
    // URLからコンテンツを抽出
    const extractedText = await extractContent(url);
    
    if (!extractedText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Could not extract content from the provided URL' })
      };
    }
    
    // Gemini APIを使用して要約を生成
    const summary = await generateSummary(extractedText);
    
    // 要約を返す
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ summary })
    };
  } catch (error) {
    console.error('Error processing request:', error);
    
    // URLバリデーションエラーの処理
    if (error instanceof TypeError && error.message.includes('Invalid URL')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid URL format' })
      };
    }
    
    // Gemini APIエラーの処理
    if (error.message.includes('Gemini API')) {
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    // その他のエラーの処理
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
