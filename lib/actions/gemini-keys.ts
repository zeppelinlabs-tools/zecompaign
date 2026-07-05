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
  label: string
  api_key: string
  monthly_quota?: number
  model?: string
}) {
  const supabase = await createClient()
  
  // Map to correct database columns
  const { data: key, error } = await supabase
    .from('gemini_keys')
    .insert({
      organization_id: data.organization_id,
      label: data.label,
      key_encrypted: data.api_key, // Map api_key to key_encrypted
      model: data.model || 'gemini-3.5-flash',
      active: true
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { data: key }
}

export async function updateGeminiKey(id: string, updates: {
  label?: string
  api_key?: string
  model?: string
  active?: boolean
}) {
  const supabase = await createClient()
  
  // Map to correct database columns
  const dbUpdates: any = {}
  if (updates.label !== undefined) dbUpdates.label = updates.label
  if (updates.api_key !== undefined) dbUpdates.key_encrypted = updates.api_key
  if (updates.model !== undefined) dbUpdates.model = updates.model
  if (updates.active !== undefined) dbUpdates.active = updates.active
  
  const { error } = await supabase
    .from('gemini_keys')
    .update(dbUpdates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/settings')
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
  revalidatePath('/settings')
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
  
  // Get active keys
  const { data, error } = await supabase
    .from('gemini_keys')
    .select('*')
    .eq('organization_id', orgId)
    .eq('active', true)
    .order('priority', { ascending: true })

  if (error) {
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'No active Gemini API keys found' }
  }

  return { data: data[0] }
}
