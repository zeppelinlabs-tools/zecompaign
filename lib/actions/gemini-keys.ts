'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGeminiKeys(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('gemini_keys')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function createGeminiKey(data: {
  organization_id: string
  name: string
  api_key: string
  monthly_quota?: number
}) {
  const supabase = await createClient()
  
  const { data: key, error } = await supabase
    .from('gemini_keys')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { data: key }
}

export async function updateGeminiKey(id: string, updates: {
  name?: string
  api_key?: string
  monthly_quota?: number
  is_active?: boolean
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('gemini_keys')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteGeminiKey(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('gemini_keys')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function incrementGeminiUsage(keyId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.rpc('increment', {
    row_id: keyId,
    x: 1,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getActiveGeminiKey(orgId: string) {
  const supabase = await createClient()
  
  // Get active keys with available quota
  const { data, error } = await supabase
    .from('gemini_keys')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('usage_count', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'No active Gemini API keys found' }
  }

  // Find first key with available quota
  const availableKey = data.find(key => 
    !key.monthly_quota || key.usage_count < key.monthly_quota
  )

  if (!availableKey) {
    return { error: 'All Gemini API keys have reached their quota' }
  }

  return { data: availableKey }
}
