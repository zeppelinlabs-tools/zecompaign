'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getTemplates(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function createTemplate(data: {
  organization_id: string
  name: string
  subject: string
  body_html: string
  body_text?: string
  category?: string
  tags?: string[]
}) {
  const supabase = await createClient()
  
  const { data: template, error } = await supabase
    .from('templates')
    .insert(data)
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { data: template }
}

export async function updateTemplate(id: string, updates: {
  name?: string
  subject?: string
  body_html?: string
  body_text?: string
  category?: string
  tags?: string[]
}) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('templates')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTemplate(id: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('templates')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function duplicateTemplate(id: string) {
  const supabase = await createClient()
  
  // Get original template
  const { data: original, error: fetchError } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !original) {
    return { error: 'Template not found' }
  }

  // Create duplicate
  const { data: duplicate, error: createError } = await supabase
    .from('templates')
    .insert({
      organization_id: original.organization_id,
      name: `${original.name} (Copy)`,
      subject: original.subject,
      body_html: original.body_html,
      body_text: original.body_text,
      category: original.category,
      tags: original.tags,
    })
    .select()
    .single()

  if (createError) {
    return { error: createError.message }
  }

  revalidatePath('/dashboard')
  return { data: duplicate }
}
