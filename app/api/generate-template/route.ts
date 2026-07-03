import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiKey {
  id: string;
  key: string;
  label: string;
  active: boolean;
  priority: number;
  model: string;
}

async function tryGemini(apiKey: string, modelName: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      keys: GeminiKey[];
      prompt: string;
      tone: string;
      type: string;
    };

    const { keys, prompt, tone, type } = body;

    const activeKeys = [...(keys || []).filter(k => k.active)]
      .sort((a, b) => a.priority - b.priority);

    if (!activeKeys.length) {
      return NextResponse.json({ error: 'No active Gemini API keys configured.' }, { status: 400 });
    }

    const fullPrompt = `You are an expert email copywriter. Generate a professional email based on:

Type: ${type}
Tone: ${tone}
Request: ${prompt}

Return ONLY a JSON object (no markdown, no backticks) with these exact fields:
{
  "subject": "Email subject line",
  "bodyHtml": "Full HTML email body with inline styles, paragraphs, and proper formatting",
  "bodyText": "Plain text version of the email"
}

CRITICAL STYLING REQUIREMENTS:
- ALL text must use dark colors (black or dark gray: #000000, #222222, #333333)
- Background colors must be white or very light (#ffffff, #f9f9f9, #f5f5f5)
- Links should be blue or a visible color (#0066cc, #1a73e8)
- DO NOT use dark backgrounds
- Ensure high contrast for readability (dark text on light background)
- Use inline styles for all color properties

The HTML should be clean, professional, and ready to send. Use <p>, <strong>, <a>, <ul>, <li> tags as needed. Do not include <html>, <head>, or <body> wrappers. Wrap the entire content in a <div style="font-family: Helvetica, Arial, sans-serif; font-size: 16px; color: #222222; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #ffffff;"> for consistent styling.`;

    let lastError = '';
    for (const key of activeKeys) {
      try {
        const modelToUse = key.model || 'gemini-3.5-flash';
        const raw = await tryGemini(key.key, modelToUse, fullPrompt);
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return NextResponse.json({ ...parsed, usedKey: `${key.label} (${modelToUse})` });
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : 'Key failed';
        continue;
      }
    }

    return NextResponse.json({ error: `All Gemini keys failed. Last error: ${lastError}` }, { status: 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
