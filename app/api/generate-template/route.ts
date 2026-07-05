import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting: 20 AI generations per minute per user
  const rateLimitResult = checkRateLimit(user.id, {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 20, // 20 generations per minute
  })

  if (rateLimitResult) {
    return rateLimitResult
  }

  const body = await request.json()
  const { organization_id, prompt, tone, length } = body

  if (!organization_id || !prompt) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get active Gemini key ordered by priority
  const { data: keys, error: keysError } = await supabase
    .from('gemini_keys')
    .select('*')
    .eq('organization_id', organization_id)
    .eq('active', true)
    .order('priority', { ascending: true })

  if (keysError || !keys || keys.length === 0) {
    console.error('[generate-template] No active keys:', keysError)
    return NextResponse.json({ error: 'No active Gemini API keys found' }, { status: 400 })
  }

  // Use first active key (lowest priority number = highest priority)
  const activeKey = keys[0]

  try {
    const genAI = new GoogleGenerativeAI(activeKey.key_encrypted)
    const model = genAI.getGenerativeModel({ model: activeKey.model || 'gemini-3.5-flash' })

    const systemPrompt = `You are an expert email copywriter. Generate a professional email template based on the user's request.

Tone: ${tone || 'professional'}
Length: ${length || 'medium'}

Return ONLY a JSON object with this exact structure:
{
  "subject": "Email subject line",
  "body_html": "<h1>Title</h1><p>Body content with HTML formatting</p>",
  "body_text": "Plain text version"
}

Do not include any markdown code blocks or additional text. Just the JSON object.`

    const result = await model.generateContent(`${systemPrompt}\n\nUser request: ${prompt}`)
    const response = await result.response
    const text = response.text()

    // Try to parse JSON from the response
    let templateData
    try {
      // Remove markdown code blocks if present
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim()
      templateData = JSON.parse(cleanedText)
    } catch (parseError) {
      // If parsing fails, create a basic template
      templateData = {
        subject: 'Generated Email',
        body_html: `<p>${text}</p>`,
        body_text: text
      }
    }

    // Log usage
    await supabase.from('usage_logs').insert({
      organization_id,
      user_id: user.id,
      action: 'ai_generation',
      metadata: {
        key_id: activeKey.id,
        prompt_length: prompt.length,
      },
    })

    return NextResponse.json({ 
      success: true,
      template: templateData
    })
  } catch (err: any) {
    return NextResponse.json({ 
      error: err.message || 'Failed to generate template',
      details: err.toString()
    }, { status: 500 })
  }
}
